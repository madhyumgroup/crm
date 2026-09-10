# MADHYUM Group CRM Mobile PWA

This package is a phone-first Progressive Web App that uses the existing MADHYUM Google Apps Script CRM backend and the same live data.

## Files
- `index.html` — single role-based login/app shell
- `app.css` — mobile-first MADHYUM UI
- `app.js` — Admin + BDM + Agent CRM client
- `manifest.webmanifest` — installable app metadata
- `sw.js` — offline shell/cache support
- `icons/` — PWA icons
- `Code.gs` — copy of the backend supplied for this build; keep the currently deployed backend unless intentionally replacing it

## GitHub deployment
1. Create a folder such as `/crm/` in the existing GitHub Pages repository.
2. Upload `index.html`, `app.css`, `app.js`, `manifest.webmanifest`, `sw.js` and the `icons` folder to that same folder.
3. Do not upload `Code.gs` to GitHub as a backend. It belongs in Google Apps Script. It is included here only as the reviewed backend reference.
4. Open the GitHub Pages URL ending in `/crm/` on the phone.
5. Android Chrome: menu → **Add to Home screen / Install app**.

## Backend
The app points to the same Apps Script deployment URL already used by the supplied Agent and Admin dashboards. No new database is created.

## Important
If the Apps Script web-app deployment URL changes in future, change the `API_URL` constant at the top of `app.js` and redeploy the static files.
