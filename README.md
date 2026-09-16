# Porikroma 2026

A mobile-first Durga Puja pass-booking website with:
- Public multi-page-style SPA navigation
- Booking form and server-validated-style calculations via Supabase RPC
- UPI QR + UTR submission workflow
- Booking status lookup
- Admin dashboard
- Pandal list/map links
- English/Bengali UI toggle
- Supabase database + RLS
- Cloudflare Pages-friendly static frontend

## 1. Supabase setup

1. Create a free Supabase project.
2. Open SQL Editor.
3. Run `supabase/schema.sql`.
4. In Project Settings → API, copy:
   - Project URL
   - anon/public key
5. Put them into `js/config.js`.

`js/config.js`:
```js
window.PORIKROMA_CONFIG = {
  supabaseUrl: "https://YOUR-PROJECT.supabase.co",
  supabaseAnonKey: "YOUR_ANON_KEY",
  upiId: "YOUR_UPI_ID@upi",
  upiQrUrl: "",
  collectionAddress: "RBR Skill Academy, Sealdah",
  supportEmail: "porikromap@gmail.com"
};
```

The anon key is intended for browser use. Never put a Supabase service-role key in this file.

## 2. Create the first admin

In Supabase → Authentication → Users, create an email/password user.

Then in SQL Editor run:
```sql
insert into public.admin_users (user_id, role)
select id, 'admin'
from auth.users
where email = 'YOUR_ADMIN_EMAIL';
```

## 3. Run locally

Because this is a static app, you can use any static server. For example:
```bash
python -m http.server 8080
```
Then open:
http://localhost:8080

Opening `index.html` directly may work for the public pages but using a local server is recommended.

## 4. Deploy free

Push this folder to GitHub and connect the repository to Cloudflare Pages.

Build command: leave empty
Output directory: `/`

Your free Pages URL can be:
`https://YOUR-PROJECT.pages.dev`

## Important payment note

The initial version uses UPI QR/manual UTR submission. A customer entering a UTR does NOT make the payment verified. An admin must verify it.

For a production launch, add a real payment gateway/webhook and verify the legal/business requirements before taking live payments.
