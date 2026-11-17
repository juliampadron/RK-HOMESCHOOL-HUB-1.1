export async function POST() {
  return Response.json(
    { error: 'Checkout is disabled during the private beta.' },
    { status: 503, headers: { 'Cache-Control': 'no-store' } },
  );
}
