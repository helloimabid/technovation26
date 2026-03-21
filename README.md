# Tecnovation'26 Event Management Platform

Full-stack event management web app for Josephite IT Club (JITC), built with Next.js App Router + Appwrite.

## Stack

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS 4
- Appwrite (Auth + Database)
- Framer Motion + Sonner
- React Hook Form + Zod

## Features Implemented

- Email/password authentication with Appwrite
- Signup profile capture: name, email, institution, phone
- User dashboard:
	- Profile snapshot
	- Registered segments + unregister
	- Available segments + dynamic form-schema registration
	- Package purchase tracking
	- Campus Ambassador status and application
- Admin panel:
	- CRUD for segments (includes formSchema JSON)
	- CRUD for packages
	- CA approval/rejection
	- Registrations list
	- Analytics: total users, total registrations, top ambassadors
	- CMS content block updates
- Dynamic CMS support via `content_blocks`
- Referral tracking via URL query `?ref=CODE`
- Protected routes using signed cookie token (`/dashboard`, `/admin`)

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env.local
```

3. Fill `.env.local` with your Appwrite values.

4. Run dev server:

```bash
npm run dev
```

5. Open `http://localhost:3000`.

## Environment Variables

See `.env.example`.

Required:

- `NEXT_PUBLIC_APPWRITE_ENDPOINT`
- `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
- `APPWRITE_API_KEY`
- `APPWRITE_DATABASE_ID`
- `APP_JWT_SECRET`

## Appwrite Database Setup

Create one database with ID from `APPWRITE_DATABASE_ID`, then create collections:

1. `users_profiles`
- `userId` (string, required)
- `name` (string, required)
- `email` (string, required)
- `institution` (string, required)
- `phone` (string, required)
- `role` (string, required, default: `user`)
- `referredByCode` (string, optional)

2. `segments`
- `name` (string, required)
- `description` (string, required)
- `image` (string, required)
- `rules` (string, required)
- `formSchema` (string, required, JSON string)

3. `registrations`
- `userId` (string, required)
- `segmentId` (string, required)
- `teamName` (string, optional)
- `additionalFormData` (string, required, JSON string)

4. `ambassadors`
- `userId` (string, required)
- `caCode` (string, required)
- `points` (integer, required, default 0)
- `referralsCount` (integer, required, default 0)
- `status` (string, required, default `pending`)

5. `packages`
- `name` (string, required)
- `price` (integer, required)
- `benefits` (string, required)

6. `purchases`
- `userId` (string, required)
- `packageId` (string, required)

7. `content_blocks`
- `key` (string, required)
- `value` (string, required)

Suggested indexes:

- `users_profiles.userId`
- `segments.name`
- `registrations.userId`
- `registrations.segmentId`
- `ambassadors.userId`
- `ambassadors.caCode`
- `content_blocks.key`

## Admin Access

To make a user admin:

1. Sign up once.
2. In Appwrite Console, open `users_profiles`.
3. Set that user document `role` to `admin`.

## Project Structure

- `src/app` pages + API routes
- `src/components/site` reusable UI sections
- `src/lib/appwrite` Appwrite clients
- `src/lib/auth.ts` signed session cookie helpers
- `proxy.ts` route protection for dashboard/admin

## Validation

- `npm run lint`
- `npm run build`
