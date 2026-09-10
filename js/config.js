// Connect BOTH the web CRM and installed phone PWA to the SAME Supabase project.
// Then web changes appear in the app and app changes appear on the web automatically.
export const SUPABASE_URL = '';
export const SUPABASE_ANON_KEY = '';

// Optional Login ID support: a Login ID such as AGENT01 is converted internally
// to AGENT01@<this-domain>. Use the SAME convention when creating Auth users.
// If your team uses only real email addresses, you can leave this blank.
export const LOGIN_ID_DOMAIN = '';

export const APP_NAME = 'MADHYUM GROUP CRM';
export const DEMO_MODE = !SUPABASE_URL || !SUPABASE_ANON_KEY;
