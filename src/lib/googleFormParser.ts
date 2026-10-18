export interface FormOption {
  value: string;
  label: string;
}

export interface FormQuestion {
  id: string; // e.g. entry.123456789
  internalId: number;
  title: string;
  description?: string;
  type: 'text' | 'paragraph' | 'radio' | 'dropdown' | 'checkbox' | 'scale' | 'grid' | 'date' | 'time' | 'other';
  subType?: 'name' | 'phone' | 'email' | 'age' | 'general';
  defaultSampleAnswers?: string[];
  rawType: number;
  required: boolean;
  options: FormOption[];
  scaleMin?: number;
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
  gridRows?: { title: string; entryId: string }[];
}

export interface ParsedGoogleForm {
  formId: string;
  title: string;
  description: string;
  submitUrl: string;
  fbzx?: string;
  questions: FormQuestion[];
}

export function detectQuestionSubType(title: string): { subType: FormQuestion['subType']; samples: string[] } {
  const t = title.toLowerCase();
  if (t.includes('điện thoại') || t.includes('sđt') || t.includes('phone') || t.includes('mobile') || t.includes('tel')) {
    return {
      subType: 'phone',
      samples: ['0912345678', '0987654321', '0903123456', '0978901234', '0868123456', '0934567890', '0898765432'],
    };
  }
  if (t.includes('email') || t.includes('thư điện tử') || t.includes('mail')) {
    return {
      subType: 'email',
      samples: ['nguyenvanan.work@gmail.com', 'tranthibich.hn@gmail.com', 'lehoanglong.survey@gmail.com', 'phamminhtuan95@gmail.com', 'dangthaovy.student@gmail.com'],
    };
  }
  if (t.includes('tên') || t.includes('họ') || t.includes('name')) {
    return {
      subType: 'name',
      samples: ['Nguyễn Văn An', 'Trần Thị Bích', 'Lê Hoàng Long', 'Phạm Minh Tuấn', 'Đặng Thảo Vy', 'Hoàng Gia Huy', 'Vũ Mai Anh'],
    };
  }
  if (t.includes('tuổi') || t.includes('năm sinh') || t.includes('age')) {
    return {
      subType: 'age',
      samples: ['21', '24', '27', '30', '32'],
    };
  }
  return {
    subType: 'general',
    samples: [
      'Rất hài lòng với chất lượng dịch vụ.',
      'Sản phẩm đáp ứng tốt nhu cầu thực tế.',
      'Trải nghiệm nhìn chung rất thuận tiện và mượt mà.',
      'Ủng hộ và hy vọng tiếp tục phát triển thêm.',
    ],
  };
}

/**
 * Normalizes shortlinks like https://forms.gle/xxx to docs.google.com
 */
export async function resolveGoogleFormUrl(rawUrl: string): Promise<string> {
  let url = rawUrl.trim();
  if (url.includes('forms.gle/')) {
    const res = await fetch(url, { redirect: 'follow' });
    url = res.url;
  }
  // Ensure viewform
  if (url.includes('formResponse')) {
    url = url.replace('formResponse', 'viewform');
  } else if (!url.includes('viewform') && !url.includes('edit')) {
    url = url.replace(/\/?$/, '/viewform');
  }
  return url;
}

/**
 * Fetches and parses a Google Form HTML to extract fields, options, and entry IDs.
 */
