# AfterLight MVP

"Preserve the light of your life."

AfterLight is a collaborative legacy and meaning platform designed to capture stories and clarify what matters most.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (v4) + Radix UI
- **Database**: Supabase (Postgres)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd AfterLight
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   - Copy `env.example` to `.env.local`
   - Fill in your Supabase credentials (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` for seeding)

4. **Setup Database**
   - Go to your Supabase Dashboard -> SQL Editor.
   - Run the content of `supabase/migrations/20240201000000_init_schema.sql`.
   - Enable Auth providers (Email/Password, Google).
   - Create a Storage bucket named `stories` (public).

5. **Seed Default Content**
   - Run the seed script to populate Prompts, Quotes, and Meditations:
   ```bash
   npx tsx scripts/seed-defaults.ts
   ```

6. **Run Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## Features (MVP)

- **Circle Creation**: Establish your private legacy circle.
- **Story Capture**: Record audio/video, write text, or upload files.
- **Prompt Queue**: Curated questions to spark memories.
- **Timeline**: Visual chronological view of your stories.
- **Meaning Layer**:
  - Values Map
  - Bucket List
  - Weekly Plan (Dashboard)

## License

Private / Proprietary.
