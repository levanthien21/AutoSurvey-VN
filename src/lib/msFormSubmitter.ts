import { sleep, getRandomUserAgent } from './googleFormSubmitter';

export interface MicrosoftAnswersPayload {
  [questionId: string]: any;
}

/**
 * Submits a single survey response to Microsoft Forms runtime endpoint
 */
export async function submitMicrosoftFormResponse(
  submitUrl: string,
  answers: MicrosoftAnswersPayload,
  antiForgeryToken?: string,
  serverSessionId?: string,
  refererUrl?: string,
  msSchema?: Record<string, any>
): Promise<{ success: boolean; status: number; message: string }> {
  // If sample or demo survey, simulate realistic response without failing
  if (
    submitUrl.includes('SampleSurvey') ||
    submitUrl.includes('sample') ||
    submitUrl.includes('demo')
  ) {
    await sleep(250 + Math.random() * 250);
    return {
      success: true,
      status: 201,
      message: 'Đã gửi câu trả lời thành công (Chế độ khảo sát mẫu Microsoft Forms)',
    };
  }

  // Format Microsoft Forms answers array
  // Schema: [{ questionId: string, answer1: any }]
  const answersArray: { questionId: string; answer1: any }[] = [];

  for (const [questionId, value] of Object.entries(answers)) {
    // 1. Skip non-question metadata keys
    if (
      !questionId ||
      questionId === 'fbzx' ||
      questionId === 'pageHistory' ||
      questionId === 'submitUrl' ||
      questionId === 'platform' ||
      questionId === 'antiForgeryToken' ||
      questionId === 'serverSessionId' ||
      questionId === 'title' ||
      questionId === 'msSchema' ||
      questionId.startsWith('entry.') // skip google form entry keys
    ) {
      continue;
    }

    const meta = msSchema ? msSchema[questionId] : undefined;

    // 2. Parent matrix group containers must NEVER be submitted as an answer
    if (meta && meta.type === 'Question.MatrixChoiceGroup') {
      continue;
    }

    let answer1: any = '';

    // 3. Matrix Choice row: Microsoft expects an object { id, key }
    if (meta && meta.type === 'Question.MatrixChoice') {
      if (typeof value === 'object' && value !== null && !Array.isArray(value) && ('id' in value || 'key' in value)) {
        answer1 = value;
      } else {
        const strVal = String(value ?? '').trim();
        const choices = meta.choices || [];
        const matched = choices.find(
          (c: any) =>
            String(c.value).toLowerCase() === strVal.toLowerCase() ||
            String(c.label).toLowerCase() === strVal.toLowerCase() ||
            String(c.id) === strVal ||
            String(c.key) === strVal
        );
        if (matched) {
          answer1 = { id: matched.id, key: matched.key ?? String(matched.id) };
        } else {
          // If numeric e.g. "4", match by index
          const num = parseInt(strVal, 10);
          if (!isNaN(num) && choices[num - 1]) {
            const ch = choices[num - 1];
            answer1 = { id: ch.id, key: ch.key ?? String(ch.id) };
          } else if (choices.length > 0) {
            const ch = choices[0];
            answer1 = { id: ch.id, key: ch.key ?? String(ch.id) };
          } else {
            answer1 = { id: 1, key: strVal || '1' };
          }
        }
      }
    }
    // 4. Checkbox question: Microsoft expects a stringified JSON array of strings
    else if (meta && meta.isCheckbox) {
      if (Array.isArray(value)) {
        answer1 = JSON.stringify(value.map(String));
      } else if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
        answer1 = value;
      } else if (value !== undefined && value !== null && value !== '') {
        answer1 = JSON.stringify([String(value)]);
      } else {
        answer1 = JSON.stringify([]);
      }
    }
    // 5. Radio / Choice question: string option label/value
    else if (meta && meta.type === 'Question.Choice') {
      const strVal = String(value ?? '').trim();
      const choices = meta.choices || [];
      const matched = choices.find(
        (c: any) =>
          String(c.value).toLowerCase() === strVal.toLowerCase() ||
          String(c.label).toLowerCase() === strVal.toLowerCase() ||
          String(c.id) === strVal
      );
      answer1 = matched ? (matched.label || matched.value) : strVal;
    }
    // 6. Rating / Scale question: string of number
    else if (meta && meta.type === 'Question.Rating') {
      const num = parseInt(String(value), 10);
      answer1 = isNaN(num) ? '5' : String(num);
    }
    // 7. General fallback (TextField, Paragraph, DateTime, etc.)
    else {
      if (Array.isArray(value)) {
        answer1 = JSON.stringify(value);
      } else if (value !== undefined && value !== null) {
        answer1 = String(value);
      }
    }

    answersArray.push({ questionId, answer1 });
  }

  // 8. Failsafe Toàn Diện: Rà soát msSchema, đảm bảo 100% mọi câu hỏi và dòng ma trận đều có đáp án
  if (msSchema) {
    for (const [sId, meta] of Object.entries(msSchema)) {
      if (!sId || meta.type === 'Question.MatrixChoiceGroup') {
        continue;
      }
      const existing = answersArray.find((a) => a.questionId === sId);
      if (!existing) {
        let fallbackAnswer: any = '';
        if (meta.type === 'Question.MatrixChoice') {
          const ch =
            meta.choices && meta.choices.length > 0
              ? meta.choices[Math.min(3, meta.choices.length - 1)]
              : { id: 4, key: '4' };
          fallbackAnswer = { id: ch.id, key: ch.key ?? String(ch.id) };
        } else if (meta.isCheckbox) {
          const ch = meta.choices && meta.choices.length > 0 ? [meta.choices[0].value] : ['1'];
          fallbackAnswer = JSON.stringify(ch);
        } else if (meta.type === 'Question.Choice') {
          const ch = meta.choices && meta.choices.length > 0 ? meta.choices[0] : { value: '1', label: '1' };
          fallbackAnswer = ch.label || ch.value;
        } else if (meta.type === 'Question.Rating') {
          fallbackAnswer = '4';
        } else if (meta.type === 'Question.DateTime') {
          fallbackAnswer = new Date().toISOString().split('T')[0];
        } else {
          fallbackAnswer = 'Hoàn toàn đồng ý';
        }

        answersArray.push({ questionId: sId, answer1: fallbackAnswer });
      }
    }
  }

  const now = new Date();
  // Simulate natural user reading and fill duration between 15s and 45s
  const durationMs = 15000 + Math.floor(Math.random() * 30000);
  const startTime = new Date(now.getTime() - durationMs);

  const payload = {
    startDate: startTime.toISOString(),
    submitDate: now.toISOString(),
    answers: JSON.stringify(answersArray),
  };

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json;charset=UTF-8',
      'Accept': 'application/json, text/plain, */*',
      'User-Agent': getRandomUserAgent(),
      'Origin': 'https://forms.cloud.microsoft',
      'Referer': refererUrl || 'https://forms.cloud.microsoft/',
    };

    if (antiForgeryToken) {
      headers['__RequestVerificationToken'] = antiForgeryToken;
      headers['x-ms-form-antiforgery-token'] = antiForgeryToken;
    }
    if (serverSessionId) {
      headers['X-UserSessionId'] = serverSessionId;
      headers['x-ms-form-session-id'] = serverSessionId;
    }

    const res = await fetch(submitUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    // Microsoft Forms returns 201 Created on successful recording
    if (res.status === 200 || res.status === 201) {
      return {
        success: true,
        status: res.status,
        message: 'Đã gửi câu trả lời Microsoft Forms thành công',
      };
    }

    const text = await res.text();
    let detailMsg = `Microsoft Forms từ chối (HTTP ${res.status}).`;
    try {
      const errJson = JSON.parse(text);
      if (errJson?.error?.message) {
        detailMsg += ` ${errJson.error.message}`;
      }
    } catch {
      if (text && text.length < 200) {
        detailMsg += ` ${text}`;
      }
    }

    return {
      success: false,
      status: res.status,
      message: detailMsg,
    };
  } catch (err: any) {
    return {
      success: false,
      status: 0,
      message: `Lỗi kết nối Microsoft Forms: ${err.message || 'Không xác định'}`,
    };
  }
}
