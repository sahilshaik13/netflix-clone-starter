# 🎬 CineTrack: AI IMDb Platform

> An intelligent movie and TV show discovery platform powered by AI recommendations

## 📋 Overview

AI IMDb Platform is a full-stack Next.js application that combines movie discovery, user reviews, and AI-powered recommendations. Users can explore content, rate movies, and receive personalized suggestions based on their viewing history and preferences.

## ✨ Features

- 🔐 **Secure Authentication** - Supabase Auth integration
- 🎯 **Personalized Onboarding** - Language, genre, and watched content selection
- 🔍 **Content Discovery** - Browse movies and TV shows with advanced filtering
- ⭐ **Rating \& Review System** - Community-driven content evaluation
- 🤖 **AI Recommendations** - Meta-Llama 3.3 powered suggestions
- 📊 **Analytics Dashboard** - Personal viewing insights and statistics
- 👤 **Profile Management** - Custom avatars and preferences
- 💾 **Smart Caching** - Efficient recommendation storage and retrieval


## 🛠️ Tech Stack

- **Frontend/Backend**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI Model**: Meta-Llama/Llama-3.3-70b-instruct via OpenRouter
- **Styling**: Tailwind CSS + shadcn/ui
- **Language**: TypeScript
- **Deployment**: Vercel


## 📋 Prerequisites

- Node.js 18.0 or higher
- npm, yarn, or pnpm
- Supabase account
- OpenRouter API key


## 🚀 Installation

1. **Clone the repository**
```bash
git clone https://github.com/Shaik-Farhana/netflix-clone-starter.git
cd ai-imdb-platform
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Fill in your environment variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenRouter AI
OPENROUTER_API_KEY=your_openrouter_api_key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. **Set up Supabase database**
```bash
# Run the database migrations
npx supabase db push
```

5. **Start the development server**
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 📁 Project Structure

```
├── .next/                     # Next.js build output
├── app/                       # App Router pages and layouts
│   ├── analytics/            # Analytics dashboard
│   ├── api/                  # API routes
│   ├── dashboard/            # User dashboard
│   ├── discover/             # Content discovery
│   ├── onboarding/           # User onboarding flow
│   ├── recommendations/      # AI recommendations
│   ├── settings/             # User settings
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── components/               # React components
│   ├── ui/                   # shadcn/ui components
│   ├── app-sidebar.tsx       # Main navigation sidebar
│   ├── auth-form.tsx         # Authentication forms
│   ├── dashboard-watched.tsx # Dashboard watched content
│   ├── discover-content.tsx  # Content discovery interface
│   ├── genre-selection.tsx   # Genre selection component
│   ├── language-selection.tsx# Language selection component
│   ├── movie-card.tsx        # Movie/TV show card
│   ├── profile-settings-form.tsx # Profile management
│   ├── recommendations.tsx   # AI recommendations display
│   ├── review-dialog.tsx     # Review modal
│   ├── star-rating.tsx       # Rating component
│   ├── theme-provider.tsx    # Theme context
│   ├── user-analytics.tsx    # Analytics components
│   └── watched-movies-selection.tsx # Watched content selector
├── hooks/                    # Custom React hooks
│   ├── use-mobile.ts         # Mobile detection
│   └── use-toast.ts          # Toast notifications
├── lib/                      # Utility libraries
│   ├── supabase/             # Supabase client setup
│   └── utils.ts              # Utility functions
├── node_modules/             # Dependencies
├── public/                   # Static assets
├── scripts/                  # Build and utility scripts
├── styles/                   # Additional stylesheets
├── .env.local                # Environment variables
├── .gitignore                # Git ignore rules
├── components.json           # shadcn/ui configuration
├── next.config.mjs           # Next.js configuration
├── next-env.d.ts             # Next.js TypeScript declarations
├── package.json              # Project dependencies
├── package-lock.json         # Dependency lock file
├── pnpm-lock.yaml            # PNPM lock file
├── postcss.config.mjs        # PostCSS configuration
├── README.md                 # Project documentation
└── tsconfig.json             # TypeScript configuration
```


## 🗄️ Database Schema

### Core Tables

- `user_profiles` - User information and preferences
- `movies_tv_shows` - Content catalog with title, overview, genres
- `ratings` - User ratings (1-10 scale)
- `reviews` - User text reviews
- `user_watched_content` - Viewing history tracking
- `user_recommendations` - Cached AI suggestions
- `genres` - Genre definitions (limited to 2 per content)
- `languages` - Supported languages
- `ott_platforms` - Streaming platform information


### Key Design Features

- **UUID Primary Keys** for enhanced security
- **Array Fields** for efficient genre/language storage
- **JSONB Recommendations** for flexible AI data
- **Row Level Security** for data protection


## 🔌 API Routes

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login


### Content Management

- `GET /api/movies` - List content with filters
- `GET /api/movies/[id]` - Get specific content details
- `POST /api/movies/[id]/watched` - Mark content as watched
- `POST /api/movies/[id]/rating` - Add/update rating
- `POST /api/movies/[id]/review` - Add/update review


### AI Recommendations

- `GET /api/recommendations` - Get cached recommendations
- `POST /api/recommendations/generate` - Generate new recommendations


### Analytics

- `GET /api/analytics/genres` - Genre distribution data
- `GET /api/analytics/ratings` - Rating distribution data
- `GET /api/analytics/trends` - Monthly viewing trends


### User Management

- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `POST /api/user/onboarding` - Complete onboarding process


## 🎯 User Journey

### 1. **Registration \& Onboarding**

- Sign up with email/password via Supabase Auth
- Complete profile setup in `/onboarding`
- Select preferred languages using `language-selection.tsx`
- Choose favorite genres with `genre-selection.tsx`
- Mark previously watched content via `watched-movies-selection.tsx`


### 2. **Content Discovery**

- Browse content in `/discover` page
- Use `discover-content.tsx` for filtering and search
- View detailed information with `movie-card.tsx`
- Navigate with `app-sidebar.tsx`


### 3. **User Interactions**

- Mark content as watched
- Rate using `star-rating.tsx` component
- Write reviews through `review-dialog.tsx`
- Manage profile with `profile-settings-form.tsx`


### 4. **AI-Powered Features**

- View recommendations in `/recommendations`
- See analytics in `/analytics` and `/dashboard`
- Track progress with `user-analytics.tsx`


## 🤖 AI Recommendation System

### How It Works

```javascript
// User data sent to AI
{
  "preferences": {
    "languages": ["English", "Hindi"],
    "genres": ["Action", "Sci-Fi"],
    "watched_movies": [...],
    "ratings": [...]
  }
}

