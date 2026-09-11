# MADHYUM GROUP CRM — Professional PWA

This build uses the existing MADHYUM Google Apps Script CRM backend and separates the frontend into maintainable feature files.

## File structure

```
MADHYUM-CRM-PROFESSIONAL-FINAL/
├── index.html
├── madhyum-brand.png
├── manifest.json
├── sw.js
├── css/
│   └── app.css
├── icon/
│   ├── icon-192.png
│   └── icon-512.png
└── js/
    ├── core.js
    ├── api.js
    ├── auth.js
    ├── navigation.js
    ├── agent.js
    ├── admin.js
    └── app.js
```

## JavaScript responsibility
- `core.js` — shared state, helpers, UI utilities.
- `api.js` — Google Apps Script API transport.
- `auth.js` — Admin / Agent / BDM login and session handling.
- `navigation.js` — role-based navigation and app startup.
- `agent.js` — Agent / BDM dashboard, leads, follow-ups, calling, shared data, commission, profile.
- `admin.js` — Admin dashboard, leads, agents, calling, distribution, commissions, dispose/restore, export.
- `app.js` — service-worker registration and final bootstrap.

## Deploy
Upload the contents of this folder to the GitHub Pages repository root. Replace the old `index.html`, `css`, `js`, `icon`, `manifest.json`, `sw.js`/old service-worker file, and brand image with these files. Remove obsolete Supabase files from the previous demo architecture.

The login field may visually say Login ID / Email, but the current backend authenticates with Admin ID or Agent/BDM ID unless email mapping is added to the Apps Script backend.


## 2026-09-11 Locked Dashboard Enhancement
This update keeps the existing working CRM architecture and backend. Added only controlled UI/functionality enhancements:
- subtle dashboard photo header
- clean white/off-white content background
- five working MADHYUM business category buttons
- in-app lead-change notification bell with unread count
- 15-second visible-app polling for lead changes

### Replace these files/folders in GitHub
- index.html
- css/app.css
- js/core.js
- js/navigation.js
- js/agent.js
- js/admin.js
- js/app.js
- sw.js
- assets/dashboard-hero.jpg (new file)

Leave api.js, auth.js, manifest.json, logo and icon files unchanged unless separately updating the app icon.
