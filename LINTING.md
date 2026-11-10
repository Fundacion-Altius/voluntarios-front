# Frontend Linting Setup

## Overview

This project uses both **ESLint** (via `next lint`) and **Biome** for linting to maintain compatibility with Next.js-specific rules while adopting Biome's cognitive complexity standards.

## Tools

### ESLint (via next lint)
- **Purpose**: Next.js framework-specific rules and React best practices
- **Config**: `.eslintrc.json` extends `next/core-web-vitals`
- **Complexity**: Currently set to warn at threshold 10

### Biome
- **Purpose**: Cognitive complexity enforcement only (for now)
- **Config**: `biome.json` with `noExcessiveCognitiveComplexity` threshold of 15 (warn severity)
- **Version**: ^2.5.11 (matches backend)
- **Command**: `biome lint --only=complexity .`

## Why Both?

We maintain both linters because:
1. **ESLint** provides Next.js-specific rules that Biome doesn't cover
2. **Biome** provides cognitive complexity enforcement with configurable thresholds
3. **Gradual migration**: Allows us to adopt Biome's complexity standards without losing existing ESLint protections

## Scripts

- `pnpm lint` - Runs both ESLint and Biome (fails on errors, allows warnings)
- `pnpm lint:eslint` - Runs only ESLint via `next lint`
- `pnpm lint:biome` - Runs only Biome complexity check via `biome lint --only=complexity .`

## Cognitive Complexity

- **Threshold**: 15 (as defined in `openspec/specs/code-quality/spec.md`)
- **Severity**: warn (to prioritize shipping velocity)
- **Rule**: `noExcessiveCognitiveComplexity` in Biome config
- **Current violations**: 85 warnings detected (functions with complexity > 15)

## Ignored Files

Biome ignores:
- `.next/` - Next.js build output
- `build/` - Build directories  
- `coverage/` - Test coverage
- `node_modules/` - Dependencies
- `dist/` - Distribution files
- Config files: `next.config.js`, `jest.*.js`, `playwright.config.ts`, etc.

## Migration Notes

The existing ESLint complexity rule (threshold: 10) is more strict than Biome's (threshold: 15). 
This dual setup allows us to:
- Maintain existing ESLint protections (threshold: 10, warn)
- Add Biome complexity enforcement (threshold: 15, warn)
- Eventually migrate fully to Biome once all rules are aligned

## Initial Run Results (2026-09-01)

- **ESLint**: Passes with warnings (complexity threshold: 10)
- **Biome**: 85 warnings, 201 infos, 0 errors (complexity threshold: 15)
- **Overall**: Exit code 0 (warnings allowed, errors not)