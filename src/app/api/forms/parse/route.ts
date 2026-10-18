import { NextRequest, NextResponse } from 'next/server';
import { parseGoogleForm } from '@/lib/googleFormParser';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ success: false, error: 'Thiếu đường dẫn Google Form' }, { status: 400 });
    }

    const form = await parseGoogleForm(url);
    return NextResponse.json({ success: true, form });
  } catch (err: any) {
    console.error('Error parsing Google Form:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Lỗi khi phân tích Google Form' },
      { status: 500 }
    );
  }
}
