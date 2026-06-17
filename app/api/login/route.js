import { getStudent } from '@/lib/db';
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

  const regNumber =
    typeof body.regNumber === 'string' ? body.regNumber.trim() : '';

  if (!/^[0-9]{8,15}$/.test(regNumber)) {
    return jsonResponse(
      { error: 'Registration number must be 8–15 digits.' },
      { status: 400 }
    );
  }

  const student = await getStudent(regNumber);
  if (!student) {
    return jsonResponse(
      { error: 'Not registered. Sign up on the website first.' },
      { status: 404 }
    );
  }

  return jsonResponse({ student });
}
