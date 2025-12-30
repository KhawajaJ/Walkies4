# WanderWalks

A location-based walking app for travelers. Generate personalized walking routes and join community walks in major cities.

## Features

- 🗺️ **Route Generation** - Create personalized walking routes based on time, interests, and pace
- 👥 **Community Walks** - Join walks hosted by locals and other travelers
- 🔐 **Authentication** - Secure login with Google or magic link email
- 📱 **Responsive Design** - Works on desktop and mobile

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Run the development server: `npm run dev`

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Deployment

Deploy to Vercel:
1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

## License

MIT
