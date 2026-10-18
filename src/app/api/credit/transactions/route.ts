import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ success: true, transactions: [] });
  }

  let transactions;
  if (user.role === 'admin') {
    transactions = db.getAllTransactions();
  } else {
    transactions = db.getUserTransactions(user.id);
  }

  return NextResponse.json({ success: true, transactions });
}
