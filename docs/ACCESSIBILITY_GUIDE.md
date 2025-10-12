# Accessibility (a11y) Guide

## Overview

Cortiware is committed to WCAG 2.1 Level AA compliance. This guide documents accessibility standards, patterns, and best practices.

## WCAG 2.1 Level AA Requirements

### Perceivable

**1.1 Text Alternatives**
- All images have alt text
- Decorative images use `alt=""`
- Icons have aria-labels

**1.3 Adaptable**
- Semantic HTML structure
- Proper heading hierarchy (h1 → h2 → h3)
- Form labels associated with inputs

**1.4 Distinguishable**
- Color contrast ratio ≥ 4.5:1 for normal text
- Color contrast ratio ≥ 3:1 for large text
- Text resizable up to 200%
- No information conveyed by color alone

### Operable

**2.1 Keyboard Accessible**
- All functionality available via keyboard
- No keyboard traps
- Visible focus indicators

**2.4 Navigable**
- Skip to main content link
- Descriptive page titles
- Logical focus order
- Clear link purpose

**2.5 Input Modalities**
- Touch targets ≥ 44x44px
- No motion-only controls

### Understandable

**3.1 Readable**
- Language declared: `<html lang="en">`
- Clear, simple language

**3.2 Predictable**
- Consistent navigation
- Consistent identification
- No unexpected context changes

**3.3 Input Assistance**
- Error identification
- Labels and instructions
- Error suggestions
- Error prevention for critical actions

### Robust

**4.1 Compatible**
- Valid HTML
- ARIA attributes used correctly
- Status messages announced

## Semantic HTML

### Proper Structure

```tsx
<header>
  <nav aria-label="Main navigation">
    <ul>
      <li><a href="/dashboard">Dashboard</a></li>
      <li><a href="/leads">Leads</a></li>
    </ul>
  </nav>
</header>

<main>
  <h1>Page Title</h1>
  
  <section aria-labelledby="section-heading">
    <h2 id="section-heading">Section Title</h2>
    <p>Content</p>
  </section>
</main>

<footer>
  <p>&copy; 2025 Cortiware</p>
</footer>
```

### Heading Hierarchy

```tsx
{/* Good: Proper hierarchy */}
<h1>Dashboard</h1>
  <h2>Leads Summary</h2>
    <h3>By Status</h3>
  <h2>Recent Activity</h2>

{/* Bad: Skipping levels */}
<h1>Dashboard</h1>
  <h3>Leads Summary</h3> {/* Skipped h2 */}
```

## ARIA Attributes

### Landmarks

```tsx
<nav aria-label="Main navigation">...</nav>
<main>...</main>
<aside aria-label="Sidebar">...</aside>
<footer>...</footer>
```

### Live Regions

```tsx
{/* Announce status updates */}
<div role="status" aria-live="polite">
  Lead created successfully
</div>

{/* Announce errors */}
<div role="alert" aria-live="assertive">
  Error: Failed to save lead
</div>
```

### Buttons and Links

```tsx
{/* Icon-only button */}
<button aria-label="Close dialog">
  <XIcon />
</button>

{/* Link with context */}
<a href="/leads/123" aria-label="View details for Acme Corp">
  View Details
</a>

{/* Toggle button */}
<button
  aria-pressed={isActive}
  aria-label={isActive ? 'Deactivate' : 'Activate'}
>
  {isActive ? 'Active' : 'Inactive'}
</button>
```

### Form Controls

```tsx
{/* Proper label association */}
<label htmlFor="company-name">Company Name</label>
<input
  id="company-name"
  type="text"
  aria-required="true"
  aria-invalid={hasError}
  aria-describedby={hasError ? 'company-error' : undefined}
/>
{hasError && (
  <div id="company-error" role="alert">
    Company name is required
  </div>
)}

{/* Fieldset for related inputs */}
<fieldset>
  <legend>Contact Information</legend>
  <label htmlFor="email">Email</label>
  <input id="email" type="email" />
  
  <label htmlFor="phone">Phone</label>
  <input id="phone" type="tel" />
</fieldset>
```

### Dialogs/Modals

```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
>
  <h2 id="dialog-title">Confirm Delete</h2>
  <p id="dialog-description">
    Are you sure you want to delete this lead?
  </p>
  
  <button onClick={handleDelete}>Delete</button>
  <button onClick={handleCancel}>Cancel</button>
</div>
```

## Keyboard Navigation

### Focus Management

```tsx
import { useEffect, useRef } from 'react';

function Modal({ isOpen, onClose }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  
  useEffect(() => {
    if (isOpen) {
      // Focus close button when modal opens
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);
  
  return (
    <div role="dialog" aria-modal="true">
      <button ref={closeButtonRef} onClick={onClose}>
        Close
      </button>
      {/* Modal content */}
    </div>
  );
}
```

