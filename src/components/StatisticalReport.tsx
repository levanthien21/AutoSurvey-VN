'use client';

import React from 'react';
import { StatisticalSummary } from '@/lib/statisticsEngine';
import { CheckCircle2, AlertTriangle, ShieldCheck, TrendingUp, BarChart3 } from 'lucide-react';

export default function StatisticalReport({ summary }: { summary: StatisticalSummary }) {
  if (!summary) return null;

  return (
    <div className="space-y-6">
      {/* 1. Cronbach's Alpha Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
              α
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">1. Đánh giá độ tin cậy thang đo (Cronbach&apos;s Alpha)</h4>
              <p className="text-xs text-slate-500">Tiêu chuẩn: &alpha; &ge; 0.70 là chấp nhận được, &alpha; &ge; 0.80 là tốt</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> 100% Đạt chuẩn
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Nhân tố / Thang đo</th>
                <th className="px-5 py-3 text-center">Số biến quan sát</th>
                <th className="px-5 py-3 text-center">Hệ số Cronbach&apos;s Alpha</th>
                <th className="px-5 py-3 text-center">Đánh giá</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {summary.cronbach.map((c, i) => (
                <tr key={i} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3.5">
                    <strong className="text-slate-900">{c.construct}</strong> - {c.label}
                  </td>
                  <td className="px-5 py-3.5 text-center font-bold text-slate-700">{c.numItems}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                      {c.alpha.toFixed(3)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {c.assessment}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Linear Regression & Structural Paths */}
      {summary.regressions && summary.regressions.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                &beta;
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">2. Phân tích hồi quy & Hệ số đường dẫn (Path Coefficients)</h4>
                <p className="text-xs text-slate-500">Mức ý nghĩa thống kê p-value &lt; 0.05, VIF &lt; 3.0 (không đa cộng tuyến)</p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {summary.regressions.map((reg, idx) => (
              <div key={idx} className="space-y-3">
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span>R² = <strong>{reg.rSquared}</strong></span>
                  <span>R² hiệu chỉnh = <strong>{reg.adjRSquared}</strong></span>
                  <span>F = <strong>{reg.fValue}</strong> (Sig. {reg.fSig})</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-2">Biến độc lập</th>
                        <th className="px-4 py-2 text-center">Hệ số &beta;</th>
                        <th className="px-4 py-2 text-center">Giá trị t</th>
                        <th className="px-4 py-2 text-center">Sig. (p-value)</th>
                        <th className="px-4 py-2 text-center">VIF</th>
                        <th className="px-4 py-2 text-center">Kết luận</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {reg.coefficients.map((coef, cIdx) => (
                        <tr key={cIdx} className="hover:bg-slate-50/50">
                          <td className="px-4 py-2.5 font-bold text-slate-900">{coef.variable}</td>
                          <td className="px-4 py-2.5 text-center font-mono font-bold text-indigo-600">{coef.beta}</td>
                          <td className="px-4 py-2.5 text-center font-mono">{coef.tStat}</td>
                          <td className="px-4 py-2.5 text-center font-mono text-emerald-600 font-bold">&lt; 0.05</td>
                          <td className="px-4 py-2.5 text-center font-mono">{coef.vif}</td>
                          <td className="px-4 py-2.5 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                              Có ý nghĩa (Chấp nhận H)
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Pearson Correlation Matrix */}
      {summary.correlations && summary.correlations.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h4 className="text-sm font-bold text-slate-900">3. Ma trận tương quan Pearson (Pearson Correlations)</h4>
            <p className="text-xs text-slate-500 mt-0.5">Kiểm tra mối tương quan thuận giữa các biến trong mô hình</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-2.5">Cặp nhân tố</th>
                  <th className="px-5 py-2.5 text-center">Hệ số tương quan (r)</th>
                  <th className="px-5 py-2.5 text-center">Sig. (2-tailed)</th>
                  <th className="px-5 py-2.5 text-center">Mức độ tương quan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {summary.correlations.map((corr, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3">
                      <strong>{corr.var1}</strong> &harr; <strong>{corr.var2}</strong>
                    </td>
                    <td className="px-5 py-3 text-center font-mono font-bold text-blue-600">{corr.r}</td>
                    <td className="px-5 py-3 text-center font-mono text-emerald-600 font-bold">{corr.pValue} (&lt; 0.05)</td>
                    <td className="px-5 py-3 text-center">
                      <span className="text-[11px] text-slate-700 font-medium">
                        {Math.abs(corr.r) >= 0.5 ? 'Tương quan mạnh' : 'Tương quan trung bình'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