// AI returns 5-7 content IDs from database
```


### Smart Caching Strategy

- Recommendations stored in `user_recommendations` table
- Cache invalidation when `watched_count` changes
- Displayed via `recommendations.tsx` component
- Reduces API costs and improves performance


## 📊 Analytics Features

The dashboard provides insights through:

1. **Genre Distribution** - Visual breakdown of viewing preferences
2. **Rating Patterns** - User rating behavior analysis
3. **Viewing Trends** - Monthly activity tracking

All powered by `user-analytics.tsx` and displayed in `/dashboard`.

## 🎨 UI Components

### Design System

- **shadcn/ui** components in `components/ui/`
- **Theme Provider** for dark/light mode support
- **Mobile Responsive** with `use-mobile.ts` hook
- **Toast Notifications** via `use-toast.ts`


### Key Components

- `movie-card.tsx` - Reusable content display
- `star-rating.tsx` - Interactive rating system
- `review-dialog.tsx` - Modal for reviews
- `app-sidebar.tsx` - Main navigation


## 🔒 Security Features

- **Supabase Row Level Security** on all tables
- **TypeScript** for type safety
- **Environment Variables** for sensitive data
- **API Route Protection** with authentication
- **Input Validation** on all forms


## 🚀 Deployment

### Development

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```


### Production (Vercel)

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Automatic deployment on push

### Supabase Setup

1. Create new Supabase project
2. Import database schema
3. Enable Row Level Security
4. Configure authentication settings

## 🧪 Testing

```bash
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
```


## ⚡ Performance Features

- **App Router** for optimized routing
- **TypeScript** for better development experience
- **Image Optimization** with Next.js Image component
- **Code Splitting** automatic with App Router
- **Static Generation** where applicable
- **Database Indexing** on frequently queried fields


## 🔧 Configuration Files

- `next.config.mjs` - Next.js configuration
- `tsconfig.json` - TypeScript settings
- `postcss.config.mjs` - PostCSS setup
- `components.json` - shadcn/ui configuration
- `.env.local` - Environment variables


## 📱 Mobile Support

- Responsive design with Tailwind CSS
- Mobile detection via `use-mobile.ts`
- Touch-friendly interactions
- Optimized for mobile browsers


## 🔄 State Management

- React hooks for local state
- Supabase for global state synchronization
- Context providers for theme management
- Custom hooks for reusable logic


## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use existing component patterns
- Add tests for new features
- Update documentation
- Follow conventional commits


## 📋 Environment Variables

| Variable | Description | Required |
| :-- | :-- | :-- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | ✅ |
| `OPENROUTER_API_KEY` | OpenRouter API key for AI | ✅ |
| `NEXT_PUBLIC_APP_URL` | Application base URL | ✅ |

## 🐛 Troubleshooting

### Common Issues

**Build Errors**

- Check TypeScript errors: `npm run type-check`
- Verify all imports and exports
- Ensure environment variables are set

**Database Issues**

- Verify Supabase connection
- Check Row Level Security policies
- Validate table schema

**AI Recommendations**

- Verify OpenRouter API key
- Check rate limits
- Ensure sufficient user data


## 🛣️ Roadmap

### Phase 1 (Current)

- [x] Basic authentication and onboarding
- [x] Content discovery and filtering
- [x] Rating and review system
- [x] AI-powered recommendations
- [x] Analytics dashboard


### Phase 2 (Upcoming)

- [ ] Social features (friends, sharing)
- [ ] Watchlist functionality
- [ ] Advanced search filters
- [ ] Mobile app (React Native)
- [ ] Real-time notifications


### Phase 3 (Future)

- [ ] Machine learning improvements
- [ ] Integration with streaming APIs
- [ ] Advanced analytics
- [ ] Content recommendation engine enhancements


## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨💻 Author

**Your Name**

- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com
- LinkedIn: [Your LinkedIn](https://linkedin.com/in/yourprofile)


## 🙏 Acknowledgments

- [Next.js](https://nextjs.org) for the amazing framework
- [Supabase](https://supabase.com) for backend infrastructure
- [shadcn/ui](https://ui.shadcn.com) for beautiful components
- [OpenRouter](https://openrouter.ai) for AI API access
- [Vercel](https://vercel.com) for seamless deployment
- [Tailwind CSS](https://tailwindcss.com) for styling

***

⭐ **Star this repository if you find it helpful!**

**Live Demo**: https://cinetrack-jade.vercel.app

**Documentation**: [Additional docs link if any]

<div style="text-align: center">⁂</div>
