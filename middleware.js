export const config = {
  matcher: ['/admin-(.*)', '/api/create-(.*)']
};

export default function middleware(request) {
  // Apply to both admin pages and API endpoints
  const url = new URL(request.url);
  if (url.pathname.startsWith('/admin-') || url.pathname.startsWith('/api/create-')) {
    const basicAuth = request.headers.get('authorization');

    if (basicAuth) {
      const authValue = basicAuth.split(' ')[1];
      const [user, pwd] = atob(authValue).split(':');

      const expectedUser = process.env.ADMIN_USER;
      const expectedPwd = process.env.ADMIN_PASS;

      // Fail securely if environment variables are not configured
      if (!expectedUser || !expectedPwd) {
        return new Response('Server configuration error: Authentication credentials not configured. Please set ADMIN_USER and ADMIN_PASS in Vercel.', {
          status: 500
        });
      }

      if (user === expectedUser && pwd === expectedPwd) {
        // Validation succeeded, continue to the static file
        return new Response(null, { headers: { 'x-middleware-next': '1' } });
      }
    }

    // Require Auth
    return new Response('Basic Auth required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Admin Area"'
      }
    });
  }
}
