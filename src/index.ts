'use strict';

import * as childProcessLib from 'child_process';
import * as fs from 'fs';
import * as pathLib from 'path';
import * as os from 'os';

const pathSeparator: string = pathLib.sep;
const refBranch: RegExp = /^ref: refs\/heads\/(.*)\n?/;
const currentRepoName: string = 'NPM-GIT-PROPERTIES';
const detachedAtHeadPrefix: string = 'Detached At Head: ';

export * from './constants';
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
    KEY_GIT_COMMIT_TIME_ISO,
    KEY_GIT_COMMIT_TIME_EPOCH,
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
            time_iso?: string;
            time_epoch?: number;
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
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return `${currentRepoName} has failed to execute command: ${msg}`;
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
            const fileContent = fs.readFileSync(testPath, 'utf8').trim();
            const match = fileContent.match(/^gitdir:\s*(.+)$/m);
            let parentRepoPath = match ? match[1].trim() : fileContent.replace(/^gitdir:\s*/, '').trim();
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
               process.env.GITHUB_HEAD_REF ||
               process.env.GITHUB_REF_NAME ||
               process.env.CI_COMMIT_REF_NAME ||
               process.env.VERCEL_GIT_COMMIT_REF ||
               process.env.BITBUCKET_BRANCH ||
               process.env.BUILD_SOURCEBRANCHNAME ||
               (process.env.BUILD_SOURCEBRANCH ? process.env.BUILD_SOURCEBRANCH.replace(/^refs\/heads\//, '') : undefined) ||
               process.env.CIRCLE_BRANCH ||
               process.env.BRANCH ||
               process.env.CF_PAGES_BRANCH ||
               process.env.HEAD;
    },
    commitId: (): string | undefined => {
        return process.env.GIT_COMMIT ||
               process.env.GITHUB_SHA ||
               process.env.CI_COMMIT_SHA ||
               process.env.VERCEL_GIT_COMMIT_SHA ||
               process.env.BITBUCKET_COMMIT ||
               process.env.BUILD_SOURCEVERSION ||
               process.env.CIRCLE_SHA1 ||
               process.env.COMMIT_REF ||
               process.env.CF_PAGES_COMMIT_SHA ||
               process.env.CODEBUILD_RESOLVED_SOURCE_VERSION;
    },
    remoteUrl: (): string | undefined => {
        if (process.env.GIT_URL) return process.env.GIT_URL;
        if (process.env.GITHUB_REPOSITORY) return `https://github.com/${process.env.GITHUB_REPOSITORY}`;
        if (process.env.CI_REPOSITORY_URL) return process.env.CI_REPOSITORY_URL;
        if (process.env.BUILD_REPOSITORY_URI) return process.env.BUILD_REPOSITORY_URI;
        if (process.env.CIRCLE_REPOSITORY_URL) return process.env.CIRCLE_REPOSITORY_URL;
        if (process.env.REPOSITORY_URL) return process.env.REPOSITORY_URL;
        if (process.env.CF_PAGES_URL) return process.env.CF_PAGES_URL;
        if (process.env.CODEBUILD_SOURCE_REPO_URL) return process.env.CODEBUILD_SOURCE_REPO_URL;
        return undefined;
    },
    commitMessage: (short?: boolean): string | undefined => {
        const msg = process.env.CI_COMMIT_MESSAGE || process.env.VERCEL_GIT_COMMIT_MESSAGE;
        if (!msg) return undefined;
        return short ? msg.split('\n')[0] : msg;
    },
    commitUser: (email?: boolean): string | undefined => {
        if (email) {
            return process.env.GIT_AUTHOR_EMAIL ||
                   process.env.CI_COMMIT_AUTHOR_EMAIL ||
                   process.env.BUILD_REQUESTEDFOREMAIL;
        }
        return process.env.GIT_AUTHOR_NAME ||
               process.env.GITHUB_ACTOR ||
               process.env.CI_COMMIT_AUTHOR ||
               process.env.BUILD_REQUESTEDFOR ||
               process.env.CIRCLE_USERNAME;
    },
    buildUser: (email?: boolean): string | undefined => {
        if (email) {
            return process.env.GIT_AUTHOR_EMAIL ||
                   process.env.CI_COMMIT_AUTHOR_EMAIL ||
                   process.env.BUILD_REQUESTEDFOREMAIL;
        }
        return process.env.GITHUB_ACTOR ||
               process.env.CI_COMMIT_AUTHOR ||
               process.env.GIT_AUTHOR_NAME ||
               process.env.BUILD_REQUESTEDFOR ||
               process.env.CIRCLE_USERNAME;
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
            const envBranch = _getEnvFallback.branch();
            if (envBranch) return envBranch;
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

export const buildVersion = (dir?: string): string => {
    // 1. Try to find package.json in git repo root
    try {
        const gitDir = _getGitDir(dir);
        const repoRoot = pathLib.resolve(gitDir, '..');
        const repoPackageJson = pathLib.join(repoRoot, 'package.json');
        if (fs.existsSync(repoPackageJson)) {
            const data = fs.readFileSync(repoPackageJson, 'utf8');
            const parsed = JSON.parse(data);
            if (parsed.version) return parsed.version;
        }
    } catch {
        // Not in a git repo or _getGitDir failed
    }

    // 2. Try package.json in current working directory
    const cwdPackageJson = pathLib.join(process.cwd(), 'package.json');
    if (fs.existsSync(cwdPackageJson)) {
        try {
            const data = fs.readFileSync(cwdPackageJson, 'utf8');
            const parsed = JSON.parse(data);
            if (parsed.version) return parsed.version;
        } catch {
            // Ignore parse error
        }
    }

    // 3. Fallback to package.json relative to __dirname
    const localPackageJsonPath: string = pathLib.join(__dirname, '..', 'package.json');
    try {
        const data: string = fs.readFileSync(localPackageJsonPath, 'utf8');
        const packageJson = JSON.parse(data) as { version?: string };
        return packageJson.version || '';
    } catch (error) {
        return currentRepoName + ' could not read or parse package.json and error is: ' + error;
    }
};

const buildUserName = (): string => {
    const envUser = _getEnvFallback.buildUser(false);
    if (envUser) return envUser;
    return currentRepoName + ' could not determine this property, please pass this info via custom property map with key ' + KEY_GIT_BUILD_USER_NAME;
};

const buildUserEmail = (): string => {
    const envEmail = _getEnvFallback.buildUser(true);
    if (envEmail) return envEmail;
    return currentRepoName + ' could not determine this property, please pass this info via custom property map with key ' + KEY_GIT_BUILD_USER_EMAIL;
};

export const commitIdAbbrev = (dir?: string): string => {
    const res = _exeCmd('git', ['rev-parse', '--short', 'HEAD'], dir);
    if (res.startsWith(currentRepoName)) {
        const envId = _getEnvFallback.commitId();
        if (envId) return envId.substring(0, 7);
        return "";
    }
    return res;
};

export const commitIdAbbrevAsync = async (dir?: string): Promise<string> => {
    const res = await _exeCmdAsync('git', ['rev-parse', '--short', 'HEAD'], dir);
    if (res.startsWith(currentRepoName)) {
        const envId = _getEnvFallback.commitId();
        if (envId) return envId.substring(0, 7);
        return "";
    }
    return res;
};

export const commitIdFull = (dir?: string): string => {
    const res = _exeCmd('git', ['rev-parse', 'HEAD'], dir);
    if (res.startsWith(currentRepoName)) {
        const envId = _getEnvFallback.commitId();
        if (envId) return envId;
        return "";
    }
    return res;
};

export const commitIdFullAsync = async (dir?: string): Promise<string> => {
    const res = await _exeCmdAsync('git', ['rev-parse', 'HEAD'], dir);
    if (res.startsWith(currentRepoName)) {
        const envId = _getEnvFallback.commitId();
        if (envId) return envId;
        return "";
    }
    return res;
};

export const lastCommitMsg = (short?: boolean, dir?: string): string => {
    const prettyArg: string = short ? '--pretty=%s' : '--pretty=%B';
    const res = _exeCmd('git', ['log', '-1', prettyArg], dir);
    if (res.startsWith(currentRepoName)) {
        const envMsg = _getEnvFallback.commitMessage(short);
        if (envMsg) return envMsg;
        return "";
    }
    return res;
};

export const lastCommitMsgAsync = async (short?: boolean, dir?: string): Promise<string> => {
    const prettyArg: string = short ? '--pretty=%s' : '--pretty=%B';
    const res = await _exeCmdAsync('git', ['log', '-1', prettyArg], dir);
    if (res.startsWith(currentRepoName)) {
        const envMsg = _getEnvFallback.commitMessage(short);
        if (envMsg) return envMsg;
        return "";
    }
    return res;
};

export const commitUserInfo = (email?: boolean, dir?: string): string => {
    const prettyArg: string = email ? '--pretty=format:%ae' : '--pretty=format:%an';
    const res = _exeCmd('git', ['log', '-1', prettyArg], dir);
    if (res.startsWith(currentRepoName)) {
        const envUser = _getEnvFallback.commitUser(email);
        if (envUser) return envUser;
        return "";
    }
    return res;
};

export const commitUserInfoAsync = async (email?: boolean, dir?: string): Promise<string> => {
    const prettyArg: string = email ? '--pretty=format:%ae' : '--pretty=format:%an';
    const res = await _exeCmdAsync('git', ['log', '-1', prettyArg], dir);
    if (res.startsWith(currentRepoName)) {
        const envUser = _getEnvFallback.commitUser(email);
        if (envUser) return envUser;
        return "";
    }
    return res;
};

export const dateOfLastCommit = (dir?: string): string => {
    const res = _exeCmd('git', ['log', '--no-color', '-n', '1', '--pretty=format:%ad'], dir);
    if (res.startsWith(currentRepoName)) {
        return new Date().toString();
    }
    const d = new Date(res);
    return isNaN(d.getTime()) ? res : d.toString();
};

export const dateOfLastCommitAsync = async (dir?: string): Promise<string> => {
    const res = await _exeCmdAsync('git', ['log', '--no-color', '-n', '1', '--pretty=format:%ad'], dir);
    if (res.startsWith(currentRepoName)) {
        return new Date().toString();
    }
    const d = new Date(res);
    return isNaN(d.getTime()) ? res : d.toString();
};

export const dateOfLastCommitIso = (dir?: string): string => {
    const res = _exeCmd('git', ['log', '--no-color', '-n', '1', '--pretty=format:%aI'], dir);
    if (res.startsWith(currentRepoName)) {
        return new Date().toISOString();
    }
    const d = new Date(res);
    return isNaN(d.getTime()) ? res : d.toISOString();
};

export const dateOfLastCommitIsoAsync = async (dir?: string): Promise<string> => {
    const res = await _exeCmdAsync('git', ['log', '--no-color', '-n', '1', '--pretty=format:%aI'], dir);
    if (res.startsWith(currentRepoName)) {
        return new Date().toISOString();
    }
    const d = new Date(res);
    return isNaN(d.getTime()) ? res : d.toISOString();
};

export const dateOfLastCommitEpoch = (dir?: string): number => {
    const res = _exeCmd('git', ['log', '--no-color', '-n', '1', '--pretty=format:%at'], dir);
    if (res.startsWith(currentRepoName)) {
        return Math.floor(Date.now() / 1000);
    }
    const parsed = parseInt(res, 10);
    return isNaN(parsed) ? 0 : parsed;
};

export const dateOfLastCommitEpochAsync = async (dir?: string): Promise<number> => {
    const res = await _exeCmdAsync('git', ['log', '--no-color', '-n', '1', '--pretty=format:%at'], dir);
    if (res.startsWith(currentRepoName)) {
        return Math.floor(Date.now() / 1000);
    }
    const parsed = parseInt(res, 10);
    return isNaN(parsed) ? 0 : parsed;
};

export const isDirty = (dir?: string): boolean => {
    const res = _exeCmd('git', ['diff-index', 'HEAD', '--'], dir);
    if (res.startsWith(currentRepoName)) {
        return false;
    }
    return res.length > 0;
};

export const isDirtyAsync = async (dir?: string): Promise<boolean> => {
    const res = await _exeCmdAsync('git', ['diff-index', 'HEAD', '--'], dir);
    if (res.startsWith(currentRepoName)) {
        return false;
    }
    return res.length > 0;
};

export const remoteUrl = (dir?: string): string => {
    const res = _exeCmd('git', ['ls-remote', '--get-url'], dir);
    if (res.startsWith(currentRepoName)) {
        const envUrl = _getEnvFallback.remoteUrl();
        return envUrl || "";
    }
    return res;
};

export const remoteUrlAsync = async (dir?: string): Promise<string> => {
    const res = await _exeCmdAsync('git', ['ls-remote', '--get-url'], dir);
    if (res.startsWith(currentRepoName)) {
        const envUrl = _getEnvFallback.remoteUrl();
        return envUrl || "";
    }
    return res;
};

export const commitIdDescAndTags = (flagDirty?: boolean, dir?: string): string => {
    const cmdArgs: string[] = flagDirty ? ['describe', '--tags'] : ['describe', '--tag', '--abbrev=0'];
    const cmdResult: string = _exeCmd('git', cmdArgs, dir);
    if (cmdResult.startsWith(currentRepoName)) {
        return "";
    }
    return flagDirty ? cmdResult + "-dirty" : cmdResult;
};

export const commitIdDescAndTagsAsync = async (flagDirty?: boolean, dir?: string): Promise<string> => {
    const cmdArgs: string[] = flagDirty ? ['describe', '--tags'] : ['describe', '--tag', '--abbrev=0'];
    const cmdResult: string = await _exeCmdAsync('git', cmdArgs, dir);
    if (cmdResult.startsWith(currentRepoName)) {
        return "";
    }
    return flagDirty ? cmdResult + "-dirty" : cmdResult;
};

export const closestTagCommitCount = (dir?: string): string => {
    const tagName: string = commitIdDescAndTags(false, dir);
    if (tagName.startsWith(currentRepoName) || !tagName) {
        return "0";
    }
    const count = _exeCmd('git', ['rev-list', '--count', tagName], dir);
    return count.startsWith(currentRepoName) ? "0" : count;
};

export const closestTagCommitCountAsync = async (dir?: string): Promise<string> => {
    const tagName: string = await commitIdDescAndTagsAsync(false, dir);
    if (tagName.startsWith(currentRepoName) || !tagName) {
        return "0";
    }
    const count = await _exeCmdAsync('git', ['rev-list', '--count', tagName], dir);
    return count.startsWith(currentRepoName) ? "0" : count;
};

export const countOfAllCommits = (dir?: string): number => {
    const result = _exeCmd('git', ['rev-list', '--all', '--count'], dir);
    const count = parseInt(result, 10);
    return isNaN(count) ? 0 : count;
};

export const countOfAllCommitsAsync = async (dir?: string): Promise<number> => {
    const result = await _exeCmdAsync('git', ['rev-list', '--all', '--count'], dir);
    const count = parseInt(result, 10);
    return isNaN(count) ? 0 : count;
};

const deepMerge = (target: Record<string, unknown>, ...sources: Record<string, unknown>[]): Record<string, unknown> => {
    for (const source of sources) {
        if (!source || typeof source !== 'object') continue;
        for (const key of Object.keys(source)) {
            if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
                continue;
            }
            if (Object.prototype.hasOwnProperty.call(source, key)) {
                const sourceVal = source[key];
                const targetVal = target[key];
                if (
                    sourceVal &&
                    typeof sourceVal === 'object' &&
                    !Array.isArray(sourceVal) &&
                    targetVal &&
                    typeof targetVal === 'object' &&
                    !Array.isArray(targetVal)
                ) {
                    deepMerge(targetVal as Record<string, unknown>, sourceVal as Record<string, unknown>);
                } else {
                    target[key] = sourceVal;
                }
            }
        }
    }
    return target;
};

const prepareObject = (key: string, value: unknown): Record<string, unknown> => {
    const jsonObject: Record<string, unknown> = {};
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

const castObjectToNestedObject = (obj: Record<string, unknown>): Record<string, unknown> => {
    let jsonObject: Record<string, unknown> = {};
    for (const key of Object.keys(obj)) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const result = prepareObject(key, obj[key]);
            jsonObject = deepMerge({}, jsonObject, result);
        }
    }
    return jsonObject;
};

