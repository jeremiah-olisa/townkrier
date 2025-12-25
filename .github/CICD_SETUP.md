# CI/CD Setup Guide

## Overview

This repository uses GitHub Actions for continuous integration and deployment. When you push to `main` with version changes, packages are automatically published to npm.

## Workflows

### 1. PR Validation (`pr-validation.yml`)

**Triggers:** When a PR is created/updated targeting `main`

**What it does:**

- ✅ Installs dependencies
- ✅ Runs linting
- ✅ Runs type checking
- ✅ Builds all packages
- ✅ Runs tests
- ✅ Checks if versions were bumped
- ✅ Comments on PR with build status

### 2. Publish to NPM (`publish.yml`)

**Triggers:** When code is pushed to `main` (including merged PRs)

**What it does:**

- ✅ Builds all packages
- ✅ Checks for version changes
- ✅ Publishes to npm (if version changed)
- ✅ Creates git tag with version number

## Setup Instructions

### 1. Create NPM Token

1. Go to [npmjs.com](https://www.npmjs.com/)
2. Login to your account
3. Click on your profile → **Access Tokens**
4. Click **Generate New Token** → **Classic Token**
5. Select **Automation** type
6. Copy the token (you won't see it again!)

### 2. Add Token to GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `NPM_TOKEN`
5. Value: Paste your npm token
6. Click **Add secret**

### 3. Configure Package Access

Make sure your packages are configured for public access:

```json
{
  "name": "porkate-valid8-core",
  "publishConfig": {
    "access": "public"
  }
}
```

### 4. Initial Package Publication (First Time Only)

For the first publication, you may need to publish manually:

```bash
# Login to npm
npm login

# Publish each package
cd packages/core
npm publish --access public

cd ../identitypass
npm publish --access public

cd ../dashboard
npm publish --access public

cd ../nest
npm publish --access public
```

After the first publication, the CI/CD will handle subsequent releases.

## Publishing Workflow

### Method 1: Automatic Version Bump

Use the provided script:

```bash
# Make the script executable (first time only)
chmod +x scripts/bump-version.sh

# Bump all packages (patch version: 1.0.0 → 1.0.1)
./scripts/bump-version.sh patch

# Bump minor version (1.0.1 → 1.1.0)
./scripts/bump-version.sh minor

# Bump major version (1.1.0 → 2.0.0)
./scripts/bump-version.sh major

# Bump specific package only
./scripts/bump-version.sh patch core
```

Then commit and push:

```bash
git add .
git commit -m "chore: bump version to X.X.X"
git push origin main
```

### Method 2: Manual Version Bump

1. Update version in each `package.json`:

   ```json
   {
     "version": "1.0.1"
   }
   ```

2. Commit and push:
   ```bash
   git add .
   git commit -m "chore: release v1.0.1"
   git push origin main
   ```

### Method 3: Via Pull Request

1. Create a branch:

   ```bash
   git checkout -b release/v1.0.1
   ```

2. Bump version (using script or manually)

   ```bash
   ./scripts/bump-version.sh patch
   ```

3. Commit and push:

   ```bash
   git add .
   git commit -m "chore: release v1.0.1"
   git push origin release/v1.0.1
   ```

4. Create PR to `main`
5. Wait for validation checks to pass
6. Merge PR → Auto-publish to npm!

## What Happens After Push to Main

1. **Build Trigger**: GitHub Actions detects push to main
2. **Version Check**: Checks if any package.json versions changed
3. **Build**: Compiles all packages
4. **Test**: Runs test suite
5. **Publish**: If version changed, publishes to npm
6. **Tag**: Creates git tag (e.g., `v1.0.1`)

## Monitoring

### Check Workflow Status

1. Go to **Actions** tab in GitHub
2. See the latest workflow runs
3. Click on a run to see detailed logs

### Verify Publication

1. Check npm: `npm view porkate-valid8-core`
2. Check git tags: `git tag -l`

## Troubleshooting

### Publishing Fails with "You do not have permission"

**Solution**: Make sure your NPM_TOKEN has the correct permissions

- Token must be an **Automation** token
- You must be a maintainer/owner of the @porkate organization on npm

### Version Not Detected

**Solution**: Make sure you actually changed the version number in package.json

- The workflow only publishes if version field changes
- Use `git diff HEAD~1 HEAD packages/*/package.json` to verify

### Build Fails

**Solution**: Check the Actions logs

- Click on the failed workflow
- Review the error messages
- Fix the issue and push again

### Tests Failing

Currently tests continue even if they fail (`continue-on-error: true`).
To make tests required, remove this line from the workflow.

## Package Names

The published packages will be:

- `porkate-valid8-core`
- `porkate-valid8-identitypass`
- `porkate-valid8-dashboard`
- `porkate-valid8-nest`

Users can install them:

```bash
npm install porkate-valid8-identitypass
```

## Rollback

If you need to rollback a version:

```bash
# Unpublish the version (within 72 hours)
npm unpublish porkate-valid8-core@1.0.1

# Or deprecate it (preferred)
npm deprecate porkate-valid8-core@1.0.1 "This version has issues, use 1.0.0 instead"
```

## Best Practices

1. ✅ Always test locally before pushing to main
2. ✅ Use semantic versioning (major.minor.patch)
3. ✅ Write meaningful commit messages
4. ✅ Update CHANGELOG.md with each release
5. ✅ Use PRs for releases (not direct pushes to main)
6. ✅ Review PR checks before merging
7. ✅ Tag releases with git tags (automated by workflow)

## Additional Scripts

Add these to your root `package.json`:

```json
{
  "scripts": {
    "version:patch": "./scripts/bump-version.sh patch",
    "version:minor": "./scripts/bump-version.sh minor",
    "version:major": "./scripts/bump-version.sh major",
    "publish:local": "pnpm run build && pnpm publish -r --access public"
  }
}
```

Then you can run:

```bash
pnpm run version:patch
```
