import { sleep, getRandomUserAgent } from './googleFormSubmitter';

export interface MicrosoftAnswersPayload {
  [questionId: string]: string | string[] | number | boolean;
}

/**
 * Submits a single survey response to Microsoft Forms runtime endpoint
 */
export async function submitMicrosoftFormResponse(
  submitUrl: string,
  answers: MicrosoftAnswersPayload,
  antiForgeryToken?: string,
  serverSessionId?: string,
  refererUrl?: string
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
  // Schema: [{ questionId: string, answer1: string }]
  const answersArray: { questionId: string; answer1: string }[] = [];

  for (const [questionId, value] of Object.entries(answers)) {
    if (!questionId || questionId === 'fbzx') continue;
    let answer1 = '';
    if (Array.isArray(value)) {
      answer1 = JSON.stringify(value);
    } else if (value !== undefined && value !== null) {
      answer1 = String(value);
    }
    answersArray.push({ questionId, answer1 });
  }

  const now = new Date();
  // Simulate natural user reading and fill duration between 20s and 50s
  const durationMs = 20000 + Math.floor(Math.random() * 30000);
  const startTime = new Date(now.getTime() - durationMs);

  const payload = {
    startDate: startTime.toISOString(),
    submitDate: now.toISOString(),
    answers: JSON.stringify(answersArray),
  };

  try {
    const res = await fetch(submitUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-ms-form-antiforgery-token': antiForgeryToken || '',
        'x-ms-form-session-id': serverSessionId || '',
        'User-Agent': getRandomUserAgent(),
        Origin: 'https://forms.cloud.microsoft',
        Referer: refererUrl || 'https://forms.cloud.microsoft/',
        Accept: 'application/json, text/plain, */*',
      },
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
