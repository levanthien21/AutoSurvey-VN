import { NextRequest, NextResponse } from 'next/server';
import { parseGoogleForm } from '@/lib/googleFormParser';
import { parseMicrosoftForm, isMicrosoftFormUrl } from '@/lib/msFormParser';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Thiếu đường dẫn Google Form hoặc Microsoft Form' },
        { status: 400 }
      );
    }

    const trimmedUrl = url.trim();
    const isMs = isMicrosoftFormUrl(trimmedUrl);
    const form = isMs
      ? await parseMicrosoftForm(trimmedUrl)
      : await parseGoogleForm(trimmedUrl);

    return NextResponse.json({ success: true, form });
  } catch (err: any) {
    console.error('Error parsing form:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Lỗi khi phân tích biểu mẫu khảo sát' },
      { status: 500 }
    );
  }
}
