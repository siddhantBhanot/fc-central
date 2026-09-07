# Jenkins Build With Parameters

## Build With Parameters

For a build, use:

**BUILD WITH PARAMETERS**

For the build pipeline, provide the branch that needs to be built.

The branch can be:

- Feature
- Hotfix
- Custom
- Release
- Master

## Master Branch Build

If the `master` branch is provided:

- Jenkins will build the branch.
- If the build is successful and there is no deployment issue, the branch will be deployed to the SIT and QA environments.

## Other Branch Builds

If a branch other than `master` is provided:

- Jenkins will create the image for that branch.
- That image can be used in other deployment processes.

## Automated SCM Trigger

Sometimes the automated SCM trigger does not occur.

In that case, deployment can be manually triggered for:

- SIT environment
- QA environment
