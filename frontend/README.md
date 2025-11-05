# CLEAR-TALENT Frontend

React + TypeScript + Vite admin dashboard for the CLEAR-TALENT Performance Management System.

## Features

- 🔐 **Authentication** - Login/Register with JWT
- 📚 **Competency Library** - Manage competencies with AI suggestions
- 👔 **Role Profiles** - Define roles and requirements
- 🎯 **Goals & OKRs** - AI-generated goals
- 📈 **Skill Gap Analysis** - Identify development needs
- 🎓 **IDPs** - Individual Development Plans
- ✨ **AI-Powered** - Integrated OpenAI features

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Axios** - API client
- **Lucide React** - Icons

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API URL

# Start development server
npm run dev
```

The app will be available at http://localhost:5173

### Development

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=https://clear-talent-production.up.railway.app/api/v1
```

For local development with backend running on localhost:3000:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

## Project Structure

```
frontend/
├── src/
│   ├── components/      # Reusable UI components
│   │   └── Layout.tsx   # Main layout with sidebar
│   ├── contexts/        # React contexts
│   │   └── AuthContext.tsx  # Authentication state
│   ├── pages/          # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Competencies.tsx
│   │   ├── RoleProfiles.tsx
│   │   ├── Goals.tsx
│   │   ├── SkillGaps.tsx
│   │   └── IDPs.tsx
│   ├── services/       # API services
│   │   └── api.ts      # API client
│   ├── types/          # TypeScript types
│   │   └── index.ts
│   ├── App.tsx         # Main app with routing
│   ├── main.tsx        # Entry point
│   └── index.css       # Global styles
├── public/             # Static assets
├── index.html          # HTML template
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Deployment

### Vercel (Recommended)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
cd frontend
vercel
```

3. Set environment variable in Vercel dashboard:
   - `VITE_API_URL` = `https://clear-talent-production.up.railway.app/api/v1`

### Railway

1. Create a new Railway project
2. Connect to GitHub repository (frontend directory)
3. Set build command: `npm run build`
4. Set start command: `npx serve -s dist -l 3000`
5. Add environment variable: `VITE_API_URL`

### Netlify

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Build and deploy:
```bash
cd frontend
npm run build
netlify deploy --prod --dir=dist
```

## Default Credentials

For testing, you can register a new account or use demo credentials if seeded:

- Email: `admin@demo.com`
- Password: `SecurePass123!`

## API Integration

The frontend connects to the CLEAR-TALENT backend API. All API calls are made through the `apiService` in `src/services/api.ts`.

Authentication tokens are automatically included in requests and stored in localStorage.

## Features Overview

### Authentication
- Login and registration
- JWT token management
- Protected routes
- Auto-redirect on auth state change

### Competency Library
- List all competencies
- Create new competencies manually
- AI-powered suggestions from job descriptions
- Edit and delete competencies
- Filter by type and category

### Role Profiles
- Define organizational roles
- Link competencies with required levels
- Version control for role templates

### Goals & OKRs
- AI-generated SMART goals
- Manual goal creation
- Goal tracking and status updates

### Skill Gap Analysis
- Compare employee skills vs role requirements
- AI-powered recommendations
- Visualization of gaps

### Individual Development Plans (IDPs)
- AI-generated development plans
- Phase-based learning paths
- Progress tracking

## License

MIT
