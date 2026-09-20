'use strict';

import * as childProcessLib from 'child_process';
import * as fs from 'fs';
import * as pathLib from 'path';
import * as os from 'os';

const pathSeparator: string = pathLib.sep;
const refBranch: RegExp = /^ref: refs\/heads\/(.*)\n?/;
const currentRepoName: string = 'NPM-GIT-PROPERTIES';
const detachedAtHeadPrefix: string = 'Detached At Head: ';

import {
    KEY_GIT_BRANCH,
    KEY_GIT_BUILD_HOST,
    KEY_GIT_BUILD_VERSION,
    KEY_GIT_BUILD_USER_NAME,
    KEY_GIT_BUILD_USER_EMAIL,
    KEY_GIT_COMMIT_ID_ABBREVIATED,
    KEY_GIT_COMMIT_ID_DESCRIBE,
    KEY_GIT_COMMIT_ID,
    KEY_GIT_COMMIT_SHORT_MESSAGE,
    KEY_GIT_COMMIT_FULL_MESSAGE,
    KEY_GIT_COMMIT_USER_NAME,
    KEY_GIT_COMMIT_USER_EMAIL,
    KEY_GIT_COMMIT_TIME,
    KEY_GIT_DIRTY,
    KEY_GIT_REMOTE_ORIGIN_URL,
    KEY_GIT_TAGS,
    KEY_GIT_CLOSEST_TAG_NAME,
    KEY_GIT_CLOSEST_TAG_COMMIT_COUNT,
    KEY_GIT_TOTAL_COMMIT_COUNT,
} from './constants';

const defaultFileName: string = 'gitDetails.json';

export interface GitProperties {
    git: {
        branch: string;
        build: {
            host: string;
            version: string;
            user: {
                name: string;
                email: string;
            };
        };
        commit: {
            id: {
                abbrev: string;
                describe: string;
                full: string;
            };
            message: {
                short: string;
                full: string;
            };
            user: {
                name: string;
                email: string;
            };
            time: string;
        };
        dirty: boolean;
        remote: {
            origin: {
                url: string;
            };
        };
        tags: string;
        closest: {
            tag: {
                name: string;
                commit: {
                    count: string | number;
                };
            };
        };
        total: {
            commit: {
                count: number;
            };
        };
        [key: string]: any;
    };
    [key: string]: any;
}

export type GitPropertiesFlat = Record<string, any>;

export interface GitInfoOptions {
    customGitProp?: Record<string, any> | Map<string, any>;
    format?: 'json' | 'flat-json' | 'properties';
    dir?: string;
}

const _exeCmd = (cmd: string, args: string[], cwd?: string): string => {
    try {
        const result = childProcessLib.spawnSync(cmd, args, {
            cwd: cwd || process.cwd(),
            encoding: 'utf8'
        });
        if (result.error) {
            return `${currentRepoName} has failed to execute command: ${result.error.message}`;
        }
        if (result.status !== 0) {
            const errorDetails = result.stderr || result.stdout;
            return `${currentRepoName} has failed to execute command: ${errorDetails ? errorDetails.trim() : ''}`;
        }
        return (result.stdout || '').trim();
    } catch (err: any) {
        return `${currentRepoName} has failed to execute command: ${err.message || String(err)}`;
    }
};

const _exeCmdAsync = (cmd: string, args: string[], cwd?: string): Promise<string> => {
    return new Promise((resolve) => {
        childProcessLib.execFile(cmd, args, {
            cwd: cwd || process.cwd(),
            encoding: 'utf8'
        }, (error, stdout, stderr) => {
            if (error) {
                const errorDetails = stderr || stdout || error.message;
                resolve(`${currentRepoName} has failed to execute command: ${(errorDetails || '').trim()}`);
            } else {
                resolve((stdout || '').trim());
            }
        });
    });
};

