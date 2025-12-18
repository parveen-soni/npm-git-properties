'use strict';

import * as childProcessLib from 'child_process';
import * as gracefulFsLib from 'graceful-fs';
import * as pathLib from 'path';
import * as shellLib from 'shelljs';
import * as os from 'os';

const hasNativeExecSync: boolean = childProcessLib.hasOwnProperty('spawnSync');
const pathSeparator: string = pathLib.sep;
const refBranch: RegExp = /^ref: refs\/heads\/(.*)\n/;
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

const _exeCmd = (cmd: string, args: string[]): string => {
    let result: any;
    if (hasNativeExecSync) {
        result = childProcessLib.spawnSync(cmd, args);
    } else {
        result = shellLib.exec(`${cmd} ${args.join(' ')}`, { silent: true });
    }
    if (result.status !== 0) {
        const errorDetails: Buffer | null = result.stderr || result.stdout;
        return `${currentRepoName} has failed to execute command: ${errorDetails ? errorDetails.toString("utf8").trim() : ''}`;
    }
    return result.stdout.toString('utf8').trim();
};

const _getGitDir = (dirPath?: string | string[]): string => {
    if (dirPath === undefined || dirPath === null) {
        dirPath = module.parent?.filename || process.cwd();
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
    if (gracefulFsLib.existsSync(testPath)) {
        if (!gracefulFsLib.statSync(testPath).isDirectory()) {
            let parentRepoPath: string = gracefulFsLib.readFileSync(testPath, 'utf8').trim().split(' ').pop() as string;
            if (!pathLib.isAbsolute(parentRepoPath)) {
                parentRepoPath = pathLib.resolve(gitRepoPath, parentRepoPath);
            }
            if (gracefulFsLib.existsSync(parentRepoPath)) {
                return pathLib.resolve(parentRepoPath);
            }
            throw new Error(currentRepoName + ' could not find repository from path ' + parentRepoPath);
        }
        return testPath;
    }
    (dirPath as string[]).pop();
    return _getGitDir(dirPath);
};

export const currentBranch = (dir?: string): string => {
    const gitDir: string = _getGitDir(dir);
    const head: string = gracefulFsLib.readFileSync(pathLib.resolve(gitDir, 'HEAD'), 'utf8');
    const b: RegExpMatchArray | null = head.match(refBranch);
    if (b) {
        return b[1];
    } else {
        return detachedAtHeadPrefix + head.trim();
    }
};

export const buildHost = (): string => {
    return os.hostname();
};

export const buildVersion = (): string => {
    const packageJsonPath: string = pathLib.join(__dirname, '..', 'package.json');
    try {
        const data: string = gracefulFsLib.readFileSync(packageJsonPath, 'utf8');
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
    return _exeCmd('git', ['rev-parse', '--short', 'HEAD']);
};

export const commitIdFull = (): string => {
    return _exeCmd('git', ['rev-parse', 'HEAD']);
};

export const lastCommitMsg = (short?: boolean): string => {
    const prettyArg: string = short ? '--pretty=%s' : '--pretty=%B'
    return _exeCmd('git', ['log', '-1', prettyArg]);
};

export const commitUserInfo = (email?: boolean): string => {
    const prettyArg: string = email ? '--pretty=format:%ae' : '--pretty=format:%an'
    return _exeCmd('git', ['log', '-1', prettyArg]);
};

export const dateOfLastCommit = (): string => {
    return new Date(_exeCmd('git', ['log', '--no-color', '-n', '1', '--pretty=format:"%ad"'])).toString();
};

export const isDirty = (): boolean => {
    return _exeCmd('git', ['diff-index', 'HEAD', '--']).length > 0;
};

export const remoteUrl = (): string => {
    return _exeCmd('git', ['ls-remote', '--get-url']);
};

export const commitIdDescAndTags = (flagDirty?: boolean): string => {
    const cmdArgs: string[] = flagDirty ? ['describe', '--tags'] : ['describe', '--tag', '--abbrev=0'];
    const cmdResult: string = _exeCmd('git', cmdArgs);
    return (!cmdResult.startsWith(currentRepoName) && flagDirty) ? cmdResult + "-dirty" : cmdResult;
};

export const closestTagCommitCount = (): string => {
    const tagName: string = commitIdDescAndTags();
    if (tagName.startsWith(currentRepoName)) {
        return tagName;
    }
    return _exeCmd('git', ['rev-list', '--count', tagName]);
};

export const countOfAllCommits = (): number => {
    return parseInt(_exeCmd('git', ['rev-list', '--all', '--count']), 10);
};

const deepMerge = (target: any, ...sources: any[]): any => {
    for (const source of sources) {
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
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
        const firstKey: string = key.substr(0, firstDotIndex);
        const nestedKey: string = key.substr(firstDotIndex + 1, key.length);
        jsonObject[firstKey] = prepareObject(nestedKey, value);
    } else {
        jsonObject[key] = value;
    }
    return jsonObject;
};

const castObjectToNestedObject = (obj: { [key: string]: any }): any => {
    let jsonObject: any = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const result: any = prepareObject(key, obj[key]);
            jsonObject = deepMerge({}, jsonObject, result);
        }
    }
    return jsonObject;
};

const getGitProp = (customGitProp?: { [key: string]: any }): { [key: string]: any } => {
    const gitProp: { [key: string]: any } = {
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
    return customGitProp ? { ...gitProp, ...customGitProp } : gitProp;
};

export const gitInfoAsJson = (customGitPropMap?: { [key: string]: any }, requireObject?: boolean): any => {
    const finalGitProp: { [key: string]: any } = getGitProp(customGitPropMap);
    const gitInfoObject: any = castObjectToNestedObject(finalGitProp);
    return requireObject ? gitInfoObject : JSON.stringify(gitInfoObject, null, 2);
};

export const createGitInfoFile = (customGitPropMap?: { [key: string]: any }, fileName?: string): boolean => {
    const targetFile = fileName || defaultFileName;
    const gitInfoJson: string = gitInfoAsJson(customGitPropMap);
    try {
        if (gracefulFsLib.existsSync(targetFile)) {
            gracefulFsLib.unlinkSync(targetFile);
        }
        gracefulFsLib.writeFileSync(targetFile, gitInfoJson);
        return true;
    } catch (error) {
        throw new Error(currentRepoName + " has failed to create " + targetFile + " due to " + error);
    }
}
