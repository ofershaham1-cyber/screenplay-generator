# TypeScript Setup Guide

This project now supports TypeScript for both the Node.js backend and React frontend.

## Configuration Files

- **tsconfig.json** - Root TypeScript configuration for the backend (Node.js)
- **src/tsconfig.json** - Frontend React configuration (extends root config)
- **tsconfig.node.json** - Configuration for Vite and build tools
- **vite.config.ts** - TypeScript version of Vite configuration

## Running with TypeScript

### Option 1: JavaScript (Original - Recommended for quick start)
```bash
npm run dev          # Frontend + Backend with JavaScript
npm run start        # Backend only with JavaScript
```

### Option 2: TypeScript
```bash
npm run dev:ts       # Frontend + Backend with TypeScript
npm run start:ts     # Backend only with TypeScript (requires tsx)
```

### TypeScript Build Commands
```bash
npm run type-check   # Check for TypeScript errors without compiling
npm run build:server # Compile backend TypeScript to dist/
npm run build:all    # Build both server (dist/) and client (dist/ for Vite)
npm run build        # Build frontend with Vite
```

## Converting Files to TypeScript

To use TypeScript, rename files:
- **.js** → **.ts** (for backend/Node.js code)
- **.jsx** → **.tsx** (for React components)

For example:
```bash
# Backend
mv server.js server.ts
mv routes/screenplay.js routes/screenplay.ts
mv routes/models.js routes/models.ts

# Frontend
mv src/main.jsx src/main.tsx
mv src/App.jsx src/App.tsx
```

Then update imports to use the new extensions if you renamed files.

## Type Checking

The TypeScript configuration enforces strict type checking. You can disable specific checks in `tsconfig.json` if needed:

```json
{
  "compilerOptions": {
    "noImplicitAny": false,        // Allow implicit any types
    "noUnusedLocals": false,       // Allow unused variables
    "noUnusedParameters": false    // Allow unused function parameters
  }
}
```

## Dependencies Added

- **typescript** - TypeScript compiler
- **@types/node** - Type definitions for Node.js
- **@types/express** - Type definitions for Express
- **@types/react** - Type definitions for React
- **@types/react-dom** - Type definitions for React DOM

## Next Steps

1. Install dependencies: `npm install` (or `pnpm install`)
2. Choose your preferred approach (JavaScript or TypeScript)
3. Optionally convert files to TypeScript for better type safety
4. Run `npm run type-check` to validate TypeScript
