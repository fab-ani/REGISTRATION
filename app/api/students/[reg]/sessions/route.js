import { getStudent, getSessionsByCreator, getAttendees } from '@/lib/db';
import { corsPreflight, jsonResponse } from '@/lib/cors';

export const runtime = 'nodejs';

export function OPTIONS() {
  return corsPreflight();
}

export async function GET(_request, { params }) {
  const { reg } = await params;

  if (!(await getStudent(reg))) {
    return jsonResponse({ error: 'Student not found.' }, { status: 404 });
  }

  const raw = await getSessionsByCreator(reg);
  const sessions = await Promise.all(
    raw.map(async (s) => ({
      ...s,
      attendeeCount: (await getAttendees(s.id)).length,
    }))
  );

  return jsonResponse({ sessions });
}
