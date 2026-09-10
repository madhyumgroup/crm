# MADHYUM GROUP CRM — Final Locked Build

This build preserves the approved mobile CRM dashboard/interface and adds the requested login flow.

## Login screen
- MADHYUM GROUP
- Ek Bharosemand Zariya
- Admin Login / Agent Login
- Login ID / Email
- Password

If `madhyum-brand.png` already exists in your GitHub repo root, keep it there. The login automatically uses it. If it is missing, a clean M fallback is shown.

## Web ↔ App live sync
Both the GitHub web CRM and the installed PWA must use the **same Supabase project** in `js/config.js`.
After Supabase is connected, this build subscribes to live lead/activity changes so updates made on web refresh in the phone app and vice versa.

## Real login
Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `js/config.js`, run `supabase/schema.sql`, and create Auth users with matching `profiles.role` values (`admin` or `agent`).

### Login ID / Email
Email works directly. If you also want simple Login IDs, set `LOGIN_ID_DOMAIN` in `js/config.js` and create each Supabase Auth user with the same internal email convention, e.g. `AGENT01@your-login-domain`.

## Files to replace in GitHub
Replace these files from this ZIP:
- `css/app.css`
- `js/app.js`
- `js/database.js`
- `js/config.js`
- `service-worker.js`

Other files are included so the ZIP remains complete. `index.html`, `manifest.json`, `js/ui.js`, icons and schema retain the approved structure unless you need to restore them.

## Design lock (10 Sep 2026)
- Login screen follows the approved dark navy + gold MADHYUM reference.
- Role switch: Agent / BDM and Admin.
- Credential label: Login ID / Email.
- Existing dashboard and all inside CRM screens are intentionally preserved.
- `madhyum-brand.png` should remain at repository root (the login automatically uses it).
- Web and installed PWA use the same configured Supabase backend; realtime subscriptions keep shared lead/activity updates synchronized.
