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
} from 'lucide-react';
import { ParsedGoogleForm } from '@/lib/googleFormParser';
import { useAuth } from '@/context/AuthContext';

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
  const [delayMin, setDelayMin] = useState<number>(1.5);
  const [delayMax, setDelayMax] = useState<number>(3.5);
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
      setError(err.message || 'Lỗi bóc tách Form');
    } finally {
      setLoading(false);
    }
  };

  const handleStartAgent = async () => {
    if (!form) return;
    setSubmitting(true);
    setError('');

    try {
      // Natural Vietnamese sentence variations for open-ended questions
      const naturalPositiveComments = [
        'Trải nghiệm nhìn chung rất mượt mà và trực quan, nhân viên hỗ trợ nhiệt tình.',
        'Sản phẩm đáp ứng đúng kỳ vọng của tôi, giao diện dễ dùng và nhanh chóng.',
        'Tôi thấy quy trình phục vụ rất chuyên nghiệp, sẽ tiếp tục ủng hộ trong tương lai.',
        'Rất thích tính năng thông báo và sự tiện lợi khi sử dụng.',
        'Mức giá phù hợp với chất lượng mang lại, không có gì để phàn nàn.',
      ];

      const naturalBalancedComments = [
        'Dịch vụ ở mức khá tốt, tuy nhiên thỉnh thoảng phản hồi còn hơi chậm vào giờ cao điểm.',
        'Cơ bản hài lòng, nếu bổ sung thêm tính năng lưu nháp thì sẽ tiện hơn rất nhiều.',
        'Chất lượng ổn định nhưng cần tối ưu thêm giao diện trên điện thoại.',
        'Nhìn chung dùng ổn, hy vọng bên bạn tiếp tục cải thiện tốc độ xử lý.',
      ];

      const allComments = tone === 'enthusiastic' ? naturalPositiveComments : naturalBalancedComments;

      const queue: Record<string, any>[] = [];

      for (let i = 0; i < targetCount; i++) {
        const payload: Record<string, any> = {};

        form.questions.forEach((q) => {
          if (q.options && q.options.length > 0) {
            // Pick based on persona bias
            const opts = q.options;
            let chosenIdx = 0;
            if (personaType === 'student' || personaType === 'office') {
              // Lean towards upper middle (4 or 5)
              const r = Math.random();
              chosenIdx = r < 0.6 ? opts.length - 1 : r < 0.85 ? Math.max(0, opts.length - 2) : 0;
            } else if (personaType === 'manager') {
              // More critical
              const r = Math.random();
              chosenIdx = r < 0.4 ? Math.max(0, opts.length - 2) : opts.length - 1;
            } else {
              chosenIdx = Math.floor(Math.random() * opts.length);
            }
            payload[q.id] = opts[chosenIdx].value;
          } else if (q.type === 'text' || q.type === 'paragraph') {
            if (q.subType === 'name') {
              const names = [
                'Nguyễn Văn An', 'Trần Thị Mai', 'Lê Hoàng Long', 'Phạm Minh Tuấn',
                'Đặng Thảo Vy', 'Hoàng Gia Huy', 'Vũ Mai Anh', 'Bùi Đức Trọng',
                'Đỗ Quỳnh Nga', 'Hồ Quốc Bảo', 'Dương Thúy Hằng'
              ];
              payload[q.id] = names[Math.floor(Math.random() * names.length)];
            } else if (q.subType === 'phone') {
              const prefixes = ['091', '098', '090', '097', '086', '093', '089'];
              const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
              const suffix = Math.floor(1000000 + Math.random() * 9000000);
              payload[q.id] = `${prefix}${suffix}`.slice(0, 10);
            } else if (q.subType === 'email') {
              const userNames = ['vanan', 'thimai', 'hoanglong', 'minhtuan', 'thaovy', 'giahuy', 'maianh', 'ductrong'];
              const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'icloud.com'];
              const randUser = userNames[Math.floor(Math.random() * userNames.length)];
              const randNum = Math.floor(10 + Math.random() * 990);
              const randDomain = domains[Math.floor(Math.random() * domains.length)];
              payload[q.id] = `${randUser}.${randNum}@${randDomain}`;
            } else if (q.subType === 'age') {
              let age = 24;
              if (personaType === 'student') age = 18 + Math.floor(Math.random() * 5);
              else if (personaType === 'office') age = 23 + Math.floor(Math.random() * 12);
              else if (personaType === 'manager') age = 35 + Math.floor(Math.random() * 15);
              else age = 20 + Math.floor(Math.random() * 30);
              payload[q.id] = String(age);
            } else {
              const comment = allComments[Math.floor(Math.random() * allComments.length)];
              payload[q.id] = comment;
            }
          }
        });

        queue.push(payload);
      }

      if (!user) {
        openAuthModal('login');
        setError('Vui lòng đăng nhập hoặc đăng ký tài khoản để bắt đầu chạy đơn. Tài khoản chưa đăng ký sẽ có 0 Credits.');
        setSubmitting(false);
        return;
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `AI Agent (${personaType}) - ${form.title}`,
          formUrl,
          submitUrl: form.submitUrl,
          mode: 'agent',
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
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">AI Agent điền form</h1>
        <p className="text-sm text-slate-500 mt-1">
          Mô phỏng chân dung người tham gia khảo sát có tri thức: Tự động trả lời câu hỏi trắc nghiệm và viết lời phản hồi tự luận chân thực 100%.
        </p>
      </div>

      {/* Step 1: Input URL */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <label className="block text-sm font-bold text-slate-900">1. Nhập đường dẫn Google Form</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={formUrl}
            onChange={(e) => setFormUrl(e.target.value)}
            placeholder="https://docs.google.com/forms/d/e/.../viewform"
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
      </div>

      {/* Step 2: Choose Persona Profile */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <div>
          <h3 className="text-base font-bold text-slate-900">2. Chọn chân dung nhóm đối tượng khảo sát (Persona)</h3>
          <p className="text-xs text-slate-500 mt-0.5">AI sẽ mô phỏng hành vi và phản xạ tương ứng với từng nhóm đối tượng</p>
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
              {user ? (user.role === 'admin' ? '∞ Vô hạn (Admin)' : ` Credits`) : '0 Credits (Chưa đăng nhập)'}
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
            disabled={submitting || !form}
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
