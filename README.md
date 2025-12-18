# npm-git-properties

Generate repository git details

## Example

```js
var gitUtil = require('npm-git-properties');

console.log(gitUtil.commitIdAbbrev());
// 18f5104

console.log(gitUtil.commitIdFull());
// 18f51041eead0e4952bfe11987504e6fdf682a0f

console.log(gitUtil.currentBranch());
// v1.0.0
```

To understand better, run the examples: `node .\examples\example-simple.js`  or `node run .\examples\example-complex.js`

To run test cases, run the file: `node .\tests\tests.js`

## Install

`npm install npm-git-properties --save`

## API

``` js
var gitUtil = require('npm-git-properties');
```

#### `gitUtil.currentBranch([filePath])` &rarr; String

return the result of `git rev-parse --short HEAD`

- Optional param `filePath` can be used to find current branch of a repo outside the current working directory

#### `gitUtil.buildHost()` &rarr; String

return the result of `os.hostname` where commands are being executed.

#### `gitUtil.buildVersion()` &rarr; String

return the current package version of repo, return error text if not able to read/parse package.json.

#### `gitUtil.commitIdAbbrev()` &rarr; String

return the short hash of the last commit in the git repository.

#### `gitUtil.commitIdFull()` &rarr; String

return the full hash of the last commit in the git repository.

#### `gitUtil.lastCommitMsg(short)` &rarr; String

return commit message of last commit in the git repository.

- Optional param `short as Boolean` can be used to find short or full commit message.

#### `gitUtil.commitUserInfo(email)` &rarr; String

return user details - email (if param is true) and username of the last commit in the git repository.

- Optional param `email as Boolean` can be used to find short or full commit message.

#### `gitUtil.dateOfLastCommit()` &rarr; String

returns date of last commit in the git repository.

#### `gitUtil.isDirty()` &rarr; Boolean

return the result of `git diff-index HEAD --` as Boolean value.

#### `gitUtil.remoteUrl()` &rarr; String

return the current remote URL of the git repository.

#### `gitUtil.commitIdDescAndTags(flagDirty)` &rarr; String

return the result of `git describe --tag --abbrev=0` or (if flagDirty is true) `git describe --tags`.

#### `gitUtil.closestTagCommitCount()` &rarr; Number

return the result of `git rev-list --count <tagName from commitIdDescAndTags>`.

#### `gitUtil.countOfAllCommits()` &rarr; Number

return the count as Number for all commits present in the git repository.

#### `gitUtil.gitInfoAsJson(customGitPropMap, requireObject)` &rarr; String/Object

return the all git information as JSON String or JSON Object (if param requireObject is true)

- Optional param `customGitPropMap` can be used to override the git information.
- Optional param `requireObject as Boolean` can be used to define return type as JSON Object.

#### `gitUtil.createGitInfoFile` &rarr; Boolean

return as true if able to write git details in a file `gitDetails.json`, throws error if not able to write any changes.

## Inspiration
1. https://github.com/kurttheviking/git-rev-sync-js (NPM Module)
2. https://github.com/n0mer/gradle-git-properties (Gradle Module)

## License

[MIT](https://github.com/parveen-rx/npm-git-properties/blob/main/LICENSE)


## Donations

[Donate on UPI ID(India): parveensoni14891@okhdfcbank]()