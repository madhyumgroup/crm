MADHYUM CRM MOBILE V4 — FINAL

Purpose: mobile/PWA CRM only. Public website is not included.

Upload/replace the CONTENTS of this folder in the GitHub crm repository root:
index.html, css/, js/, assets/, icon/, manifest.json, sw.js, madhyum-brand.png

Important fixes in this build:
- Uses verified V4 Apps Script URL already present in core.js.
- V4 read routes use GET, preventing generic success responses from showing fake zero dashboards.
- Admin/Agent dashboard response shapes are validated.
- Blank/non-actionable records are hidden in the working CRM.
- Dates are parsed unambiguously as Indian/ISO dates.
- Dashboard hero is shown uncropped on mobile.
- Service-worker cache version bumped so the old app UI is replaced.

After GitHub Pages updates: remove the previously installed PWA once, open https://madhyumgroup.github.io/crm/ in Chrome, refresh, then Add to Home screen / Install app again.
