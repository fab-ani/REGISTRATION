import { getCRForCourse } from '@/lib/db';
import { corsPreflight, jsonResponse } from '@/lib/cors';

export const runtime = 'nodejs';

export function OPTIONS() {
  return corsPreflight();
}

export async function GET(request) {
  const course = new URL(request.url).searchParams.get('course')?.trim();
  if (!course) {
    return jsonResponse({ cr: null });
  }

  const cr = await getCRForCourse(course);
  return jsonResponse({ cr });
}
