import { getStudent, getStudentAttendance } from '@/lib/db';
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

  return jsonResponse({
    regNumber:  reg,
    attendance: await getStudentAttendance(reg),
  });
}
