# 🚀 Deployment Checklist

## Pre-Deployment

- [ ] Run `npm run build` locally - verify no errors
- [ ] Test all admin pages
- [ ] Test all public pages
- [ ] Test authentication (sign in/sign up)
- [ ] Test license generation
- [ ] Test API validation endpoint
- [ ] Verify database migrations applied

## Environment Variables (Vercel)

Required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional (Email):
- `RESEND_API_KEY`

## Post-Deployment

- [ ] Verify homepage loads
- [ ] Test admin login
- [ ] Create test product
- [ ] Create test category
- [ ] Generate test license
- [ ] Verify email sending (if configured)
- [ ] Test API endpoint: POST /api/license/validate
- [ ] Check analytics dashboard
- [ ] Verify global settings

## Performance

- [ ] Run Lighthouse audit
- [ ] Check mobile responsiveness
- [ ] Test dark mode
- [ ] Verify images load
- [ ] Check page load speeds

## Security

- [ ] Verify RLS policies active
- [ ] Test admin-only routes
- [ ] Verify API authentication
- [ ] Check CORS settings
