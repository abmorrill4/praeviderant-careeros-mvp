
# CareerOS - AI-Powered Career Intelligence Platform

## Overview

CareerOS is a career intelligence platform that delivers structured, AI-powered voice interviews to capture deep user context and dynamically generate resumes in real-time. The goal is to demonstrate that comprehensive user context leads to superior career outputs compared to traditional form-based tools.

## Target Users

- **Marcus** – Mid-career product manager looking for a new role
- **Emily** – Career switcher entering tech

## MVP Features

### 🎤 AI Interview Engine
- Conducts structured interviews using OpenAI's real-time voice API
- Captures comprehensive user data:
  - Work history and experience
  - Education background
  - Skills and competencies
  - Career goals and aspirations
- Stores responses and extracted context in Supabase (PostgreSQL)

### 📄 Real-Time Resume Generation
- Live resume generation during the interview process
- Output format: Clean Markdown with professional styling
- Automatically updates as users provide more context
- Resume content stored securely in Supabase

### 🎨 Visual Interview Interface
- Clean, responsive frontend optimized for performance
- Real-time voice transcription display
- Retro audio waveform visualization
- Context sidebar showing captured data in real-time
- Minimal JavaScript footprint for optimal performance

### ⚙️ API Key Configuration Panel
- Secure admin UI for API key management
- Supported integrations:
  - OpenAI (required for voice + text generation)
  - Perplexity (optional for enhanced research)
  - GitHub (optional for version control)
- Keys stored securely using Supabase Vault

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions, Vault)
- **AI**: OpenAI real-time voice mode + text generation
- **Voice Processing**: OpenAI real-time voice API
- **Storage**: Supabase for all content and metadata
- **UI Components**: shadcn/ui library

## Project Setup

### Prerequisites

- Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- Supabase account for backend services
- OpenAI API key for AI functionality

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to project directory
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Setup

1. Set up your Supabase project and obtain the URL and anon key
2. Configure your OpenAI API key in the Supabase Vault
3. Access the admin panel to configure additional API keys as needed

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

### Project Structure

- `/src/components` - React components organized by feature
- `/src/hooks` - Custom React hooks for state management
- `/src/integrations` - Supabase client and type definitions
- `/src/pages` - Top-level page components
- `/supabase` - Database migrations and Edge Functions

## Deployment

### Using Lovable
1. Open your [Lovable Project](https://lovable.dev/projects/250b0b36-c4ad-4418-b812-117787350e3d)
2. Click Share → Publish for instant deployment

### Custom Domain
Navigate to Project > Settings > Domains in Lovable to connect your custom domain.

## Contributing

This project prioritizes:
- **Lightweight and intuitive** user experience
- **Live, interactive** resume generation
- **Minimal external dependencies**
- **Simple user onboarding**
- **Secure configuration storage**

## MVP Goal

> Prove that a deep-context, structured AI interview can produce more useful and accurate resumes than existing form-based tools.

## Technologies Used

- **Vite** - Build tool and development server
- **TypeScript** - Type-safe JavaScript
- **React** - Frontend framework
- **shadcn-ui** - Component library
- **Tailwind CSS** - Utility-first CSS framework
- **Supabase** - Backend-as-a-Service
- **OpenAI** - AI/ML capabilities

## Support

For questions or issues, please refer to the [Lovable documentation](https://docs.lovable.dev/) or join the [Lovable Discord community](https://discord.com/channels/1119885301872070706/1280461670979993613).

---

**Project URL**: https://lovable.dev/projects/250b0b36-c4ad-4418-b812-117787350e3d
