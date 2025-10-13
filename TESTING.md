# 🧪 Testing Guide

## 1. Authentication Flow

**Sign Up:**
1. Go to `/auth/signup`
2. Create account with test email
3. Verify redirect to sign in

**Sign In:**
1. Go to `/auth/signin`
2. Sign in with admin email (mark8pips@gmail.com)
3. Verify redirect to `/admin`

## 2. Admin Features

**Categories:**
1. Go to `/admin/categories`
2. Create new category
3. Verify it appears in list
4. Delete category

**Products:**
1. Go to `/admin/products`
2. Click "Add New EA"
3. Fill form and create product
4. Verify product appears on public site

**Licenses:**
1. Go to `/admin/licenses`
2. Generate license for a product
3. Copy license key
4. Check user dashboard

**Analytics:**
1. Go to `/admin/analytics`
2. Verify stats display
3. Check charts load

**Users:**
1. Go to `/admin/users`
2. View user list
3. Click on user to see details
4. Test block/unblock

## 3. Public Site

**Homepage:**
1. Go to `/`
2. Verify hero section
3. Check featured products
4. Click "Browse Products"

**Products:**
1. Go to `/products`
2. Test search
3. Test category filtering
4. Click product to view details

**Customer Dashboard:**
1. Sign in as customer
2. Go to `/dashboard`
3. Verify licenses display
4. Test copy license key

## 4. API Testing

**Validate License:**
curl -X POST https://your-domain.vercel.app/api/license/validate
-H "Content-Type: application/json"
-d '{
"license_key": "YOUR-TEST-KEY",
"account_number": 123456,
"broker_server": "Broker-Server",
"account_name": "Test Account",
"broker_company": "Test Broker"
}'

Expected: `{ "valid": true, ... }`

## 5. Mobile Testing

- Test on Chrome DevTools mobile view
- Verify navigation works
- Check cards are responsive
- Test forms on mobile
