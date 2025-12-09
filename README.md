# Filter My Disco.gs

A web application to filter and explore your Discogs vinyl collection.

## Features

- 🔐 **OAuth Authentication** - Secure login with your Discogs account
- 🎵 **Complete Collection Access** - Browse your entire vinyl collection
- 🎨 **Style Filtering** - Filter releases by music styles and genres
- 📊 **Advanced Sorting** - Sort by label, date added, release year, and rating
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- ⚡ **Fast Performance** - Built with Next.js and React Query

## Setup

### Prerequisites

- Node.js 18+ and pnpm
- A Discogs account
- Discogs API credentials

### Discogs OAuth Setup

1. Go to [Discogs Settings > Developers](https://www.discogs.com/settings/developers)
2. Create a new application
3. Set the callback URL to `http://localhost:6767/auth/callback` for development
4. Copy your Consumer Key and Consumer Secret

### Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Discogs OAuth Credentials
DISCOGS_CONSUMER_KEY=your_consumer_key_here
DISCOGS_CONSUMER_SECRET=your_consumer_secret_here

# OAuth Callback URL
DISCOGS_CALLBACK_URL=http://localhost:6767/auth/callback
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
4. Use the logout button to sign out

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: CSS Modules with modern CSS features
- **State Management**: React Context + useReducer
- **Data Fetching**: React Query (TanStack Query)
- **Authentication**: OAuth 1.0a with Discogs
- **Linting**: Biome
- **Testing**: Jest

## Development

```bash
# Run tests
pnpm test

# Run linter
pnpm lint

# Run type checker
pnpm type-check

# Build for production
pnpm build
```

## License

MIT
