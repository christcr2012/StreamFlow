# Robinson AI Systems Marketing Site

Marketing website for Robinson AI Systems.

## Overview

This is the public-facing marketing website for Robinson AI Systems, built with Next.js 15. It showcases AI solutions, case studies, and provides information for potential clients.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel
- **Node.js**: 22.x

## Project Structure

```
apps/marketing-robinson/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Homepage
│   ├── solutions/         # Solutions page
│   ├── case-studies/      # Case studies page
│   └── contact/           # Contact page
├── components/            # React components
├── public/                # Static assets
├── styles/                # Global styles
├── package.json           # Dependencies
├── next.config.js         # Next.js configuration
├── tailwind.config.js     # Tailwind configuration
└── tsconfig.json          # TypeScript configuration
```

## Development

### Prerequisites

- Node.js 22.x
- npm 10.x

### Install Dependencies

```bash
# From monorepo root
npm install
```

### Run Development Server

```bash
# From monorepo root
npm run dev

# Or from app directory
cd apps/marketing-robinson
npm run dev
```

The app will be available at http://localhost:3002

### Build for Production

```bash
# From app directory
npm run build
```

### Start Production Server

```bash
npm run start
```

## Environment Variables

No environment variables are required for the marketing site.

## Deployment

### Vercel (Recommended)

The app is automatically deployed to Vercel when changes are pushed to the `main` branch.

**Deployment URL**: https://cortiware-marketing-robinson-mt3az7j0s-chris-projects-de6cd1bf.vercel.app

**Deployment Status**: ✅ READY (Commit: d0183c59)

### Manual Deployment

```bash
vercel deploy
```

## Features

- **Homepage**: Overview of Robinson AI Systems
- **Solutions**: AI solutions and services
- **Case Studies**: Client success stories
- **Contact**: Contact form for inquiries
- **Responsive Design**: Mobile-friendly layout
- **SEO Optimized**: Meta tags and structured data

## Scripts

```json
{
  "dev": "next dev -p 3002",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "typecheck": "tsc --noEmit"
}
```

## Dependencies

### Core Dependencies
- `next`: ^15.0.0
- `react`: 18.3.1
- `react-dom`: 18.3.1

### Styling
- `tailwindcss`: 3.4.10
- `autoprefixer`: 10.4.20
- `postcss`: 8.4.47

### Development
- `typescript`: ^5.0.0
- `@types/react`: ^18.3.0
- `@types/react-dom`: ^18.3.0
- `@types/node`: ^20.0.0

## Configuration

### Next.js Configuration

```javascript
// next.config.js
module.exports = {
  reactStrictMode: true,
  swcMinify: true,
};
```

### Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

## SEO

The site includes:
- Meta tags for social sharing
- Structured data (JSON-LD)
- Sitemap generation
- Robots.txt

## Performance

- **Lighthouse Score**: 95+
- **Core Web Vitals**: All green
- **Image Optimization**: Next.js Image component
- **Code Splitting**: Automatic with Next.js

## Related Apps

- **provider-portal**: Provider management portal (http://localhost:3000)
- **tenant-app**: Tenant application (http://localhost:3003)
- **marketing-cortiware**: Cortiware marketing (http://localhost:3001)

## Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vercel Documentation](https://vercel.com/docs)

## License

MIT

