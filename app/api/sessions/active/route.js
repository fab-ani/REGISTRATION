import { getActiveSessions } from '@/lib/db';
import { corsPreflight, jsonResponse } from '@/lib/cors';

export const runtime = 'nodejs';

export function OPTIONS() {
  return corsPreflight();
}

// GET /api/sessions/active
// Students poll this from the app; each new session triggers an in-app
// alert ("your class has started").
export async function GET() {
  const sessions = await getActiveSessions();
  return jsonResponse({ sessions });
}
