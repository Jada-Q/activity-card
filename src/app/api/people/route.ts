import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createPerson, listPeople } from '@/lib/github-store';

export const dynamic = 'force-dynamic';
export const revalidate = 10;

const CreateSchema = z.object({
  name: z.string().min(1).max(60),
  bio: z.string().max(200).default(''),
  lookingFor: z.string().max(200).default(''),
  social: z.string().max(80).default(''),
  tags: z.array(z.string().min(1).max(30)).max(3).default([]),
});

export async function GET() {
  try {
    const people = await listPeople();
    return NextResponse.json({ data: people, error: null });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown';
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { data: null, error: 'invalid json' },
      { status: 400 },
    );
  }

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const person = await createPerson(parsed.data);
    return NextResponse.json({ data: person, error: null });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown';
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}
