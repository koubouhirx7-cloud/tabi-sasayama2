export const config = {
  matcher: [
    '/admin-(.*)', 
    '/api/create-:path*', 
    '/api/update-:path*', 
    '/api/upload-media', 
    '/api/get-media', 
    '/api/unpublish', 
    '/api/manage-templates'
  ]
};

export default function middleware(request) {
  // Apply to both admin pages and mutating API endpoints
  const url = new URL(request.url);
  const p = url.pathname;
  
  if (
    p.startsWith('/admin-') || 
    p.startsWith('/api/create-') ||
    p.startsWith('/api/update-') ||
    ['/api/upload-media', '/api/get-media', '/api/unpublish', '/api/manage-templates'].includes(p)
  ) {
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

    // --- 6 Hour Session Timeout Logic ---
    // Generate a new Basic Auth Realm name every 6 hours.
    // When the realm name changes, the browser automatically discards the cached password
    // and forces the user to log in again.
    const TIME_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
    const currentSessionBlock = Math.floor(Date.now() / TIME_INTERVAL);

    // Require Auth
    return new Response('Basic Auth required', {
      status: 401,
      headers: {
        'WWW-Authenticate': `Basic realm="Secure Admin Area (Session ${currentSessionBlock})"`
      }
    });
  }
}
