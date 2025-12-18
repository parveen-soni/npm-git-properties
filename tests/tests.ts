import * as git from '../src/index';

describe('npm-git-properties', () => {
    const customPropMap = new Map<string, string>();
    const userName = "App User";
    const userEmail = "appuser@app.com";

    customPropMap.set("git.build.user.name", userName);
    customPropMap.set("git.build.user.email", userEmail);

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
        const result = git.gitInfoAsJson(new Map(), true);
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

    it('createGitInfoFile creates as file as output', () => {
        const result = git.createGitInfoFile(customPropMap);
        expect(typeof result).toBe('boolean');
    });
});
