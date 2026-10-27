export interface SubmitResponsePayload {
  [entryId: string]: string | string[]; // Can be single value or array for checkboxes
}

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
];

export function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Submits a single survey response to Google Forms
 */
export async function submitGoogleFormResponse(
  submitUrl: string,
  answers: SubmitResponsePayload,
  fbzx?: string,
  pageHistory?: string
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
      status: 200,
      message: 'Đã gửi câu trả lời thành công (Chế độ khảo sát mẫu AutoSurvey VN)',
    };
  }

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(answers)) {
    if (!key.startsWith('entry.')) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, String(item));
      }
    } else {
      params.append(key, String(value));
    }
  }

  // Google Forms tracking standard fields
  params.append('fvv', '1');
  params.append('pageHistory', pageHistory && pageHistory.trim() ? pageHistory.trim() : '0');
  params.append('submissionTimestamp', String(Date.now()));

  // Only append fbzx if valid signed integer
  if (fbzx && /^-?\d+$/.test(fbzx.trim())) {
    params.append('fbzx', fbzx.trim());
  }

  const refererUrl = submitUrl.replace('formResponse', 'viewform');

  try {
    const res = await fetch(submitUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': getRandomUserAgent(),
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
        Origin: 'https://docs.google.com',
        Referer: refererUrl,
      },
      body: params.toString(),
      redirect: 'follow',
    });

    const text = await res.text();

    // Verify confirmation message or status
    const isSuccess =
      (res.status === 200 || res.status === 302) &&
      (text.includes('freebirdFormviewerViewResponseConfirmationMessage') ||
        text.includes('Câu trả lời của bạn đã được ghi lại') ||
        text.includes('Your response has been recorded') ||
        text.includes('đã được ghi lại') ||
        text.includes('formResponse'));

    if (isSuccess) {
      return { success: true, status: res.status, message: 'Đã gửi câu trả lời thành công' };
    } else {
      let detailMsg = 'Google Forms từ chối (HTTP ' + res.status + ').';
      if (text.includes('Vui lòng nhập đúng')) {
        detailMsg += ' Lỗi định dạng trường dữ liệu (Số điện thoại / Email không hợp lệ).';
      } else if (text.includes('Đây là một câu hỏi bắt buộc')) {
        detailMsg += ' Thiếu câu hỏi bắt buộc chưa được điền.';
      } else {
        detailMsg += ' Kiểm tra lại câu hỏi bắt buộc hoặc định dạng câu trả lời.';
      }
      return {
        success: false,
        status: res.status,
        message: detailMsg,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      status: 500,
      message: err.message || 'Lỗi kết nối khi gửi tới Google Forms',
    };
  }
}
