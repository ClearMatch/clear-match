# Pre-Commit Hooks

This directory contains Husky pre-commit hooks that ensure code quality before commits.

## What the pre-commit hook does

The `.husky/pre-commit` hook runs automatically before every commit and performs:

1. **🧪 Tests** - Runs Jest test suite with `--passWithNoTests` flag for safety
2. **🔍 Linting** - Runs ESLint via `next lint` to catch code style issues
3. **📝 Type Checking** - Runs TypeScript compiler with `--noEmit` to catch type errors
4. **🏗️ Build** - Runs `next build` to ensure the app builds successfully

If ANY of these checks fail, the commit is blocked.

## Benefits

- ✅ **Prevents broken code** from being committed
- ✅ **Maintains consistent code quality** across the team
- ✅ **Catches issues early** before they reach CI/CD
- ✅ **Enforces best practices** automatically

## Setup

The hooks are automatically set up when you run:
```bash
pnpm install
```

This triggers the `prepare` script which runs `husky` to initialize the hooks.

## Manual execution

You can manually run the same checks:

```bash
# Run tests
pnpm test --watchAll=false --passWithNoTests

# Run linting
pnpm run lint

# Run type checking
pnpm exec tsc --noEmit

# Run build
pnpm run build
```

## Troubleshooting

If pre-commit hooks fail:

1. **Fix the failing check** (tests, linting, types, or build)
2. **Stage your changes** with `git add`
3. **Try committing again**

## Bypassing hooks (NOT recommended)

In emergency situations only:
```bash
git commit --no-verify -m "emergency fix"
```

⚠️ **Warning**: Only use `--no-verify` in true emergencies. Always fix the underlying issues.