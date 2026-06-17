import { getSession, getAttendees } from '@/lib/db';
import { corsPreflight, jsonResponse } from '@/lib/cors';

export const runtime = 'nodejs';

export function OPTIONS() {
  return corsPreflight();
}

export async function GET(_request, { params }) {
  const { id } = await params;

  const session = await getSession(id);
  if (!session) {
    return jsonResponse({ error: 'Session not found.' }, { status: 404 });
  }

  return jsonResponse({
    session,
    attendees: await getAttendees(id),
  });
}