interface BatchedCommitInfo {
    commitIdFull: string;
    commitIdAbbrev: string;
    commitShortMsg: string;
    commitFullMsg: string;
    commitUserName: string;
    commitUserEmail: string;
    commitTime: string;
    commitTimeIso: string;
    commitTimeEpoch: number;
}

const _getBatchedCommitInfo = (dir?: string): BatchedCommitInfo => {
    const res = _exeCmd('git', ['log', '-1', '--format=%H%x1f%h%x1f%s%x1f%an%x1f%ae%x1f%ad%x1f%aI%x1f%at%x1f%B'], dir);
    if (!res.startsWith(currentRepoName)) {
        const parts = res.split('\x1f');
        if (parts.length >= 9) {
            const [fullHash, abbrevHash, shortMsg, authorName, authorEmail, adStr, isoStr, atStr] = parts;
            const fullMsg = parts.slice(8).join('\x1f').trim();
            const d = new Date(isoStr || adStr);
            const isValidDate = !isNaN(d.getTime());
            return {
                commitIdFull: fullHash.trim(),
                commitIdAbbrev: abbrevHash.trim(),
                commitShortMsg: shortMsg.trim(),
                commitFullMsg: fullMsg,
                commitUserName: authorName.trim(),
                commitUserEmail: authorEmail.trim(),
                commitTime: isValidDate ? d.toString() : adStr.trim(),
                commitTimeIso: isValidDate ? d.toISOString() : (isoStr ? isoStr.trim() : ''),
                commitTimeEpoch: isValidDate ? Math.floor(d.getTime() / 1000) : (parseInt(atStr, 10) || 0)
            };
        }
    }

    const commitFull = commitIdFull(dir);
    const commitAbbrev = commitIdAbbrev(dir);
    const shortMsg = lastCommitMsg(true, dir);
    const fullMsg = lastCommitMsg(false, dir);
    const authorName = commitUserInfo(false, dir);
    const authorEmail = commitUserInfo(true, dir);
    const timeStr = dateOfLastCommit(dir);
    const timeIso = dateOfLastCommitIso(dir);
    const timeEpoch = dateOfLastCommitEpoch(dir);

    return {
        commitIdFull: commitFull,
        commitIdAbbrev: commitAbbrev,
        commitShortMsg: shortMsg,
        commitFullMsg: fullMsg,
        commitUserName: authorName,
        commitUserEmail: authorEmail,
        commitTime: timeStr,
        commitTimeIso: timeIso,
        commitTimeEpoch: timeEpoch
    };
};

