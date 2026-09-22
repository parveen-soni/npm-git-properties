# Contributing to npm-git-properties

Thank you for your interest in contributing to `npm-git-properties`! We welcome contributions that maintain our core principles:
- **Zero runtime dependencies** (Node.js standard libraries only)
- **High performance and resilience in CI/CD and Docker environments**
- **Strict dual CommonJS and ESM support with comprehensive TypeScript typings**

---

## Development Setup

1. **Fork and Clone** the repository:
   ```bash
   git clone https://github.com/parveen-soni/npm-git-properties.git
   cd npm-git-properties
   ```

2. **Install Dev Dependencies**:
   ```bash
   npm install
   ```

3. **Build the Project** (builds CJS, ESM, types, and executable CLI):
   ```bash
   npm run build
   ```

4. **Run Tests**:
   ```bash
   npm test
   ```

5. **Type Check**:
   ```bash
   npm run typecheck
   ```

6. **Check Test Coverage**:
   ```bash
   npm run test:coverage
   ```

---

## Contribution Guidelines

1. **Keep Zero Runtime Dependencies**: Do not introduce any third-party packages to `dependencies` in `package.json`. Everything must use Node.js built-ins (`child_process`, `fs`, `path`, `os`).
2. **Support Both Sync and Async**: If you add or modify a core extraction API, provide both synchronous and asynchronous Promise-based implementations.
3. **Cross-Platform Compatibility**: Ensure your code works across macOS, Linux, and Windows (avoid hardcoded path separators; use `path.sep` or `path.resolve`).
4. **Write Tests**: Add corresponding test cases in `tests/tests.ts` to maintain high test coverage (>85%).
5. **Update Documentation**: When adding new features or CLI flags, update `README.md` and include usage examples.

---

## Submitting a Pull Request

1. Create a feature branch: `git checkout -b feat/my-new-feature`
2. Commit your changes following conventional commits (e.g. `feat: ...`, `fix: ...`, `docs: ...`).
3. Push to your fork: `git push origin feat/my-new-feature`
4. Open a Pull Request and complete the PR checklist.
