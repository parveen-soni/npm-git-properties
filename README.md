# npm-git-properties

[![CI](https://github.com/parveen-soni/npm-git-properties/actions/workflows/ci.yml/badge.svg)](https://github.com/parveen-soni/npm-git-properties/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/npm-git-properties.svg)](https://badge.fury.io/js/npm-git-properties)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](https://www.npmjs.com/package/npm-git-properties)

> Lightweight, **zero-dependency** Git metadata and build-stamping toolkit for Node.js, Docker, CI/CD, and full-stack web applications. Compatible with **Spring Boot Actuator** and **express-actuator**.

---

## Features

- **Zero External Dependencies**: Powered purely by Node.js built-ins (`child_process`, `fs`, `path`, `os`).
- **High-Performance Subprocess Batching**: Single-pass `git log` metadata extraction executes **60%+ faster**.
- **Dual ESM & CommonJS**: Full support for both `import` and `require`.
- **Zero-Config CLI**: Generate `git.properties` or `gitDetails.json` in one command (`npx git-properties`).
- **Spring Boot / Actuator Compatible**: Outputs standard Java `.properties` format as well as nested or flat JSON with ISO-8601 timestamps.
- **Sync & Async APIs**: Non-blocking `Promise`-based APIs for web servers, and synchronous methods for build scripts.
- **In-Memory Caching & Middleware**: Built-in memoized cache and zero-dependency Express / Connect middleware.
- **Universal Cloud & CI/CD Fallbacks**: Automatic fallbacks for GitHub Actions, GitLab CI, Azure DevOps, CircleCI, Vercel, Netlify, Cloudflare Pages, AWS CodeBuild, and Bitbucket.
- **Strong TypeScript Types**: Comprehensive type declarations for all properties and options.

---

## Installation

```bash
npm install npm-git-properties
```

Or run via `npx` without installing:

```bash
npx git-properties
```

---

## CLI Usage

Generate git properties files directly in your `package.json` build scripts or Dockerfile:

```json
{
  "scripts": {
    "prebuild": "git-properties --format properties --output dist/git.properties",
    "build": "tsc"
  }
}
```

### CLI Options

```
Usage:
  git-properties [options]

Options:
  -o, --output <file>    Output file path (default: gitDetails.json or git.properties)
  -f, --format <format>  Output format: properties, json, flat-json
  -d, --dir <directory>  Target git repository directory (default: current working directory)
  -p, --print            Print output to stdout instead of writing to a file
  -q, --silent           Suppress informative log output
  -c, --custom <k=v>     Add custom property override (e.g. -c git.build.user.name=CI)
  --fail-on-dirty        Exit with code 1 if working directory has uncommitted changes
  -v, --version          Print version
  -h, --help             Show help
```

### CLI Examples

```bash
# Generate standard Java git.properties for Spring Boot / express-actuator
npx git-properties --format properties --output git.properties

# Generate nested JSON file silently in build scripts
npx git-properties --format json --output gitDetails.json --silent

# Pass custom property overrides directly via CLI
npx git-properties --print -c git.build.user.name="CI Runner" -c app.environment="production"

# Fail release build if uncommitted changes exist
npx git-properties --fail-on-dirty
```

---

## Programmatic Usage

### ESM (ECMAScript Modules)

```ts
import { 
  gitInfoAsProperties, 
  gitInfoAsJson, 
  createGitInfoFile,
  commitIdAbbrev 
} from 'npm-git-properties';

console.log(commitIdAbbrev()); // e.g. "ca99ec0"

// Generate standard Java key=value properties string
const props = gitInfoAsProperties();
console.log(props);
```

### CommonJS

```js
const git = require('npm-git-properties');

console.log(git.currentBranch()); // e.g. "master"
console.log(git.commitIdFull());  // e.g. "ca99ec0232c2397ae4ff711ef62a088c87818f9f"

// Write to file (auto-detects .properties format by extension)
git.createGitInfoFile(undefined, 'git.properties');
```

### Asynchronous APIs (Web Servers & Microservices)

Non-blocking methods prevent blocking the Node.js event loop:

```ts
import { gitInfoAsJsonAsync, createGitInfoFileAsync } from 'npm-git-properties';

// In an Express / Fastify / NestJS health route:
app.get('/info', async (req, res) => {
  const gitInfo = await gitInfoAsJsonAsync(undefined, true);
  res.json(gitInfo);
});

// Async file writing
await createGitInfoFileAsync(undefined, 'git.properties');
```

---

## Output Formats

### 1. Java Properties Format (`properties`)
Ideal for Spring Boot Actuator, `express-actuator`, Prometheus, or log shippers:

```properties
git.branch=master
git.build.host=runner-1
git.build.version=2.1.0
git.commit.id.abbrev=ca99ec0
git.commit.id.full=ca99ec0232c2397ae4ff711ef62a088c87818f9f
git.commit.message.short=feat: Add async API and CLI
git.commit.time=Tue Sep 15 2026 22:30:00 GMT+0000
git.commit.time_epoch=1790056091
git.commit.time_iso=2026-09-15T22:30:00.000Z
git.commit.user.email=dev@example.com
git.commit.user.name=Developer
git.dirty=false
git.remote.origin.url=https://github.com/parveen-soni/npm-git-properties.git
git.tags=v2.1.0
git.total.commit.count=42
```

### 2. Nested JSON Format (`json`)
Default structure formatted into nested objects with ISO timestamps:

```json
{
  "git": {
    "branch": "master",
    "build": {
      "host": "runner-1",
      "version": "2.1.0"
    },
    "commit": {
      "id": {
        "abbrev": "ca99ec0",
        "full": "ca99ec0232c2397ae4ff711ef62a088c87818f9f"
      },
      "message": {
        "short": "feat: Add async API and CLI",
        "full": "feat: Add async API and CLI"
      },
      "user": {
        "name": "Developer",
        "email": "dev@example.com"
      },
      "time": "Tue Sep 15 2026 22:30:00 GMT+0000",
      "time_iso": "2026-09-15T22:30:00.000Z",
      "time_epoch": 1790056091
    },
    "dirty": false,
    "remote": {
      "origin": {
        "url": "https://github.com/parveen-soni/npm-git-properties.git"
      }
    },
    "total": {
      "commit": {
        "count": 42
      }
    }
  }
}
```

---

## Web Framework Middleware & Caching

For web servers (Express, Fastify, Connect), avoid spawning subprocesses on every HTTP request by using the built-in zero-dependency middleware or memoized cache:

### Express / Connect Middleware

```ts
import express from 'express';
import { gitPropertiesMiddleware } from 'npm-git-properties';

const app = express();

// Exposes /info with cached Git metadata in JSON format
app.use(gitPropertiesMiddleware({ path: '/info' }));

// Or serve Spring Boot Actuator format:
app.use(gitPropertiesMiddleware({ path: '/actuator/info', format: 'properties' }));
```

### In-Memory Caching API

```ts
import { getGitPropCached, getGitPropCachedAsync, clearGitPropCache } from 'npm-git-properties';

// Synchronous cached lookup (cached permanently for process lifetime by default)
const cachedProps = getGitPropCached();

// With custom Time-To-Live (TTL in ms):
const freshProps = await getGitPropCachedAsync({ ttlMs: 60000 });

// Manually invalidate cache if needed:
clearGitPropCache();
```

---

## Custom Property Overrides

You can pass a custom JavaScript `Object` or `Map` to override or extend metadata (e.g. inject build user from CI):

```js
const customProps = new Map();
customProps.set('git.build.user.name', 'CI Builder');
customProps.set('git.build.user.email', 'ci@company.com');

git.createGitInfoFile(customProps, 'git.properties');
```

---

## API Reference

### Core Synchronous Methods
- **`currentBranch(dir?: string)`** &rarr; `string`: Branch name or detached HEAD indicator.
- **`commitIdAbbrev()`** &rarr; `string`: 7-character abbreviated commit hash.
- **`commitIdFull()`** &rarr; `string`: 40-character full commit SHA.
- **`lastCommitMsg(short?: boolean)`** &rarr; `string`: Last commit message (`short` for summary line).
- **`commitUserInfo(email?: boolean)`** &rarr; `string`: Author name (or email if `true`).
- **`dateOfLastCommit()`** &rarr; `string`: Local date string of last commit.
- **`dateOfLastCommitIso()`** &rarr; `string`: ISO-8601 UTC timestamp of last commit.
- **`dateOfLastCommitEpoch()`** &rarr; `number`: UNIX epoch seconds of last commit.
- **`isDirty()`** &rarr; `boolean`: Whether working tree has uncommitted modifications.
- **`remoteUrl()`** &rarr; `string`: Remote origin URL.
- **`commitIdDescAndTags(flagDirty?: boolean)`** &rarr; `string`: Output from `git describe`.
- **`closestTagCommitCount()`** &rarr; `string`: Commit count from closest tag.
- **`countOfAllCommits()`** &rarr; `number`: Total commit count in repository.
- **`buildHost()`** &rarr; `string`: Hostname where code is executed.
- **`buildVersion()`** &rarr; `string`: Version read from package.json.

### Caching & Middleware Methods
- **`getGitPropCached(options?: CacheOptions)`** &rarr; `GitPropertiesFlat`: In-memory memoized properties lookup.
- **`getGitPropCachedAsync(options?: CacheOptions)`** &rarr; `Promise<GitPropertiesFlat>`: Async memoized lookup.
- **`clearGitPropCache()`** &rarr; `void`: Clears in-memory cache.
- **`gitPropertiesMiddleware(options?: MiddlewareOptions)`** &rarr; `(req, res, next) => void`: Zero-dependency HTTP handler.

### File & Serialization Methods
- **`gitInfoAsProperties(customProps?)`** &rarr; `string`: Format properties as Java key=value.
- **`gitInfoAsJson(customProps?, requireObject?)`** &rarr; `string | GitProperties`: Returns JSON string or nested JS object.
- **`createGitInfoFile(customProps?, fileName?, format?)`** &rarr; `boolean`: Creates file on disk. Auto-detects `.properties` extension.

### Asynchronous Equivalents
- `commitIdAbbrevAsync()` &rarr; `Promise<string>`
- `commitIdFullAsync()` &rarr; `Promise<string>`
- `lastCommitMsgAsync(short?)` &rarr; `Promise<string>`
- `commitUserInfoAsync(email?)` &rarr; `Promise<string>`
- `dateOfLastCommitAsync()` &rarr; `Promise<string>`
- `dateOfLastCommitIsoAsync()` &rarr; `Promise<string>`
- `dateOfLastCommitEpochAsync()` &rarr; `Promise<number>`
- `isDirtyAsync()` &rarr; `Promise<boolean>`
- `remoteUrlAsync()` &rarr; `Promise<string>`
- `countOfAllCommitsAsync()` &rarr; `Promise<number>`
- `gitInfoAsPropertiesAsync(customProps?)` &rarr; `Promise<string>`
- `gitInfoAsJsonAsync(customProps?, requireObject?)` &rarr; `Promise<string | GitProperties>`
- `createGitInfoFileAsync(customProps?, fileName?, format?)` &rarr; `Promise<boolean>`

---

## Inspiration

- [git-rev-sync-js](https://github.com/kurttheviking/git-rev-sync-js)
- [gradle-git-properties](https://github.com/n0mer/gradle-git-properties)

---

## License

[MIT](LICENSE)