const _getBatchedCommitInfoAsync = async (dir?: string): Promise<BatchedCommitInfo> => {
    const res = await _exeCmdAsync('git', ['log', '-1', '--format=%H%x1f%h%x1f%s%x1f%an%x1f%ae%x1f%ad%x1f%aI%x1f%at%x1f%B'], dir);
    if (!res.startsWith(currentRepoName)) {
        const parts = res.split('\x1f');
        if (parts.length >= 9) {
            const [fullHash, abbrevHash, shortMsg, authorName, authorEmail, adStr, isoStr, atStr] = parts;
            const fullMsg = parts.slice(8).join('\x1f').trim();
            const d = new Date(isoStr || adStr);
            const isValidDate = !isNaN(d.getTime());
            return {
                commitIdFull: fullHash.trim(),
                commitIdAbbrev: abbrevHash.trim(),
                commitShortMsg: shortMsg.trim(),
                commitFullMsg: fullMsg,
                commitUserName: authorName.trim(),
                commitUserEmail: authorEmail.trim(),
                commitTime: isValidDate ? d.toString() : adStr.trim(),
                commitTimeIso: isValidDate ? d.toISOString() : (isoStr ? isoStr.trim() : ''),
                commitTimeEpoch: isValidDate ? Math.floor(d.getTime() / 1000) : (parseInt(atStr, 10) || 0)
            };
        }
    }

    const [
        commitFull,
        commitAbbrev,
        shortMsg,
        fullMsg,
        authorName,
        authorEmail,
        timeStr,
        timeIso,
        timeEpoch
    ] = await Promise.all([
        commitIdFullAsync(dir),
        commitIdAbbrevAsync(dir),
        lastCommitMsgAsync(true, dir),
        lastCommitMsgAsync(false, dir),
        commitUserInfoAsync(false, dir),
        commitUserInfoAsync(true, dir),
        dateOfLastCommitAsync(dir),
        dateOfLastCommitIsoAsync(dir),
        dateOfLastCommitEpochAsync(dir)
    ]);

    return {
        commitIdFull: commitFull,
        commitIdAbbrev: commitAbbrev,
        commitShortMsg: shortMsg,
        commitFullMsg: fullMsg,
        commitUserName: authorName,
        commitUserEmail: authorEmail,
        commitTime: timeStr,
        commitTimeIso: timeIso,
        commitTimeEpoch: timeEpoch
    };
};

