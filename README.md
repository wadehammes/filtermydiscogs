<img width="2042" height="1194" alt="app-preview--dark" src="https://github.com/user-attachments/assets/d1206324-c2be-4650-8598-f4b98aff7b41" />

# Filter My Disco.gs

A web application to filter and explore your Discogs vinyl collection.

## Features

- 🔐 **OAuth Authentication** - Secure login with your Discogs account
- 🎵 **Complete Collection Access** - Browse your entire vinyl collection
- 🎨 **Style Filtering** - Filter releases by music styles, genres, years, and formats
- 📊 **Advanced Sorting** - Sort by label, date added, release year, and rating
- 🎲 **Random Release** - View a random release from your collection
- 📋 **Multiple Views** - View releases in card or table format
- 📦 **Crate Management** - Save releases to a crate as you browse
- 🖼️ **Mosaic Generator** - Create and download mosaic grids in different formats/sizes
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- ⚡ **Fast Performance** - Built with Next.js and React Query
- 🎨 **Theme Support** - Light, dark, and system theme preferences

## Setup

### Prerequisites

- Node.js 24+ and pnpm
- A Discogs account
- Discogs API credentials

### Discogs OAuth Setup

1. Go to [Discogs Settings > Developers](https://www.discogs.com/settings/developers)
2. Create a new application
3. Set the callback URL to `http://localhost:6767/api/auth/callback` for development
4. Copy your Consumer Key and Consumer Secret

### Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Discogs OAuth Credentials
DISCOGS_CONSUMER_KEY=your_consumer_key_here
DISCOGS_CONSUMER_SECRET=your_consumer_secret_here

# OAuth Callback URL (optional, defaults to http://localhost:6767/api/auth/callback)
DISCOGS_CALLBACK_URL=http://localhost:6767/api/auth/callback

# Site URL (optional, defaults to https://www.filtermydisco.gs)
NEXT_PUBLIC_SITE_URL=http://localhost:6767
```

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The app will be available at `http://localhost:6767`.

## Usage

1. Click "Connect with Discogs" to authenticate
2. Authorize the application on Discogs
3. Browse your collection with filters and sorting options
4. Save releases to your crate as you browse
5. Create mosaic grids from your crate or filtered collection
6. Use the logout button to sign out

## Pages

- **Home** (`/`) - Login and main dashboard
- **Releases** (`/releases`) - Browse, filter, and sort your collection
- **Mosaic** (`/mosaic`) - Create mosaic grids from your collection
- **About** (`/about`) - Terms of Service, Privacy Policy, and contact information

## Tech Stack

- **Framework**: Next.js 16.1 with App Router
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: CSS Modules with modern CSS features
- **State Management**: React Context + useReducer
- **Data Fetching**: TanStack Query (React Query)
- **Tables**: TanStack Table
- **Authentication**: OAuth 1.0a with Discogs
- **Analytics**: Google Tag Manager
- **Linting & Formatting**: Biome
- **Testing**: Jest with Testing Library

## Development

```bash
# Start development server
pnpm dev

# Run tests
pnpm test

# Run tests in watch mode for a specific file
pnpm test:file

# Run linter
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format

# Format and fix code
pnpm format:fix

# Run type checker
pnpm type-check

# Build for production
pnpm build

# Start production server
pnpm start

# Analyze bundle size
pnpm analyze

# Generate bundle report
pnpm bundle-report

# Run Lighthouse audit
pnpm lighthouse

# Scaffold new component/page
pnpm scaffold
```

## Release

```bash
# Create and push a new release tag
make release tag=v0.0.1
```

## License

MIT
