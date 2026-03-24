import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { approveWithdrawalInternal } from '@/lib/admin/actions/financial';

export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const secret = headersList.get('x-internal-secret');

    const expectedSecret = process.env.INTERNAL_API_SECRET;
    if (!expectedSecret || !secret || secret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { withdrawalId, platformId } = await request.json();

    if (!withdrawalId || !platformId) {
      return NextResponse.json({ error: 'Missing withdrawalId or platformId' }, { status: 400 });
    }

    const result = await approveWithdrawalInternal(withdrawalId, platformId);

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('Error in auto-approve-withdrawal API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
