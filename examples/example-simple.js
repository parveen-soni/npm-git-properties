'use strict';

const gitInfoUtil = require('../dist/index');

console.log('gitInfoUtil.currentBranch() => ' + gitInfoUtil.currentBranch());
// e.g. v1.0.0

console.log('gitInfoUtil.commitIdAbbrev() => ' + gitInfoUtil.commitIdAbbrev());
// e.g. 18f5104

console.log('gitInfoUtil.commitIdFull() => ' + gitInfoUtil.commitIdFull());
// e.g. 18f51041eead0e4952bfe11987504e6fdf682a0f