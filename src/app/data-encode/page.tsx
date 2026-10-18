'use client';

import React, { useState } from 'react';
import { Binary, Upload, Download, CheckCircle2, ArrowRightLeft, FileCheck } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function DataEncodePage() {
  const [fileName, setFileName] = useState('');
  const [rawData, setRawData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [encodedData, setEncodedData] = useState<any[]>([]);
  const [reverseColumns, setReverseColumns] = useState<string[]>([]);

  // Default mapping dictionary
  const defaultMapping: { [text: string]: number } = {
    'hoàn toàn không đồng ý': 1,
    'rất không đồng ý': 1,
    'không đồng ý': 2,
    'chưa đồng ý': 2,
    'bình thường': 3,
    'trung lập': 3,
    'không ý kiến': 3,
    'đồng ý': 4,
    'khá đồng ý': 4,
    'hoàn toàn đồng ý': 5,
    'rất đồng ý': 5,
    'nam': 1,
    'nữ': 2,
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        if (data.length > 0) {
          setRawData(data);
          const cols = Object.keys(data[0]);
          setColumns(cols);
          runEncoding(data, cols, []);
        }
      } catch (err: any) {
        alert('Lỗi đọc file: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  const runEncoding = (data: any[], cols: string[], revCols: string[]) => {
    const encoded = data.map((row) => {
      const newRow: Record<string, any> = {};
      cols.forEach((col) => {
        const val = row[col];
        if (typeof val === 'string') {
          const lower = val.toLowerCase().trim();
          let num = defaultMapping[lower];
          if (num !== undefined) {
            // Check reverse coding (1 -> 5, 2 -> 4, etc.)
            if (revCols.includes(col)) {
              num = 6 - num;
            }
            newRow[col] = num;
          } else {
            newRow[col] = val;
          }
        } else if (typeof val === 'number') {
          if (revCols.includes(col) && val >= 1 && val <= 5) {
            newRow[col] = 6 - val;
          } else {
            newRow[col] = val;
          }
        } else {
          newRow[col] = val;
        }
      });
      return newRow;
    });

    setEncodedData(encoded);
  };

  const toggleReverseColumn = (col: string) => {
    const updated = reverseColumns.includes(col)
      ? reverseColumns.filter((c) => c !== col)
      : [...reverseColumns, col];
    setReverseColumns(updated);
    runEncoding(rawData, columns, updated);
  };

  const handleExport = () => {
    if (encodedData.length === 0) return;
    const worksheet = XLSX.utils.json_to_sheet(encodedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data_Ma_Hoa');
    XLSX.writeFile(workbook, `Encoded_${fileName || 'Survey_Data.xlsx'}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold mb-2">
          <Binary className="w-3.5 h-3.5" />
          <span>Tiện ích xử lý dữ liệu</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Mã hoá & Đảo chiều dữ liệu</h1>
        <p className="text-sm text-slate-500 mt-1">
          Chuyển đổi tự động các câu trả lời dạng chữ (Ví dụ: &ldquo;Hoàn toàn đồng ý&rdquo;) sang số (1, 2, 3, 4, 5) và đảo chiều thang đo cho câu hỏi nghịch.
        </p>
      </div>

      {/* Upload Box */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <label className="block text-sm font-bold text-slate-900">Tải lên file khảo sát cần mã hoá (Excel / CSV)</label>
        <div className="border-2 border-dashed border-slate-200 hover:border-amber-400 rounded-2xl p-8 text-center transition-colors">
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileUpload}
            className="hidden"
            id="encode-file-upload"
          />
          <label htmlFor="encode-file-upload" className="cursor-pointer flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-slate-800">
              {fileName ? fileName : 'Nhấp để chọn file Excel hoặc CSV'}
            </div>
            <div className="text-xs text-slate-400 mt-1">Hệ thống tự động nhận diện tiếng Việt có dấu và không dấu</div>
          </label>
        </div>
      </div>

      {/* Encoded Preview & Reverse Coding */}
      {encodedData.length > 0 && (
        <div className="space-y-6">
          {/* Reverse Coding selector */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Chọn câu hỏi đảo chiều (Reverse Coding)</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Nhấp vào cột nếu câu hỏi mang ý nghĩa phủ định (1 &harr; 5, 2 &harr; 4, 3 &harr; 3)
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {columns.map((col) => {
                const isRev = reverseColumns.includes(col);
                return (
                  <button
                    key={col}
                    onClick={() => toggleReverseColumn(col)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      isRev
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                    <span>{col}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Dữ liệu sau khi mã hoá (Xem trước 10 dòng)</h4>
                <p className="text-xs text-slate-500 mt-0.5">Tổng số dòng: {encodedData.length}</p>
              </div>

              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Tải file đã mã hoá (.xlsx)</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-700 uppercase border-b border-slate-100">
                  <tr>
                    {columns.map((col) => (
                      <th key={col} className="px-3 py-2">
                        {col} {reverseColumns.includes(col) && <span className="text-amber-600">(Đảo)</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {encodedData.slice(0, 10).map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50/50">
                      {columns.map((col) => (
                        <td key={col} className="px-3 py-2 font-bold text-slate-800">
                          {row[col]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