export const getGitProp = (customGitProp?: Record<string, any> | Map<string, any>, dir?: string): GitPropertiesFlat => {
    const normalizedProps = normalizeCustomPropMap(customGitProp);
    const batch = _getBatchedCommitInfo(dir);
    const tagsDesc = commitIdDescAndTags(false, dir);
    const gitProp: Record<string, any> = {
        [KEY_GIT_BRANCH]: currentBranch(dir),
        [KEY_GIT_BUILD_HOST]: buildHost(),
        [KEY_GIT_BUILD_VERSION]: buildVersion(dir),
        [KEY_GIT_BUILD_USER_NAME]: buildUserName(),
        [KEY_GIT_BUILD_USER_EMAIL]: buildUserEmail(),
        [KEY_GIT_COMMIT_ID_ABBREVIATED]: batch.commitIdAbbrev,
        [KEY_GIT_COMMIT_ID_DESCRIBE]: commitIdDescAndTags(true, dir),
        [KEY_GIT_COMMIT_ID]: batch.commitIdFull,
        [KEY_GIT_COMMIT_SHORT_MESSAGE]: batch.commitShortMsg,
        [KEY_GIT_COMMIT_FULL_MESSAGE]: batch.commitFullMsg,
        [KEY_GIT_COMMIT_USER_NAME]: batch.commitUserName,
        [KEY_GIT_COMMIT_USER_EMAIL]: batch.commitUserEmail,
        [KEY_GIT_COMMIT_TIME]: batch.commitTime,
        [KEY_GIT_COMMIT_TIME_ISO]: batch.commitTimeIso,
        [KEY_GIT_COMMIT_TIME_EPOCH]: batch.commitTimeEpoch,
        [KEY_GIT_DIRTY]: isDirty(dir),
        [KEY_GIT_REMOTE_ORIGIN_URL]: remoteUrl(dir),
        [KEY_GIT_TAGS]: tagsDesc,
        [KEY_GIT_CLOSEST_TAG_NAME]: tagsDesc,
        [KEY_GIT_CLOSEST_TAG_COMMIT_COUNT]: closestTagCommitCount(dir),
        [KEY_GIT_TOTAL_COMMIT_COUNT]: countOfAllCommits(dir),
    };
    return normalizedProps ? { ...gitProp, ...normalizedProps } : gitProp;
};

