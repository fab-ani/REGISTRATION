import { createSession, getStudent } from '@/lib/db';
import { corsPreflight, jsonResponse } from '@/lib/cors';

export const runtime = 'nodejs';

export function OPTIONS() {
  return corsPreflight();
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Body must be JSON.' }, { status: 400 });
  }

  const subject     = (body.subject     ?? '').toString().trim();
  const teacher     = (body.teacher     ?? '').toString().trim();
  const periodTime  = (body.periodTime  ?? '').toString().trim();
  const createdBy   = (body.createdBy   ?? '').toString().trim();
  const duration    = body.durationMinutes;

  if (!subject)    return jsonResponse({ error: 'Subject is required.' },     { status: 400 });
  if (!teacher)    return jsonResponse({ error: 'Teacher is required.' },     { status: 400 });
  if (!periodTime) return jsonResponse({ error: 'Period time is required.' }, { status: 400 });
  if (!createdBy)  return jsonResponse({ error: 'createdBy reg number is required.' }, { status: 400 });

  // Role check uses the DB record, not a hardcoded reg number, so accounts
  // created via the "Become CR" toggle on the registration form can also
  // start sessions.
  const creator = await getStudent(createdBy);
  if (!creator) {
    return jsonResponse(
      { error: 'Your account is not registered yet.' },
      { status: 404 }
    );
  }
  if (creator.role !== 'cr') {
    return jsonResponse(
      { error: 'Only a Class Representative can create sessions.' },
      { status: 403 }
    );
  }

  const session = await createSession({
    subject,
    teacher,
    periodTime,
    createdBy,
    durationMinutes: duration,
  });

  return jsonResponse({ session }, { status: 201 });
}
