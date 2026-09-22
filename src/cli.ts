#!/usr/bin/env node
'use strict';

import * as fs from 'fs';
import * as path from 'path';
import {
    createGitInfoFile,
    gitInfoAsJson,
    gitInfoAsProperties,
    getGitProp,
    buildVersion,
    isDirty
} from './index';

export interface CliResult {
    exitCode: number;
    output?: string;
    error?: string;
}

export interface CliOptions {
    log?: (msg: string) => void;
    error?: (msg: string) => void;
}

export function getHelpText(): string {
    return `
npm-git-properties CLI

Usage:
  git-properties [options]

Options:
  -o, --output <file>    Output file path (default: gitDetails.json or git.properties)
  -f, --format <format>  Output format: json, flat-json, properties (default: auto-detected by extension or json)
  -d, --dir <directory>  Target git repository directory (default: current directory)
  -p, --print            Print output to stdout instead of writing to a file
  -q, --silent           Suppress informative log output
  -c, --custom <k=v>     Add custom property override (e.g. -c git.build.user.name=CI)
  --fail-on-dirty        Exit with code 1 if working directory has uncommitted changes
  -v, --version          Print version
  -h, --help             Show help
`;
}

export function runCli(args: string[] = process.argv.slice(2), options: CliOptions = {}): CliResult {
    const log = options.log || console.log;
    const error = options.error || console.error;

    let output: string | undefined;
    let format: 'json' | 'flat-json' | 'properties' | undefined;
    let dir: string | undefined;
    let print = false;
    let silent = false;
    let failOnDirty = false;
    const customProps: Record<string, any> = {};

    const getOptValue = (index: number, flag: string): { val?: string; err?: string } => {
        if (index + 1 >= args.length || args[index + 1].startsWith('-')) {
            return { err: `Error: Option '${flag}' requires a value.` };
        }
        return { val: args[index + 1] };
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '-h' || arg === '--help') {
            const helpText = getHelpText();
            log(helpText);
            return { exitCode: 0, output: helpText };
        }
        if (arg === '-v' || arg === '--version') {
            const ver = buildVersion(dir);
            log(ver);
            return { exitCode: 0, output: ver };
        }
        if (arg === '-o' || arg === '--output') {
            const res = getOptValue(i, arg);
            if (res.err) {
                error(res.err);
                return { exitCode: 1, error: res.err };
            }
            output = res.val;
            i++;
        } else if (arg === '-f' || arg === '--format') {
            const res = getOptValue(i, arg);
            if (res.err) {
                error(res.err);
                return { exitCode: 1, error: res.err };
            }
            const f = res.val;
            i++;
            if (f === 'json' || f === 'flat-json' || f === 'properties') {
                format = f;
            } else {
                const msg = `Unknown format: ${f}. Supported formats: json, flat-json, properties`;
                error(msg);
                return { exitCode: 1, error: msg };
            }
        } else if (arg === '-d' || arg === '--dir') {
            const res = getOptValue(i, arg);
            if (res.err) {
                error(res.err);
                return { exitCode: 1, error: res.err };
            }
            dir = res.val;
            i++;
        } else if (arg === '-p' || arg === '--print') {
            print = true;
        } else if (arg === '-q' || arg === '--silent') {
            silent = true;
        } else if (arg === '--fail-on-dirty') {
            failOnDirty = true;
        } else if (arg === '-c' || arg === '--custom') {
            const res = getOptValue(i, arg);
            if (res.err) {
                error(res.err);
                return { exitCode: 1, error: res.err };
            }
            const val = res.val!;
            i++;
            const eqIdx = val.indexOf('=');
            if (eqIdx === -1) {
                const msg = `Error: Option '--custom' must be formatted as key=value (got '${val}')`;
                error(msg);
                return { exitCode: 1, error: msg };
            }
            const k = val.substring(0, eqIdx).trim();
            const v = val.substring(eqIdx + 1).trim();
            customProps[k] = v;
        } else if (arg.startsWith('-')) {
            const msg = `Unknown option: ${arg}. See --help for available options.`;
            error(msg);
            return { exitCode: 1, error: msg };
        }
    }

    if (dir) {
        const resolved = path.resolve(dir);
        if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
            const msg = `Error: Directory does not exist: ${dir}`;
            error(msg);
            return { exitCode: 1, error: msg };
        }
    }

    if (failOnDirty && isDirty(dir)) {
        const msg = 'Error: Working directory has uncommitted changes (--fail-on-dirty enabled).';
        error(msg);
        return { exitCode: 1, error: msg };
    }

    const hasCustom = Object.keys(customProps).length > 0;
    const propsArg = hasCustom ? customProps : undefined;

    if (print) {
        let content: string;
        if (format === 'properties') {
            content = gitInfoAsProperties(propsArg, dir);
        } else if (format === 'flat-json') {
            content = JSON.stringify(getGitProp(propsArg, dir), null, 2);
        } else {
            content = gitInfoAsJson(propsArg, false, dir);
        }
        log(content);
        return { exitCode: 0, output: content };
    }

    const outputFile = output || (format === 'properties' ? 'git.properties' : 'gitDetails.json');
    const targetPath = dir && !path.isAbsolute(outputFile) ? path.resolve(dir, outputFile) : outputFile;
    try {
        createGitInfoFile(propsArg, targetPath, format, dir);
        const msg = `Generated git properties file at: ${targetPath}`;
        if (!silent) {
            log(msg);
        }
        return { exitCode: 0, output: msg };
    } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        error(errMsg);
        return { exitCode: 1, error: errMsg };
    }
}

if (require.main === module) {
    const result = runCli();
    if (result.exitCode !== 0) {
        process.exit(result.exitCode);
    }
}