export const getGitPropAsync = async (customGitProp?: Record<string, any> | Map<string, any>, dir?: string): Promise<GitPropertiesFlat> => {
    const normalizedProps = normalizeCustomPropMap(customGitProp);
    const [
        branch,
        batch,
        commitDesc,
        dirty,
        remote,
        tagsDesc,
        closestCount,
        totalCount
    ] = await Promise.all([
        Promise.resolve().then(() => currentBranch(dir)),
        _getBatchedCommitInfoAsync(dir),
        commitIdDescAndTagsAsync(true, dir),
        isDirtyAsync(dir),
        remoteUrlAsync(dir),
        commitIdDescAndTagsAsync(false, dir),
        closestTagCommitCountAsync(dir),
        countOfAllCommitsAsync(dir)
    ]);

    const gitProp: Record<string, any> = {
        [KEY_GIT_BRANCH]: branch,
        [KEY_GIT_BUILD_HOST]: buildHost(),
        [KEY_GIT_BUILD_VERSION]: buildVersion(dir),
        [KEY_GIT_BUILD_USER_NAME]: buildUserName(),
        [KEY_GIT_BUILD_USER_EMAIL]: buildUserEmail(),
        [KEY_GIT_COMMIT_ID_ABBREVIATED]: batch.commitIdAbbrev,
        [KEY_GIT_COMMIT_ID_DESCRIBE]: commitDesc,
        [KEY_GIT_COMMIT_ID]: batch.commitIdFull,
        [KEY_GIT_COMMIT_SHORT_MESSAGE]: batch.commitShortMsg,
        [KEY_GIT_COMMIT_FULL_MESSAGE]: batch.commitFullMsg,
        [KEY_GIT_COMMIT_USER_NAME]: batch.commitUserName,
        [KEY_GIT_COMMIT_USER_EMAIL]: batch.commitUserEmail,
        [KEY_GIT_COMMIT_TIME]: batch.commitTime,
        [KEY_GIT_COMMIT_TIME_ISO]: batch.commitTimeIso,
        [KEY_GIT_COMMIT_TIME_EPOCH]: batch.commitTimeEpoch,
        [KEY_GIT_DIRTY]: dirty,
        [KEY_GIT_REMOTE_ORIGIN_URL]: remote,
        [KEY_GIT_TAGS]: tagsDesc,
        [KEY_GIT_CLOSEST_TAG_NAME]: tagsDesc,
        [KEY_GIT_CLOSEST_TAG_COMMIT_COUNT]: closestCount,
        [KEY_GIT_TOTAL_COMMIT_COUNT]: totalCount,
    };
    return normalizedProps ? { ...gitProp, ...normalizedProps } : gitProp;
};

