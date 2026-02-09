# TypeScript Quick Reference

## What Was Done

All 16 `.js` files in the project have been converted to TypeScript (`.ts` files) with full type safety.

## Quick Start

### Installation
```bash
npm install
```

### Development (Choose One)

**Option 1: JavaScript (No Changes - Works as Before)**
```bash
npm run dev          # Runs frontend + backend
npm run start        # Just the backend
```

**Option 2: TypeScript Backend + JavaScript Frontend**
```bash
npm run dev:ts       # Best of both worlds
npm run start:ts     # Just backend with TypeScript
```

**Option 3: Full TypeScript (Optional)**
```bash
# First, convert frontend JSX to TSX:
mv src/App.jsx src/App.tsx
mv src/ScreenplayGenerator.jsx src/ScreenplayGenerator.tsx
# ... etc for other JSX files

# Then run:
npm run dev:ts       # Everything in TypeScript
```

## TypeScript Scripts

| Command | What It Does |
|---------|-------------|
| `npm run type-check` | Check for TypeScript errors (no compilation) |
| `npm run build:server` | Compile backend TypeScript to `dist/` |
| `npm run build:all` | Compile backend + build frontend |
| `npm run build` | Just build frontend (Vite) |

## File Changes Summary

### Created TypeScript Files
```
backend/
  ✅ server.ts
  ✅ index.ts
  ✅ config/screenplay.ts
  ✅ routes/screenplay.ts
  ✅ routes/models.ts

frontend/
  ✅ src/useScreenplay.ts
  ✅ src/useScreenplayHistory.ts
  ✅ src/useScreenplayRequests.ts
  ✅ src/tts.ts
  ✅ src/store/index.ts
  ✅ src/config/defaults.ts
  ✅ src/config/languages.ts
  ✅ src/config/generator.ts

testing/
  ✅ tests/e2e/navigation.spec.ts
  ✅ playwright.config.ts

config/
  ✅ vite.config.ts
  ✅ tsconfig.json (updated)
  ✅ src/tsconfig.json (updated)
  ✅ tsconfig.node.json (created)
```

### Dependencies Added
```json
{
  "devDependencies": {
    "typescript": "^5.3.3",
    "tsx": "^4.7.0",
    "@types/node": "^20.10.6",
    "@types/express": "^4.17.21",
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15"
  }
}
```

## Important Notes

1. **Backward Compatible**: Original JavaScript still works
2. **No Breaking Changes**: Existing code functionality unchanged
3. **Optional Migration**: Use TypeScript gradually or not at all
4. **Type Safe**: Full type coverage for backend code
5. **Better IDE Support**: Full IntelliSense and autocomplete

## Common Tasks

### Run with TypeScript
```bash
npm run dev:ts
# Visit http://localhost:5173 in your browser
# Backend runs on http://localhost:3000
```

### Check for Type Errors
```bash
npm run type-check
# No errors = all clear!
```

### Build Everything
```bash
npm run build:all
```

### Convert a React Component to TypeScript (Optional)

1. Rename the file:
   ```bash
   mv src/ScreenplayGenerator.jsx src/ScreenplayGenerator.tsx
   ```

2. Add types to props:
   ```typescript
   interface ScreenplayGeneratorProps {
     onScreenplayGenerated: (screenplay: unknown, params: object) => void;
     generatingScreenplay: unknown;
     // ... other props
   }

   export default function ScreenplayGenerator(props: ScreenplayGeneratorProps) {
     // ... rest of component
   }
   ```

3. Update any imports that reference the file

## Documentation Files

- **TYPESCRIPT.md** - Detailed TypeScript setup guide
- **TYPESCRIPT_CONVERSION.md** - Full conversion details with interfaces
- **TS_FILE_MAPPING.md** - Complete file mapping and statistics

## Need Help?

Check the appropriate guide:
- **Getting started**: See this file (quick reference)
- **Detailed setup**: `TYPESCRIPT.md`
- **What was converted**: `TYPESCRIPT_CONVERSION.md` or `TS_FILE_MAPPING.md`

## Summary

You now have a **fully TypeScript-compatible project** that:
- ✅ Works exactly like before with `npm run dev`
- ✅ Can optionally use TypeScript for backend with `npm run dev:ts`
- ✅ Can optionally convert frontend components to TypeScript
- ✅ Has zero breaking changes
- ✅ Provides optional type safety and better IDE support
