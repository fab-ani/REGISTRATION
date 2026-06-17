// Tiny CORS helper — the Flutter app calls these API routes from a
// different origin, so we need to send the right headers.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export function corsHeaders() {
  return { ...CORS_HEADERS };
}

export function jsonResponse(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
      ...(init.headers || {}),
    },
  });
}

// Preflight responder — call from OPTIONS handler in each route.
export function corsPreflight() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
