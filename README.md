# FinTracker

A full-stack personal finance tracker built with Next.js 16 and Supabase.

## Features

- **Dashboard** — monthly stats, income vs expenses bar chart, spending by category donut chart, recent transactions
- **Transactions** — add/edit/delete, month navigation, search, income/expense filter
- **Budgets** — set monthly spending limits per category with progress tracking
- **Reports** — 12-month trend charts, category breakdown, savings rate
- **Settings** — profile, currency preference
- **Dark mode** — system-aware theme toggle

## Tech Stack

- [Next.js 16](https://nextjs.org/) (App Router)
- [Supabase](https://supabase.com/) — PostgreSQL database + Auth
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Recharts](https://recharts.org/) — charts
- [Radix UI](https://www.radix-ui.com/) — accessible primitives
- [react-hook-form](https://react-hook-form.com/) + [Zod](https://zod.dev/) — form validation

## Getting Started

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and add your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to see the app.
