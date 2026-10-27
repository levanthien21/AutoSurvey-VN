import { FormQuestion, ParsedGoogleForm, detectQuestionSubType } from './googleFormParser';

/**
 * Checks if the given URL is a Microsoft Forms URL
 */
export function isMicrosoftFormUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase().trim();
  return (
    lower.includes('forms.cloud.microsoft') ||
    lower.includes('forms.office.com') ||
    lower.includes('form.office365.com')
  );
}

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/**
 * Parses a Microsoft Forms URL (forms.cloud.microsoft or forms.office.com)
 */
export async function parseMicrosoftForm(rawUrl: string): Promise<ParsedGoogleForm> {
  const url = rawUrl.trim();

  // Step 1: Follow redirects (shortlinks like /r/...) to get the final ResponsePage URL
  const pageRes = await fetch(url, {
    redirect: 'follow',
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
    },
  });

  const finalUrl = pageRes.url;
  const html = await pageRes.text();

  // Step 2: Extract window.OfficeFormServerInfo
  const match = html.match(/window\.OfficeFormServerInfo\s*=\s*({[\s\S]*?});/);
  if (!match) {
    throw new Error(
      'Không thể đọc cấu trúc Microsoft Forms. Vui lòng đảm bảo form ở chế độ công khai: "Bất kỳ ai có liên kết đều có thể phản hồi" (Anyone can respond).'
    );
  }

  let serverInfo: any;
  try {
    serverInfo = JSON.parse(match[1]);
  } catch (err: any) {
    throw new Error('Lỗi cấu trúc dữ liệu máy chủ Microsoft Forms: ' + err.message);
  }

  const prefetchUrl = serverInfo.prefetchFormUrl;
  const antiForgeryToken = serverInfo.antiForgeryToken;
  const serverSessionId = serverInfo.serverSessionId;

  if (!prefetchUrl) {
    throw new Error('Không tìm thấy đường dẫn nạp câu hỏi của Microsoft Forms.');
  }

  // Step 3: Fetch form runtime definition from prefetchFormUrl
  const apiRes = await fetch(prefetchUrl, {
    headers: {
      'x-ms-form-antiforgery-token': antiForgeryToken || '',
      'x-ms-form-session-id': serverSessionId || '',
      'User-Agent': USER_AGENT,
      Accept: 'application/json, text/plain, */*',
    },
  });

  const formJson = await apiRes.json();

  // Step 4: Handle Error Code 639 (Form was moved to a Group)
  if (formJson?.error?.code === '639' && formJson?.error?.message) {
    const idMatch = formJson.error.message.match(/new form id is ([A-Za-z0-9_\-]+)/);
    if (idMatch && idMatch[1]) {
      const newFormId = idMatch[1];
      const newPageUrl = `https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=${newFormId}`;
      return parseMicrosoftForm(newPageUrl);
    }
  }

  if (formJson?.error) {
    const msg = formJson.error.message || JSON.stringify(formJson.error);
    throw new Error(`Microsoft Forms từ chối cung cấp dữ liệu: ${msg}`);
  }

  // Step 5: Construct response submission endpoint
  // prefetchUrl is e.g.:
  // https://forms.cloud.microsoft/formapi/api/{tenantId}/{groups|users}/{containerId}/light/runtimeForms('{formId}')?$expand=...
  // Submission endpoint removes /light/runtimeForms and replaces with /forms(...)/responses
  const withoutQuery = prefetchUrl.split('?')[0];
  const submitBase = withoutQuery
    .replace(/\/light\/runtimeForms\(/i, '/forms(')
    .replace(/\/runtimeForms\(/i, '/forms(');
  const submitUrl = submitBase.endsWith('/responses') ? submitBase : `${submitBase}/responses`;

  // Step 6: Map Microsoft questions to unified FormQuestion schema
  const rawQuestions: any[] = formJson.questions || [];
  rawQuestions.sort((a, b) => (a.order || 0) - (b.order || 0));

  const rawById = new Map<string, any>();
  rawQuestions.forEach((q) => rawById.set(q.id, q));

  // Identify child matrix rows that belong to a matrix parent group
  const matrixChildIds = new Set<string>();
  rawQuestions.forEach((q) => {
    if (q.groupId && rawById.has(q.groupId)) {
      matrixChildIds.add(q.id);
    }
  });

  // Microsoft question schema dictionary for submitter formatting
  const msSchema: Record<string, {
    id: string;
    type: string;
    isCheckbox?: boolean;
    isMatrixRow?: boolean;
    parentGroupId?: string;
    choices?: { id?: any; key?: any; value: string; label: string }[];
  }> = {};

  const questions: FormQuestion[] = [];

  for (const q of rawQuestions) {
    let qInfo: any = {};
    try {
      if (q.questionInfo) {
        qInfo = typeof q.questionInfo === 'string' ? JSON.parse(q.questionInfo) : q.questionInfo;
      }
    } catch {}

    // Case 1: Parent Matrix / Likert Grid Question
    if (q.type === 'Question.MatrixChoiceGroup') {
      const rawChoices = qInfo.Choices || q.choices || [];
      const options = rawChoices.map((c: any, cIdx: number) => {
        const val = String(c.Description || c.FormsProDisplayRTText || c.displayText || c.Label || c.Text || (cIdx + 1));
        return {
          value: val,
          label: val,
          id: c.id ?? cIdx + 1,
          key: c.key ?? (c.id !== undefined ? String(c.id) : String(cIdx + 1)),
        };
      });

      // Find all child rows under this group
      const childQuestions = rawQuestions.filter(
        (child) => child.groupId === q.id || (child.type === 'Question.MatrixChoice' && child.groupId === q.id)
      );
      childQuestions.sort((a, b) => (a.order || 0) - (b.order || 0));

      const gridRows = childQuestions.map((child) => {
        // Register each row in msSchema as an answerable Matrix row
        msSchema[child.id] = {
          id: child.id,
          type: 'Question.MatrixChoice',
          isMatrixRow: true,
          parentGroupId: q.id,
          choices: options,
        };
        return {
          title: child.title || child.formsProRTQuestionTitle || 'Tiêu chí đánh giá',
          entryId: child.id,
        };
      });

      // Register parent container in msSchema (flagged so submitter never posts it as an answer)
      msSchema[q.id] = {
        id: q.id,
        type: 'Question.MatrixChoiceGroup',
        choices: options,
      };

      questions.push({
        id: q.id,
        internalId: questions.length + 1,
        title: q.title || q.formsProRTQuestionTitle || 'Bảng đánh giá ma trận',
        description: q.subtitle || undefined,
        type: 'grid',
        subType: 'general',
        defaultSampleAnswers: ['4', '5'],
        rawType: 0,
        required: !!q.required,
        options,
        gridRows,
      });
      continue;
    }

    // Skip child matrix rows here, since they are already nested in their parent gridRows
    if (matrixChildIds.has(q.id)) {
      continue;
    }

    let type: FormQuestion['type'] = 'text';
    let options: FormQuestion['options'] = [];
    let scaleMin: number | undefined;
    let scaleMax: number | undefined;
    let isCheckbox = false;

    if (q.type === 'Question.Choice') {
      isCheckbox = qInfo.ChoiceType === 2;
      type = isCheckbox ? 'checkbox' : 'radio';
      const rawChoices = qInfo.Choices || q.choices || [];
      options = rawChoices.map((c: any, cIdx: number) => {
        const val = String(c.Description || c.FormsProDisplayRTText || c.displayText || (cIdx + 1));
        return {
          value: val,
          label: val,
          id: c.id ?? cIdx + 1,
          key: c.key ?? String(c.id ?? cIdx + 1),
        };
      });
      msSchema[q.id] = {
        id: q.id,
        type: 'Question.Choice',
        isCheckbox,
        choices: options as any,
      };
    } else if (q.type === 'Question.TextField') {
      type = qInfo.Multiline ? 'paragraph' : 'text';
      msSchema[q.id] = { id: q.id, type: 'Question.TextField' };
    } else if (q.type === 'Question.Rating') {
      type = 'scale';
      scaleMin = 1;
      scaleMax = qInfo.MaxRating || qInfo.Length || 5;
      options = Array.from({ length: scaleMax }, (_, i) => ({
        value: String(i + 1),
        label: String(i + 1),
        id: i + 1,
        key: String(i + 1),
      }));
      msSchema[q.id] = {
        id: q.id,
        type: 'Question.Rating',
        choices: options as any,
      };
    } else if (q.type === 'Question.DateTime') {
      type = 'date';
      msSchema[q.id] = { id: q.id, type: 'Question.DateTime' };
    } else if (q.type === 'Question.MatrixChoice') {
      // Standalone matrix row without group
      type = 'scale';
      scaleMin = 1;
      scaleMax = 5;
      const rawChoices = qInfo.Choices || q.choices || [];
      options = rawChoices.map((c: any, cIdx: number) => ({
        value: String(c.Description || c.FormsProDisplayRTText || (cIdx + 1)),
        label: String(c.Description || c.FormsProDisplayRTText || (cIdx + 1)),
        id: c.id ?? cIdx + 1,
        key: c.key ?? String(c.id ?? cIdx + 1),
      }));
      msSchema[q.id] = {
        id: q.id,
        type: 'Question.MatrixChoice',
        isMatrixRow: true,
        choices: options as any,
      };
    } else {
      msSchema[q.id] = { id: q.id, type: q.type || 'Question.TextField' };
    }

    const title = q.title || q.formsProRTQuestionTitle || `Câu hỏi ${questions.length + 1}`;
    const subTypeInfo = detectQuestionSubType(title);

    questions.push({
      id: q.id,
      internalId: questions.length + 1,
      title,
      description: q.subtitle || undefined,
      type,
      subType: subTypeInfo.subType,
      defaultSampleAnswers: subTypeInfo.samples,
      rawType: 0,
      required: !!q.required,
      options,
      scaleMin,
      scaleMax,
    });
  }

  return {
    formId: formJson.id || serverInfo.formId || '',
    title: formJson.title || 'Microsoft Form',
    description: formJson.description || '',
    submitUrl,
    platform: 'microsoft',
    antiForgeryToken,
    serverSessionId,
    originalUrl: finalUrl,
    msSchema,
    questions,
  };
}
