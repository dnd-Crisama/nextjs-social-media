<div align="center">

<img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js&logoColor=white" />
<img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
<img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
<img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white" />
<img src="https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />

<br/>
<br/>

# StarRail — Full-Stack Social Media Platform

**A modern, feature-rich social platform built with Next.js 15 App Router — featuring real-time chat, AI-powered moderation, gamified daily quests, and profile decoration rewards.**

</div>

---

##  Overview

**StarRail** is a production-grade full-stack social media application designed to replicate and extend the core experience of modern social platforms. The project showcases advanced Next.js patterns including Server Components, Server Actions, streaming, and real-time communication — alongside an AI layer for community safety and a gamification system to drive user engagement.

> Built to demonstrate full-stack engineering depth: from database schema design and REST/streaming APIs to polished UI/UX and intelligent content moderation.

---

##  Key Features

###  Social Core
| Feature | Description |
|---|---|
| **Feed & Posts** | Create, edit, and delete rich posts with image attachments via Cloudinary/UploadThing |
| **Like · Comment · Share** | Fully interactive engagement system with optimistic UI updates |
| **Follow / Unfollow** | Follow graph with suggested users and activity-based discovery |
| **User Search** | Real-time search across users by name and username |
| **Profile & Avatar** | Customizable user profiles with avatar upload and editable bio |

### 💬 Real-Time Communication
| Feature | Description |
|---|---|
| **Live Chat** | Instant messaging between users powered by **ChatStreamSDK** |
| **Notifications** | Real-time in-app notifications for likes, comments, follows, and mentions |

### 🤖 AI-Powered Moderation
| Feature | Description |
|---|---|
| **Toxic Comment Filter** | AI model automatically detects and flags harmful, offensive, or abusive comments before they are published — keeping the community safe |

### 🎮 Gamification System
| Feature | Description |
|---|---|
| **Daily Quests** | Users receive refreshing daily challenges (e.g., post, comment, follow someone) |
| **Reward & Claim** | Completing quests unlocks exclusive **Profile Decorations** (frames, badges, themes) that users can equip to personalize their profile |

---

##  Tech Stack

