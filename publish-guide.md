# NPM Publishing & Version Management Guide

A comprehensive guide for maintaining, versioning, and publishing `npm-git-properties` (and other public NPM packages).

---

## 1. Quick Reference & Setup

* **Package Name:** `npm-git-properties`
* **Registry:** `https://registry.npmjs.org/`
* **Prepublish Hook:** `package.json` includes `"prepublishOnly": "npm run build"`, which automatically compiles TypeScript to CommonJS, ESM, and CLI bundles in `dist/` before packaging.

---

## 2. Step-by-Step Publishing Workflow

### Step 1: Authenticate with NPM
If you are working on a new machine or haven't logged in recently:

```bash
# 1. Log in to your NPM account
npm login

# 2. Verify logged-in account
npm whoami
```

### Step 2: Verify Package Ownership
Confirm that your account has maintainer privileges on the package:

```bash
npm owner ls npm-git-properties
```

### Step 3: Run Tests & Build Check
Ensure that the codebase is clean, all tests pass, and the build succeeds:

```bash
# Run unit tests
npm test

# Verify build output
npm run build
```

### Step 4: Choose and Bump the Version
NPM strictly follows [Semantic Versioning (SemVer)](https://semver.org/):

* **Patch** (`1.0.0` → `1.0.1`): Backwards-compatible bug fixes.
* **Minor** (`1.0.0` → `1.1.0`): Backwards-compatible new features.
* **Major** (`1.0.0` → `2.0.0`): Breaking API changes.

Run one of the following commands:
```bash
# Automatically updates package.json, creates a git commit, and tags the commit
npm version patch   # For bug fixes
npm version minor   # For new features
npm version major   # For breaking changes
```

> **Note:** If you manually update `"version"` in [package.json](file:///Users/ps/development/npm-git-properties/package.json), you will need to commit and git-tag it manually.

### Step 5: Test the Package Bundle (Dry Run)
Before uploading to the registry, preview what files will actually be included:

```bash
npm publish --dry-run
```
Inspect the output to confirm only intended files (e.g., `dist/`, `README.md`, `LICENSE`, `package.json`) are bundled.

### Step 6: Publish to NPM
Publish the package to the public registry:

```bash
npm publish
```

* **Two-Factor Authentication (2FA):** If 2FA is active on your npm account, enter the One-Time Password (OTP) when prompted in terminal, or supply it directly:
  ```bash
  npm publish --otp=123456
  ```
* **Scoped Packages Note:** If publishing an `@org/pkg-name` package in the future, remember to pass `--access public` on first publish. Unscoped packages (like `npm-git-properties`) publish publicly by default.

### Step 7: Push Git Commits & Tags
Keep your GitHub remote repository in sync with the published version:

```bash
git push origin <branch-name> --follow-tags
# Or push tags explicitly:
git push origin --tags
```

### Step 8: Verify Live Package
Check the registry to verify that the release is live:

```bash
npm view npm-git-properties version
```
Or check the package page: `https://www.npmjs.com/package/npm-git-properties`

---

## 3. Unpublishing, Deleting, & Version Replacement

### The Immutable Version Rule
> **Important:** NPM does **NOT** allow republishing the same version number. Once a version (e.g., `2.0.0`) is published, that specific number is permanently retired by the registry, even if unpublished. Attempting to re-publish the same version will produce:  
> `403 Forbidden - You cannot publish over the previously published versions.`

### NPM Unpublish Policy (72-Hour Rule)
* **Within 72 Hours:** You can unpublish a specific version only if no other packages depend on it:
  ```bash
  npm unpublish npm-git-properties@<version>
  ```
* **After 72 Hours:** Unpublishing via CLI is blocked to prevent breaking downstream consumers. You must contact npm support or deprecate the version instead.

### Recommended Fix: Deprecate + Patch Bump
Instead of unpublishing, standard practice is to deprecate the faulty version and publish a fast patch fix:

```bash
# 1. Deprecate the faulty version with a clear notice
npm deprecate npm-git-properties@2.0.0 "Contains an issue; please upgrade to 2.0.1"

# 2. Bump patch version
npm version patch

# 3. Publish the fixed release
npm publish
```

### Repointing the `latest` Dist-Tag
If an accidental version changes the default install target, repoint `latest` back to the stable version:

```bash
npm dist-tag add npm-git-properties@<stable-version> latest
```

---

## 4. Publishing Limits & Frequency

### Daily Limits
* **No strict daily quota:** There is no hard limit on how many versions you can publish per day under normal maintenance (publishing 5–15 versions a day across fixes and features will not trigger limits).

### Burst Rate Limits (`HTTP 429 Too Many Requests`)
* **Burst Threshold:** Rapid automated publishing (e.g., CI/CD loops) often hits a burst rate limiter after roughly **25 to 50 operations** in a short window.
* **Cooldown:** If rate-limited (`429 Too Many Requests`), the restriction typically clears automatically within **30 to 60 minutes**.

### Testing Without Wasting Version Numbers
To test packages without publishing permanent versions to `latest`:

1. **Local Tarball Testing (`npm pack`):**
   ```bash
   npm pack
   # Creates npm-git-properties-2.0.0.tgz
   # In another test project: npm install /path/to/npm-git-properties-2.0.0.tgz
   ```
2. **Local Symlinking (`npm link`):**
   ```bash
   # In this repo:
   npm link
   # In your test project:
   npm link npm-git-properties
   ```
3. **Pre-Release / Beta Tags:**
   Publish for staging without affecting normal `npm install` users:
   ```bash
   npm version 2.0.0-beta.0
   npm publish --tag beta
   ```
   * Users installing `npm install npm-git-properties` will stay on `latest`.
   * Testers can install via `npm install npm-git-properties@beta`.

---

## 5. Common Troubleshooting

| Issue / Error | Cause | Solution |
| :--- | :--- | :--- |
| `npm error code ENEEDAUTH` | Not logged into npm CLI | Run `npm login` and check with `npm whoami`. |
| `403 Forbidden` | Insufficient permissions or wrong account | Ensure `npm whoami` matches an owner in `npm owner ls npm-git-properties`. |
| `403 Cannot publish over previously published versions` | Version already exists or was previously deleted | Increment the version in `package.json` or use `npm version patch`. |
| `429 Too Many Requests` | Burst rate limit reached | Wait 30–60 minutes before retrying; avoid rapid batch releases. |
