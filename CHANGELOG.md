# Changelog

This file documents all the major changes made to the MT5 Licensing Dashboard application.

## UI Overhaul: Glassmorphism + Cyberpunk Minimal

A complete redesign of the application was undertaken to implement a modern "Glassmorphism + Cyberpunk Minimal" design system. This involved changes to styling, layout, and components across the entire admin and public-facing sections.

### Core Design System Changes:

- **Colors**: Introduced a new color palette with a prominent "neon" accent (`#CFFF04`).
- **Styling**:
    - `glass-card`: A reusable class for creating frosted glass-like card components.
    - `gradient-text`: A class for applying a gradient effect to text.
    - `gradient-bg`: A class for the main background gradient.
- **Typography**: Updated font sizes and weights for a more modern feel.
- **Components**: Many components were restyled or replaced with new, custom-styled versions from `shadcn/ui`.

---

## Admin Section

The entire admin section was overhauled to match the new design system.

### `src/app/admin/layout.tsx`

- Replaced the old layout with a new `AdminLayout` component.
- The new layout includes a redesigned sidebar (`AdminNav`) and a consistent header.
- Applied `glass-card` styling to the main content area.

### `src/app/admin/page.tsx` (Dashboard)

- Replaced old dashboard cards with new `StatsCard` components.
- Updated charts (`RevenueChart`, `UsageChart`, `GeoChart`) to match the new theme.
- Applied `glass-card` styling to all dashboard panels.

### `src/app/admin/analytics/page.tsx`

- Redesigned the page with the new `glass-card` layout.
- Updated all charts and stats to the new theme.

### `src/app/admin/batch/page.tsx`

- Redesigned the batch license generation form.
- Replaced the standard HTML checkbox with a new, styled `Checkbox` component from `src/components/ui/checkbox.tsx`.
- Applied `glass-card` styling to the form container.

### `src/app/admin/categories/page.tsx`

- Redesigned the category management page.
- Both the category list and the "Create Category" form now use `glass-card` styling.
- Updated buttons and inputs to the new design.

### `src/app/admin/licenses/page.tsx` & `[id]/page.tsx`

- Redesigned the licenses table and the individual license detail page.
- Used `glass-card` for table containers and detail panels.
- Added a `CopyLicenseButton` component.

### `src/app/admin/products/page.tsx` & `create/page.tsx`

- Overhauled the product list and product creation/editing forms.
- Applied `glass-card` styling and updated all form elements.

### `src/app/admin/security/page.tsx`

- Redesigned the security settings page.
- Updated the "Recent Activity" and "Active Sessions" sections with the new theme.

### `src/app/admin/settings/page.tsx`

- Redesigned the settings page with the new `glass-card` layout.

### `src/app/admin/users/page.tsx` & `[id]/page.tsx`

- Redesigned the user management table and individual user detail pages.
- Applied `glass-card` styling and updated components.

---

## Public-Facing Section

The public-facing website was updated to provide a consistent and modern user experience.

### `src/app/(public)/layout.tsx`

- Created a new root layout for all public pages.
- Implemented a new, redesigned header and footer that matches the "Glassmorphism" theme.
- This ensures a consistent navigation experience across the public site.

### `src/app/(public)/page.tsx` (Homepage)

- Completely redesigned the homepage.
- **Hero Section**: New design with animated gradient background and updated buttons.
- **Features Section**: Replaced old feature blocks with new `glass-card` components and icons.
- **Products Section**: Redesigned product cards to match the new theme, including new badges and buttons.

### `src/app/about/page.tsx`

- Redesigned the "About Us" page.
- Applied `glass-card` styling to content sections.
- Removed the redundant local navigation, now handled by the root public layout.

### `src/app/contact/page.tsx`

- Redesigned the contact page.
- The contact form and contact information cards now use the `glass-card` style.
- Removed the redundant local navigation.

### `src/app/products/page.tsx` & `[id]/page.tsx`

- Redesigned the product marketplace and product detail pages.
- Product cards and detail sections now use `glass-card` styling.
- Updated filtering and search UI.
- Removed the redundant local navigation.

---

## Authentication

### `src/app/login/page.tsx`

- Created a new, redesigned login page.
- Replaced the old `/auth/signin` page.
- The new page uses Server Actions for form submission and aligns with the new UI.

---

## Components

### `src/components/ui/checkbox.tsx`

- **Created**: A new, styled checkbox component was created using `@radix-ui/react-checkbox` and `tailwind-variants`. This replaced a temporary workaround and is used in the admin panel.

### Other Components

- `AdminLayout`, `AdminNav`, `StatsCard`, `CopyLicenseButton`, `DeleteButton`, etc., were all updated to match the new design system.

---

## Bug Fixes & Type Safety

During the refactoring, several TypeScript and linting errors were identified and resolved.

- **`src/types/index.ts`**: Added the `max_accounts` property to the `License` type definition.
- **`src/app/admin/users/page.tsx`**: Corrected a type assertion for `licensesArray`.
- **`src/app/admin/security/page.tsx`**: Fixed a type casting issue for `mt5Accounts`.
- **`src/app/checkout/[productId]/page.tsx`**: Added missing `Input` and `Label` component imports.
- **`src/app/dashboard/page.tsx`**: Resolved an implicit `any` error by adding an explicit index signature to the `statusVariant` object.