### Focus Trap

```tsx
import { useEffect } from 'react';

function FocusTrap({ children }) {
  useEffect(() => {
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    function handleTab(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }
    
    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, []);
  
  return <>{children}</>;
}
```

### Skip Links

```tsx
{/* In root layout */}
<a
  href="#main-content"
  className="
    sr-only
    focus:not-sr-only
    focus:absolute
    focus:top-0
    focus:left-0
    focus:z-50
    focus:bg-blue-600
    focus:text-white
    focus:px-4
    focus:py-2
  "
>
  Skip to main content
</a>

<main id="main-content">
  {/* Page content */}
</main>
```

## Color Contrast

### Text Contrast

```css
/* Good: 4.5:1 ratio */
.text-primary {
  color: #1a1a1a; /* Dark gray */
  background: #ffffff; /* White */
}

/* Bad: Insufficient contrast */
.text-light {
  color: #cccccc; /* Light gray */
  background: #ffffff; /* White */
}
```

### Interactive Elements

```css
/* Button with sufficient contrast */
.button-primary {
  color: #ffffff;
  background: #0066cc; /* 4.5:1 with white text */
}

.button-primary:hover {
  background: #0052a3; /* Darker on hover */
}

.button-primary:focus {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}
```

## Screen Reader Support

### Visually Hidden Text

```tsx
{/* Screen reader only text */}
<span className="sr-only">
  Current page: Dashboard
</span>

{/* CSS for sr-only */}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

### Descriptive Labels

```tsx
{/* Good: Descriptive */}
<button aria-label="Delete lead for Acme Corp">
  <TrashIcon />
</button>

{/* Bad: Generic */}
<button aria-label="Delete">
  <TrashIcon />
</button>
```

## Form Validation

### Error Messages

```tsx
function LeadForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  return (
    <form>
      <div>
        <label htmlFor="company">Company Name *</label>
        <input
          id="company"
          type="text"
          aria-required="true"
          aria-invalid={!!errors.company}
          aria-describedby={errors.company ? 'company-error' : undefined}
        />
        {errors.company && (
          <div id="company-error" role="alert" className="text-red-600">
            {errors.company}
          </div>
        )}
      </div>
      
      <button type="submit">Save Lead</button>
    </form>
  );
}
```

### Required Fields

```tsx
{/* Visual and semantic indication */}
<label htmlFor="email">
  Email <span aria-label="required">*</span>
</label>
<input
  id="email"
  type="email"
  required
  aria-required="true"
/>
```

## Testing Tools

### Automated Testing

**ESLint Plugin:**
```bash
npm install --save-dev eslint-plugin-jsx-a11y
```

```json
// .eslintrc.json
{
  "extends": [
    "plugin:jsx-a11y/recommended"
  ]
}
```

**Axe DevTools:**
- Browser extension for automated testing
- Identifies WCAG violations
- Provides remediation guidance

### Manual Testing

**Keyboard Navigation:**
1. Tab through all interactive elements
2. Verify focus indicators are visible
3. Test all functionality without mouse
4. Verify no keyboard traps

**Screen Reader Testing:**
- macOS: VoiceOver (Cmd+F5)
- Windows: NVDA (free) or JAWS
- Test all pages and interactions

## Accessibility Checklist

### General
- [ ] Valid HTML structure
- [ ] Proper heading hierarchy
- [ ] Language declared (`<html lang="en">`)
- [ ] Page titles are descriptive
- [ ] Skip to main content link

### Images
- [ ] All images have alt text
- [ ] Decorative images use `alt=""`
- [ ] Complex images have long descriptions

### Forms
- [ ] All inputs have labels
- [ ] Required fields are indicated
- [ ] Error messages are clear and helpful
- [ ] Form validation is accessible

### Navigation
- [ ] Keyboard accessible
- [ ] Focus indicators visible
- [ ] Logical tab order
- [ ] ARIA landmarks used

### Color & Contrast
- [ ] Text contrast ≥ 4.5:1
- [ ] Large text contrast ≥ 3:1
- [ ] No information by color alone
- [ ] Focus indicators have sufficient contrast

### Interactive Elements
- [ ] Touch targets ≥ 44x44px
- [ ] Buttons have accessible names
- [ ] Links have descriptive text
- [ ] Modals trap focus

### Dynamic Content
- [ ] Status messages announced
- [ ] Errors announced
- [ ] Loading states communicated
- [ ] Live regions used appropriately

Accessibility: Complete ✅

