# ContentBot - YouTube Automation Platform

## Overview

ContentBot is a full-stack web application built for automating YouTube content creation from Reddit sources. The system consists of a React frontend with TypeScript, an Express.js backend, and PostgreSQL database with Drizzle ORM. The application enables users to monitor Reddit subreddits, fetch video content, generate AI-powered descriptions using OpenAI, and manage scheduled YouTube uploads.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and production builds
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom YouTube brand theming
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **API Design**: RESTful endpoints with JSON responses
- **Error Handling**: Centralized error middleware

### Development Environment
- **Monorepo Structure**: Client, server, and shared code in single repository
- **Hot Reload**: Vite dev server with HMR for frontend
- **Process Management**: TSX for TypeScript execution in development
- **Build Process**: Separate builds for client (Vite) and server (esbuild)

## Key Components

### Database Schema (Shared)
Located in `shared/schema.ts` using Drizzle ORM:
- **Users**: Basic user management with username/password
- **Reddit Sources**: Configured subreddits to monitor
- **Content Items**: Video content with metadata, AI descriptions, and status tracking
- **Campaigns**: Content campaign management with settings

### Frontend Pages
- **Dashboard**: Overview with stats and recent content
- **Reddit Sources**: Manage monitored subreddits
- **AI Generator**: Bulk generate descriptions using OpenAI
- **Preview Queue**: Review and approve/reject content
- **Scheduled Posts**: Manage scheduled YouTube uploads
- **Analytics**: Performance metrics and insights

### Backend Services
- **Reddit Service**: Fetch video content from Reddit API
- **OpenAI Service**: Generate YouTube descriptions using GPT-4o
- **YouTube Service**: Handle video uploads and scheduling (stub implementation)
- **Storage Interface**: Abstract data access layer for database operations

### UI Components
- **Shadcn/ui**: Complete component library with consistent styling
- **Custom Components**: ContentCard, StatsCard, Layout, Sidebar
- **Theme**: YouTube-inspired color scheme with red primary color

## Data Flow

1. **Content Ingestion**: Reddit Service fetches video posts from configured subreddits
2. **Content Processing**: Videos are stored with metadata (title, upvotes, duration, thumbnails)
3. **AI Enhancement**: OpenAI Service generates YouTube-optimized descriptions
4. **Content Review**: Users can preview, approve, or reject content through the queue
5. **Scheduling**: Approved content can be scheduled for YouTube upload
6. **Analytics**: Performance tracking and reporting on published content

## External Dependencies

### Third-Party Services
- **Reddit API**: Public JSON endpoints for fetching subreddit content
- **OpenAI API**: GPT-4o model for description generation
- **YouTube Data API**: Video upload and management (implementation pending)
- **Neon Database**: Serverless PostgreSQL hosting

### Key Libraries
- **Database**: `drizzle-orm`, `@neondatabase/serverless`
- **Frontend**: `react`, `@tanstack/react-query`, `wouter`
- **UI**: `@radix-ui/*` components, `tailwindcss`
- **Validation**: `zod`, `drizzle-zod`
- **Build Tools**: `vite`, `esbuild`, `tsx`

## Deployment Strategy

### Development
- **Frontend**: Vite dev server on client port
- **Backend**: Express server with TSX for TypeScript execution
- **Database**: Drizzle migrations with push command

### Production Build
- **Frontend**: Static build output to `dist/public`
- **Backend**: Bundled JavaScript to `dist/index.js`
- **Assets**: Static file serving from Express
- **Environment**: Node.js production environment

### Configuration
- **Database**: PostgreSQL connection via `DATABASE_URL`
- **API Keys**: OpenAI and YouTube API keys via environment variables
- **Build Settings**: ESM modules, TypeScript strict mode

## User Preferences

Preferred communication style: Simple, everyday language.

## Known Issues

### Reddit API Access
- Reddit API is currently returning 403 Blocked errors for both OAuth and public endpoints
- This appears to be related to Reddit's recent API policy changes or IP-based blocking
- Workaround: Sample content has been added to test other features
- Solution: Consider switching to alternative content sources or implementing a Reddit scraping service

## Changelog

- June 27, 2025. Initial setup and migration to Replit
- June 27, 2025. Successfully configured Gemini AI for description generation
- June 27, 2025. Added sample content to demonstrate all features
- June 27, 2025. Identified Reddit API blocking issues
- June 28, 2025. Successfully migrated from Replit Agent to Replit environment
- June 28, 2025. Integrated TikTok API with complete CRUD operations for hashtag sources
- June 28, 2025. Added TikTok Sources page with content fetching functionality
- June 28, 2025. Configured PostgreSQL database with Neon provider
- June 28, 2025. Successfully pushed database schema and migrated from in-memory to persistent storage
- June 28, 2025. Resolved DATABASE_URL formatting issues and validated database connectivity
- June 28, 2025. Successfully configured TikTok API keys and implemented real video fetching
- June 28, 2025. Enhanced TikTok service with comprehensive video extraction for authentic content
- June 28, 2025. Completed migration from Replit Agent to Replit environment with PostgreSQL database
- June 28, 2025. Successfully configured Gemini API key for AI description generation
- June 28, 2025. Verified Gemini API is working correctly, TikTok API facing access restrictions