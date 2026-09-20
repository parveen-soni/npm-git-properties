import * as git from '../src/index';
import { runCli } from '../src/cli';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('npm-git-properties', () => {
    const customPropMap = {
        "git.build.user.name": "App User",
        "git.build.user.email": "appuser@app.com"
    };
    const userName = "App User";
    const userEmail = "appuser@app.com";

    it('currentBranch() returns a string with non-zero length', () => {
        const result = git.currentBranch();
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
    });

    it('buildHost() returns a string with non-zero length', () => {
        const result = git.buildHost();
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
    });

    it('buildVersion() returns a string with non-zero length', () => {
        const result = git.buildVersion();
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
    });

    it('commitIdAbbrev() returns string of length 7 chars', () => {
        const result = git.commitIdAbbrev();
        expect(result.length).toBeGreaterThanOrEqual(7);
    });

    it('commitIdFull() returns string of length 40 chars', () => {
        const result = git.commitIdFull();
        expect(result.length).toBe(40);
    });

    it('lastCommitMsg() returns a string with non-zero length', () => {
        const result = git.lastCommitMsg();
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
    });

    it('commitUserInfo() returns a string with non-zero length', () => {
        const result = git.commitUserInfo();
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
    });

    it('dateOfLastCommit() returns a date', () => {
        const result = git.dateOfLastCommit();
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
    });

    it('isDirty() returns a boolean value', () => {
        const result = git.isDirty();
        expect(typeof result).toBe('boolean');
    });

    it('remoteUrl() returns expected remote URL value', () => {
        const result = git.remoteUrl();
        expect(result.includes("https://github.com") || result.includes("git@github.com")).toBe(true);
    });

    it('commitIdDescAndTags(flagDirty: true) returns a string with non-zero length', () => {
        const result = git.commitIdDescAndTags();
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
    });

    it('closestTagCommitCount() returns an error description', () => {
        const result = git.closestTagCommitCount();
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
    });

    it('countOfAllCommits() returns a non-zero number', () => {
        const result = git.countOfAllCommits();
        expect(typeof result).toBe('number');
        expect(result).not.toBe(0);
        expect(Math.abs(result)).toBe(result);
    });

    it('gitInfoAsJson returns an object', () => {
        const result = git.gitInfoAsJson({}, true);
        expect(typeof result).toBe('object');
    });

    it('gitInfoAsJson returns a stringify JSON Object', () => {
        const result = git.gitInfoAsJson();
        expect(typeof result).toBe('string');
        expect(typeof JSON.parse(result)).toBe('object');
    });

    it('gitInfoAsJson overrides result with custom property map', () => {
        const result = git.gitInfoAsJson(customPropMap, true);
        expect(result["git"]["build"]["user"]["name"]).toBe(userName);
        expect(result["git"]["build"]["user"]["email"]).toBe(userEmail);
    });

    it('gitInfoAsJson overrides result with Map custom property map', () => {
        const propMap = new Map();
        propMap.set("git.build.user.name", "Map User");
        propMap.set("git.build.user.email", "mapuser@app.com");
        const result = git.gitInfoAsJson(propMap, true);
        expect(result["git"]["build"]["user"]["name"]).toBe("Map User");
        expect(result["git"]["build"]["user"]["email"]).toBe("mapuser@app.com");
    });

    it('gitInfoAsProperties returns standard Java key=value properties', () => {
        const result = git.gitInfoAsProperties(customPropMap);
        expect(typeof result).toBe('string');
        expect(result).toContain('git.branch=');
        expect(result).toContain('git.commit.id.full=');
        expect(result).toContain('git.build.user.name=App User');
        expect(result).toContain('git.build.user.email=appuser@app.com');
    });

    it('createGitInfoFile automatically detects .properties extension', () => {
        const propFileName = 'test-git.properties';
        const result = git.createGitInfoFile(customPropMap, propFileName);
        expect(result).toBe(true);
        expect(fs.existsSync(propFileName)).toBe(true);
        const content = fs.readFileSync(propFileName, 'utf8');
        expect(content).toContain('git.branch=');
        expect(content).toContain('git.build.user.name=App User');
        fs.unlinkSync(propFileName);
    });

    it('createGitInfoFile creates flat-json when requested', () => {
        const flatFileName = 'test-flat.json';
        const result = git.createGitInfoFile(customPropMap, flatFileName, 'flat-json');
        expect(result).toBe(true);
        expect(fs.existsSync(flatFileName)).toBe(true);
        const parsed = JSON.parse(fs.readFileSync(flatFileName, 'utf8'));
        expect(parsed['git.build.user.name']).toBe('App User');
        fs.unlinkSync(flatFileName);
    });

    describe('Async APIs', () => {
        it('commitIdAbbrevAsync() returns valid abbrev commit hash', async () => {
            const res = await git.commitIdAbbrevAsync();
            expect(typeof res).toBe('string');
            expect(res.length).toBeGreaterThanOrEqual(7);
        });

        it('commitIdFullAsync() returns 40 chars full hash', async () => {
            const res = await git.commitIdFullAsync();
            expect(typeof res).toBe('string');
            expect(res.length).toBe(40);
        });

        it('lastCommitMsgAsync() returns commit message', async () => {
            const res = await git.lastCommitMsgAsync();
            expect(typeof res).toBe('string');
            expect(res.length).toBeGreaterThan(0);
        });

        it('commitUserInfoAsync() returns author info', async () => {
            const res = await git.commitUserInfoAsync();
            expect(typeof res).toBe('string');
            expect(res.length).toBeGreaterThan(0);
        });

        it('dateOfLastCommitAsync() returns date string', async () => {
            const res = await git.dateOfLastCommitAsync();
            expect(typeof res).toBe('string');
            expect(res.length).toBeGreaterThan(0);
        });

        it('isDirtyAsync() returns boolean', async () => {
            const res = await git.isDirtyAsync();
            expect(typeof res).toBe('boolean');
        });

        it('remoteUrlAsync() returns remote URL', async () => {
            const res = await git.remoteUrlAsync();
            expect(typeof res).toBe('string');
            expect(res.includes('github.com')).toBe(true);
        });

        it('countOfAllCommitsAsync() returns commit count number', async () => {
            const res = await git.countOfAllCommitsAsync();
            expect(typeof res).toBe('number');
            expect(res).toBeGreaterThan(0);
        });

        it('gitInfoAsJsonAsync returns parsed object and serialized string', async () => {
            const obj = await git.gitInfoAsJsonAsync(customPropMap, true);
            expect(typeof obj).toBe('object');
            expect(obj.git.build.user.name).toBe(userName);

            const str = await git.gitInfoAsJsonAsync();
            expect(typeof str).toBe('string');
            expect(typeof JSON.parse(str)).toBe('object');
        });

        it('gitInfoAsPropertiesAsync returns valid properties string', async () => {
            const props = await git.gitInfoAsPropertiesAsync(customPropMap);
            expect(typeof props).toBe('string');
            expect(props).toContain('git.branch=');
            expect(props).toContain('git.build.user.name=App User');
        });

        it('createGitInfoFileAsync creates file asynchronously', async () => {
            const asyncFileName = 'asyncGitDetails.json';
            const res = await git.createGitInfoFileAsync(customPropMap, asyncFileName);
            expect(res).toBe(true);
            expect(fs.existsSync(asyncFileName)).toBe(true);
            fs.unlinkSync(asyncFileName);
        });
    });

    describe('Hardening and Edge Cases', () => {
        it('prevents prototype pollution in customPropMap', () => {
            const maliciousMap = JSON.parse('{"__proto__": {"polluted": true}, "git.build.user.name": "Safe User"}');
            git.gitInfoAsJson(maliciousMap, true);
            expect((Object.prototype as any).polluted).toBeUndefined();
        });

        it('buildVersion() resolves version from current repo package.json', () => {
            const version = git.buildVersion();
            const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            expect(version).toBe(pkg.version);
        });

        it('currentBranch() falls back to GITHUB_REF_NAME when in CI/detached HEAD', () => {
            const originalRef = process.env.GITHUB_REF_NAME;
            const originalHeadRef = process.env.GITHUB_HEAD_REF;
            const originalGitBranch = process.env.GIT_BRANCH;
            try {
                delete process.env.GIT_BRANCH;
                delete process.env.GITHUB_HEAD_REF;
                process.env.GITHUB_REF_NAME = 'feature-ci-test';
                const branch = git.currentBranch('/tmp/non-existent-git-dir-12345');
                expect(branch).toBe('feature-ci-test');
            } finally {
                if (originalRef !== undefined) {
                    process.env.GITHUB_REF_NAME = originalRef;
                } else {
                    delete process.env.GITHUB_REF_NAME;
                }
                if (originalHeadRef !== undefined) {
                    process.env.GITHUB_HEAD_REF = originalHeadRef;
                } else {
                    delete process.env.GITHUB_HEAD_REF;
                }
                if (originalGitBranch !== undefined) {
                    process.env.GIT_BRANCH = originalGitBranch;
                } else {
                    delete process.env.GIT_BRANCH;
                }
            }
        });

        it('getGitProp exports flat properties object', () => {
            const props = git.getGitProp();
            expect(typeof props).toBe('object');
            expect(props['git.branch']).toBeDefined();
            expect(props['git.commit.id.full']).toBeDefined();
        });

        it('handles git worktree .git file containing spaces in path', () => {
            const tempDir = path.join(os.tmpdir(), 'git-worktree-space-test-' + Date.now());
            const targetDir = path.join(tempDir, 'nested folder with spaces', '.git');
            fs.mkdirSync(targetDir, { recursive: true });
            fs.writeFileSync(path.join(targetDir, 'HEAD'), 'ref: refs/heads/worktree-branch\n');

            const worktreeDir = path.join(tempDir, 'worktree');
            fs.mkdirSync(worktreeDir, { recursive: true });
            fs.writeFileSync(path.join(worktreeDir, '.git'), `gitdir: ${targetDir}\n`);

            try {
                const branch = git.currentBranch(worktreeDir);
                expect(branch).toBe('worktree-branch');
            } finally {
                fs.rmSync(tempDir, { recursive: true, force: true });
            }
        });
    });

    describe('CLI (runCli)', () => {
        it('runCli returns help text and exitCode 0 on --help', () => {
            const logs: string[] = [];
            const res = runCli(['--help'], { log: (msg) => logs.push(msg) });
            expect(res.exitCode).toBe(0);
            expect(res.output).toContain('npm-git-properties CLI');
            expect(logs[0]).toContain('npm-git-properties CLI');
        });

        it('runCli returns version and exitCode 0 on --version', () => {
            const logs: string[] = [];
            const res = runCli(['--version'], { log: (msg) => logs.push(msg) });
            expect(res.exitCode).toBe(0);
            expect(res.output).toBe(git.buildVersion());
            expect(logs[0]).toBe(git.buildVersion());
        });

        it('runCli returns error and exitCode 1 on missing option value', () => {
            const errors: string[] = [];
            const res = runCli(['-o'], { error: (msg) => errors.push(msg) });
            expect(res.exitCode).toBe(1);
            expect(res.error).toContain("Option '-o' requires a value");
            expect(errors[0]).toContain("Option '-o' requires a value");
        });

        it('runCli returns error and exitCode 1 on invalid format', () => {
            const errors: string[] = [];
            const res = runCli(['-f', 'invalid-format'], { error: (msg) => errors.push(msg) });
            expect(res.exitCode).toBe(1);
            expect(res.error).toContain('Unknown format: invalid-format');
            expect(errors[0]).toContain('Unknown format: invalid-format');
        });

        it('runCli returns error and exitCode 1 on non-existent directory', () => {
            const errors: string[] = [];
            const res = runCli(['-d', '/path/to/non/existent/directory/xyz123'], { error: (msg) => errors.push(msg) });
            expect(res.exitCode).toBe(1);
            expect(res.error).toContain('Directory does not exist');
            expect(errors[0]).toContain('Directory does not exist');
        });

        it('runCli prints json output with --print', () => {
            const logs: string[] = [];
            const res = runCli(['--print'], { log: (msg) => logs.push(msg) });
            expect(res.exitCode).toBe(0);
            expect(res.output).toBeDefined();
            const parsed = JSON.parse(res.output!);
            expect(parsed.git).toBeDefined();
            expect(parsed.git.branch).toBeDefined();
        });

        it('runCli prints properties output with --print -f properties', () => {
            const logs: string[] = [];
            const res = runCli(['--print', '-f', 'properties'], { log: (msg) => logs.push(msg) });
            expect(res.exitCode).toBe(0);
            expect(res.output).toContain('git.branch=');
        });

        it('runCli prints flat-json output with --print -f flat-json', () => {
            const logs: string[] = [];
            const res = runCli(['--print', '-f', 'flat-json'], { log: (msg) => logs.push(msg) });
            expect(res.exitCode).toBe(0);
            const parsed = JSON.parse(res.output!);
            expect(parsed['git.branch']).toBeDefined();
        });

        it('runCli generates file at specified output path', () => {
            const cliOutputFile = 'cli-test-output.json';
            const logs: string[] = [];
            const res = runCli(['-o', cliOutputFile], { log: (msg) => logs.push(msg) });
            expect(res.exitCode).toBe(0);
            expect(fs.existsSync(cliOutputFile)).toBe(true);
            const content = JSON.parse(fs.readFileSync(cliOutputFile, 'utf8'));
            expect(content.git).toBeDefined();
            fs.unlinkSync(cliOutputFile);
        });

        it('runCli returns error and exitCode 1 on unknown option', () => {
            const errors: string[] = [];
            const res = runCli(['--unknown-flag'], { error: (msg) => errors.push(msg) });
            expect(res.exitCode).toBe(1);
            expect(res.error).toContain('Unknown option: --unknown-flag');
            expect(errors[0]).toContain('Unknown option: --unknown-flag');
        });
    });
});
