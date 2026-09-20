import * as git from '../src/index';
import * as fs from 'fs';

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
});
