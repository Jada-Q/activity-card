import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSpark } from '@/lib/sparks-store';

export const dynamic = 'force-dynamic';

const Schema = z.object({
  from: z.string().regex(/^\d+$/),
  to: z.string().regex(/^\d+$/),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ data: null, error: 'invalid json' }, { status: 400 });
  }
  const parsed = Schema.safeParse(body);
  if (!parsed.success || parsed.data.from === parsed.data.to) {
    return NextResponse.json({ data: null, error: 'invalid spark' }, { status: 400 });
  }
  try {
    const result = await createSpark(parsed.data.from, parsed.data.to);
    return NextResponse.json({ data: result, error: null });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown';
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}
