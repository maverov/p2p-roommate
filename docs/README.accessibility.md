# Accessibility Guide

Use semantic HTML and explicit accessibility attributes by default.

Accessibility is needed so everyone can use the app (including keyboard-only users, screen-reader users, and people with low vision), and it also reduces UX bugs for all users.

## Patterns already used in this app

1. `aria-label` for navigation context (`Navbar`, language switcher, homepage header).
2. `aria-current` for the active language and the current page in breadcrumbs.
3. `role="alert"` and `aria-live="assertive"` for error messaging (`app/error.tsx`).
4. Focus-visible outlines on interactive elements.
5. Meaningful `alt` text for images (`OptimizedListingImage`).
6. Accessible names come from translation keys, so a screen reader in `en` does not read
   Bulgarian labels.

## Example: accessible language switcher

The live switcher is `LocaleLinks` in `components/shared/navbar/NavbarClient.tsx`. It uses
**links, not buttons**: switching language is a navigation, so it should be crawlable,
middle-clickable, and work without JavaScript. `hrefLang` tells assistive tech and
crawlers what each target is, and `aria-current` marks the active one — `aria-pressed`
would wrongly describe a navigation as a toggle.

```tsx
const t = useTranslations('common.nav');

<div aria-label={t('switchLanguage')} role="group">
  {locales.map((candidate) => (
    <Link
      key={candidate}
      aria-current={candidate === locale ? 'true' : undefined}
      href={withLocale(pathname, candidate)}
      hrefLang={candidate}
    >
      {candidate.toUpperCase()}
    </Link>
  ))}
</div>;
```

Note the label comes from `t('switchLanguage')`, not a literal — an accessible name is
user-facing copy and belongs in the catalogue like any other string.

## Example: labeled form field with error message

```tsx
<label htmlFor="email" className="text-sm font-medium">
  Email
</label>
<input
  id="email"
  name="email"
  type="email"
  aria-invalid={hasError}
  aria-describedby={hasError ? 'email-error' : undefined}
  className="rounded border px-3 py-2"
/>
{hasError && (
  <p id="email-error" className="text-sm text-red-600">
    Please enter a valid email address.
  </p>
)}
```

## Example: keyboard-friendly dialog semantics

```tsx
<div role="dialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-text">
  <h2 id="delete-title">Delete listing</h2>
  <p id="delete-text">This action cannot be undone.</p>
  <button type="button">Cancel</button>
  <button type="button">Delete</button>
</div>
```

## Example: accessible error state

```tsx
<main role="alert" aria-live="assertive">
  <h1>Something went wrong</h1>
  <button className="focus-visible:outline-2 focus-visible:outline-offset-2">Try again</button>
</main>
```

## Example: accessible images

```tsx
<Image
  src={src}
  alt="Bright one-bedroom apartment with balcony"
  width={800}
  height={600}
/>
```

## Example: skip link for faster keyboard navigation

```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded focus:bg-white focus:px-3 focus:py-2"
>
  Skip to main content
</a>
<main id="main-content">{children}</main>
```

## Example: icon button with an accessible name

```tsx
<button type="button" aria-label="Close dialog" className="rounded p-2 focus-visible:outline-2">
  <CloseIcon aria-hidden="true" />
</button>
```

## Checklist for new UI

1. Use semantic elements (`main`, `header`, `nav`, `button`, `form`, `label`).
2. Ensure keyboard access to all interactive controls.
3. Use visible focus styles (`focus-visible:*`).
4. Provide labels for controls and landmarks.
5. Use `aria-*` only when native semantics are not enough.
6. Provide descriptive text for error, loading, and empty states.
7. Keep color contrast strong enough for text and controls.

## External guides

- W3C Web Accessibility Initiative (WAI): https://www.w3.org/WAI/fundamentals/accessibility-intro/
- WCAG 2.2 quick reference: https://www.w3.org/WAI/WCAG22/quickref/
- MDN accessibility guide: https://developer.mozilla.org/en-US/docs/Learn/Accessibility