const _getGitDir = (dirPath?: string | string[]): string => {
    if (dirPath === undefined || dirPath === null) {
        dirPath = process.cwd();
    }
    if (typeof dirPath === 'string') {
        dirPath = dirPath.split(pathSeparator);
    }
    const gitRepoPath: string = (dirPath as string[]).join(pathSeparator);
    let testPath: string = gitRepoPath;
    if (!testPath.length) {
        throw new Error('Current directory is not a git repository');
    }
    testPath = pathLib.resolve(testPath, '.git');
    if (fs.existsSync(testPath)) {
        if (!fs.statSync(testPath).isDirectory()) {
            let parentRepoPath: string = fs.readFileSync(testPath, 'utf8').trim().split(' ').pop() as string;
            if (!pathLib.isAbsolute(parentRepoPath)) {
                parentRepoPath = pathLib.resolve(gitRepoPath, parentRepoPath);
            }
            if (fs.existsSync(parentRepoPath)) {
                return pathLib.resolve(parentRepoPath);
            }
            throw new Error(currentRepoName + ' could not find repository from path ' + parentRepoPath);
        }
        return testPath;
    }
    (dirPath as string[]).pop();
    return _getGitDir(dirPath);
};

const _getEnvFallback = {
    branch: (): string | undefined => {
        return process.env.GIT_BRANCH ||
               process.env.GITHUB_REF_NAME ||
               process.env.CI_COMMIT_REF_NAME ||
               process.env.VERCEL_GIT_COMMIT_REF ||
               process.env.HEAD;
    },
    commitId: (): string | undefined => {
        return process.env.GIT_COMMIT ||
               process.env.GITHUB_SHA ||
               process.env.CI_COMMIT_SHA ||
               process.env.VERCEL_GIT_COMMIT_SHA;
    },
    remoteUrl: (): string | undefined => {
        if (process.env.GIT_URL) return process.env.GIT_URL;
        if (process.env.GITHUB_REPOSITORY) return `https://github.com/${process.env.GITHUB_REPOSITORY}`;
        if (process.env.CI_REPOSITORY_URL) return process.env.CI_REPOSITORY_URL;
        return undefined;
    },
    commitMessage: (short?: boolean): string | undefined => {
        const msg = process.env.CI_COMMIT_MESSAGE || process.env.VERCEL_GIT_COMMIT_MESSAGE;
        if (!msg) return undefined;
        return short ? msg.split('\n')[0] : msg;
    },
    commitUser: (email?: boolean): string | undefined => {
        if (email) {
            return process.env.GIT_AUTHOR_EMAIL || process.env.CI_COMMIT_AUTHOR_EMAIL;
        }
        return process.env.GIT_AUTHOR_NAME || process.env.GITHUB_ACTOR || process.env.CI_COMMIT_AUTHOR;
    }
};

const normalizeCustomPropMap = (customGitProp?: Record<string, any> | Map<string, any>): Record<string, any> | undefined => {
    if (!customGitProp) return undefined;
    if (customGitProp instanceof Map) {
        const obj: Record<string, any> = {};
        for (const [k, v] of customGitProp.entries()) {
            obj[k] = v;
        }
        return obj;
    }
    return customGitProp;
};

export const currentBranch = (dir?: string): string => {
    try {
        const gitDir: string = _getGitDir(dir);
        const head: string = fs.readFileSync(pathLib.resolve(gitDir, 'HEAD'), 'utf8');
        const b: RegExpMatchArray | null = head.match(refBranch);
        if (b) {
            return b[1].trim();
        } else {
            return detachedAtHeadPrefix + head.trim();
        }
    } catch (err) {
        const envBranch = _getEnvFallback.branch();
        if (envBranch) return envBranch;
        throw err;
    }
};

export const buildHost = (): string => {
    return os.hostname();
};

export const buildVersion = (): string => {
    const packageJsonPath: string = pathLib.join(__dirname, '..', 'package.json');
    try {
        const data: string = fs.readFileSync(packageJsonPath, 'utf8');
        const packageJson: any = JSON.parse(data);
        return packageJson.version;
    } catch (error) {
        return currentRepoName + ' could not read or parse package.json and error is: ' + error;
    }
};

