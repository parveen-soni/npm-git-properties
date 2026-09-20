#!/usr/bin/env node
'use strict';

import * as path from 'path';
import {
    createGitInfoFile,
    gitInfoAsJson,
    gitInfoAsProperties,
    buildVersion
} from './index';

function printHelp(): void {
    console.log(`
npm-git-properties CLI

Usage:
  git-properties [options]

Options:
  -o, --output <file>    Output file path (default: gitDetails.json or git.properties)
  -f, --format <format>  Output format: json, flat-json, properties (default: auto-detected by extension or json)
  -d, --dir <directory>  Target git repository directory (default: current directory)
  -p, --print            Print output to stdout instead of writing to a file
  -v, --version          Print version
  -h, --help             Show help
`);
}

function run(): void {
    const args = process.argv.slice(2);
    let output: string | undefined;
    let format: 'json' | 'flat-json' | 'properties' | undefined;
    let dir: string | undefined;
    let print = false;

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '-h' || arg === '--help') {
            printHelp();
            process.exit(0);
        }
        if (arg === '-v' || arg === '--version') {
            console.log(buildVersion());
            process.exit(0);
        }
        if (arg === '-o' || arg === '--output') {
            output = args[++i];
        } else if (arg === '-f' || arg === '--format') {
            const f = args[++i];
            if (f === 'json' || f === 'flat-json' || f === 'properties') {
                format = f;
            } else {
                console.error(`Unknown format: ${f}. Supported formats: json, flat-json, properties`);
                process.exit(1);
            }
        } else if (arg === '-d' || arg === '--dir') {
            dir = args[++i];
        } else if (arg === '-p' || arg === '--print') {
            print = true;
        }
    }

    if (dir) {
        process.chdir(path.resolve(dir));
    }

    if (print) {
        if (format === 'properties') {
            console.log(gitInfoAsProperties());
        } else {
            console.log(gitInfoAsJson());
        }
        process.exit(0);
    }

    const outputFile = output || (format === 'properties' ? 'git.properties' : 'gitDetails.json');
    try {
        createGitInfoFile(undefined, outputFile, format);
        console.log(`Generated git properties file at: ${outputFile}`);
    } catch (err: any) {
        console.error(err.message || err);
        process.exit(1);
    }
}

run();
