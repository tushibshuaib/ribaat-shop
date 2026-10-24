# Ribaat Shop

A dark forest-green online store. React + Vite, Supabase (database, login, image
storage), and Netlify (hosting + secure checkout functions).
Everything below can be done from a phone browser. No computer needed.

## Accounts needed (all free to start)
GitHub, Supabase, Netlify.

## Files: what to upload

UPLOAD every file in this repository, including `.env.example` (blank placeholders only).

NEVER upload: `.env`, `.env.local`, any file holding a real key, `node_modules/`, `dist/`.
The `.gitignore` already blocks them. The SERVICE ROLE key must only ever live in
Netlify's environment variables.

## 1. Supabase setup
1. Create a project (see Stage 1).
2. SQL Editor, New query. Run these files one at a time, in order, each in a NEW query:
   01_schema.sql, 02_policies.sql, 03_storage.sql, 04_checkout_function.sql,
   06_inventory_function.sql
3. Authentication: turn OFF "Allow new users to sign up".
4. Authentication, Users, Add user, Create new user. Use your email and a long unique
   password. Tick "Auto Confirm User".
5. Put your email into 05_make_admin.sql and run it. The result must show role = admin.
6. Project Settings, API. Copy the Project URL, the anon public key, and the
   service_role key (secret).

## 2. Deploy on Netlify
1. app.netlify.com, Add new site, Import an existing project, GitHub. Pick `ribaat-shop`.
2. Build command: `npm run build`. Publish directory: `dist`. (netlify.toml sets these.)
3. Before deploying, open Environment variables and add the four below.
4. Deploy. The first build takes 1 to 3 minutes.

| Name | Value | Secret? |
|---|---|---|
| VITE_SUPABASE_URL | Project URL | public |
| VITE_SUPABASE_ANON_KEY | anon public key | public |
| SUPABASE_URL | Project URL (same as above) | public |
| SUPABASE_SERVICE_ROLE_KEY | service_role key | SECRET: tick "Contains secret values" |

Changing an environment variable needs a new deploy:
Deploys, Trigger deploy, Clear cache and deploy site.

## 3. First-time store setup
1. Visit `your-site.netlify.app/admin/login` and sign in.
2. Settings: store name, phone, delivery fees, bKash/Nagad numbers. Save.
3. Categories: add a few.
4. Products: add products with photos and stock.
5. Banners: add 1 to 3 wide photos.

## 4. Test before you share
- Place a Cash on delivery order as a customer. Stock should drop by the quantity.
- Admin, Orders: the order appears. Set it to cancelled, and stock returns.
- Track order using the order number and the phone number.

## 5. Updating the site
Edit a file on GitHub (pencil icon) and commit. Netlify rebuilds automatically.

## Security rules
- Browser code only ever holds the public anon key.
- Prices and stock are decided on the server when an order is placed.
- Customers cannot read or write orders directly. Only admins can.
- Admin rights come from `profiles.role` in the database and cannot be self-assigned.
- If a secret key is ever pasted somewhere public, rotate it in Supabase immediately.

## Troubleshooting
- Red "Setup needed" bar: the VITE_ variables are missing. Add them and redeploy.
- Build fails mentioning secrets: add the SECRETS_SCAN_OMIT_KEYS line to netlify.toml.
- "Could not place the order": check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, and that
  04_checkout_function.sql was run. See Netlify, Logs, Functions.
- Image upload fails: run 03_storage.sql. Use JPG, PNG or WebP.
- "No admin access" after login: run 05_make_admin.sql with the exact email.
- Page not found after refresh: check the redirect block in netlify.toml.