const buildUserName = (): string => {
    return currentRepoName + ' could not determine this property, please pass this info via custom property map with key ' + KEY_GIT_BUILD_USER_NAME;
};

const buildUserEmail = (): string => {
    return currentRepoName + ' could not determine this property, please pass this info via custom property map with key ' + KEY_GIT_BUILD_USER_EMAIL;
};

export const commitIdAbbrev = (): string => {
    const res = _exeCmd('git', ['rev-parse', '--short', 'HEAD']);
    if (res.startsWith(currentRepoName)) {
        const envId = _getEnvFallback.commitId();
        if (envId) return envId.substring(0, 7);
    }
    return res;
};

export const commitIdAbbrevAsync = async (): Promise<string> => {
    const res = await _exeCmdAsync('git', ['rev-parse', '--short', 'HEAD']);
    if (res.startsWith(currentRepoName)) {
        const envId = _getEnvFallback.commitId();
        if (envId) return envId.substring(0, 7);
    }
    return res;
};

export const commitIdFull = (): string => {
    const res = _exeCmd('git', ['rev-parse', 'HEAD']);
    if (res.startsWith(currentRepoName)) {
        const envId = _getEnvFallback.commitId();
        if (envId) return envId;
    }
    return res;
};

export const commitIdFullAsync = async (): Promise<string> => {
    const res = await _exeCmdAsync('git', ['rev-parse', 'HEAD']);
    if (res.startsWith(currentRepoName)) {
        const envId = _getEnvFallback.commitId();
        if (envId) return envId;
    }
    return res;
};

export const lastCommitMsg = (short?: boolean): string => {
    const prettyArg: string = short ? '--pretty=%s' : '--pretty=%B';
    const res = _exeCmd('git', ['log', '-1', prettyArg]);
    if (res.startsWith(currentRepoName)) {
        const envMsg = _getEnvFallback.commitMessage(short);
        if (envMsg) return envMsg;
    }
    return res;
};

export const lastCommitMsgAsync = async (short?: boolean): Promise<string> => {
    const prettyArg: string = short ? '--pretty=%s' : '--pretty=%B';
    const res = await _exeCmdAsync('git', ['log', '-1', prettyArg]);
    if (res.startsWith(currentRepoName)) {
        const envMsg = _getEnvFallback.commitMessage(short);
        if (envMsg) return envMsg;
    }
    return res;
};

export const commitUserInfo = (email?: boolean): string => {
    const prettyArg: string = email ? '--pretty=format:%ae' : '--pretty=format:%an';
    const res = _exeCmd('git', ['log', '-1', prettyArg]);
    if (res.startsWith(currentRepoName)) {
        const envUser = _getEnvFallback.commitUser(email);
        if (envUser) return envUser;
    }
    return res;
};

export const commitUserInfoAsync = async (email?: boolean): Promise<string> => {
    const prettyArg: string = email ? '--pretty=format:%ae' : '--pretty=format:%an';
    const res = await _exeCmdAsync('git', ['log', '-1', prettyArg]);
    if (res.startsWith(currentRepoName)) {
        const envUser = _getEnvFallback.commitUser(email);
        if (envUser) return envUser;
    }
    return res;
};

export const dateOfLastCommit = (): string => {
    const res = _exeCmd('git', ['log', '--no-color', '-n', '1', '--pretty=format:%ad']);
    if (res.startsWith(currentRepoName)) {
        return new Date().toString();
    }
    const d = new Date(res);
    return isNaN(d.getTime()) ? res : d.toString();
};

export const dateOfLastCommitAsync = async (): Promise<string> => {
    const res = await _exeCmdAsync('git', ['log', '--no-color', '-n', '1', '--pretty=format:%ad']);
    if (res.startsWith(currentRepoName)) {
        return new Date().toString();
    }
    const d = new Date(res);
    return isNaN(d.getTime()) ? res : d.toString();
};

export const isDirty = (): boolean => {
    return _exeCmd('git', ['diff-index', 'HEAD', '--']).length > 0;
};

