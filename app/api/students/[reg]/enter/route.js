import { getStudent, recordClassEntry } from '@/lib/db';
import { corsPreflight, jsonResponse } from '@/lib/cors';

export const runtime = 'nodejs';

export function OPTIONS() {
  return corsPreflight();
}

// POST /api/students/[reg]/enter
// Called by the app right after the BLE gate unlocks. Records the
// student's arrival time, attached to the newest active session (if any).
export async function POST(_request, { params }) {
  const { reg } = await params;

  if (!(await getStudent(reg))) {
    return jsonResponse({ error: 'Not registered.' }, { status: 404 });
  }

  const result = await recordClassEntry({ studentReg: reg });
  return jsonResponse({
    matched: result.matched,
    session: result.session,
  });
}
