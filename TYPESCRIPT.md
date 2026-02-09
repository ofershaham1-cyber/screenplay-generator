# TypeScript Setup Guide

This project now has full TypeScript support for both the Node.js backend and React frontend.

## Project Structure

### Backend (Node.js)
- `server.ts` - Main Express server
- `index.ts` - Entry point
- `routes/screenplay.ts` - Screenplay generation API route
- `routes/models.ts` - Models fetching API route
- `config/screenplay.ts` - Backend configuration

### Frontend (React)
- `src/main.tsx` - Entry point (rename from main.jsx)
- `src/App.tsx` - Main component (rename from App.jsx)
- `src/useScreenplay.ts` - Screenplay generation hook
- `src/useScreenplayHistory.ts` - History management hook
- `src/useScreenplayRequests.ts` - Request management hook
- `src/tts.ts` - Text-to-speech utilities
- `src/store/index.ts` - Redux-like store
- `src/config/defaults.ts` - Frontend defaults
- `src/config/languages.ts` - Language configuration
- `src/config/generator.ts` - Generator form configuration

### Configuration
- `tsconfig.json` - Root TypeScript config (backend)
- `src/tsconfig.json` - Frontend TypeScript config
- `tsconfig.node.json` - Config for build tools
- `vite.config.ts` - Vite configuration (in TypeScript)

### Testing
- `tests/e2e/navigation.spec.ts` - Playwright test (converted from .js)
- `playwright.config.ts` - Playwright configuration

## Running the Project

### Using JavaScript (Original - No Changes Needed)
```bash
npm install
npm run dev          # Runs both frontend and backend with JavaScript
npm run start        # Backend only with JavaScript
```

### Using TypeScript

#### Option 1: Run with tsx (Recommended for Development)
```bash
npm install
npm run dev:ts       # Runs both frontend and backend with TypeScript
npm run start:ts     # Backend only with TypeScript (uses tsx)
```

#### Option 2: Build and Run Compiled Code
```bash
npm run build:server # Compiles backend TypeScript to dist/
npm run build:all    # Builds both server and client
```

## Type Checking

Check for TypeScript errors without compiling:
```bash
npm run type-check
```

## Converting JSX Files to TSX

If you want to fully migrate to TypeScript for React components:

```bash
# Frontend components
mv src/main.jsx src/main.tsx
mv src/App.jsx src/App.tsx
# ... and other JSX files to TSX
```

Then update imports in other files if necessary.

## NPM Scripts

| Script | Purpose |
|--------|---------|
| `npm run start` | Run backend with JavaScript |
| `npm run start:ts` | Run backend with TypeScript (using tsx) |
| `npm run dev` | Run frontend + backend (JavaScript) |
| `npm run dev:ts` | Run frontend + backend (TypeScript) |
| `npm run build` | Build frontend with Vite |
| `npm run build:server` | Compile backend TypeScript |
| `npm run build:all` | Build frontend and compile backend |
| `npm run type-check` | Type-check without compiling |
| `npm run test` | Run Playwright tests |

## Dependencies Added

TypeScript and type definitions:
- **typescript** - TypeScript compiler
- **@types/node** - Node.js type definitions
- **@types/express** - Express type definitions
- **@types/react** - React type definitions
- **@types/react-dom** - React DOM type definitions
- **tsx** - Execute TypeScript files directly (without compilation)

## Type Safety

The project includes strict TypeScript settings:
- `strict: true` - Enables all strict type checking options
- `noImplicitAny: true` - Requires explicit types
- `strictNullChecks: true` - Strict null checking
- `noImplicitReturns: true` - All code paths must return values

## How to Migrate Existing JSX Files to TypeScript

For any React component files you want to convert from JSX to TSX:

1. Rename the file from `.jsx` to `.tsx`
2. Add type annotations for props and state
3. Update any untyped function parameters

Example migration:
```typescript
// Before (MyComponent.jsx)
export default function MyComponent({ prop1, prop2 }) {
  const [state, setState] = useState(null);
  
  const handleClick = (event) => {
    // ...
  };
}

// After (MyComponent.tsx)
interface MyComponentProps {
  prop1: string;
  prop2: number;
}

export default function MyComponent({ prop1, prop2 }: MyComponentProps) {
  const [state, setState] = useState<string | null>(null);
  
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // ...
  };
}
```

## Next Steps

1. **Option A - Stay with JavaScript**: Continue using `npm run dev` as before. TypeScript config is available if needed later.

2. **Option B - Migrate Gradually**: Use `npm run dev:ts` for the backend and keep JSX for frontend components. Migrate components to TSX incrementally.

3. **Option C - Full Migration**: Convert all JSX files to TSX and use `npm run dev:ts` for full TypeScript benefits.

## Troubleshooting

### Module not found errors
Make sure to update imports in converted files. For example:
- `import { getModels } from './routes/models.js'` → `import { getModels } from './routes/models'`
- (TypeScript automatically resolves `.ts` extensions)

### Type errors in third-party libraries
If a library lacks type definitions, you can either:
1. Use `npm install @types/library-name` if available
2. Create a `.d.ts` file with basic type definitions
3. Use `@ts-ignore` comment as a last resort

### Global types for Express
The server uses global type declarations for the logger. Check `server.ts` for the `declare global` block if you need to add more global types.

