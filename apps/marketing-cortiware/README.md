# Cortiware Marketing Site

Marketing website for Cortiware SaaS platform.

## Overview

This is the public-facing marketing website for Cortiware, built with Next.js 15. It provides information about the platform, features, pricing, and allows potential customers to sign up.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel
- **Node.js**: 22.x

## Project Structure

```
apps/marketing-cortiware/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Homepage
│   ├── features/          # Features page
│   ├── pricing/           # Pricing page
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
cd apps/marketing-cortiware
npm run dev
```

The app will be available at http://localhost:3001

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

**Deployment URL**: https://cortiware-marketing-cortiware-*.vercel.app

### Manual Deployment

```bash
vercel deploy
```

## Features

- **Homepage**: Overview of Cortiware platform
- **Features**: Detailed feature descriptions
- **Pricing**: Pricing plans and comparison
- **Contact**: Contact form for inquiries
- **Responsive Design**: Mobile-friendly layout
- **SEO Optimized**: Meta tags and structured data

## Scripts

```json
{
  "dev": "next dev -p 3001",
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
- **marketing-robinson**: Robinson AI Systems marketing (http://localhost:3002)

## Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vercel Documentation](https://vercel.com/docs)

## License

MIT

