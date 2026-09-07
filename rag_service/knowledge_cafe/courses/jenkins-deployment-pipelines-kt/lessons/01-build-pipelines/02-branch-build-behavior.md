# Master and Non-Master Branch Build Behavior

## Master Branch

When `master` is selected in `BUILD WITH PARAMETERS`, Jenkins builds the selected/latest revision from the master branch and runs the configured build process.

Configured checks can include:

- build or compilation checks
- automated test checks
- quality checks
- security checks
- vulnerability checks
- image or artifact creation

When the required build checks are successful, the documented master promotion flow can continue to SIT deployment, SIT smoke testing, and QA deployment.

## Feature, Hotfix, Custom, and Release Branches

A branch other than master can also be built.

Examples:

- `feature/MAX-12345`
- `hotfix/MAX-12345`
- `release/1.0`
- a custom branch

The build creates an application image/artifact for the selected branch and source revision. That generated image/artifact can be used in other deployment processes.

## Important Difference

Master builds participate in the documented automatic promotion path.

Non-master branch builds are primarily used to create a deployable image/artifact for the selected branch. The exact downstream deployment behavior can depend on the configured Jenkins pipeline and deployment process.
