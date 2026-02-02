# Publishing townkrier-core to npm

## Pre-publication Checklist

- [ ] All tests pass: `npm run test`
- [ ] Code builds successfully: `npm run build`
- [ ] Code passes linting: `npm run lint`
- [ ] README.md is up-to-date
- [ ] CHANGELOG.md is updated with version changes
- [ ] Version in package.json is bumped appropriately
- [ ] No uncommitted changes in git

## Publishing Steps

### 1. Update Version (Semantic Versioning)

```bash
# Choose one:
npm version patch  # 1.0.0-beta.1 -> 1.0.0-beta.2
npm version minor  # 1.0.0-beta.1 -> 1.0.1-beta.1
npm version major  # 1.0.0-beta.1 -> 2.0.0-beta.1
```

Or manually edit `package.json` version and commit:

```bash
git add package.json
git commit -m "chore: bump version to 1.0.0-beta.2"
```

### 2. Build and Verify

```bash
npm run clean
npm run build
npm run test
npm run lint
```

### 3. Publish to npm

```bash
# Public publish (requires npm login)
npm publish

# Or dry run to see what will be published
npm publish --dry-run
```

### 4. Create Git Tag

```bash
git tag -a v1.0.0-beta.2 -m "Release v1.0.0-beta.2"
git push origin v1.0.0-beta.2
```

## Beta Releases

To publish a beta version:

```bash
npm publish --tag beta
```

Then users can install with:

```bash
npm install townkrier-core@beta
```

## Troubleshooting

### Authentication Issues

```bash
# Login to npm
npm login

# Verify login
npm whoami
```

### Permission Denied

Make sure your npm account has publish permissions for `townkrier-core`. Contact the package maintainers if needed.

### Version Already Published

If the version already exists on npm:

```bash
# Bump patch version and try again
npm version patch
npm publish
```

## What Gets Published

Only files listed in `files` field of package.json are included:

- `dist/` - Compiled JavaScript and type definitions
- `README.md` - Package documentation
- `LICENSE` - License file

Tests and source files are excluded via `tsconfig.json` exclude rules.

## After Publishing

1. Announce the release in your repository
2. Update release notes on GitHub
3. Update documentation if needed
4. Notify users of breaking changes if applicable
