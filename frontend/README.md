# Lasius Frontend

Open source time tracker for teams built with Next.js, React, TypeScript, Tailwind CSS, and DaisyUI.

This project runs cross-platform and is tested on Linux and macOS (including Apple Silicon).

## Prerequisites

### Node.js (v24)
```bash
# Using nvm (recommended)
nvm install 24
nvm use 24

# Verify installation
node --version  # Should show v24.x.x
```

### Package Manager Setup
```bash
# Enable Corepack for Yarn management
corepack enable

# Verify Yarn is available
yarn --version  # Should show 3.x or 4.x
```

### Docker
```bash
docker --version  # Docker version 20.10 or higher
```

## Tech Stack

- **Framework**: Next.js 15 with Pages Router
- **UI Library**: React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4 + DaisyUI
- **State Management**: Zustand
- **Data Fetching**: SWR
- **Form Handling**: React Hook Form + Zod
- **Code Quality**: ESLint, Prettier, TypeScript strict mode


## Installation

```bash
# Clone the repository
git clone https://github.com/tegonal/lasius.git
cd lasius/frontend

# Enable Corepack if not already done
corepack enable

# Install dependencies
yarn install
```

## Development

### Start Backend Services
```bash
yarn run backend
```
Starts the backend server (sbt run) and Docker containers for MongoDB and Nginx proxy.

### Start Development Server
```bash
yarn run dev
```
Runs Next.js in development mode with hot reload on port 3001.

### Access Points
- Frontend: `http://localhost:3001`
- API Documentation: `http://localhost:9000/backend/docs/swagger-ui/index.html?url=/backend/assets/swagger.json`
- Backend Routes: `http://localhost:9000/backend/`

### Demo Credentials
```
Username: demo1@lasius.ch
Password: demo

Username: demo2@lasius.ch
Password: demo
```

## Code Quality

### Run All Checks
```bash
yarn check
```
Runs linting, formatting, and type checking in sequence.

### Individual Commands
```bash
yarn run lint        # ESLint checking
yarn run lint:fix    # Auto-fix ESLint issues
yarn run prettier    # Format code with Prettier
yarn run typecheck   # TypeScript type checking
```

## Build

```bash
yarn run build       # Production build
yarn run start       # Start production server
```

## API Client Generation

```bash
yarn run orval
```
Regenerates the TypeScript API client from OpenAPI spec. Requires backend to be running.

**Note**: Never manually edit files in `src/lib/api/lasius/` - they are auto-generated.


## Maintenance

### Update Dependencies
```bash
yarn run up          # Interactive dependency updates
```

### Clean Install
```bash
yarn run cleaner     # Remove all packages and reinstall
yarn rebuild         # Rebuild platform-specific binaries
```

## Project Structure

```
frontend/
├── @types/                 # TypeScript global type definitions
├── public/                 # Static assets (images, fonts, icons)
│   └── locales/           # i18n translation files
├── scripts/               # Build and helper scripts
└── src/
    ├── components/        # React components (see Component Architecture)
    │   ├── primitives/    # Basic building blocks
    │   ├── ui/           # Composed UI components
    │   └── features/     # Business logic components
    ├── lib/              # Utilities and helpers
    │   ├── api/          # API client and hooks
    │   ├── schemas/      # Zod validation schemas
    │   └── utils/        # Utility functions
    ├── pages/            # Next.js pages (routes)
    ├── stores/           # Zustand state management
    └── styles/           # Global styles and Tailwind config
```

## Component Architecture

The project follows atomic design principles with three component layers:

- **[Primitives](src/components/primitives/README.md)**: Foundation components (buttons, inputs, typography)
- **[UI Components](src/components/ui/README.md)**: Composed, reusable patterns (modals, cards, tables)
- **[Features](src/components/features/README.md)**: Domain-specific business components

See the [Component Architecture Guide](src/components/README.md) for detailed information.

## Additional Documentation

- [Component Architecture](src/components/README.md) - Overview of component organization
- [Primitives Guide](src/components/primitives/README.md) - Foundation component guidelines
- [UI Components Guide](src/components/ui/README.md) - Composed component patterns
- [Features Guide](src/components/features/README.md) - Business logic components
- [CLAUDE.md](CLAUDE.md) - AI assistant instructions and project conventions

## Contributing

Please ensure all code passes quality checks before submitting:

```bash
yarn check  # Must pass without errors
```

Follow the established patterns and conventions documented in the component guides.
