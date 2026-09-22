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

    describe('Directory Argument Support (dir)', () => {
        const repoDir = process.cwd();

        it('individual sync functions accept explicit dir argument', () => {
            expect(git.currentBranch(repoDir)).toBe(git.currentBranch());
            expect(git.commitIdAbbrev(repoDir)).toBe(git.commitIdAbbrev());
            expect(git.commitIdFull(repoDir)).toBe(git.commitIdFull());
            expect(git.buildVersion(repoDir)).toBe(git.buildVersion());
            expect(git.countOfAllCommits(repoDir)).toBe(git.countOfAllCommits());
            expect(git.dateOfLastCommit(repoDir)).toBe(git.dateOfLastCommit());
            expect(git.isDirty(repoDir)).toBe(git.isDirty());
            expect(git.remoteUrl(repoDir)).toBe(git.remoteUrl());
        });

        it('individual async functions accept explicit dir argument', async () => {
            const [abbrev, full, count, dirty, remote] = await Promise.all([
                git.commitIdAbbrevAsync(repoDir),
                git.commitIdFullAsync(repoDir),
                git.countOfAllCommitsAsync(repoDir),
                git.isDirtyAsync(repoDir),
                git.remoteUrlAsync(repoDir)
            ]);
            expect(abbrev).toBe(git.commitIdAbbrev());
            expect(full).toBe(git.commitIdFull());
            expect(count).toBe(git.countOfAllCommits());
            expect(dirty).toBe(git.isDirty());
            expect(remote).toBe(git.remoteUrl());
        });

        it('getGitProp and gitInfoAsJson accept explicit dir argument', () => {
            const prop = git.getGitProp(undefined, repoDir);
            expect(prop['git.branch']).toBe(git.currentBranch());

            const json = git.gitInfoAsJson(undefined, true, repoDir);
            expect(json.git.branch).toBe(git.currentBranch());

            const propStr = git.gitInfoAsProperties(undefined, repoDir);
            expect(propStr).toContain('git.branch=');
        });

        it('getGitPropAsync and gitInfoAsJsonAsync accept explicit dir argument', async () => {
            const prop = await git.getGitPropAsync(undefined, repoDir);
            expect(prop['git.branch']).toBe(git.currentBranch());

            const json = await git.gitInfoAsJsonAsync(undefined, true, repoDir);
            expect(json.git.branch).toBe(git.currentBranch());

            const propStr = await git.gitInfoAsPropertiesAsync(undefined, repoDir);
            expect(propStr).toContain('git.branch=');
        });
    });

    describe('CI/CD Fallbacks for Commit, User, Remote and Message', () => {
        const nonGitDir = path.join(os.tmpdir(), 'non-git-dir-test-' + Date.now());

        beforeAll(() => {
            fs.mkdirSync(nonGitDir, { recursive: true });
        });

        afterAll(() => {
            fs.rmSync(nonGitDir, { recursive: true, force: true });
        });

        it('falls back to GITHUB_SHA / GIT_COMMIT for commit IDs in gitless environments', () => {
            const origSha = process.env.GITHUB_SHA;
            const origGitCommit = process.env.GIT_COMMIT;
            try {
                delete process.env.GIT_COMMIT;
                process.env.GITHUB_SHA = '1234567890abcdef1234567890abcdef12345678';
                expect(git.commitIdFull(nonGitDir)).toBe('1234567890abcdef1234567890abcdef12345678');
                expect(git.commitIdAbbrev(nonGitDir)).toBe('1234567');
            } finally {
                if (origSha !== undefined) process.env.GITHUB_SHA = origSha;
                else delete process.env.GITHUB_SHA;
                if (origGitCommit !== undefined) process.env.GIT_COMMIT = origGitCommit;
                else delete process.env.GIT_COMMIT;
            }
        });

        it('falls back to GITHUB_REPOSITORY / GIT_URL for remoteUrl in gitless environments', () => {
            const origRepo = process.env.GITHUB_REPOSITORY;
            const origGitUrl = process.env.GIT_URL;
            try {
                delete process.env.GIT_URL;
                process.env.GITHUB_REPOSITORY = 'test-org/test-repo';
                expect(git.remoteUrl(nonGitDir)).toBe('https://github.com/test-org/test-repo');
            } finally {
                if (origRepo !== undefined) process.env.GITHUB_REPOSITORY = origRepo;
                else delete process.env.GITHUB_REPOSITORY;
                if (origGitUrl !== undefined) process.env.GIT_URL = origGitUrl;
                else delete process.env.GIT_URL;
            }
        });

        it('falls back to CI_COMMIT_MESSAGE / VERCEL_GIT_COMMIT_MESSAGE for lastCommitMsg', () => {
            const origMsg = process.env.CI_COMMIT_MESSAGE;
            try {
                process.env.CI_COMMIT_MESSAGE = 'feat: custom ci commit title\n\nFull detailed body message.';
                expect(git.lastCommitMsg(true, nonGitDir)).toBe('feat: custom ci commit title');
                expect(git.lastCommitMsg(false, nonGitDir)).toBe('feat: custom ci commit title\n\nFull detailed body message.');
            } finally {
                if (origMsg !== undefined) process.env.CI_COMMIT_MESSAGE = origMsg;
                else delete process.env.CI_COMMIT_MESSAGE;
            }
        });

        it('falls back to GITHUB_ACTOR / GIT_AUTHOR_EMAIL for commitUserInfo', () => {
            const origActor = process.env.GITHUB_ACTOR;
            const origEmail = process.env.GIT_AUTHOR_EMAIL;
            try {
                process.env.GITHUB_ACTOR = 'ci-actor';
                process.env.GIT_AUTHOR_EMAIL = 'ci-actor@ci.test';
                expect(git.commitUserInfo(false, nonGitDir)).toBe('ci-actor');
                expect(git.commitUserInfo(true, nonGitDir)).toBe('ci-actor@ci.test');
            } finally {
                if (origActor !== undefined) process.env.GITHUB_ACTOR = origActor;
                else delete process.env.GITHUB_ACTOR;
                if (origEmail !== undefined) process.env.GIT_AUTHOR_EMAIL = origEmail;
                else delete process.env.GIT_AUTHOR_EMAIL;
            }
        });
    });

    describe('Deep Property Mapping & Nested Objects', () => {
        it('handles deeply nested custom property paths correctly', () => {
            const deepProps = {
                'custom.level1.level2.value': 'deep-value',
                'custom.level1.level2.number': 42,
                'custom.flag': true
            };
            const result = git.gitInfoAsJson(deepProps, true) as any;
            expect(result.custom.level1.level2.value).toBe('deep-value');
            expect(result.custom.level1.level2.number).toBe(42);
            expect(result.custom.flag).toBe(true);
        });

        it('gitInfoAsProperties sorts keys alphabetically and terminates with newline', () => {
            const propsStr = git.gitInfoAsProperties();
            expect(propsStr.endsWith('\n')).toBe(true);
            const lines = propsStr.trim().split('\n');
            const keys = lines.map(line => line.split('=')[0]);
            const sortedKeys = [...keys].sort();
            expect(keys).toEqual(sortedKeys);
        });
    });

    describe('Error Handling and File Operations', () => {
        it('createGitInfoFile throws error when target directory is invalid', () => {
            const invalidPath = path.join(os.tmpdir(), 'non_existent_folder_xyz', 'sub', 'gitDetails.json');
            expect(() => git.createGitInfoFile(undefined, invalidPath)).toThrow();
        });

        it('createGitInfoFileAsync throws error when target directory is invalid', async () => {
            const invalidPath = path.join(os.tmpdir(), 'non_existent_folder_xyz', 'sub', 'gitDetails.json');
            await expect(git.createGitInfoFileAsync(undefined, invalidPath)).rejects.toThrow();
        });
    });

    describe('Constants and Exports', () => {
        it('exports all expected Git property key constants', () => {
            expect(git.KEY_GIT_BRANCH).toBe('git.branch');
            expect(git.KEY_GIT_BUILD_HOST).toBe('git.build.host');
            expect(git.KEY_GIT_BUILD_VERSION).toBe('git.build.version');
            expect(git.KEY_GIT_COMMIT_ID).toBe('git.commit.id.full');
            expect(git.KEY_GIT_COMMIT_ID_ABBREVIATED).toBe('git.commit.id.abbrev');
            expect(git.KEY_GIT_DIRTY).toBe('git.dirty');
            expect(git.KEY_GIT_REMOTE_ORIGIN_URL).toBe('git.remote.origin.url');
            expect(git.KEY_GIT_TAGS).toBe('git.tags');
            expect(git.KEY_GIT_TOTAL_COMMIT_COUNT).toBe('git.total.commit.count');
            expect(git.KEY_GIT_COMMIT_TIME_ISO).toBe('git.commit.time_iso');
            expect(git.KEY_GIT_COMMIT_TIME_EPOCH).toBe('git.commit.time_epoch');
        });
    });

    describe('ISO & Epoch Commit Timestamps', () => {
        it('dateOfLastCommitIso() returns valid ISO-8601 string', () => {
            const iso = git.dateOfLastCommitIso();
            expect(typeof iso).toBe('string');
            expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        });

        it('dateOfLastCommitIsoAsync() returns valid ISO-8601 string', async () => {
            const iso = await git.dateOfLastCommitIsoAsync();
            expect(typeof iso).toBe('string');
            expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        });

        it('dateOfLastCommitEpoch() returns a valid unix epoch timestamp number', () => {
            const epoch = git.dateOfLastCommitEpoch();
            expect(typeof epoch).toBe('number');
            expect(epoch).toBeGreaterThan(0);
        });

        it('dateOfLastCommitEpochAsync() returns a valid unix epoch timestamp number', async () => {
            const epoch = await git.dateOfLastCommitEpochAsync();
            expect(typeof epoch).toBe('number');
            expect(epoch).toBeGreaterThan(0);
        });

        it('getGitProp and gitInfoAsJson include ISO and Epoch time properties', () => {
            const flat = git.getGitProp();
            expect(flat['git.commit.time_iso']).toBeDefined();
            expect(typeof flat['git.commit.time_iso']).toBe('string');
            expect(typeof flat['git.commit.time_epoch']).toBe('number');

            const json = git.gitInfoAsJson(undefined, true);
            expect(json.git.commit.time_iso).toBeDefined();
            expect(typeof json.git.commit.time_epoch).toBe('number');
        });

        it('getGitPropAsync and gitInfoAsJsonAsync include ISO and Epoch time properties', async () => {
            const flat = await git.getGitPropAsync();
            expect(flat['git.commit.time_iso']).toBeDefined();
            expect(typeof flat['git.commit.time_iso']).toBe('string');
            expect(typeof flat['git.commit.time_epoch']).toBe('number');

            const json = await git.gitInfoAsJsonAsync(undefined, true);
            expect(json.git.commit.time_iso).toBeDefined();
            expect(typeof json.git.commit.time_epoch).toBe('number');
        });
    });

    describe('Expanded Universal CI/CD Provider Fallbacks', () => {
        const nonGitDir = path.join(os.tmpdir(), 'non-git-provider-test-' + Date.now());

        beforeAll(() => {
            fs.mkdirSync(nonGitDir, { recursive: true });
        });

        afterAll(() => {
            fs.rmSync(nonGitDir, { recursive: true, force: true });
        });

        it('falls back to Azure DevOps variables in gitless environments', () => {
            const origSha = process.env.BUILD_SOURCEVERSION;
            const origBranch = process.env.BUILD_SOURCEBRANCHNAME;
            const origUri = process.env.BUILD_REPOSITORY_URI;
            const origUser = process.env.BUILD_REQUESTEDFOR;
            try {
                process.env.BUILD_SOURCEVERSION = 'azure1234567890abcdef1234567890abcdef12';
                process.env.BUILD_SOURCEBRANCHNAME = 'release/azure';
                process.env.BUILD_REPOSITORY_URI = 'https://dev.azure.com/org/project/_git/repo';
                process.env.BUILD_REQUESTEDFOR = 'Azure Pipeline User';

                expect(git.commitIdFull(nonGitDir)).toBe('azure1234567890abcdef1234567890abcdef12');
                expect(git.currentBranch(nonGitDir)).toBe('release/azure');
                expect(git.remoteUrl(nonGitDir)).toBe('https://dev.azure.com/org/project/_git/repo');
                expect(git.commitUserInfo(false, nonGitDir)).toBe('Azure Pipeline User');
            } finally {
                if (origSha !== undefined) process.env.BUILD_SOURCEVERSION = origSha; else delete process.env.BUILD_SOURCEVERSION;
                if (origBranch !== undefined) process.env.BUILD_SOURCEBRANCHNAME = origBranch; else delete process.env.BUILD_SOURCEBRANCHNAME;
                if (origUri !== undefined) process.env.BUILD_REPOSITORY_URI = origUri; else delete process.env.BUILD_REPOSITORY_URI;
                if (origUser !== undefined) process.env.BUILD_REQUESTEDFOR = origUser; else delete process.env.BUILD_REQUESTEDFOR;
            }
        });

        it('falls back to CircleCI variables in gitless environments', () => {
            const origSha = process.env.CIRCLE_SHA1;
            const origBranch = process.env.CIRCLE_BRANCH;
            const origUri = process.env.CIRCLE_REPOSITORY_URL;
            const origUser = process.env.CIRCLE_USERNAME;
            try {
                process.env.CIRCLE_SHA1 = 'circle1234567890abcdef1234567890abcdef12';
                process.env.CIRCLE_BRANCH = 'feature/circleci';
                process.env.CIRCLE_REPOSITORY_URL = 'git@github.com:org/circle-repo.git';
                process.env.CIRCLE_USERNAME = 'circleci-runner';

                expect(git.commitIdFull(nonGitDir)).toBe('circle1234567890abcdef1234567890abcdef12');
                expect(git.currentBranch(nonGitDir)).toBe('feature/circleci');
                expect(git.remoteUrl(nonGitDir)).toBe('git@github.com:org/circle-repo.git');
                expect(git.commitUserInfo(false, nonGitDir)).toBe('circleci-runner');
            } finally {
                if (origSha !== undefined) process.env.CIRCLE_SHA1 = origSha; else delete process.env.CIRCLE_SHA1;
                if (origBranch !== undefined) process.env.CIRCLE_BRANCH = origBranch; else delete process.env.CIRCLE_BRANCH;
                if (origUri !== undefined) process.env.CIRCLE_REPOSITORY_URL = origUri; else delete process.env.CIRCLE_REPOSITORY_URL;
                if (origUser !== undefined) process.env.CIRCLE_USERNAME = origUser; else delete process.env.CIRCLE_USERNAME;
            }
        });

        it('falls back to Netlify and Cloudflare Pages variables in gitless environments', () => {
            const origNetlifyCommit = process.env.COMMIT_REF;
            const origCfSha = process.env.CF_PAGES_COMMIT_SHA;
            const origCfBranch = process.env.CF_PAGES_BRANCH;
            try {
                process.env.COMMIT_REF = 'netlify1234567890abcdef1234567890abcdef';
                expect(git.commitIdFull(nonGitDir)).toBe('netlify1234567890abcdef1234567890abcdef');
                delete process.env.COMMIT_REF;

                process.env.CF_PAGES_COMMIT_SHA = 'cfpages1234567890abcdef1234567890abcdef';
                process.env.CF_PAGES_BRANCH = 'cloudflare-prod';
                expect(git.commitIdFull(nonGitDir)).toBe('cfpages1234567890abcdef1234567890abcdef');
                expect(git.currentBranch(nonGitDir)).toBe('cloudflare-prod');
            } finally {
                if (origNetlifyCommit !== undefined) process.env.COMMIT_REF = origNetlifyCommit; else delete process.env.COMMIT_REF;
                if (origCfSha !== undefined) process.env.CF_PAGES_COMMIT_SHA = origCfSha; else delete process.env.CF_PAGES_COMMIT_SHA;
                if (origCfBranch !== undefined) process.env.CF_PAGES_BRANCH = origCfBranch; else delete process.env.CF_PAGES_BRANCH;
            }
        });

        it('falls back to AWS CodeBuild variables in gitless environments', () => {
            const origSha = process.env.CODEBUILD_RESOLVED_SOURCE_VERSION;
            const origUrl = process.env.CODEBUILD_SOURCE_REPO_URL;
            try {
                process.env.CODEBUILD_RESOLVED_SOURCE_VERSION = 'codebuild1234567890abcdef1234567890abcd';
                process.env.CODEBUILD_SOURCE_REPO_URL = 'https://git-codecommit.us-east-1.amazonaws.com/v1/repos/my-repo';
                expect(git.commitIdFull(nonGitDir)).toBe('codebuild1234567890abcdef1234567890abcd');
                expect(git.remoteUrl(nonGitDir)).toBe('https://git-codecommit.us-east-1.amazonaws.com/v1/repos/my-repo');
            } finally {
                if (origSha !== undefined) process.env.CODEBUILD_RESOLVED_SOURCE_VERSION = origSha; else delete process.env.CODEBUILD_RESOLVED_SOURCE_VERSION;
                if (origUrl !== undefined) process.env.CODEBUILD_SOURCE_REPO_URL = origUrl; else delete process.env.CODEBUILD_SOURCE_REPO_URL;
            }
        });
    });

    describe('In-Memory Caching', () => {
        beforeEach(() => {
            git.clearGitPropCache();
        });

        it('getGitPropCached caches results and returns identical data', () => {
            const first = git.getGitPropCached();
            const second = git.getGitPropCached();
            expect(first).toEqual(second);
        });

        it('getGitPropCached respects customGitProp override on cached data', () => {
            const custom = { 'git.build.user.name': 'CachedBuilder' };
            const res = git.getGitPropCached({ customGitProp: custom });
            expect(res['git.build.user.name']).toBe('CachedBuilder');
        });

        it('getGitPropCachedAsync returns cached results asynchronously', async () => {
            const first = await git.getGitPropCachedAsync();
            const second = await git.getGitPropCachedAsync();
            expect(first).toEqual(second);
        });

        it('clearGitPropCache empties the cache', () => {
            git.getGitPropCached();
            git.clearGitPropCache();
            const fresh = git.getGitPropCached();
            expect(fresh['git.branch']).toBeDefined();
        });
    });

    describe('Zero-Dependency Web Framework Middleware', () => {
        it('gitPropertiesMiddleware handles request and sends JSON by default', () => {
            const middleware = git.gitPropertiesMiddleware();
            let headers: Record<string, string> = {};
            let body = '';
            const req = { url: '/info' };
            const res = {
                setHeader: (k: string, v: string) => { headers[k] = v; },
                end: (content: string) => { body = content; }
            };

            middleware(req, res);
            expect(headers['Content-Type']).toBe('application/json; charset=utf-8');
            const parsed = JSON.parse(body);
            expect(parsed.git.branch).toBe(git.currentBranch());
        });

        it('gitPropertiesMiddleware passes through on non-matching path', () => {
            const middleware = git.gitPropertiesMiddleware({ path: '/actuator/info' });
            let nextCalled = false;
            const req = { url: '/other-route' };
            const res = { setHeader: () => {}, end: () => {} };

            middleware(req, res, () => { nextCalled = true; });
            expect(nextCalled).toBe(true);
        });

        it('gitPropertiesMiddleware supports properties format', () => {
            const middleware = git.gitPropertiesMiddleware({ format: 'properties' });
            let headers: Record<string, string> = {};
            let body = '';
            const req = { url: '/' };
            const res = {
                setHeader: (k: string, v: string) => { headers[k] = v; },
                end: (content: string) => { body = content; }
            };

            middleware(req, res);
            expect(headers['Content-Type']).toBe('text/plain; charset=utf-8');
            expect(body).toContain('git.branch=');
        });

        it('gitPropertiesMiddleware supports flat-json format', () => {
            const middleware = git.gitPropertiesMiddleware({ format: 'flat-json' });
            let headers: Record<string, string> = {};
            let body = '';
            const req = { url: '/' };
            const res = {
                setHeader: (k: string, v: string) => { headers[k] = v; },
                end: (content: string) => { body = content; }
            };

            middleware(req, res);
            expect(headers['Content-Type']).toBe('application/json; charset=utf-8');
            const parsed = JSON.parse(body);
            expect(parsed['git.branch']).toBe(git.currentBranch());
        });
    });

    describe('Extended CLI Options', () => {
        it('runCli supports short options -h and -v', () => {
            const hRes = runCli(['-h'], { log: () => {} });
            expect(hRes.exitCode).toBe(0);
            expect(hRes.output).toContain('Usage:');

            const vRes = runCli(['-v'], { log: () => {} });
            expect(vRes.exitCode).toBe(0);
            expect(vRes.output).toBe(git.buildVersion());
        });

        it('runCli supports explicit directory parameter with -d', () => {
            const logs: string[] = [];
            const res = runCli(['-d', process.cwd(), '--print'], { log: (msg) => logs.push(msg) });
            expect(res.exitCode).toBe(0);
            const parsed = JSON.parse(res.output!);
            expect(parsed.git.branch).toBe(git.currentBranch());
        });

        it('runCli creates properties file with -f properties', () => {
            const outputFile = 'test-cli-run.properties';
            const res = runCli(['-o', outputFile, '-f', 'properties'], { log: () => {} });
            expect(res.exitCode).toBe(0);
            expect(fs.existsSync(outputFile)).toBe(true);
            const content = fs.readFileSync(outputFile, 'utf8');
            expect(content).toContain('git.branch=');
            fs.unlinkSync(outputFile);
        });

        it('runCli supports -q / --silent to suppress console logging', () => {
            const outputFile = 'test-silent.json';
            const logs: string[] = [];
            const res = runCli(['-o', outputFile, '--silent'], { log: (msg) => logs.push(msg) });
            expect(res.exitCode).toBe(0);
            expect(logs.length).toBe(0);
            expect(fs.existsSync(outputFile)).toBe(true);
            fs.unlinkSync(outputFile);
        });

        it('runCli supports -c / --custom to inject custom property values', () => {
            const logs: string[] = [];
            const res = runCli(['--print', '-c', 'git.build.user.name=CustomCLIUser', '-c', 'custom.tag=v1.2.3'], { log: (msg) => logs.push(msg) });
            expect(res.exitCode).toBe(0);
            const parsed = JSON.parse(res.output!);
            expect(parsed.git.build.user.name).toBe('CustomCLIUser');
            expect(parsed.custom.tag).toBe('v1.2.3');
        });

        it('runCli returns error when --custom lacks an equal sign', () => {
            const errors: string[] = [];
            const res = runCli(['--custom', 'invalidformat'], { error: (msg) => errors.push(msg) });
            expect(res.exitCode).toBe(1);
            expect(errors[0]).toContain("Option '--custom' must be formatted as key=value");
        });

        it('runCli supports --fail-on-dirty flag', () => {
            const dirty = git.isDirty();
            const errors: string[] = [];
            const res = runCli(['--fail-on-dirty', '--print'], { error: (msg) => errors.push(msg), log: () => {} });
            if (dirty) {
                expect(res.exitCode).toBe(1);
                expect(errors[0]).toContain('--fail-on-dirty');
            } else {
                expect(res.exitCode).toBe(0);
            }
        });
    });
});
