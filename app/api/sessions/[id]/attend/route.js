import {
  getSession,
  getStudent,
  recordAttendance,
  isSessionExpired,
} from '@/lib/db';
import { corsPreflight, jsonResponse } from '@/lib/cors';

export const runtime = 'nodejs';

export function OPTIONS() {
  return corsPreflight();
}

export async function POST(request, { params }) {
  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Body must be JSON.' }, { status: 400 });
  }

  const regNumber = (body.regNumber ?? '').toString().trim();
  if (!regNumber) {
    return jsonResponse({ error: 'regNumber is required.' }, { status: 400 });
  }

  const session = await getSession(id);
  if (!session) {
    return jsonResponse({ error: 'Session not found.' }, { status: 404 });
  }

  if (await isSessionExpired(session)) {
    return jsonResponse(
      { error: 'This session has expired. Ask the CR for a new QR.' },
      { status: 410 }
    );
  }

  const student = await getStudent(regNumber);
  if (!student) {
    return jsonResponse(
      { error: 'You are not registered. Sign up on the website first.' },
      { status: 404 }
    );
  }

  const isFirstScan = await recordAttendance({
    sessionId:  session.id,
    studentReg: regNumber,
  });

  return jsonResponse({
    session,
    alreadyAttended: !isFirstScan,
  });
}