export const isDirtyAsync = async (): Promise<boolean> => {
    const res = await _exeCmdAsync('git', ['diff-index', 'HEAD', '--']);
    return res.length > 0;
};

export const remoteUrl = (): string => {
    const res = _exeCmd('git', ['ls-remote', '--get-url']);
    if (res.startsWith(currentRepoName)) {
        const envUrl = _getEnvFallback.remoteUrl();
        if (envUrl) return envUrl;
    }
    return res;
};

export const remoteUrlAsync = async (): Promise<string> => {
    const res = await _exeCmdAsync('git', ['ls-remote', '--get-url']);
    if (res.startsWith(currentRepoName)) {
        const envUrl = _getEnvFallback.remoteUrl();
        if (envUrl) return envUrl;
    }
    return res;
};

export const commitIdDescAndTags = (flagDirty?: boolean): string => {
    const cmdArgs: string[] = flagDirty ? ['describe', '--tags'] : ['describe', '--tag', '--abbrev=0'];
    const cmdResult: string = _exeCmd('git', cmdArgs);
    return (!cmdResult.startsWith(currentRepoName) && flagDirty) ? cmdResult + "-dirty" : cmdResult;
};

export const commitIdDescAndTagsAsync = async (flagDirty?: boolean): Promise<string> => {
    const cmdArgs: string[] = flagDirty ? ['describe', '--tags'] : ['describe', '--tag', '--abbrev=0'];
    const cmdResult: string = await _exeCmdAsync('git', cmdArgs);
    return (!cmdResult.startsWith(currentRepoName) && flagDirty) ? cmdResult + "-dirty" : cmdResult;
};

export const closestTagCommitCount = (): string => {
    const tagName: string = commitIdDescAndTags();
    if (tagName.startsWith(currentRepoName) || !tagName) {
        return tagName;
    }
    return _exeCmd('git', ['rev-list', '--count', tagName]);
};

export const closestTagCommitCountAsync = async (): Promise<string> => {
    const tagName: string = await commitIdDescAndTagsAsync();
    if (tagName.startsWith(currentRepoName) || !tagName) {
        return tagName;
    }
    return _exeCmdAsync('git', ['rev-list', '--count', tagName]);
};

export const countOfAllCommits = (): number => {
    const result = _exeCmd('git', ['rev-list', '--all', '--count']);
    const count = parseInt(result, 10);
    return isNaN(count) ? 0 : count;
};

export const countOfAllCommitsAsync = async (): Promise<number> => {
    const result = await _exeCmdAsync('git', ['rev-list', '--all', '--count']);
    const count = parseInt(result, 10);
    return isNaN(count) ? 0 : count;
};

const deepMerge = (target: any, ...sources: any[]): any => {
    for (const source of sources) {
        for (const key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
                if (source[key] instanceof Object && target.hasOwnProperty(key) && target[key] instanceof Object) {
                    deepMerge(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        }
    }
    return target;
};

const prepareObject = (key: string, value: any): any => {
    let jsonObject: any = {};
    const firstDotIndex: number = key.indexOf('.');
    if (firstDotIndex > -1) {
        const firstKey: string = key.substring(0, firstDotIndex);
        const nestedKey: string = key.substring(firstDotIndex + 1);
        jsonObject[firstKey] = prepareObject(nestedKey, value);
    } else {
        jsonObject[key] = value;
    }
    return jsonObject;
};

const castObjectToNestedObject = (obj: { [key: string]: any }): any => {
    let jsonObject: any = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const result: any = prepareObject(key, obj[key]);
            jsonObject = deepMerge({}, jsonObject, result);
        }
    }
    return jsonObject;
};

