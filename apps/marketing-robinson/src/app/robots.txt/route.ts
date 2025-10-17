export function GET() {
  const body = `User-agent: *\nAllow: /\nSitemap: https://www.robinsonaisystems.com/sitemap.xml`;
  return new Response(body, { headers: { 'content-type': 'text/plain' } });
}

