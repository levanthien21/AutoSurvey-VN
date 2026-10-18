'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileSpreadsheet,
  Upload,
  Search,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Send,
  Loader2,
  Table,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ParsedGoogleForm, FormQuestion } from '@/lib/googleFormParser';
import { useAuth } from '@/context/AuthContext';

export default function CreateFormDataPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [formUrl, setFormUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<ParsedGoogleForm | null>(null);

  // File state
  const [excelData, setExcelData] = useState<any[]>([]);
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');
  const [mappings, setMappings] = useState<{ [questionId: string]: string }>({});

  const [delayMin, setDelayMin] = useState<number>(1.0);
  const [delayMax, setDelayMax] = useState<number>(2.5);
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const url = params.get('url');
      if (url) {
        setFormUrl(url);
      }
    }
  }, []);

  // Parse Form
  const handleParseForm = async () => {
    if (!formUrl.trim()) {
      setError('Vui lòng nhập đường dẫn Google Form.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/forms/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: formUrl }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setForm(data.form);
    } catch (err: any) {
      setError(err.message || 'Lỗi đọc Google Form');
    } finally {
      setLoading(false);
    }
  };

  // Handle File Upload
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

        if (data.length === 0) {
          setError('File Excel rỗng, vui lòng kiểm tra lại.');
          return;
        }

        const cols = Object.keys(data[0]);
        setExcelColumns(cols);
        setExcelData(data);

        // Auto-match mappings by similarity
        if (form) {
          const autoMap: { [qId: string]: string } = {};
          form.questions.forEach((q) => {
            const matchedCol = cols.find(
              (c) =>
                c.toLowerCase().trim() === q.title.toLowerCase().trim() ||
                q.title.toLowerCase().includes(c.toLowerCase()) ||
                c.toLowerCase().includes(q.title.toLowerCase())
            );
            if (matchedCol) {
              autoMap[q.id] = matchedCol;
            }
          });
          setMappings(autoMap);
        }
      } catch (err: any) {
        setError('Lỗi đọc file: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleStartBatch = async () => {
    if (!form || excelData.length === 0) return;
    setSubmitting(true);
    setError('');

    try {
      // Build responses queue from Excel rows based on mappings
      const queue = excelData.map((row) => {
        const payload: Record<string, any> = {};
        form.questions.forEach((q) => {
          const col = mappings[q.id];
          if (col && row[col] !== undefined && row[col] !== null) {
            payload[q.id] = String(row[col]);
          }
        });
        return payload;
      });

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Điền data có trước (${fileName}) - ${form.title}`,
          formUrl,
          submitUrl: form.submitUrl,
          mode: 'data',
          totalTarget: queue.length,
          delayMin,
          delayMax,
          responsesQueue: queue,
          fbzx: form.fbzx,
          autoStart: true,
        }),
      });

      const resData = await res.json();
      if (!resData.success) throw new Error(resData.error);

      router.push(`/orders?id=${resData.order.id}`);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi khởi chạy');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2">
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Chế độ 2</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Điền data có trước (Excel / CSV)</h1>
        <p className="text-sm text-slate-500 mt-1">
          Nhập file bảng tính sẵn có, ánh xạ các cột vào câu hỏi Google Form và submit từng dòng tự động.
        </p>
      </div>

      {/* Step 1: Input Form URL */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <label className="block text-sm font-bold text-slate-900">1. Nhập đường dẫn Google Form</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={formUrl}
            onChange={(e) => setFormUrl(e.target.value)}
            placeholder="https://docs.google.com/forms/d/e/.../viewform"
            className="flex-1 h-11 px-4 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleParseForm}
            disabled={loading || !formUrl}
            className="h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-xs shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Bóc tách Form</span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Step 2: Upload File & Mapping */}
      {form && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <label className="block text-sm font-bold text-slate-900">2. Tải lên file Excel / CSV dữ liệu khảo sát</label>
            <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-8 text-center transition-colors">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-slate-800">
                  {fileName ? fileName : 'Nhấp để chọn file hoặc kéo thả vào đây'}
                </div>
                <div className="text-xs text-slate-400 mt-1">Định dạng hỗ trợ: .xlsx, .xls, .csv</div>
              </label>
            </div>

            {excelData.length > 0 && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <span>
                    Đã tải thành công file <strong>{fileName}</strong>: Tìm thấy <strong>{excelData.length}</strong> dòng và <strong>{excelColumns.length}</strong> cột dữ liệu.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Column Mapping */}
          {excelColumns.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    3. Ánh xạ cột Excel sang câu hỏi Google Form
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Chọn cột trong file tương ứng với mỗi câu hỏi</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {form.questions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex-1">
                      <div className="text-xs font-bold text-indigo-600">Câu {idx + 1}</div>
                      <div className="text-xs font-semibold text-slate-900 mt-0.5">{q.title}</div>
                    </div>

                    <div className="w-full sm:w-64">
                      <select
                        value={mappings[q.id] || ''}
                        onChange={(e) => setMappings({ ...mappings, [q.id]: e.target.value })}
                        className="w-full h-9 px-3 text-xs font-medium rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      >
                        <option value="">-- Bỏ qua câu này --</option>
                        {excelColumns.map((col) => (
                          <option key={col} value={col}>
                            Cột: {col}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              {/* Commercial billing card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-500">Chi phí nộp file data: </span>
                  <strong className="text-indigo-700 font-bold">{(excelData.length * 80).toLocaleString()} Credits</strong>
                  <span className="text-slate-400"> (80đ / dòng dữ liệu)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Số dư hiện tại: </span>
                  <strong className="text-slate-900 font-mono font-bold">
                    {user ? user.credits.toLocaleString() : '---'} Credits
                  </strong>
                  {user && user.credits < excelData.length * 80 && (
                    <a
                      href="/credit"
                      className="text-blue-600 font-bold underline hover:text-blue-700 ml-1"
                    >
                      + Nạp thêm
                    </a>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  Số lượng dòng cần gửi: <strong className="text-slate-800">{excelData.length} mẫu</strong>
                </div>

                <button
                  onClick={handleStartBatch}
                  disabled={submitting}
                  className="h-11 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all hover:scale-[1.02]"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Bắt đầu điền form từ Excel</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