const formatPropertyValue = (val: unknown): string => {
    if (val === undefined || val === null) return '';
    return String(val)
        .replace(/\\/g, '\\\\')
        .replace(/\r/g, '\\r')
        .replace(/\n/g, '\\n');
};

export const gitInfoAsProperties = (customGitPropMap?: Record<string, any> | Map<string, any>, dir?: string): string => {
    const finalGitProp = getGitProp(customGitPropMap, dir);
    const lines: string[] = [];
    for (const key of Object.keys(finalGitProp).sort()) {
        const val = finalGitProp[key];
        lines.push(`${key}=${formatPropertyValue(val)}`);
    }
    return lines.join('\n') + '\n';
};

export const gitInfoAsPropertiesAsync = async (customGitPropMap?: Record<string, any> | Map<string, any>, dir?: string): Promise<string> => {
    const finalGitProp = await getGitPropAsync(customGitPropMap, dir);
    const lines: string[] = [];
    for (const key of Object.keys(finalGitProp).sort()) {
        const val = finalGitProp[key];
        lines.push(`${key}=${formatPropertyValue(val)}`);
    }
    return lines.join('\n') + '\n';
};

export function gitInfoAsJson(
    customGitPropMap?: Record<string, any> | Map<string, any>,
    requireObject?: false,
    dir?: string
): string;
export function gitInfoAsJson(
    customGitPropMap: Record<string, any> | Map<string, any> | undefined,
    requireObject: true,
    dir?: string
): GitProperties;
export function gitInfoAsJson(
    customGitPropMap?: Record<string, any> | Map<string, any>,
    requireObject?: boolean,
    dir?: string
): GitProperties | string;
export function gitInfoAsJson(
    customGitPropMap?: Record<string, any> | Map<string, any>,
    requireObject?: boolean,
    dir?: string
): GitProperties | string {
    const finalGitProp: Record<string, any> = getGitProp(customGitPropMap, dir);
    const gitInfoObject = castObjectToNestedObject(finalGitProp) as unknown as GitProperties;
    return requireObject ? gitInfoObject : JSON.stringify(gitInfoObject, null, 2);
}

