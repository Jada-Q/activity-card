import { NextResponse } from 'next/server';
import { getPerson } from '@/lib/github-store';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const person = await getPerson(id);
    if (!person) {
      return NextResponse.json(
        { data: null, error: 'not found' },
        { status: 404 },
      );
    }
    return NextResponse.json({ data: person, error: null });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown';
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}
