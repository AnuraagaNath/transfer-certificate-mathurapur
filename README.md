# Mathurapur Free Primary School · Transfer Certificates

A small React app for preparing a transfer certificate and its receipt acknowledgement, then exporting the same document as PDF or DOCX.

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and set the Supabase project URL and anon key.
3. In the Supabase dashboard, enable email/password authentication and create staff accounts.
4. Start the app with `npm run dev`.

Sign in with the staff account's email and password. Authentication uses Supabase Auth; credentials are not stored by this app.

## Build

Run `npm run build` to create the production app in `dist/`.
