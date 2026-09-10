# MADHYUM GROUP CRM

Mobile-first PWA CRM designed to share the same online Supabase backend between agent web access and the phone app.

## Folder structure

- `index.html` – app shell
- `css/app.css` – premium soothing UI
- `js/app.js` – screens, navigation and interactions
- `js/database.js` – shared data layer
- `js/config.js` – Supabase project URL + anon key
- `js/ui.js` – UI helpers
- `supabase/schema.sql` – database tables, triggers and RLS policies
- `manifest.json` – PWA manifest
- `service-worker.js` – offline/static caching
- `icon/` – PWA icons

## Connect the live CRM

1. Create/open the Supabase project used by the MADHYUM CRM portal.
2. Run `supabase/schema.sql` once in Supabase SQL Editor.
3. Put the project URL and anon key in `js/config.js`.
4. Create users in Supabase Auth. New users automatically receive an `agent` profile.
5. Change the required user's role to `admin` in `public.profiles` when needed.
6. Publish the repository with GitHub Pages or another static host.

When `js/config.js` has no Supabase credentials, the app intentionally runs in demo/local mode for UI testing.

## Important

Do not place a Supabase service-role key in browser code. Only the anon/publishable browser key should be used, with RLS enabled.
