# Contributing

<!-- 1. Familiarize yourself with the codebase by reading the [docs](docs), in
   particular the [development](contributing/developing.md) doc. -->

1. Create a new issue before starting your project so that we can keep track of
   what you are trying to add/fix. That way, we can also offer suggestions or
   let you know if there is already an effort in progress.
1. Fork this repository.
1. The [README](README.md) has details on how to set up your environment.
1. Create a _topic_ branch in your fork based on `main`. Note, this step is recommended but technically not required if contributing using a fork.
1. Edit the code in your fork.
1. Sign CLA (see [CLA](#cla) below)
1. Send us a pull request when you are done. We'll review your code, suggest any
   needed changes, and merge it in.

## Committing

- We follow [Conventional Commit](https://www.conventionalcommits.org/) messages. The most important prefixes you should have in mind are:

  - fix: which represents bug fixes, and correlates to a SemVer patch.
  - feat: which represents a new feature, and correlates to a SemVer minor.
  - feat!:, or fix!:, refactor!:, etc., which represent a breaking change (indicated by the !) and will result in a SemVer major.

- We enforce coding styles using eslint and prettier. Use `yarn lint` to check.
- Before git commit and push, Husky runs hooks to ensure the commit message is in the correct format and that everything lints and compiles properly.

## Branches

- `main` is the only long-lived branch in this repository. It must always be healthy.
- We want to keep the commit history clean and as linear as possible.
- To this end, we integrate topic branches onto `main` using merge commits only of the history of the branch is clean and meaningful and the branch doesn't contain merge commits itself.
- If the branch history is not clean, we squash the changes into a single commit before merging.
  - NOTE: It's important to also follow [Conventional Commit](https://www.conventionalcommits.org/) messages for the squash commit!. See [Committing](#Committing) above.

## Releases

The release process and [CHANGELOG](CHANGELOG.md) generation is automated using [release-please](https://github.com/googleapis/release-please), which is triggered from Github actions.

After every commit that lands on `main`, [release-please](https://github.com/googleapis/release-please) updates (or creates) a release PR on github for every package on this mono-repo. These PRs include the version number changes to `package.json` and the updates necessary for the [CHANGELOG](CHANGELOG.md) (which are inferred from the commit messages).

To perform a release, simply merge the release PR to `main`. After this happens, the automation scripts will create a git tag, publish the packages to NPM and create a release entry on github.

Before merging the release PR, manual changes can be made on the release branch, including changes to the CHANGELOG.

## CLA

External contributors will be required to sign a Contributor's License Agreement. You can do so by going to https://cla.salesforce.com/sign-cla.
