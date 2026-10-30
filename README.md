This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Local setup

1. Copy `.env.example` to `.env.local` and set the MariaDB connection values.
2. Set `TOTP_ENCRYPTION_KEY` to a private 32-byte key encoded as 64 hexadecimal characters (generate one with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`). Keep the same key across deployments; changing it makes previously enrolled TOTP secrets unreadable.
3. Set `CRON_SECRET` to a private random value of at least 32 characters.
4. Apply `scripts/migrations/20261030-security-controls.sql` to an existing database. New databases should use `secure_hr_portal.sql`.
5. Run `npm run build`, then `npm run start`.

Authenticated users can enroll in authenticator-based TOTP at `/settings/security`. The login flow verifies TOTP before creating a session. Accounts without 2FA enabled can still sign in with their password.

The `POST /api/cron/deactivate-inactive` endpoint deactivates accounts with no recorded activity for the configured 30–60 day period and revokes their sessions. Schedule it to run once per day and send `Authorization: Bearer <CRON_SECRET>`. Accounts are deactivated rather than physically deleted so that foreign-key-linked audit history is retained.

The application uses a per-request nonce-based Content Security Policy. In development, `unsafe-eval` is enabled only because of Next.js development tooling.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
