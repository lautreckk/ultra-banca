import { NextResponse } from 'next/server';
import { executeTrigger } from '@/lib/admin/actions/evolution';
import { headers } from 'next/headers';

export async function POST(request: Request) {
    try {
        const headersList = await headers();
        const secret = headersList.get('x-internal-secret');

        // Simple security check using env var (or hardcoded for now if env not set for simplicity in this context, but env is better)
        if (secret !== process.env.INTERNAL_API_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { triggerType, userData } = body;

        if (!triggerType || !userData) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const result = await executeTrigger(triggerType, userData);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error in internal trigger API:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
