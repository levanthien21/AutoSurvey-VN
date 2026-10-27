'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bot,
  Search,
  Users,
  Sparkles,
  Send,
  Loader2,
  AlertCircle,
  BrainCircuit,
  MessageSquare,
  Sliders,
  CheckCircle2,
  ListFilter,
  Clock,
  ShieldCheck,
  Star,
  Settings2,
} from 'lucide-react';
import { ParsedGoogleForm } from '@/lib/googleFormParser';
import { useAuth } from '@/context/AuthContext';
import { buildBankingGenZQueue } from '@/lib/presets/bankingGenZPreset';

export default function CreateFormAgentPage() {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();
  const [formUrl, setFormUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<ParsedGoogleForm | null>(null);

  // Persona configuration
  const [personaType, setPersonaType] = useState('office'); // student, office, manager, mixed
  const [tone, setTone] = useState('natural'); // natural, critical, enthusiastic
  const [targetCount, setTargetCount] = useState<number>(50);
  const [submitting, setSubmitting] = useState(false);

  // Timing & Delay Settings (Chống giảng viên kiểm tra thời gian)
  const [enableCustomDelay, setEnableCustomDelay] = useState<boolean>(false);
  const [delayPreset, setDelayPreset] = useState<'8-10' | '10-15' | '3-5' | 'custom'>('8-10');
  const [customMinMinutes, setCustomMinMinutes] = useState<number>(8);
  const [customMaxMinutes, setCustomMaxMinutes] = useState<number>(10);

  // VIP Customer Specific Preset (Áp dụng riêng cho khách hàng này theo file yêu cầu)
  const [isCustomerSpecialPreset, setIsCustomerSpecialPreset] = useState<boolean>(false);

  // Calculate delayMin and delayMax in seconds
  const getComputedDelays = () => {
    let min = 1.5;
    let max = 3.5;
    if (enableCustomDelay) {
      if (delayPreset === '8-10') {
        min = 480; // 8 phút
        max = 600; // 10 phút
      } else if (delayPreset === '10-15') {
        min = 600; // 10 phút
        max = 900; // 15 phút
      } else if (delayPreset === '3-5') {
        min = 180; // 3 phút
        max = 300; // 5 phút
      } else if (delayPreset === 'custom') {
        min = Math.max(1, customMinMinutes) * 60;
        max = Math.max(min / 60, customMaxMinutes) * 60;
      }
    }
    return { min, max };
  };

  // Auto-parse helper
  const executeParse = async (urlToParse: string) => {
    if (!urlToParse.trim()) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/forms/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToParse.trim() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setForm(data.form);
      return data.form;
    } catch (err: any) {
      setError(err.message || 'Lỗi bóc tách Form');
      return null;
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const url = params.get('url');
      if (url) {
        setFormUrl(url);
        executeParse(url);
      }
    }
  }, []);

  const personas = [
    {
      id: 'student',
      title: 'Sinh viên & Giới trẻ Gen Z (18 - 22 tuổi)',
      desc: 'Thời gian biểu linh hoạt, am hiểu công nghệ, ngân sách chi tiêu vừa phải, văn phong trẻ trung gần gũi.',
      bias: 'high',
    },
    {
      id: 'office',
      title: 'Nhân viên văn phòng (23 - 35 tuổi)',
      desc: 'Thu nhập ổn định, chú trọng sự tiện lợi và tốc độ, đánh giá kỹ lưỡng về giá trị và trải nghiệm người dùng.',
      bias: 'balanced',
    },
    {
      id: 'manager',
      title: 'Quản lý & Chuyên gia (35 - 50 tuổi)',
      desc: 'Kinh nghiệm phong phú, tiêu chuẩn khắt khe, quan tâm đến tính bảo mật, chất lượng và chăm sóc khách hàng.',
      bias: 'critical',
    },
    {
      id: 'mixed',
      title: 'Đa dạng nhân khẩu học toàn quốc',
      desc: 'Phân bổ ngẫu nhiên từ học sinh, sinh viên, nhân viên đến nội trợ trên khắp cả nước tạo mẫu đại diện cao.',
      bias: 'normal',
    },
  ];

  const handleParseForm = async () => {
    if (!formUrl.trim()) {
      setError('Vui lòng nhập đường dẫn Google Form hoặc Microsoft Form.');
      return;
    }
    await executeParse(formUrl);
  };

  const handleStartAgent = async () => {
    let currentForm = form;
    setError('');

    // If form not yet parsed but user has entered a URL, auto-parse now
    if (!currentForm) {
      if (!formUrl.trim()) {
        setError('Vui lòng nhập đường dẫn Google Form hoặc Microsoft Form hợp lệ trước khi bắt đầu.');
        return;
      }
      currentForm = await executeParse(formUrl);
      if (!currentForm) return;
    }

    setSubmitting(true);

    try {
      // Natural Vietnamese sentence variations for open-ended questions based on Persona & Tone
      const naturalPositiveComments = [
        'Trải nghiệm nhìn chung rất mượt mà và trực quan, nhân viên hỗ trợ nhiệt tình.',
        'Sản phẩm đáp ứng đúng kỳ vọng của tôi, giao diện dễ dùng và nhanh chóng.',
        'Tôi thấy quy trình phục vụ rất chuyên nghiệp, sẽ tiếp tục ủng hộ trong tương lai.',
        'Rất thích tính năng thông báo và sự tiện lợi khi sử dụng hàng ngày.',
        'Mức giá phù hợp với chất lượng mang lại, không có gì để phàn nàn.',
        'Đánh giá cao tính bảo mật và sự chỉn chu trong từng khâu phục vụ.',
        'Rất hài lòng, thời gian phản hồi nhanh và giải quyết vấn đề triệt để.',
      ];

      const naturalBalancedComments = [
        'Dịch vụ ở mức khá tốt, tuy nhiên thỉnh thoảng phản hồi còn hơi chậm vào giờ cao điểm.',
        'Cơ bản hài lòng, nếu bổ sung thêm tính năng lưu nháp thì sẽ tiện hơn rất nhiều.',
        'Chất lượng ổn định nhưng cần tối ưu thêm giao diện trên điện thoại.',
        'Nhìn chung dùng ổn, hy vọng bên bạn tiếp tục cải thiện tốc độ xử lý.',
        'Sản phẩm tốt, mức giá hợp lý nhưng nên có thêm hướng dẫn chi tiết cho người mới.',
        'Trải nghiệm tương đối ổn, chưa gặp lỗi nghiêm trọng nào.',
      ];

      const criticalComments = [
        'Quy trình khá ổn nhưng thời gian chờ đợi còn lâu, cần cải thiện hiệu suất hệ thống.',
        'Cần tối ưu thêm trải nghiệm người dùng ở các bước xác nhận để tránh nhầm lẫn.',
        'Mong muốn bên bạn lắng nghe phản hồi của người dùng và cập nhật thêm các tính năng hữu ích.',
        'Chính sách chăm sóc khách hàng cần linh hoạt và chủ động hơn.',
      ];

      const allComments =
        tone === 'enthusiastic'
          ? naturalPositiveComments
          : tone === 'critical'
          ? criticalComments
          : naturalBalancedComments;

      let queue: Record<string, any>[] = [];

      if (isCustomerSpecialPreset) {
        // Áp dụng 100% chuẩn theo file của khách hàng (CB-SEM/PLS-SEM Gen Z)
        queue = buildBankingGenZQueue(currentForm.questions, targetCount);
      } else {
        for (let i = 0; i < targetCount; i++) {
        const payload: Record<string, any> = {};

        currentForm.questions.forEach((q) => {
          // 0. Grid / Matrix question rows (Likert scale multi-statement)
          if (q.type === 'grid' && q.gridRows && q.gridRows.length > 0) {
            const opts = q.options && q.options.length > 0 ? q.options : [{ value: '4' }, { value: '5' }];
            q.gridRows.forEach((r) => {
              if (r.entryId) {
                let chosenIdx = 0;
                if (personaType === 'student' || personaType === 'office') {
                  const rand = Math.random();
                  chosenIdx = rand < 0.7 ? opts.length - 1 : rand < 0.9 ? Math.max(0, opts.length - 2) : 0;
                } else if (personaType === 'manager') {
                  const rand = Math.random();
                  chosenIdx = rand < 0.4 ? Math.max(0, opts.length - 2) : opts.length - 1;
                } else {
                  chosenIdx = Math.floor(Math.random() * opts.length);
                }
                payload[r.entryId] = opts[chosenIdx]?.value || '4';
              }
            });
            return;
          }

          // 1. Choice / Radio / Dropdown
          if (q.options && q.options.length > 0 && q.type !== 'checkbox' && q.type !== 'grid') {
            const opts = q.options;
            let chosenIdx = 0;
            if (personaType === 'student' || personaType === 'office') {
              const r = Math.random();
              chosenIdx = r < 0.65 ? opts.length - 1 : r < 0.9 ? Math.max(0, opts.length - 2) : 0;
            } else if (personaType === 'manager') {
              const r = Math.random();
              chosenIdx = r < 0.4 ? Math.max(0, opts.length - 2) : opts.length - 1;
            } else {
              chosenIdx = Math.floor(Math.random() * opts.length);
            }
            payload[q.id] = opts[chosenIdx].value;
          }
          // 2. Checkbox (Multi-choice)
          else if (q.type === 'checkbox') {
            const opts = q.options || [];
            if (opts.length > 0) {
              const selectedCount = Math.min(opts.length, Math.random() < 0.6 ? 1 : 2);
              const shuffled = [...opts].sort(() => 0.5 - Math.random());
              const picked = shuffled.slice(0, selectedCount).map((o) => o.value);
              payload[q.id] = picked;
            }
          }
          // 3. Scale / Linear Likert (Thang đo 1-5)
          else if (q.type === 'scale') {
            const min = q.scaleMin || 1;
            const max = q.scaleMax || 5;
            let score = max;
            if (personaType === 'student' || personaType === 'office') {
              score = Math.random() < 0.7 ? max : Math.max(min, max - 1);
            } else if (personaType === 'manager') {
              score = Math.random() < 0.5 ? Math.max(min, max - 1) : max;
            } else {
              score = Math.floor(min + Math.random() * (max - min + 1));
            }
            payload[q.id] = String(score);
          }
          // 4. Date question
          else if (q.type === 'date') {
            const d = new Date();
            d.setDate(d.getDate() - Math.floor(Math.random() * 30));
            payload[q.id] = d.toISOString().split('T')[0];
          }
          // 5. Time question
          else if (q.type === 'time') {
            const h = String(8 + Math.floor(Math.random() * 12)).padStart(2, '0');
            const m = String(Math.floor(Math.random() * 60)).padStart(2, '0');
            payload[q.id] = `${h}:${m}`;
          }
          // 6. Text / Paragraph open-ended questions
          else if (q.type === 'text' || q.type === 'paragraph') {
            if (q.subType === 'name') {
              const names = [
                'Nguyễn Văn An', 'Trần Thị Mai', 'Lê Hoàng Long', 'Phạm Minh Tuấn',
                'Đặng Thảo Vy', 'Hoàng Gia Huy', 'Vũ Mai Anh', 'Bùi Đức Trọng',
                'Đỗ Quỳnh Nga', 'Hồ Quốc Bảo', 'Dương Thúy Hằng', 'Lý Gia Hưng',
                'Nguyễn Hải Đăng', 'Võ Phương Linh', 'Trịnh Bá Đạt'
              ];
              payload[q.id] = names[Math.floor(Math.random() * names.length)];
            } else if (q.subType === 'phone') {
              const prefixes = ['091', '098', '090', '097', '086', '093', '089', '077', '083'];
              const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
              const suffix = Math.floor(1000000 + Math.random() * 9000000);
              payload[q.id] = `${prefix}${suffix}`.slice(0, 10);
            } else if (q.subType === 'email') {
              const userNames = ['vanan', 'thimai', 'hoanglong', 'minhtuan', 'thaovy', 'giahuy', 'maianh', 'ductrong', 'quynhnga', 'quocbao'];
              const domains = ['gmail.com', 'outlook.com', 'yahoo.com', 'icloud.com'];
              const randUser = userNames[Math.floor(Math.random() * userNames.length)];
              const randNum = Math.floor(10 + Math.random() * 990);
              const randDomain = domains[Math.floor(Math.random() * domains.length)];
              payload[q.id] = `${randUser}.${randNum}@${randDomain}`;
            } else if (q.subType === 'age') {
              let age = 22;
              if (personaType === 'student') age = 18 + Math.floor(Math.random() * 5);
              else if (personaType === 'office') age = 23 + Math.floor(Math.random() * 12);
              else if (personaType === 'manager') age = 35 + Math.floor(Math.random() * 15);
              else age = 20 + Math.floor(Math.random() * 30);
              payload[q.id] = String(age);
            } else if (q.subType === 'school') {
              const schools = [
                'Đại học Quốc gia Hà Nội',
                'Đại học Bách Khoa',
                'Đại học Kinh tế Quốc dân (NEU)',
                'Đại học Ngoại Thương (FTU)',
                'Đại học Kinh tế TP.HCM (UEH)',
                'Đại học FPT',
                'Đại học Cần Thơ',
                'Học viện Ngân hàng',
                'Học viện Tài chính',
              ];
              payload[q.id] = schools[Math.floor(Math.random() * schools.length)];
            } else if (q.subType === 'major') {
              const majors = [
                'Quản trị kinh doanh',
                'Marketing & Truyền thông số',
                'Công nghệ thông tin',
                'Tài chính - Ngân hàng',
                'Kế toán - Kiểm toán',
                'Ngôn ngữ Anh thương mại',
                'Kinh doanh quốc tế',
                'Khoa học dữ liệu',
              ];
              payload[q.id] = majors[Math.floor(Math.random() * majors.length)];
            } else if (q.subType === 'location') {
              const cities = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Bình Dương', 'Đồng Nai', 'Quảng Ninh', 'Huế'];
              payload[q.id] = cities[Math.floor(Math.random() * cities.length)];
            } else if (q.subType === 'job') {
              const jobs = [
                'Sinh viên năm cuối',
                'Nhân viên văn phòng',
                'Chuyên viên Marketing',
                'Lập trình viên / IT',
                'Nhân viên kinh doanh',
                'Trưởng nhóm dự án',
                'Quản lý bộ phận',
              ];
              payload[q.id] = jobs[Math.floor(Math.random() * jobs.length)];
            } else {
              const comment = allComments[Math.floor(Math.random() * allComments.length)];
              payload[q.id] = comment;
            }
          }

          // 7. Grid / Matrix question rows fallback
          if (q.gridRows && q.gridRows.length > 0) {
            const opts = q.options && q.options.length > 0 ? q.options : [{ value: '4' }, { value: '5' }];
            q.gridRows.forEach((r) => {
              if (r.entryId) {
                const optVal = opts[Math.floor(Math.random() * opts.length)].value;
                payload[r.entryId] = optVal;
              }
            });
          }
        });

        // ĐẢM BẢO 100% KHÔNG CÂU HỎI HAY DÒNG MA TRẬN NÀO BỊ BỎ SÓT:
        currentForm.questions.forEach((chkQ) => {
          if (chkQ.type === 'grid' && chkQ.gridRows) {
            const opts = chkQ.options && chkQ.options.length > 0 ? chkQ.options : [{ value: '4' }, { value: '5' }];
            chkQ.gridRows.forEach((r) => {
              if (r.entryId && (payload[r.entryId] === undefined || payload[r.entryId] === null || payload[r.entryId] === '')) {
                payload[r.entryId] = opts[Math.min(3, opts.length - 1)].value;
              }
            });
          } else {
            if (payload[chkQ.id] === undefined || payload[chkQ.id] === null || payload[chkQ.id] === '') {
              if (chkQ.options && chkQ.options.length > 0) {
                payload[chkQ.id] = chkQ.type === 'checkbox' ? [chkQ.options[0].value] : chkQ.options[Math.min(3, chkQ.options.length - 1)].value;
              } else if (chkQ.type === 'scale') {
                payload[chkQ.id] = '4';
              } else if (chkQ.type === 'date') {
                payload[chkQ.id] = new Date().toISOString().split('T')[0];
              } else if (chkQ.type === 'time') {
                payload[chkQ.id] = '10:00';
              } else {
                payload[chkQ.id] = 'Hoàn toàn đồng ý';
              }
            }
          }
        });

        queue.push(payload);
        }
      }

      if (!user) {
        openAuthModal('login');
        setError('Vui lòng đăng nhập hoặc đăng ký tài khoản để bắt đầu chạy đơn. Tài khoản chưa đăng ký sẽ có 0 Credits.');
        setSubmitting(false);
        return;
      }

      const { min: finalDelayMin, max: finalDelayMax } = getComputedDelays();

      const token = typeof window !== 'undefined' ? localStorage.getItem('autosurvey_token') : null;
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: isCustomerSpecialPreset
            ? `[VIP Preset] Khảo sát Thẻ tín dụng & Ngân hàng số Gen Z - ${currentForm.title}`
            : `AI Agent (${personaType}) - ${currentForm.title}`,
          formUrl,
          submitUrl: currentForm.submitUrl,
          platform: currentForm.platform,
          antiForgeryToken: currentForm.antiForgeryToken,
          serverSessionId: currentForm.serverSessionId,
          msSchema: currentForm.msSchema,
          pageHistory: currentForm.pageHistory,
          mode: 'agent',
          totalTarget: queue.length,
          delayMin: finalDelayMin,
          delayMax: finalDelayMax,
          responsesQueue: queue,
          fbzx: currentForm.fbzx,
          autoStart: true,
        }),
      });

      const resData = await res.json();
      if (!resData.success) throw new Error(resData.error);

      if (resData.order) {
        try {
          const cur = JSON.parse(localStorage.getItem('autosurvey_orders') || '[]');
          const updated = [resData.order, ...cur.filter((o: any) => o.id !== resData.order.id)];
          localStorage.setItem('autosurvey_orders', JSON.stringify(updated));
          localStorage.setItem('autosurvey_active_order', JSON.stringify(resData.order));
        } catch {}
      }

      router.push(`/orders?id=${resData.order.id}`);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi kích hoạt AI Agent');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold mb-2">
          <Bot className="w-3.5 h-3.5" />
          <span>Chế độ 4 (AI Agent Thông minh)</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">AI Agent điền form tự luận đa nhân khẩu</h1>
        <p className="text-sm text-slate-500 mt-1">
          Mô phỏng chân dung người tham gia khảo sát có tri thức: Tự động trả lời câu hỏi trắc nghiệm, thang đo Likert và viết lời phản hồi tự luận chân thực 100%.
        </p>
      </div>

      {/* Step 1: Input URL */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <label className="block text-sm font-bold text-slate-900">1. Nhập đường dẫn Google Form hoặc Microsoft Form</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={formUrl}
            onChange={(e) => setFormUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleParseForm();
              }
            }}
            placeholder="https://docs.google.com/forms/d/e/.../viewform hoặc https://forms.cloud.microsoft/..."
            className="flex-1 h-11 px-4 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={handleParseForm}
            disabled={loading || !formUrl}
            className="h-11 px-6 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-xs shrink-0"
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

        {/* Form Parsed Summary Card */}
        {form && (
          <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Biểu mẫu đã bóc tách sẵn sàng ({form.platform === 'microsoft' ? 'Microsoft Forms' : 'Google Forms'})
                </span>
              </div>
              <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900">
                {form.questions.length} câu hỏi hợp lệ
              </span>
            </div>
            <h4 className="text-sm font-extrabold text-slate-900 line-clamp-1">{form.title}</h4>
            {form.description && (
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{form.description}</p>
            )}

            {/* Quick Question Preview */}
            <div className="pt-2 border-t border-emerald-200/60">
              <div className="text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <ListFilter className="w-3 h-3 text-emerald-600" />
                <span>Các loại câu hỏi nhận diện được:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Array.from(new Set(form.questions.map((q) => q.subType ? `${q.type} (${q.subType})` : q.type))).map((t, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-white border border-emerald-200 font-medium text-slate-700 shadow-2xs"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Choose Persona Profile */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <div>
          <h3 className="text-base font-bold text-slate-900">2. Chọn chân dung nhóm đối tượng khảo sát (Persona)</h3>
          <p className="text-xs text-slate-500 mt-0.5">AI sẽ mô phỏng hành vi và phản xạ tương ứng với từng nhóm đối tượng</p>
        </div>

        {/* VIP Customer Special Preset Toggle */}
        <div className={`p-4 rounded-2xl border-2 transition-all ${isCustomerSpecialPreset ? 'border-amber-500 bg-amber-50/70 shadow-sm' : 'border-slate-200/80 bg-slate-50/50 hover:border-slate-300'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-md shadow-amber-500/20">
                <Star className="w-5 h-5 fill-current" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    Cấu hình Chuyên biệt: Khảo sát Ngân hàng số & Thẻ tín dụng Gen Z
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                    Theo file yêu cầu riêng
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Thiết lập chuẩn hóa theo file dự đoán dữ liệu (CB-SEM/PLS-SEM): 49 phát biểu Likert chuẩn Mean & Std Dev, 9 câu nhân khẩu, 5 câu đảo chiều, câu kiểm tra chú ý #39 (loại &lt; 10%), tự động áp dụng thời gian đọc 8 - 10 phút.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
              <span className="text-xs font-bold text-slate-700">
                {isCustomerSpecialPreset ? 'Đang bật' : 'Tắt'}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCustomerSpecialPreset}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsCustomerSpecialPreset(checked);
                    if (checked) {
                      setEnableCustomDelay(true);
                      setDelayPreset('8-10');
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>
          </div>

          {isCustomerSpecialPreset && (
            <div className="mt-3 pt-3 border-t border-amber-200 text-xs text-amber-950 space-y-1">
              <div className="flex items-center gap-2 font-semibold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Đã nạp 100% quy tắc file: Tự động điều tiết điểm trung bình Likert 2.5 - 4.5, độ lệch chuẩn 0.7 - 1.2, câu 39 chọn mức 1 (90%) và các nhóm năm sinh Gen Z 1998 - 2008.</span>
              </div>
              <p className="text-[11px] text-amber-850/80 italic">
                * Lưu ý: Cấu hình này chỉ áp dụng riêng cho khách hàng này theo file nhu cầu cụ thể, không upload dùng chung cho toàn bộ web.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {personas.map((p) => {
            const isSelected = personaType === p.id;
            return (
              <div
                key={p.id}
                onClick={() => setPersonaType(p.id)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-purple-600 bg-purple-50/40 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{p.title}</span>
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-purple-600 bg-purple-600' : 'border-slate-300'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">{p.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Tone & Style */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Giọng điệu trả lời tự luận</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full h-10 px-3 text-xs font-medium rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            >
              <option value="natural">Tự nhiên, đa dạng (Khuyên dùng)</option>
              <option value="enthusiastic">Tích cực, đánh giá cao, hài lòng</option>
              <option value="critical">Khách quan, góp ý xây dựng</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Số lượng câu trả lời cần điền</label>
            <input
              type="number"
              min="5"
              max="1000"
              value={targetCount}
              onChange={(e) => setTargetCount(Number(e.target.value) || 10)}
              className="w-full h-10 px-3 text-sm font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Step 3: Timing & Delay Configuration (Chống giảng viên kiểm tra) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" />
              <h3 className="text-base font-bold text-slate-900">3. Cài đặt thời gian đọc & nộp form (Chống giảng viên kiểm tra)</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Tùy chỉnh thời gian đọc form trung bình để Google Sheet ghi nhận timestamp nộp bài tự nhiên như người thật làm bài
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <span className="text-xs font-bold text-slate-700">
              {enableCustomDelay ? 'Đang bật' : 'Tắt'}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enableCustomDelay}
                onChange={(e) => setEnableCustomDelay(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>

        {!enableCustomDelay ? (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>⚡ Chế độ hiện tại: <strong>Siêu tốc (1.5 - 3.5 giây / phản hồi)</strong> — Thích hợp điền nhanh hoặc khảo sát không yêu cầu kiểm tra thời gian.</span>
            <button
              type="button"
              onClick={() => setEnableCustomDelay(true)}
              className="text-[11px] font-bold text-purple-700 hover:text-purple-800 underline text-left sm:text-right cursor-pointer"
            >
              Bật mô phỏng thời gian đọc bài →
            </button>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {[
                { id: '8-10', title: '8 - 10 phút (Khuyên dùng)', desc: 'Mô phỏng đọc kỹ 40-50 câu, chống giảng viên check tuyệt đối' },
                { id: '10-15', title: '10 - 15 phút (Chuyên sâu)', desc: 'Dành cho nghiên cứu học thuật dài, nhiều nội dung đọc hiểu' },
                { id: '3-5', title: '3 - 5 phút (Khảo sát ngắn)', desc: 'Dành cho phiếu khảo sát ngắn dưới 15 câu' },
                { id: 'custom', title: 'Tùy chỉnh phút', desc: 'Tự nhập khoảng thời gian min - max theo nhu cầu' },
              ].map((item) => (
                <div
                  key={item.id}
                  onClick={() => setDelayPreset(item.id as any)}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    delayPreset === item.id
                      ? 'border-purple-600 bg-purple-50/50 shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-900">{item.title}</div>
                  <div className="text-[11px] text-slate-500 mt-1 leading-snug">{item.desc}</div>
                </div>
              ))}
            </div>

            {delayPreset === 'custom' && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Thời gian tối thiểu (Phút)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={customMinMinutes}
                    onChange={(e) => setCustomMinMinutes(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full h-9 px-3 text-sm font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Thời gian tối đa (Phút)</label>
                  <input
                    type="number"
                    min={customMinMinutes}
                    max="120"
                    value={customMaxMinutes}
                    onChange={(e) => setCustomMaxMinutes(Math.max(customMinMinutes, Number(e.target.value) || customMinMinutes))}
                    className="w-full h-9 px-3 text-sm font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Chống phát hiện tự động:</strong> Giữa mỗi phản hồi, hệ thống sẽ ngẫu nhiên hóa thời gian chờ trong khoảng <strong>{(getComputedDelays().min / 60).toFixed(0)} - {(getComputedDelays().max / 60).toFixed(0)} phút</strong>. Dấu thời gian nộp bài trên Google Sheet sẽ hoàn toàn tự nhiên, giảng viên xem lịch sử sẽ thấy như nhiều người khác nhau đang tự đọc và hoàn thành bài thi/khảo sát.
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">

        {/* Commercial billing card */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-slate-500">Chi phí AI Agent: </span>
            <strong className="text-purple-700 font-bold">{(targetCount * 500).toLocaleString()} Credits</strong>
            <span className="text-slate-400"> (500đ / câu bao gồm sinh tự luận AI)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Số dư hiện tại: </span>
            <strong className="text-slate-900 font-mono font-bold">
              {user ? (user.role === 'admin' ? '∞ Vô hạn (Admin)' : `${user.credits.toLocaleString()} Credits`) : '0 Credits (Chưa đăng nhập)'}
            </strong>
            {user && user.role !== 'admin' && user.credits < targetCount * 500 && (
              <a
                href="/credit"
                className="text-blue-600 font-bold underline hover:text-blue-700 ml-1"
              >
                + Nạp thêm
              </a>
            )}
            {!user && (
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="text-blue-600 font-bold underline hover:text-blue-700 ml-1"
              >
                Đăng nhập
              </button>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <BrainCircuit className="w-4 h-4 text-purple-600" />
            <span>AI sẽ tự sinh nội dung tự luận khác nhau cho từng người điền.</span>
          </div>

          <button
            onClick={handleStartAgent}
            disabled={submitting}
            className="h-11 px-8 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-bold text-sm shadow-md shadow-purple-500/20 flex items-center gap-2 transition-all hover:scale-[1.02]"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Kích hoạt AI Agent nộp bài</span>
          </button>
        </div>
      </div>
    </div>
  );
}
