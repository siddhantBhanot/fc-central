# Master Branch Build Flow

## Build Pipeline

Example:

`servicename-build #3340`

Code is merged into the `master` branch and the Jenkins build is triggered.

Jenkins builds the service and runs the configured:

- Build checks
- Quality checks
- Security checks

## Build Successful

When the build is successful:

`BUILD SUCCESSFUL`

Once the master build completes successfully, the build is automatically promoted to SIT.

## Generate Version Manifest

Example:

`servicename-generate-version-manifest #3410`

This generates the version and deployment metadata required for the application release.

## SIT Deployment

Example:

`servicename-sit-deploy #2673`

The successfully built artifact or version is deployed to the SIT environment.

### Manual SIT Deployment

SIT deployment can also be triggered directly by manually running the SIT Deploy pipeline.

## SIT Deployment Successful

When SIT deployment is completed successfully, automated smoke tests are triggered if smoke tests are configured.

## SIT Smoke Test

Example:

`servicename-sit-run-smoke #3235`

Basic validation is performed on the SIT environment to ensure that the deployed application is working correctly.

## Smoke Tests Successful

When the smoke tests are green or successful, the build is promoted to the QA environment.

The build is promoted to QA only after the smoke tests pass successfully.

## QA Deployment

Example:

`servicename-qa-deploy #2225`

The build is promoted to the QA environment.

`BUILD PROMOTED TO QA`

## Complete Master Branch Flow

`servicename-build #3340`

↓

Code is merged into master and the Jenkins build is triggered.

↓

Jenkins builds the service and runs the configured build, quality, and security checks.

↓

`BUILD SUCCESSFUL`

↓

The master build is automatically promoted to SIT.

↓

`servicename-generate-version-manifest #3410`

↓

Version and deployment metadata required for the application release is generated.

↓

`servicename-sit-deploy #2673`

↓

The successfully built artifact or version is deployed to SIT.

↓

`SIT DEPLOYMENT SUCCESSFUL`

↓

Automated smoke tests are triggered if smoke tests are configured.

↓

`servicename-sit-run-smoke #3235`

↓

Basic validation is performed on the SIT environment.

↓

`SMOKE TESTS GREEN / SUCCESSFUL`

↓

The build is promoted to QA.

↓

`servicename-qa-deploy #2225`

↓

`BUILD PROMOTED TO QA`

## Automated SCM Trigger

Sometimes the automated SCM trigger does not occur.

In that case, deployment can be manually triggered on:

- SIT environment
- QA environment