export async function parseGoogleForm(formUrl: string): Promise<ParsedGoogleForm> {
  const resolvedUrl = await resolveGoogleFormUrl(formUrl);

  const res = await fetch(resolvedUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  if (!res.ok) {
    throw new Error(`Không thể truy cập Google Form (HTTP ${res.status}). Kiểm tra lại quyền truy cập hoặc link form.`);
  }

  const html = await res.text();

  // Extract FB_PUBLIC_LOAD_DATA_
  const match = html.match(/var\s+FB_PUBLIC_LOAD_DATA_\s*=\s*(.+?);\s*<\/script>/s) ||
                html.match(/FB_PUBLIC_LOAD_DATA_\s*=\s*(\[.+?\]);/s);

  if (!match || !match[1]) {
    throw new Error('Không tìm thấy dữ liệu form (FB_PUBLIC_LOAD_DATA_). Form có thể yêu cầu đăng nhập tài khoản Google.');
  }

  let data: any;
  try {
    data = JSON.parse(match[1]);
  } catch (err: any) {
    throw new Error('Lỗi parse dữ liệu cấu trúc Google Form: ' + err.message);
  }

  // Form metadata
  const title = data[1]?.[8] || data[8] || 'Khảo sát Google Form';
  const description = data[1]?.[0] || '';

  // Extract true numeric fbzx token from input tag
  const fbzxInputMatch = html.match(/name="fbzx"\s+value="([^"]+)"/) || html.match(/value="([^"]+)"\s+name="fbzx"/);
  let fbzx = '';
  if (fbzxInputMatch && /^-?\d+$/.test(fbzxInputMatch[1].trim())) {
    fbzx = fbzxInputMatch[1].trim();
  }

  // Extract formId from URL
  const formIdMatch = resolvedUrl.match(/\/d\/e\/([a-zA-Z0-9_\-]+)\//) || resolvedUrl.match(/\/d\/([a-zA-Z0-9_\-]+)\//);
  const formId = formIdMatch ? formIdMatch[1] : 'unknown';
  const submitUrl = `https://docs.google.com/forms/d/e/${formId}/formResponse`;

  const rawQuestions = data[1]?.[1] || [];
  const questions: FormQuestion[] = [];

  for (const item of rawQuestions) {
    if (!item) continue;
    const internalId = item[0];
    const qTitle = item[1] || 'Câu hỏi không tiêu đề';
    const qDesc = item[2] || '';
    const qType = item[3]; // type code
    const rawPayload = item[4];

    if (!rawPayload || !Array.isArray(rawPayload) || rawPayload.length === 0) {
      continue;
    }

    // Determine type
    let typeName: FormQuestion['type'] = 'other';
    const options: FormOption[] = [];
    let scaleMin: number | undefined;
    let scaleMax: number | undefined;
    let scaleMinLabel: string | undefined;
    let scaleMaxLabel: string | undefined;
    let gridRows: { title: string; entryId: string }[] | undefined;

    const firstSub = rawPayload[0];
    const entryId = firstSub?.[0] ? `entry.${firstSub[0]}` : '';
    const required = Boolean(firstSub?.[2]);

    switch (qType) {
      case 0:
        typeName = 'text';
        break;
      case 1:
        typeName = 'paragraph';
        break;
      case 2:
        typeName = 'radio';
        if (firstSub?.[1]) {
          for (const opt of firstSub[1]) {
            const val = opt[0];
            if (val !== undefined && val !== null) {
              options.push({ value: String(val), label: String(val) });
            }
          }
        }
        break;
      case 3:
        typeName = 'dropdown';
        if (firstSub?.[1]) {
          for (const opt of firstSub[1]) {
            const val = opt[0];
            if (val !== undefined && val !== null) {
              options.push({ value: String(val), label: String(val) });
            }
          }
        }
        break;
      case 4:
        typeName = 'checkbox';
        if (firstSub?.[1]) {
          for (const opt of firstSub[1]) {
            const val = opt[0];
            if (val !== undefined && val !== null) {
              options.push({ value: String(val), label: String(val) });
            }
          }
        }
        break;
      case 5:
        typeName = 'scale';
        if (firstSub?.[1]) {
          for (const opt of firstSub[1]) {
            const val = opt[0];
            options.push({ value: String(val), label: String(val) });
          }
        }
        if (firstSub?.[3]) {
          scaleMinLabel = firstSub[3][0] || '';
          scaleMaxLabel = firstSub[3][1] || '';
        }
        if (options.length > 0) {
          scaleMin = Number(options[0].value) || 1;
          scaleMax = Number(options[options.length - 1].value) || options.length;
        }
        break;
      case 7:
        // Grid / Matrix question
        typeName = 'grid';
        gridRows = [];
        for (const row of rawPayload) {
          if (row?.[0] && row?.[3]) {
            gridRows.push({
              title: row[3][0] || 'Dòng',
              entryId: `entry.${row[0]}`,
            });
          }
        }
        // Column options
        if (firstSub?.[1]) {
          for (const opt of firstSub[1]) {
            options.push({ value: String(opt[0]), label: String(opt[0]) });
          }
        }
        break;
      case 9:
        typeName = 'date';
        break;
      case 10:
        typeName = 'time';
        break;
      default:
        typeName = 'other';
        break;
    }

    if (entryId || (gridRows && gridRows.length > 0)) {
      let subType: FormQuestion['subType'] = undefined;
      let defaultSampleAnswers: string[] | undefined = undefined;

      if (typeName === 'text' || typeName === 'paragraph') {
        const detected = detectQuestionSubType(qTitle);
        subType = detected.subType;
        defaultSampleAnswers = detected.samples;
      }

      questions.push({
        id: entryId,
        internalId,
        title: qTitle,
        description: qDesc,
        type: typeName,
        subType,
        defaultSampleAnswers,
        rawType: qType,
        required,
        options,
        scaleMin,
        scaleMax,
        scaleMinLabel,
        scaleMaxLabel,
        gridRows,
      });
    }
  }

  return {
    formId,
    title,
    description,
    submitUrl,
    fbzx,
    questions,
  };
}
