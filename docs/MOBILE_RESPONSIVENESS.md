# Mobile Responsiveness Guide

## Overview

Cortiware applications are built with mobile-first responsive design using Tailwind CSS. This guide documents responsive breakpoints, patterns, and best practices.

## Breakpoints

### Tailwind Default Breakpoints

```css
/* Mobile First (default) */
/* No prefix: 0px - 639px */

sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large desktops */
```

### Usage Examples

```tsx
<div className="
  w-full          /* Mobile: full width */
  sm:w-1/2        /* Tablet: half width */
  lg:w-1/3        /* Desktop: third width */
  p-4             /* Mobile: padding 1rem */
  md:p-6          /* Tablet: padding 1.5rem */
  lg:p-8          /* Desktop: padding 2rem */
">
  Content
</div>
```

## Responsive Patterns

### Navigation

**Mobile: Hamburger Menu**
```tsx
<nav className="flex items-center justify-between p-4">
  {/* Logo */}
  <div className="text-xl font-bold">Cortiware</div>
  
  {/* Mobile menu button */}
  <button className="md:hidden">
    <MenuIcon />
  </button>
  
  {/* Desktop navigation */}
  <div className="hidden md:flex gap-4">
    <a href="/dashboard">Dashboard</a>
    <a href="/leads">Leads</a>
    <a href="/settings">Settings</a>
  </div>
</nav>
```

**Mobile Menu Drawer:**
```tsx
<div className={`
  fixed inset-0 bg-white z-50
  transform transition-transform
  ${isOpen ? 'translate-x-0' : 'translate-x-full'}
  md:hidden
`}>
  <div className="p-4">
    <button onClick={close}>Close</button>
    <nav className="mt-8 space-y-4">
      <a href="/dashboard">Dashboard</a>
      <a href="/leads">Leads</a>
      <a href="/settings">Settings</a>
    </nav>
  </div>
</div>
```

### Tables

**Mobile: Card Layout**
```tsx
{/* Desktop: Table */}
<table className="hidden md:table w-full">
  <thead>
    <tr>
      <th>Company</th>
      <th>Contact</th>
      <th>Status</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {leads.map(lead => (
      <tr key={lead.id}>
        <td>{lead.company}</td>
        <td>{lead.contactName}</td>
        <td>{lead.status}</td>
        <td><button>View</button></td>
      </tr>
    ))}
  </tbody>
</table>

{/* Mobile: Cards */}
<div className="md:hidden space-y-4">
  {leads.map(lead => (
    <div key={lead.id} className="border rounded-lg p-4">
      <div className="font-bold">{lead.company}</div>
      <div className="text-sm text-gray-600">{lead.contactName}</div>
      <div className="mt-2">
        <span className="badge">{lead.status}</span>
      </div>
      <button className="mt-2 w-full">View Details</button>
    </div>
  ))}
</div>
```

### Forms

**Responsive Form Layout:**
```tsx
<form className="space-y-4">
  {/* Single column on mobile, two columns on desktop */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label>Company Name</label>
      <input type="text" className="w-full" />
    </div>
    <div>
      <label>Contact Name</label>
      <input type="text" className="w-full" />
    </div>
  </div>
  
  {/* Full width on all screens */}
  <div>
    <label>Email</label>
    <input type="email" className="w-full" />
  </div>
  
  {/* Stacked buttons on mobile, inline on desktop */}
  <div className="flex flex-col md:flex-row gap-2 md:gap-4">
    <button className="w-full md:w-auto">Save</button>
    <button className="w-full md:w-auto">Cancel</button>
  </div>
</form>
```

### Modals/Dialogs

**Full Screen on Mobile:**
```tsx
<div className="
  fixed inset-0 z-50
  bg-white
  md:inset-auto
  md:top-1/2 md:left-1/2
  md:-translate-x-1/2 md:-translate-y-1/2
  md:w-full md:max-w-lg
  md:rounded-lg
  overflow-y-auto
">
  <div className="p-4 md:p-6">
    <h2 className="text-xl font-bold">Modal Title</h2>
    <div className="mt-4">
      Modal content
    </div>
  </div>
</div>
```

### Dashboard Grids

