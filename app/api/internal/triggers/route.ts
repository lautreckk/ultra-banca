import { NextResponse } from 'next/server';
import { executeTrigger } from '@/lib/admin/actions/evolution';
import { headers } from 'next/headers';

export async function POST(request: Request) {
    try {
        const headersList = await headers();
        const secret = headersList.get('x-internal-secret');

        const expectedSecret = process.env.INTERNAL_API_SECRET;
        if (!expectedSecret || !secret || secret !== expectedSecret) {
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