### Frontend
- **[Next.js 15](https://nextjs.org/)** — App Router, Server Components, Server Actions, Route Handlers
- **[TypeScript](https://www.typescriptlang.org/)** — End-to-end type safety
- **[Tailwind CSS](https://tailwindcss.com/)** — Utility-first responsive styling
- **[shadcn/ui](https://ui.shadcn.com/)** — Accessible, composable component library

### Backend & Data
- **[Prisma ORM](https://www.prisma.io/)** — Type-safe database access with schema-first modeling
- **[PostgreSQL](https://www.postgresql.org/)** — Relational database for all persistent data

### Authentication & Media
- **[Cloudinary](https://cloudinary.com/) / [UploadThing](https://uploadthing.com/)** — Cloud media storage and optimized image delivery

### Real-Time & AI
- **[ChatStreamSDK](https://getstream.io/chat/)** — Scalable real-time messaging infrastructure
- **AI Toxic Filter** — Integrated language model for automated comment moderation

---


## ⚙️ Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **PostgreSQL** database
- Accounts on: [Cloudinary](https://cloudinary.com) or [UploadThing](https://uploadthing.com), [Stream](https://getstream.io)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/dnd-Crisama/nextjs-social-media.git
cd nextjs-social-media

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Set up environment variables
cp .env.example .env.local
```

### Environment Variables

```env
# =========================
# Database (Vercel Postgres + Prisma)
# =========================
DATABASE_URL="your_database_url"
POSTGRES_URL="your_postgres_url"
PRISMA_DATABASE_URL="your_prisma_accelerate_url"

# =========================
# Uploadthing
# =========================
UPLOADTHING_SECRET="your_uploadthing_secret"
NEXT_PUBLIC_UPLOADTHING_APP_ID="your_uploadthing_app_id"
UPLOADTHING_TOKEN="your_uploadthing_token"

# =========================
# Cron Jobs
# =========================
CRON_SECRET="your_cron_secret"

# =========================
# Stream (Chat / Video / Activity Feed)
# =========================
NEXT_PUBLIC_STREAM_KEY="your_stream_public_key"
STREAM_SECRET="your_stream_secret"

# =========================
# Google OAuth
# =========================
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# =========================
# App Config
# =========================
NEXT_PUBLIC_BASE_URL="http://localhost:3000"# =========================
# Database (Vercel Postgres + Prisma)
# =========================
DATABASE_URL="your_database_url"
POSTGRES_URL="your_postgres_url"
PRISMA_DATABASE_URL="your_prisma_accelerate_url"

# =========================
# Uploadthing
# =========================
UPLOADTHING_SECRET="your_uploadthing_secret"
NEXT_PUBLIC_UPLOADTHING_APP_ID="your_uploadthing_app_id"
UPLOADTHING_TOKEN="your_uploadthing_token"

# =========================
# Cron Jobs
# =========================
CRON_SECRET="your_cron_secret"

# =========================
# Stream (Chat / Video / Activity Feed)
# =========================
NEXT_PUBLIC_STREAM_KEY="your_stream_public_key"
STREAM_SECRET="your_stream_secret"

# =========================
# Google OAuth
# =========================
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# =========================
# App Config
# =========================
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# =========================
# AI Moderation
# =========================
AI_MODERATION_API_KEY=...
```

### Run the Application

```bash
# Push database schema
npx prisma db push

# Seed initial data (optional)
npx prisma db seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

##  Technical Highlights

- **Server Actions** — Form mutations handled entirely on the server without dedicated API routes, reducing client bundle size
- **Optimistic UI** — Like and follow interactions update instantly on the client before server confirmation
- **Streaming & Suspense** — Feed and profile data stream progressively for faster perceived load times
- **AI moderation pipeline** — Comments pass through a language model inference call before persisting; flagged content is held for review without blocking UX
- **Quest engine** — A cron-reset daily quest system tracks user activity server-side and gates reward claiming behind completion criteria

---

##  Screenshots
<img width="1904" height="911" alt="image" src="https://github.com/user-attachments/assets/9049e1f3-283f-48b0-a52a-1eb62907f5f1" />
<img width="1909" height="926" alt="image" src="https://github.com/user-attachments/assets/feb1709b-3d9c-451e-b231-3b5a0a1c1207" />
<img width="1897" height="912" alt="image" src="https://github.com/user-attachments/assets/8228f8fc-214c-4965-940b-bacd4e73cb87" />
<img width="1900" height="916" alt="image" src="https://github.com/user-attachments/assets/7d2ac808-d85f-4ed9-a8d3-471ea5cdfee5" />
<img width="1893" height="912" alt="image" src="https://github.com/user-attachments/assets/f071c3f6-69ba-4b3c-a5e5-2df17453b711" />
<img width="1915" height="907" alt="image" src="https://github.com/user-attachments/assets/ecfffeb8-a254-4615-97c5-a98f837dd1c4" />
<img width="1892" height="907" alt="image" src="https://github.com/user-attachments/assets/5801202f-a2fb-4015-a332-cd6611122725" />
<img width="1890" height="915" alt="image" src="https://github.com/user-attachments/assets/7f48afa9-5d1c-49f5-a788-db3968c6790c" />
<img width="1889" height="913" alt="image" src="https://github.com/user-attachments/assets/3140ec9f-6631-45ab-bedb-959061ba3e30" />
<img width="1376" height="905" alt="image" src="https://github.com/user-attachments/assets/fe345b36-97b2-4edb-9516-654926a5225c" />
<img width="1443" height="896" alt="image" src="https://github.com/user-attachments/assets/70d37ff2-3a74-4331-865e-58dca7051aed" />
<img width="1090" height="847" alt="image" src="https://github.com/user-attachments/assets/e49d7793-31ee-4bbf-9b99-7a22039f87d6" />


---

---

<div align="center">

**Built with ❤️ by [Crisama](https://github.com/dnd-Crisama)**
*If you found this project interesting, please consider giving it a ⭐*

</div>
