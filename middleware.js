export const config = {
  matcher: '/admin-(.*)'
};

export default function middleware(request) {
  // Only apply to paths starting with /admin-
  const url = new URL(request.url);
  if (url.pathname.startsWith('/admin-')) {
    const basicAuth = request.headers.get('authorization');

    if (basicAuth) {
      const authValue = basicAuth.split(' ')[1];
      const [user, pwd] = atob(authValue).split(':');

      // TODO: In a production environment, use process.env to store credentials.
      // For now, hardcoding an initial password for user demonstration.
      // E.g., user: admin, password: withsasayama
      const expectedUser = process.env.ADMIN_USER || 'admin';
      const expectedPwd = process.env.ADMIN_PASS || 'withsasayama';

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
