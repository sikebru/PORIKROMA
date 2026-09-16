# Security notes

- The browser must use only the Supabase anon/public key.
- Never paste the service-role key into `js/config.js`.
- Admin access is controlled by `admin_users` and `auth.users`.
- Customer booking creation is done through `create_booking`.
- The function calculates price server-side and locks inventory before reducing it.
- Payment UTR submission does not equal verification.
- Before taking real money, test the RLS policies and public booking lookup carefully in a separate Supabase project.
- For a production launch, consider a payment gateway webhook so payment verification is cryptographically tied to the gateway rather than manual UTR review.