**Responsive Grid Layout:**
```tsx
<div className="
  grid
  grid-cols-1        /* Mobile: 1 column */
  sm:grid-cols-2     /* Tablet: 2 columns */
  lg:grid-cols-3     /* Desktop: 3 columns */
  xl:grid-cols-4     /* Large: 4 columns */
  gap-4
">
  <MetricCard title="Total Leads" value={1234} />
  <MetricCard title="Converted" value={567} />
  <MetricCard title="Conversion Rate" value="45.9%" />
  <MetricCard title="Revenue" value="$123,456" />
</div>
```

## Touch Targets

### Minimum Size

All interactive elements should be at least 44x44px on mobile:

```tsx
<button className="
  min-h-[44px]
  min-w-[44px]
  px-4 py-2
">
  Click Me
</button>
```

### Spacing

Adequate spacing between touch targets:

```tsx
<div className="flex gap-2 md:gap-4">
  <button>Action 1</button>
  <button>Action 2</button>
  <button>Action 3</button>
</div>
```

## Typography

### Responsive Font Sizes

```tsx
<h1 className="
  text-2xl        /* Mobile: 24px */
  md:text-3xl     /* Tablet: 30px */
  lg:text-4xl     /* Desktop: 36px */
  font-bold
">
  Heading
</h1>

<p className="
  text-sm         /* Mobile: 14px */
  md:text-base    /* Desktop: 16px */
">
  Body text
</p>
```

## Images

### Responsive Images

```tsx
import Image from 'next/image';

<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  className="
    w-full
    h-auto
    object-cover
  "
  sizes="
    (max-width: 768px) 100vw,
    (max-width: 1200px) 50vw,
    33vw
  "
/>
```

## Container Widths

### Max Width Containers

```tsx
<div className="
  container
  mx-auto
  px-4           /* Mobile: 16px padding */
  sm:px-6        /* Tablet: 24px padding */
  lg:px-8        /* Desktop: 32px padding */
  max-w-7xl      /* Max width: 1280px */
">
  Content
</div>
```

## Hiding/Showing Elements

### Conditional Display

```tsx
{/* Show only on mobile */}
<div className="block md:hidden">
  Mobile only content
</div>

{/* Show only on desktop */}
<div className="hidden md:block">
  Desktop only content
</div>

{/* Show on tablet and up */}
<div className="hidden sm:block">
  Tablet and desktop content
</div>
```

## Testing Checklist

### Breakpoint Testing

- [ ] Test at 375px (iPhone SE)
- [ ] Test at 390px (iPhone 12/13/14)
- [ ] Test at 428px (iPhone 14 Pro Max)
- [ ] Test at 768px (iPad)
- [ ] Test at 1024px (iPad Pro)
- [ ] Test at 1280px (Desktop)
- [ ] Test at 1920px (Large Desktop)

### Device Testing

- [ ] iOS Safari (iPhone)
- [ ] iOS Safari (iPad)
- [ ] Chrome Android
- [ ] Chrome Desktop
- [ ] Firefox Desktop
- [ ] Safari Desktop

### Interaction Testing

- [ ] Touch targets are at least 44x44px
- [ ] Buttons are easily tappable
- [ ] Forms are usable on mobile
- [ ] Navigation works on all screen sizes
- [ ] Modals are accessible on mobile
- [ ] Tables are readable on mobile
- [ ] Images scale properly
- [ ] Text is readable without zooming

## Common Issues & Solutions

### Issue: Horizontal Scroll on Mobile

**Solution:**
```tsx
{/* Add to root layout */}
<body className="overflow-x-hidden">
  {children}
</body>
```

### Issue: Text Too Small on Mobile

**Solution:**
```tsx
{/* Use responsive text sizes */}
<p className="text-sm md:text-base">
  Text content
</p>
```

### Issue: Buttons Too Close Together

**Solution:**
```tsx
{/* Add responsive gap */}
<div className="flex gap-2 md:gap-4">
  <button>Button 1</button>
  <button>Button 2</button>
</div>
```

### Issue: Table Overflow on Mobile

**Solution:**
```tsx
{/* Use horizontal scroll container */}
<div className="overflow-x-auto">
  <table className="min-w-full">
    {/* Table content */}
  </table>
</div>

{/* Or use card layout on mobile (preferred) */}
```

## Performance Considerations

### Lazy Loading

```tsx
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Spinner />,
  ssr: false
});
```

### Image Optimization

```tsx
<Image
  src="/large-image.jpg"
  alt="Description"
  width={1200}
  height={800}
  priority={false}  // Lazy load below fold
  quality={75}      // Reduce quality for mobile
/>
```

Mobile Responsiveness: Complete ✅

