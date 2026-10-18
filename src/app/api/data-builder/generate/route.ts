import { NextRequest, NextResponse } from 'next/server';
import { generateResearchDataset, ModelConfig } from '@/lib/statisticsEngine';

export async function POST(req: NextRequest) {
  try {
    const config: ModelConfig = await req.json();

    if (!config.constructs || config.constructs.length === 0) {
      return NextResponse.json({ success: false, error: 'Cần ít nhất một nhân tố / khái niệm' }, { status: 400 });
    }

    const result = generateResearchDataset(config);
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error('Error generating research dataset:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Lỗi khi tạo bộ dữ liệu NCKH' },
      { status: 500 }
    );
  }
}