const getGitProp = (customGitProp?: Record<string, any> | Map<string, any>): Record<string, any> => {
    const normalizedProps = normalizeCustomPropMap(customGitProp);
    const gitProp: Record<string, any> = {
        [KEY_GIT_BRANCH]: currentBranch(),
        [KEY_GIT_BUILD_HOST]: buildHost(),
        [KEY_GIT_BUILD_VERSION]: buildVersion(),
        [KEY_GIT_BUILD_USER_NAME]: buildUserName(),
        [KEY_GIT_BUILD_USER_EMAIL]: buildUserEmail(),
        [KEY_GIT_COMMIT_ID_ABBREVIATED]: commitIdAbbrev(),
        [KEY_GIT_COMMIT_ID_DESCRIBE]: commitIdDescAndTags(true),
        [KEY_GIT_COMMIT_ID]: commitIdFull(),
        [KEY_GIT_COMMIT_SHORT_MESSAGE]: lastCommitMsg(true),
        [KEY_GIT_COMMIT_FULL_MESSAGE]: lastCommitMsg(),
        [KEY_GIT_COMMIT_USER_NAME]: commitUserInfo(),
        [KEY_GIT_COMMIT_USER_EMAIL]: commitUserInfo(true),
        [KEY_GIT_COMMIT_TIME]: dateOfLastCommit(),
        [KEY_GIT_DIRTY]: isDirty(),
        [KEY_GIT_REMOTE_ORIGIN_URL]: remoteUrl(),
        [KEY_GIT_TAGS]: commitIdDescAndTags(),
        [KEY_GIT_CLOSEST_TAG_NAME]: commitIdDescAndTags(),
        [KEY_GIT_CLOSEST_TAG_COMMIT_COUNT]: closestTagCommitCount(),
        [KEY_GIT_TOTAL_COMMIT_COUNT]: countOfAllCommits(),
    };
    return normalizedProps ? { ...gitProp, ...normalizedProps } : gitProp;
};

export const getGitPropAsync = async (customGitProp?: Record<string, any> | Map<string, any>): Promise<Record<string, any>> => {
    const normalizedProps = normalizeCustomPropMap(customGitProp);
    const [
        branch,
        commitAbbrev,
        commitDesc,
        commitFull,
        shortMsg,
        fullMsg,
        userName,
        userEmail,
        commitTime,
        dirty,
        remote,
        tags,
        closestTagName,
        closestCount,
        totalCount
    ] = await Promise.all([
        Promise.resolve().then(() => currentBranch()),
        commitIdAbbrevAsync(),
        commitIdDescAndTagsAsync(true),
        commitIdFullAsync(),
        lastCommitMsgAsync(true),
        lastCommitMsgAsync(),
        commitUserInfoAsync(),
        commitUserInfoAsync(true),
        dateOfLastCommitAsync(),
        isDirtyAsync(),
        remoteUrlAsync(),
        commitIdDescAndTagsAsync(),
        commitIdDescAndTagsAsync(),
        closestTagCommitCountAsync(),
        countOfAllCommitsAsync()
    ]);

    const gitProp: Record<string, any> = {
        [KEY_GIT_BRANCH]: branch,
        [KEY_GIT_BUILD_HOST]: buildHost(),
        [KEY_GIT_BUILD_VERSION]: buildVersion(),
        [KEY_GIT_BUILD_USER_NAME]: buildUserName(),
        [KEY_GIT_BUILD_USER_EMAIL]: buildUserEmail(),
        [KEY_GIT_COMMIT_ID_ABBREVIATED]: commitAbbrev,
        [KEY_GIT_COMMIT_ID_DESCRIBE]: commitDesc,
        [KEY_GIT_COMMIT_ID]: commitFull,
        [KEY_GIT_COMMIT_SHORT_MESSAGE]: shortMsg,
        [KEY_GIT_COMMIT_FULL_MESSAGE]: fullMsg,
        [KEY_GIT_COMMIT_USER_NAME]: userName,
        [KEY_GIT_COMMIT_USER_EMAIL]: userEmail,
        [KEY_GIT_COMMIT_TIME]: commitTime,
        [KEY_GIT_DIRTY]: dirty,
        [KEY_GIT_REMOTE_ORIGIN_URL]: remote,
        [KEY_GIT_TAGS]: tags,
        [KEY_GIT_CLOSEST_TAG_NAME]: closestTagName,
        [KEY_GIT_CLOSEST_TAG_COMMIT_COUNT]: closestCount,
        [KEY_GIT_TOTAL_COMMIT_COUNT]: totalCount,
    };
    return normalizedProps ? { ...gitProp, ...normalizedProps } : gitProp;
};

