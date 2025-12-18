'use strict';

const gitInfoUtil = require('../dist/index');

console.log('gitInfoUtil.currentBranch() => ' + gitInfoUtil.currentBranch());
console.log('gitInfoUtil.buildHost() => ' + gitInfoUtil.buildHost());
console.log('gitInfoUtil.buildVersion() => ' + gitInfoUtil.buildVersion());
console.log('gitInfoUtil.commitIdAbbrev => ' + gitInfoUtil.commitIdAbbrev());
console.log('gitInfoUtil.commitIdDesc => ' + gitInfoUtil.commitIdDescAndTags(true));
console.log('gitInfoUtil.commitIdFull() => ' + gitInfoUtil.commitIdFull());
console.log('gitInfoUtil.lastCommitMsg() => ' + gitInfoUtil.lastCommitMsg());
console.log('gitInfoUtil.commitUserInfo() => ' + gitInfoUtil.commitUserInfo());
console.log('gitInfoUtil.dateOfLastCommit() => ' + gitInfoUtil.dateOfLastCommit());
console.log('gitInfoUtil.isDirty() => ' + gitInfoUtil.isDirty());
console.log('gitInfoUtil.remoteUrl() => ' + gitInfoUtil.remoteUrl());
console.log('gitInfoUtil.commitIdDescAndTags() => ' + gitInfoUtil.commitIdDescAndTags());
console.log('gitInfoUtil.closestTagCommitCount() => ' + gitInfoUtil.closestTagCommitCount());
console.log('gitInfoUtil.countOfAllCommits() => ' + gitInfoUtil.countOfAllCommits());
const customPropMap = new Map();
customPropMap.set( "git.build.user.name" , "App User");
customPropMap.set( "git.build.user.email" , "appuser@app.com");
console.log('gitInfoUtil.gitInfoAsJson() => ' + gitInfoUtil.gitInfoAsJson(customPropMap));
console.log('gitInfoUtil.createGitInfoFile() => ' + gitInfoUtil.createGitInfoFile(customPropMap));