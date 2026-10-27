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
  const submitBase = withoutQuery.replace('/light/runtimeForms(', '/forms(');
  const submitUrl = `${submitBase}/responses`;

  // Step 6: Map Microsoft questions to unified FormQuestion schema
  const rawQuestions: any[] = formJson.questions || [];
  rawQuestions.sort((a, b) => (a.order || 0) - (b.order || 0));

  const questions: FormQuestion[] = rawQuestions.map((q, idx) => {
    let qInfo: any = {};
    try {
      if (q.questionInfo) qInfo = JSON.parse(q.questionInfo);
    } catch {}

    let type: FormQuestion['type'] = 'text';
    let options: FormQuestion['options'] = [];
    let scaleMin: number | undefined;
    let scaleMax: number | undefined;

    if (q.type === 'Question.Choice') {
      type = qInfo.ChoiceType === 2 ? 'checkbox' : 'radio';
      const rawChoices = qInfo.Choices || q.choices || [];
      options = rawChoices.map((c: any) => ({
        value: c.Description || c.FormsProDisplayRTText || '',
        label: c.Description || c.FormsProDisplayRTText || '',
      }));
    } else if (q.type === 'Question.TextField') {
      type = qInfo.Multiline ? 'paragraph' : 'text';
    } else if (q.type === 'Question.Rating') {
      type = 'scale';
      scaleMin = 1;
      scaleMax = qInfo.MaxRating || 5;
      options = Array.from({ length: scaleMax }, (_, i) => ({
        value: String(i + 1),
        label: String(i + 1),
      }));
    } else if (q.type === 'Question.DateTime') {
      type = 'date';
    } else if (
      q.type === 'Question.MatrixChoice' ||
      q.type === 'Question.MatrixChoiceGroup'
    ) {
      type = 'grid';
      const rawChoices = qInfo.Choices || q.choices || [];
      options = rawChoices.map((c: any) => ({
        value: c.Description || c.FormsProDisplayRTText || '',
        label: c.Description || c.FormsProDisplayRTText || '',
      }));
    }

    const title = q.title || q.formsProRTQuestionTitle || `Câu hỏi ${idx + 1}`;
    const subTypeInfo = detectQuestionSubType(title);

    return {
      id: q.id,
      internalId: idx + 1,
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
    };
  });

  return {
    formId: formJson.id || serverInfo.formId || '',
    title: formJson.title || 'Microsoft Form',
    description: formJson.description || '',
    submitUrl,
    platform: 'microsoft',
    antiForgeryToken,
    serverSessionId,
    originalUrl: finalUrl,
    questions,
  };
}
