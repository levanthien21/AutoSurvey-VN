import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const envPath = path.join(process.cwd(), '.env.local');
  let isConfigured = false;
  let config: Record<string, string> = {};

  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...rest] = trimmed.split('=');
        if (key && rest.length > 0) {
          config[key.trim()] = rest.join('=').trim().replace(/(^['"]|['"]$)/g, '');
        }
      }
    });

    const apiKey = config['NEXT_PUBLIC_FIREBASE_API_KEY'] || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '';
    if (apiKey.length > 20 && !apiKey.includes('DummyKey')) {
      isConfigured = true;
    }
  }

  return NextResponse.json({
    success: true,
    isConfigured,
    projectId: config['NEXT_PUBLIC_FIREBASE_PROJECT_ID'] || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'autosurvey-vn',
    authDomain: config['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'] || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId } = body;

    if (!apiKey || apiKey.length < 15) {
      return NextResponse.json({ success: false, error: 'Firebase API Key không hợp lệ.' }, { status: 400 });
    }

    const envPath = path.join(process.cwd(), '.env.local');
    const newEnvContent = `# Firebase Official Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=${apiKey.trim()}
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${(authDomain || `${projectId}.firebaseapp.com`).trim()}
NEXT_PUBLIC_FIREBASE_PROJECT_ID=${(projectId || '').trim()}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${(storageBucket || `${projectId}.appspot.com`).trim()}
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${(messagingSenderId || '').trim()}
NEXT_PUBLIC_FIREBASE_APP_ID=${(appId || '').trim()}
`;

    fs.writeFileSync(envPath, newEnvContent, 'utf8');

    // Also update current process.env
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = apiKey.trim();
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = (authDomain || `${projectId}.firebaseapp.com`).trim();
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = (projectId || '').trim();
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = (storageBucket || `${projectId}.appspot.com`).trim();
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = (messagingSenderId || '').trim();
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID = (appId || '').trim();

    return NextResponse.json({
      success: true,
      message: 'Cấu hình Firebase chính thống đã được lưu thành công vào .env.local!',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Lỗi khi lưu cấu hình Firebase' }, { status: 500 });
  }
}