export const gitInfoAsProperties = (customGitPropMap?: Record<string, any> | Map<string, any>): string => {
    const finalGitProp = getGitProp(customGitPropMap);
    const lines: string[] = [];
    for (const key of Object.keys(finalGitProp).sort()) {
        const val = finalGitProp[key];
        lines.push(`${key}=${val !== undefined && val !== null ? val : ''}`);
    }
    return lines.join('\n') + '\n';
};

export const gitInfoAsPropertiesAsync = async (customGitPropMap?: Record<string, any> | Map<string, any>): Promise<string> => {
    const finalGitProp = await getGitPropAsync(customGitPropMap);
    const lines: string[] = [];
    for (const key of Object.keys(finalGitProp).sort()) {
        const val = finalGitProp[key];
        lines.push(`${key}=${val !== undefined && val !== null ? val : ''}`);
    }
    return lines.join('\n') + '\n';
};

export const gitInfoAsJson = (customGitPropMap?: Record<string, any> | Map<string, any>, requireObject?: boolean): any => {
    const finalGitProp: Record<string, any> = getGitProp(customGitPropMap);
    const gitInfoObject: any = castObjectToNestedObject(finalGitProp);
    return requireObject ? gitInfoObject : JSON.stringify(gitInfoObject, null, 2);
};

export const gitInfoAsJsonAsync = async (customGitPropMap?: Record<string, any> | Map<string, any>, requireObject?: boolean): Promise<any> => {
    const finalGitProp: Record<string, any> = await getGitPropAsync(customGitPropMap);
    const gitInfoObject: any = castObjectToNestedObject(finalGitProp);
    return requireObject ? gitInfoObject : JSON.stringify(gitInfoObject, null, 2);
};

export const createGitInfoFile = (
    customGitPropMap?: Record<string, any> | Map<string, any>,
    fileName?: string,
    format?: 'json' | 'flat-json' | 'properties'
): boolean => {
    const targetFile = fileName || defaultFileName;
    const isProps = format === 'properties' || (!format && targetFile.endsWith('.properties'));
    const isFlatJson = format === 'flat-json';
    let content: string;
    if (isProps) {
        content = gitInfoAsProperties(customGitPropMap);
    } else if (isFlatJson) {
        const normalized = normalizeCustomPropMap(customGitPropMap);
        content = JSON.stringify(getGitProp(normalized), null, 2);
    } else {
        content = gitInfoAsJson(customGitPropMap, false);
    }
    try {
        if (fs.existsSync(targetFile)) {
            fs.unlinkSync(targetFile);
        }
        fs.writeFileSync(targetFile, content, 'utf8');
        return true;
    } catch (error) {
        throw new Error(currentRepoName + " has failed to create " + targetFile + " due to " + error);
    }
};

export const createGitInfoFileAsync = async (
    customGitPropMap?: Record<string, any> | Map<string, any>,
    fileName?: string,
    format?: 'json' | 'flat-json' | 'properties'
): Promise<boolean> => {
    const targetFile = fileName || defaultFileName;
    const isProps = format === 'properties' || (!format && targetFile.endsWith('.properties'));
    const isFlatJson = format === 'flat-json';
    let content: string;
    if (isProps) {
        content = await gitInfoAsPropertiesAsync(customGitPropMap);
    } else if (isFlatJson) {
        const normalized = normalizeCustomPropMap(customGitPropMap);
        const props = await getGitPropAsync(normalized);
        content = JSON.stringify(props, null, 2);
    } else {
        content = await gitInfoAsJsonAsync(customGitPropMap, false);
    }
    try {
        if (fs.existsSync(targetFile)) {
            fs.unlinkSync(targetFile);
        }
        await fs.promises.writeFile(targetFile, content, 'utf8');
        return true;
    } catch (error) {
        throw new Error(currentRepoName + " has failed to create " + targetFile + " due to " + error);
    }
};

