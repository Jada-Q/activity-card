import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createPerson, listPeople } from '@/lib/github-store';
import { embedText } from '@/lib/embed';

export const dynamic = 'force-dynamic';
export const revalidate = 10;

const CreateSchema = z.object({
  name: z.string().min(1).max(60),
  // "What you bring" — skills/background, embedded for similar-match.
  vibe: z.string().max(300).default(''),
  // "Teammate skills you want" — embedded for complementary-match.
  lookingFor: z.string().max(300).default(''),
  social: z.string().max(80).default(''),
  // Legacy fields — accepted for backward compat but unused by v5 flow.
  bio: z.string().max(200).default(''),
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
    // Embed both the skills sentence and the wanted-skills sentence (skip
    // silently if no key). Each returns null on failure — card still gets
    // created, just skipped on the corresponding /match tab.
    const [embedding, wantEmbedding] = await Promise.all([
      parsed.data.vibe ? embedText(parsed.data.vibe) : Promise.resolve(null),
      parsed.data.lookingFor
        ? embedText(parsed.data.lookingFor)
        : Promise.resolve(null),
    ]);

    const person = await createPerson({
      name: parsed.data.name,
      bio: parsed.data.bio,
      lookingFor: parsed.data.lookingFor,
      social: parsed.data.social,
      tags: parsed.data.tags,
      vibe: parsed.data.vibe,
      embedding: embedding ?? undefined,
      wantEmbedding: wantEmbedding ?? undefined,
    });
    return NextResponse.json({ data: person, error: null });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown';
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}
