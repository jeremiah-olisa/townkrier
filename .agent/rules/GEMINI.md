=== foundation rules ===

# Townkrier Rules

The Townkrier Gemini rules are specifically curated for this application to ensure high-quality, maintainable, and developer-friendly code.

## Foundational Context

This is the Townkrier project, a TypeScript monorepo for notification services. You are an expert in TypeScript, Node.js, and notification systems.

## Core Principles

- **DRY (Don't Repeat Yourself)**: Avoid code duplication. Extract usage patterns into reusable variables, functions, or classes.
- **SOLID**: Adhere to SOLID principles, especially Single Responsibility and Open/Closed principles, to ensure the notification system remains extensible.
- **Developer Experience (DX)**: Prioritize simplicity and ease of use for the end-developer. usage should feels "plug and play" (like Laravel notifications).
- **Simplicity**: choose the simplest solution that effectively solves the problem. Avoid over-engineering.

## Conventions

- **Naming**: Use descriptive names for variables and methods.
- **Component Reuse**: Check for existing utilities or components before creating new ones.
- **Plug and Play**: When designing interfaces or factories, ensure the consumer experience is seamless and requires minimal configuration.

=== typescript rules ===

## TypeScript Strictness

- **No `any`**: Avoid using the `any` type. strictly define types and interfaces.
- **Exceptions**: If `any` is absolutely necessary, you must use `// eslint-disable-next-line @typescript-eslint/no-explicit-any` to acknowledge it.
- **Unused Variables**: Do not leave unused variables or imports. Follow the ESLint rules.

## Formatting & Style

- **Prettier**: Code must follow the project's Prettier configuration:
  - Semicolons: Yes (`semi: true`)
  - Quotes: Single (`singleQuote: true`)
  - Width: 100 characters
  - Tabs: 2 spaces
- **Linting**: Respect `.eslintrc.js` rules.

=== workflow rules ===

## Monorepo Navigation

- **Filter Commands**: When searching for files or running commands, avoid navigating blindly. Use specific paths or filters to target the right package.
  - Example: Use `find_by_name` with `SearchDirectory` set to `packages/core` instead of the root if you know the file is in core.
  - Do not `cd` unnecessarily. Run commands from the root or specific workspace using `npm run --workspace=@townkrier/core ...`.

## Testing

- **Jest**: This project uses Jest. Ensure tests are written for all new functionality.
- **Type Definitions**: Ensure `tsconfig.spec.json` is respected so test files have checking.

=== tools rules ===

## Townkrier Guidelines

- **Factory Pattern**: Use the `TownkrierFactory` for simplified instantiation.
- **Generics**: Use generics in `BaseNotificationChannel` and other core classes to ensure type safety without casting.
