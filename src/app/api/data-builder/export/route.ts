import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function POST(req: NextRequest) {
  try {
    const { data, filename = 'AutoSurvey_Research_Data.xlsx' } = await req.json();

    if (!data || typeof data !== 'object') {
      return NextResponse.json({ success: false, error: 'Dữ liệu không hợp lệ' }, { status: 400 });
    }

    // Convert { item1: [1,2,3], item2: [4,5,6] } into array of objects
    const keys = Object.keys(data);
    const n = data[keys[0]]?.length || 0;
    const rows: Record<string, any>[] = [];

    for (let i = 0; i < n; i++) {
      const row: Record<string, any> = { ID: i + 1 };
      for (const k of keys) {
        row[k] = data[k][i];
      }
      rows.push(row);
    }

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Survey_Data');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    console.error('Error exporting excel:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