export function gitInfoAsJsonAsync(
    customGitPropMap?: Record<string, any> | Map<string, any>,
    requireObject?: false,
    dir?: string
): Promise<string>;
export function gitInfoAsJsonAsync(
    customGitPropMap: Record<string, any> | Map<string, any> | undefined,
    requireObject: true,
    dir?: string
): Promise<GitProperties>;
export function gitInfoAsJsonAsync(
    customGitPropMap?: Record<string, any> | Map<string, any>,
    requireObject?: boolean,
    dir?: string
): Promise<GitProperties | string>;
export async function gitInfoAsJsonAsync(
    customGitPropMap?: Record<string, any> | Map<string, any>,
    requireObject?: boolean,
    dir?: string
): Promise<GitProperties | string> {
    const finalGitProp: Record<string, any> = await getGitPropAsync(customGitPropMap, dir);
    const gitInfoObject = castObjectToNestedObject(finalGitProp) as unknown as GitProperties;
    return requireObject ? gitInfoObject : JSON.stringify(gitInfoObject, null, 2);
}

export const createGitInfoFile = (
    customGitPropMap?: Record<string, any> | Map<string, any>,
    fileName?: string,
    format?: 'json' | 'flat-json' | 'properties',
    dir?: string
): boolean => {
    const targetFile = fileName || defaultFileName;
    const isProps = format === 'properties' || (!format && targetFile.endsWith('.properties'));
    const isFlatJson = format === 'flat-json';
    let content: string;
    if (isProps) {
        content = gitInfoAsProperties(customGitPropMap, dir);
    } else if (isFlatJson) {
        const normalized = normalizeCustomPropMap(customGitPropMap);
        content = JSON.stringify(getGitProp(normalized, dir), null, 2);
    } else {
        content = gitInfoAsJson(customGitPropMap, false, dir);
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
    format?: 'json' | 'flat-json' | 'properties',
    dir?: string
): Promise<boolean> => {
    const targetFile = fileName || defaultFileName;
    const isProps = format === 'properties' || (!format && targetFile.endsWith('.properties'));
    const isFlatJson = format === 'flat-json';
    let content: string;
    if (isProps) {
        content = await gitInfoAsPropertiesAsync(customGitPropMap, dir);
    } else if (isFlatJson) {
        const normalized = normalizeCustomPropMap(customGitPropMap);
        const props = await getGitPropAsync(normalized, dir);
        content = JSON.stringify(props, null, 2);
    } else {
        content = await gitInfoAsJsonAsync(customGitPropMap, false, dir);
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

export interface CacheOptions {
    ttlMs?: number;
    dir?: string;
    customGitProp?: Record<string, any> | Map<string, any>;
}

interface CacheEntry {
    timestamp: number;
    data: GitPropertiesFlat;
}

const _cache = new Map<string, CacheEntry>();

export const clearGitPropCache = (): void => {
    _cache.clear();
};

export const getGitPropCached = (options?: CacheOptions): GitPropertiesFlat => {
    const dirKey = options?.dir || 'default';
    const now = Date.now();
    const entry = _cache.get(dirKey);
    const ttl = options?.ttlMs;

    if (entry && (ttl === undefined || (now - entry.timestamp) < ttl)) {
        const customProps = normalizeCustomPropMap(options?.customGitProp);
        return customProps ? { ...entry.data, ...customProps } : { ...entry.data };
    }

    const data = getGitProp(undefined, options?.dir);
    _cache.set(dirKey, { timestamp: now, data });
    const customProps = normalizeCustomPropMap(options?.customGitProp);
    return customProps ? { ...data, ...customProps } : { ...data };
};

export const getGitPropCachedAsync = async (options?: CacheOptions): Promise<GitPropertiesFlat> => {
    const dirKey = options?.dir || 'default';
    const now = Date.now();
    const entry = _cache.get(dirKey);
    const ttl = options?.ttlMs;

    if (entry && (ttl === undefined || (now - entry.timestamp) < ttl)) {
        const customProps = normalizeCustomPropMap(options?.customGitProp);
        return customProps ? { ...entry.data, ...customProps } : { ...entry.data };
    }

    const data = await getGitPropAsync(undefined, options?.dir);
    _cache.set(dirKey, { timestamp: now, data });
    const customProps = normalizeCustomPropMap(options?.customGitProp);
    return customProps ? { ...data, ...customProps } : { ...data };
};

export interface MiddlewareOptions extends CacheOptions {
    path?: string;
    format?: 'json' | 'flat-json' | 'properties';
}

export const gitPropertiesMiddleware = (options?: MiddlewareOptions) => {
    const targetPath = options?.path;
    const format = options?.format || 'json';

    return (req: any, res: any, next?: () => void): void => {
        if (targetPath && req.url && req.url !== targetPath && !req.url.startsWith(targetPath + '?')) {
            if (typeof next === 'function') {
                return next();
            }
            return;
        }

        try {
            const props = getGitPropCached(options);
            if (format === 'properties') {
                const lines: string[] = [];
                for (const key of Object.keys(props).sort()) {
                    lines.push(`${key}=${formatPropertyValue(props[key])}`);
                }
                const content = lines.join('\n') + '\n';
                if (typeof res.setHeader === 'function') {
                    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                }
                if (typeof res.end === 'function') {
                    res.end(content);
                }
            } else if (format === 'flat-json') {
                const content = JSON.stringify(props, null, 2);
                if (typeof res.setHeader === 'function') {
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                }
                if (typeof res.end === 'function') {
                    res.end(content);
                }
            } else {
                const nested = castObjectToNestedObject(props);
                const content = JSON.stringify(nested, null, 2);
                if (typeof res.setHeader === 'function') {
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                }
                if (typeof res.end === 'function') {
                    res.end(content);
                }
            }
        } catch (err: unknown) {
            if (typeof next === 'function') {
                return next();
            }
            if (typeof res.statusCode !== 'undefined') {
                res.statusCode = 500;
            }
            if (typeof res.end === 'function') {
                const msg = err instanceof Error ? err.message : String(err);
                res.end(JSON.stringify({ error: msg }));
            }
        }
    };
};


