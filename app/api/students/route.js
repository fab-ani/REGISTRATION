import { getAllStudents } from '@/lib/db';
import { corsPreflight, jsonResponse } from '@/lib/cors';

export const runtime = 'nodejs';

export function OPTIONS() {
  return corsPreflight();
}

export async function GET() {
  return jsonResponse({ students: await getAllStudents() });
}
