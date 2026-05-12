# CoBuy

> Smart Buying Starts with CoBuy.

CoBuy is a collaborative purchasing platform that allows users to form groups, organize shared purchases, and split costs fairly. The platform is designed to help individuals, roommates, dorms, neighborhoods, and small households access wholesale-style pricing without needing to purchase excessive quantities individually.

Built with Next.js, Supabase, and Tailwind CSS, CoBuy provides secure authentication, group management, invite-code joining, automatic cost allocation, and protected user dashboards.

---

## Features

- User authentication and account management
- Secure protected routes using Supabase SSR
- Create and manage purchasing groups
- Join groups using invite codes
- Role-based permissions (admin, leader, member)
- Shared order coordination
- Automatic cost splitting
- Contribution and membership tracking
- Responsive modern UI
- PostgreSQL database with Row Level Security (RLS)

---


## Tech Stack

### Frontend
- Next.js
- React 19
- TypeScript
- Tailwind CSS
- Radix UI
- Lucide React Icons

### Backend / Infrastructure
- Supabase
  - Authentication
  - PostgreSQL Database
  - Row Level Security Policies
  - Server-side session handling
- Vercel Deployment

---

## Architecture

### Frontend
- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS
- Radix UI Components

### Backend
- Supabase Authentication
- PostgreSQL Database
- Row Level Security (RLS)
- Server-side session handling

### Hosting
- Vercel deployment platform

---

## Project Structure

```bash
app/
├── admin/
├── api/
├── auth/
├── dashboard/
├── groups/
├── notifications/
├── protected/
├── globals.css
├── layout.tsx
└── page.tsx

components/
lib/
├── supabase/
│   ├── client.ts
│   ├── server.ts
│   └── proxy.ts

supabase/
└── migrations/
```

---

## Authentication & Security

CoBuy uses Supabase SSR authentication with protected routing.

Unauthenticated users attempting to access protected pages are automatically redirected to the login page.

Security features include:

- Secure server-side session handling
- Protected API routes
- Role-based access control
- PostgreSQL Row Level Security (RLS)
- Secure cookie-based authentication

The database uses PostgreSQL Row Level Security (RLS) policies to ensure users can only access data they are authorized to view or modify.

---

## Database Design

The application uses PostgreSQL through Supabase.

### Core Tables

#### `users`
Stores application-level profile information linked to Supabase Auth users.

#### `groups`
Stores collaborative purchasing groups, invite codes, and group status.

#### `group_members`
Tracks membership relationships and user roles inside groups.

---

## API Overview

The application uses API routes within the Next.js App Router architecture to handle core platform functionality.

### Core API Functionality
- User authentication
- Session validation
- Group creation
- Invite-code group joining
- Membership management
- Protected route handling

### Authentication Flow
Authentication is handled through Supabase SSR using secure cookie-based sessions and protected middleware routing.

---

## Role System

| Role   | Permissions |
|--------|-------------|
| Admin  | Platform management |
| Leader | Create/manage groups and members |
| Member | Join groups and participate in purchases |

---

## Group Workflow

1. User creates an account
2. User creates a purchasing group
3. Invite code is generated automatically
4. Members join using the invite code
5. Group members coordinate shared purchases
6. Costs are distributed fairly among participants

---

## Key Learning Outcomes

Through the development of CoBuy, the team gained practical experience in:

- Building full-stack applications using Next.js and Supabase
- Implementing secure server-side authentication workflows
- Designing relational PostgreSQL database schemas
- Applying Row Level Security (RLS) policies
- Managing protected routing and session persistence
- Developing responsive and modular UI components
- Deploying production-ready applications using Vercel
- Collaborating within a structured software engineering workflow

---

## Local Development

### Clone Repository

```bash
git clone https://github.com/Wulfrin/Software-Engineering-Project-CoBuy.git

cd Software-Engineering-Project-CoBuy
```

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

### Run Development Server

```bash
npm run dev
```

Application runs at:

```bash
http://localhost:3000
```

---

## Deployment

CoBuy is deployed using Vercel.

Live Deployment:

https://cobuyproject.vercel.app/

---

## Future Improvements

- Real-time notifications
- Supplier integration
- Mobile application support
- Shared payment processing
- Order analytics
- Purchase history dashboard

---

## Contributors

| Name | Role |
|------|------|
| Tyneika Williams | Project Manager |
| James Leonard | Requirements Analyst |
| Ammon Allen | Documentation Lead |
| Uriel Rodriguez | Quality Reviewer |
| Evan Landry | Quality Reviewer |

---

## License

This project was developed for educational and academic purposes.
