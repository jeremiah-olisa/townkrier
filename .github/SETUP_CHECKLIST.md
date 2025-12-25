# 🚀 NPM Publishing Setup Checklist

Follow these steps to enable automatic npm publishing for your monorepo.

## ☑️ Pre-Publishing Checklist

### 1. NPM Account Setup

- [ ] Create account on [npmjs.com](https://www.npmjs.com/) (if you don't have one)
- [ ] Verify your email address
- [ ] Enable 2FA (recommended)
- [ ] Create organization `@porkate` (if not exists)
  - Go to https://www.npmjs.com/settings/YourUsername/teams
  - Click "Create an Organization"
  - Choose organization name: `porkate`

### 2. Generate NPM Token

- [ ] Go to https://www.npmjs.com/settings/YourUsername/tokens
- [ ] Click "Generate New Token" → "Classic Token"
- [ ] Select **Automation** (not Classic or Granular)
- [ ] Copy the token (format: `npm_xxxxxxxxxxxxxxxxxxxx`)
- [ ] Save it securely (you won't see it again!)

### 3. Add Token to GitHub

- [ ] Go to your repo: https://github.com/jeremiah-olisa/PorkAte-Valid8
- [ ] Navigate to **Settings** → **Secrets and variables** → **Actions**
- [ ] Click "New repository secret"
- [ ] Name: `NPM_TOKEN`
- [ ] Value: Paste your npm token
- [ ] Click "Add secret"

### 4. Update Package Configurations

Check each package has proper configuration:

**packages/core/package.json**

```json
{
  "name": "porkate-valid8-core",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist", "README.md"],
  "publishConfig": {
    "access": "public"
  }
}
```

**packages/identitypass/package.json**

```json
{
  "name": "porkate-valid8-identitypass",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist", "README.md"],
  "publishConfig": {
    "access": "public"
  }
}
```

Repeat for `dashboard` and `nest` packages.

### 5. Initial Manual Publication (First Time Only)

```bash
# Login to npm
npm login

# Build all packages
pnpm run build

# Publish each package manually (first time)
cd packages/core
npm publish --access public

cd ../identitypass
npm publish --access public

cd ../dashboard
npm publish --access public

cd ../nest
npm publish --access public
```

After the first publication, CI/CD will handle future releases automatically.

### 6. Verify Workflows Are Active

- [ ] Check `.github/workflows/publish.yml` exists
- [ ] Check `.github/workflows/pr-validation.yml` exists
- [ ] Go to repo **Actions** tab
- [ ] Ensure workflows appear in the list

## 🎯 Testing the Setup

### Test 1: PR Validation

```bash
# Create a test branch
git checkout -b test/ci-setup

# Make a small change
echo "# Test" >> packages/core/README.md

# Commit and push
git add .
git commit -m "test: CI/CD setup"
git push origin test/ci-setup

# Create PR on GitHub
# ✅ Check that PR validation workflow runs
```

### Test 2: Publishing

```bash
# Bump version
pnpm run version:patch

# Review changes
git diff

# Commit
git add .
git commit -m "chore: bump version to 1.0.1"

# Push to main (or merge PR)
git push origin main

# ✅ Check Actions tab for publish workflow
# ✅ Verify on npm: npm view porkate-valid8-core
```

## 📋 Regular Publishing Workflow

Once setup is complete, use this workflow:

### Option A: Direct to Main (Quick)

```bash
# Bump version
pnpm run version:patch

# Commit and push
git add .
git commit -m "chore: release v1.0.1"
git push origin main

# ✅ Auto-publishes to npm
```

### Option B: Via Pull Request (Recommended)

```bash
# Create release branch
git checkout -b release/v1.0.1

# Bump version
pnpm run version:patch

# Commit and push
git add .
git commit -m "chore: release v1.0.1"
git push origin release/v1.0.1

# Create PR on GitHub
# ✅ PR validation runs
# ✅ Merge PR → Auto-publishes to npm
```

## 🔍 Verification

After publishing, verify:

```bash
# Check package on npm
npm view porkate-valid8-core
npm view porkate-valid8-identitypass
npm view porkate-valid8-dashboard
npm view porkate-valid8-nest

# Check git tags
git fetch --tags
git tag -l

# Install in test project
mkdir test-project && cd test-project
npm init -y
npm install porkate-valid8-identitypass
```

## 🐛 Troubleshooting

### Issue: "You do not have permission to publish"

**Fix:**

- Verify you own the `@porkate` npm organization
- Check NPM_TOKEN is an "Automation" token
- Make sure you're logged in: `npm login`

### Issue: "Version not detected by workflow"

**Fix:**

- Ensure you changed the "version" field in package.json
- Run: `git diff HEAD~1 HEAD packages/*/package.json`
- Commit should show version change

### Issue: "Workflow doesn't run"

**Fix:**

- Check if workflows are enabled in repo Settings → Actions
- Ensure NPM_TOKEN secret exists
- Check workflow file syntax (YAML formatting)

### Issue: "Build fails"

**Fix:**

- Check Actions logs for specific error
- Run locally: `pnpm run build`
- Fix issues and push again

## 📚 Documentation

- Full CI/CD guide: `.github/CICD_SETUP.md`
- Workflow files: `.github/workflows/`
- Version bump script: `scripts/bump-version.sh`

## ✅ Setup Complete!

Once all checkboxes are checked, your CI/CD is ready! 🎉

Every merge to `main` with version changes will automatically publish to npm.
