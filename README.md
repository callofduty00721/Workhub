# MahaHub

An original SaaS platform (inspired by WorkHub.io) connecting startups, freelancers, investors, mentors, partners, clients and job seekers. Original codebase, design, and copy — no WorkHub source or assets were used.

## Scope of this build

Nearly the full platform spec is implemented. A few pieces are coded against real third-party APIs (Google Sign-In, Razorpay, Stripe, Cloudinary, SMTP email) but need **you to supply credentials** before they'll actually work end-to-end — without keys they fail gracefully (503 "not configured" from the backend, hidden buttons on the frontend) instead of pretending to succeed. See [Credentials required](#credentials-required-for-full-functionality) below.

### What's built

- **Public site**: Home page (hero, stats, categories, featured startups, testimonials, partners, CTA), Pricing page with live checkout
- **Auth**: Register (8 roles: Founder, Freelancer, Employer, Job Seeker, Investor, Mentor, Partner, Client), Login, Google Sign-In, Forgot/Reset Password (real email flow), Email Verification — real JWT access/refresh flow with revocation on logout
- **Startup module**: directory, detail page (overview, problem & solution, team, funding, follow/interest), founder create/edit form with logo/cover/pitch-deck uploads — full CRUD API
- **Jobs module**: public job board, job detail + apply flow (with resume upload), employer "Post a Job", employer dashboard with per-job applicants and status changes, job seeker dashboard tracking applications
- **Freelancer marketplace**: browse freelancers & services, public freelancer profile with reviews, service detail page with reviews, freelancer's "My Gigs" management (with cover image upload)
- **Investor module**: directory, public profile, dashboard showing startups they've marked interested/followed (deal flow)
- **Mentor module**: directory, public profile, "Book a Session" flow, mentor dashboard to confirm/decline/complete session requests
- **Partner module**: directory (accelerator/incubator/government/NGO/service provider), public profile
- **Client module**: reuses the Jobs/Applications system under a "Post a Project" label — a client posts a freelance-type job, freelancers apply, client reviews applicants, same as the Employer flow
- **Real-time chat**: conversation list + message thread over authenticated Socket.io, REST-backed persistence, reachable from any dashboard and from "Message" buttons across profiles
- **Notifications**: in-app real-time notification bell (Socket.io push + REST history/mark-as-read) firing on follows, interest, job applications, status changes, new messages, session requests/status, and reviews received
- **Reviews & ratings**: star ratings + comments on freelancer profiles and services, with live aggregate rating rollup
- **File uploads**: generic Cloudinary-backed upload endpoint wired into startup logo/cover/pitch-deck, job application resumes, gig cover images, and profile avatars
- **Payments/Subscriptions**: Free/Starter/Professional/Enterprise plans on the Pricing page, real Razorpay order+verify flow and real Stripe Checkout+webhook flow, subscription status persisted per user
- **Admin dashboard**: platform-wide stats, user management (search, ban/unban) — `super_admin` only
- **Code splitting**: every route is lazy-loaded; production bundle's largest chunk is ~78KB gzipped (was one 227KB bundle before)
- **Backend**: Express + MongoDB/Mongoose, JWT auth (access + httpOnly refresh cookie, revoked on logout), rate limiting, Helmet, centralized error handling, Socket.io wired to notifications and chat

Community, About, Contact, Settings, Terms, and Privacy still route to an explicit "Coming Soon" placeholder — they're genuinely unbuilt, not broken links.

### Known simplifications (so you know what to expect)

- **"Push notifications"** = real-time in-app notifications delivered over the existing Socket.io connection, not browser Web Push (which needs a service worker + VAPID keypair — a separate, larger piece of infra).
- **Client module** reuses the Job/Application backend rather than a parallel "Project" model — a client's "project" is stored as a `Job` with `type: "freelance"`. This avoids duplicating the entire posting/applying/reviewing pipeline for something functionally identical.
- **Partner module** is directory + profile only; partners don't have a transactional dashboard since the spec's partner activities (accelerator/incubator/government listings) are inherently just a curated directory.
- **Mentor sessions**: a non-mentor's own outgoing session requests aren't surfaced anywhere in their dashboard yet (only the mentor's incoming-requests view is built).

## Credentials required for full functionality

Everything below runs and looks correct with **zero credentials configured** — auth, browsing, posting, chat, and notifications all work. These specific features return a clear "not configured" error (backend) or hide their UI (frontend) until you provide real keys:

| Feature | Env vars (backend `.env`) | Where to get them |
|---|---|---|
| Google Sign-In | `GOOGLE_CLIENT_ID` (backend) + `VITE_GOOGLE_CLIENT_ID` (frontend `.env`) | [Google Cloud Console](https://console.cloud.google.com/) → OAuth 2.0 Client ID |
| File uploads (logos, resumes, pitch decks, avatars) | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | [Cloudinary dashboard](https://cloudinary.com/) |
| Outbound email (verification, password reset) | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Any SMTP provider (SendGrid, Mailgun, etc.) — without this, emails are logged to the server console instead of sent |
| Razorpay checkout | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | [Razorpay dashboard](https://dashboard.razorpay.com/) |
| Stripe checkout | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | [Stripe dashboard](https://dashboard.stripe.com/) |

## Tech stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, Radix UI primitives (shadcn-style components), Framer Motion, React Router, React Hook Form + Zod, TanStack Query, Axios, Socket.io client
- **Backend**: Node.js, Express, MongoDB, Mongoose, JWT, Socket.io, Cloudinary, Nodemailer, Razorpay SDK, Stripe SDK, google-auth-library

Note: the original spec listed both "MongoDB + Prisma" and "Deployment on Neon PostgreSQL," which are contradictory. Per your direction, this build uses **MongoDB + Mongoose**.

## Getting started

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in MONGO_URI and JWT secrets at minimum
npm run dev             # http://localhost:5000
```

Requires a running MongoDB instance (local or Atlas) at `MONGO_URI`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # optional — only needed for Google Sign-In
npm run dev              # http://localhost:5173
```

The Vite dev server proxies `/api` and `/socket.io` to `http://localhost:5000`.

## What's next

The remaining gaps: browser Web Push notifications, a dedicated Client "Project" data model (if the Job-reuse approach ever needs to diverge), CSV import/export, audit logs, and admin content moderation tooling.
