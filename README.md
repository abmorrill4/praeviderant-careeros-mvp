
# CareerOS - AI-Powered Career Intelligence Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)

> An intelligent career management platform that conducts AI-powered voice interviews to extract deep career context and generate dynamic, tailored resumes in real-time.

## 🎯 Overview

CareerOS revolutionizes career management by combining AI-driven interviews with intelligent resume generation. Unlike traditional form-based tools, CareerOS conducts natural conversations to understand your complete career story, then automatically creates perfectly tailored resumes for any job opportunity.

### Key Value Propositions

- **Deep Context Understanding**: AI interviews extract nuanced career narratives beyond basic job listings
- **Real-time Resume Generation**: Dynamic resume creation during conversations
- **Voice-First Interface**: Natural conversation flow with real-time transcription
- **Intelligent Tailoring**: Job description analysis for targeted resume optimization
- **Comprehensive Career Mapping**: Complete professional timeline with skills, achievements, and growth patterns

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- OpenAI API key

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/careeros.git
cd careeros

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase URL, anon key, and OpenAI API key

# Start development server
npm run dev
```

Visit `http://localhost:5173` to access the application.

### First Steps

1. **Sign up** for an account through the authentication flow
2. **Upload a resume** or start with the AI interview process
3. **Complete your profile** through guided conversations
4. **Generate tailored resumes** for specific job opportunities

## 📋 Features

### Core Capabilities

- **🎤 AI Voice Interviews**: Structured conversations using OpenAI's real-time voice API
- **📄 Dynamic Resume Generation**: Real-time Markdown resume creation with professional styling
- **🔄 Profile Timeline Management**: Comprehensive career history tracking
- **📊 Skills Analysis**: Automated skill extraction and proficiency mapping
- **📈 Profile Optimization**: AI-powered suggestions for profile enhancement
- **🎯 Job Targeting**: Resume customization based on job descriptions

### Advanced Features

- **📁 Resume Upload & Analysis**: PDF/Word document parsing and entity extraction
- **🔒 Secure Data Storage**: Encrypted storage of sensitive career information
- **📱 Responsive Design**: Optimized for desktop and mobile experiences
- **⚡ Real-time Updates**: Live profile updates during interview sessions
- **🔍 Entity Normalization**: Intelligent matching and deduplication of career data

## 🏗️ Architecture

CareerOS is built with modern web technologies:

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **AI Integration**: OpenAI GPT-4 + Real-time Voice API
- **Authentication**: Supabase Auth with Row Level Security
- **Storage**: Supabase Storage for file uploads
- **Deployment**: Lovable.dev platform

For detailed architecture information, see [ARCHITECTURE.md](./docs/ARCHITECTURE.md).

## 📚 Documentation

### User Guides
- [Getting Started Guide](./docs/user-guides/getting-started.md)
- [AI Interview Process](./docs/user-guides/ai-interview-guide.md)
- [Resume Generation](./docs/user-guides/resume-generation.md)
- [Profile Management](./docs/user-guides/profile-management.md)

### Developer Documentation
- [Development Setup](./docs/development/setup.md)
- [API Reference](./docs/development/api-reference.md)
- [Database Schema](./docs/development/database-schema.md)
- [Contributing Guidelines](./docs/development/contributing.md)

### Administrator Guides
- [Deployment Guide](./docs/admin/deployment.md)
- [Configuration](./docs/admin/configuration.md)
- [Monitoring & Analytics](./docs/admin/monitoring.md)

## 🎯 Target Users

### Primary Users

- **Marcus** - Mid-career product manager seeking new opportunities
- **Emily** - Career switcher transitioning into tech
- **Sarah** - Recent graduate building her first professional resume

### Use Cases

- Career transition support with narrative bridge-building
- Resume optimization for specific job applications
- Comprehensive career data organization and management
- Interview preparation through career story development

## 🛠️ Development

### Tech Stack

- **Build Tool**: Vite for fast development and building
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Query for server state
- **Type Safety**: TypeScript throughout the application
- **Code Quality**: ESLint + Prettier for consistent formatting

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run type-check   # Run TypeScript checks
npm run lint         # Run ESLint
```

### Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page-level components
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
├── contexts/           # React context providers
└── integrations/       # Third-party integrations
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](./docs/development/contributing.md) for details on:

- Code standards and conventions
- Pull request process
- Issue reporting
- Development workflow

## 📄 License

This project is proprietary software. All rights reserved. Unauthorized copying, modification, distribution, or use of this software is strictly prohibited.

## 🔗 Links

- **Live Demo**: [careeros.lovable.app](https://careeros.lovable.app)
- **Documentation**: [Full Documentation](./docs/)
- **Issues**: [GitHub Issues](https://github.com/your-org/careeros/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/careeros/discussions)

## 📞 Support

- **Documentation**: Check our comprehensive guides in `/docs`
- **Community**: Join our [Discord community](https://discord.gg/careeros)
- **Issues**: Report bugs via [GitHub Issues](https://github.com/your-org/careeros/issues)
- **Email**: support@careeros.com

---

**Built with ❤️ using [Lovable.dev](https://lovable.dev)**
