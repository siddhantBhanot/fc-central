# Build Number and Git Commit Verification

## Purpose

A Jenkins build can be verified against the expected Git commit on the branch that was selected for the build.

## Example Git Commit

Example full commit:

`ad9cb70c229b2acef3ddc621370f9631ae641a1b`

The first five characters are:

`ad9cb`

## Example Build Identifier

`home-loan-ui:build-3340-ad9cb`

Interpretation:

- `home-loan-ui` = service name
- `build` = build artifact/image indicator
- `3340` = Jenkins build number
- `ad9cb` = first five characters of the Git commit

General format:

`service-name:build-build-number-commit-prefix`

## Verification Procedure

1. Identify the branch selected for the Jenkins build.
2. Check the latest expected commit on that branch.
3. Note the first five characters of the commit hash.
4. Open the Jenkins build number.
5. Open `Console Output` or inspect the build identifier.
6. Search for the commit prefix.
7. Confirm that the prefix matches the expected commit.

Example:

Expected commit prefix:

`ad9cb`

Observed build identifier:

`home-loan-ui:build-3340-ad9cb`

Matching prefixes provide confirmation that the build is associated with the expected source revision.
