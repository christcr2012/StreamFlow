export function GET() {
  const body = `User-agent: *\nAllow: /\nSitemap: https://www.cortiware.com/sitemap.xml`;
  return new Response(body, { headers: { 'content-type': 'text/plain' } });
}

