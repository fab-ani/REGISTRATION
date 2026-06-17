import { createStudent, getStudent } from '@/lib/db';
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

  const name        = typeof body.name        === 'string' ? body.name.trim()      : '';
  const regNumber   = typeof body.regNumber   === 'string' ? body.regNumber.trim() : '';
  const course      = typeof body.course      === 'string' ? body.course.trim()    : '';
  const yearOfStudy = Number(body.yearOfStudy);

  if (!name) {
    return jsonResponse({ error: 'Name is required.' }, { status: 400 });
  }
  if (!/^[0-9]{8,15}$/.test(regNumber)) {
    return jsonResponse(
      { error: 'Registration number must be 8–15 digits.' },
      { status: 400 }
    );
  }
  if (!course) {
    return jsonResponse({ error: 'Course is required.' }, { status: 400 });
  }
  if (!Number.isInteger(yearOfStudy) || yearOfStudy < 1 || yearOfStudy > 6) {
    return jsonResponse(
      { error: 'Year of study must be between 1 and 6.' },
      { status: 400 }
    );
  }

  if (await getStudent(regNumber)) {
    return jsonResponse(
      { error: 'That registration number is already registered.' },
      { status: 409 }
    );
  }

  const student = await createStudent({ name, regNumber, course, yearOfStudy });
  return jsonResponse({ student }, { status: 201 });
}
