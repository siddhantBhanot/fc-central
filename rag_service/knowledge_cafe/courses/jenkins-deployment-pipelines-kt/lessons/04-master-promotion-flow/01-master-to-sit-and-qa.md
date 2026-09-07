# Master Branch Promotion: Build to SIT to QA

## Example Jenkins Jobs

Application build:

`home-loan-home-loan-ui-build #3340`

Version manifest:

`home-loan-generate-version-manifest #3410`

SIT deployment:

`home-loan-sit-deploy #2673`

SIT smoke test:

`home-loan-sit-run-smoke #3235`

QA deployment:

`home-loan-qa-deploy #2225`

## Detailed Flow

### 1. Master Application Build

Code is merged into or available on the master branch.

The Jenkins application build is triggered.

Jenkins:

- builds the Home Loan UI/application
- runs configured quality checks
- runs configured security checks
- runs configured validation and test checks
- creates the required application image/artifact

Promotion requirement:

The required build checks must complete successfully.

### 2. Generate Version Manifest

After a successful master build, the version manifest pipeline generates version and deployment metadata required by the subsequent deployment process.

### 3. SIT Deployment

The successful application version/artifact is deployed to the SIT environment.

The documented flow proceeds when SIT deployment completes successfully.

### 4. SIT Smoke Test

After successful SIT deployment, automated smoke tests are executed.

The smoke tests provide basic validation that the application deployed in SIT is functioning correctly.

### 5. QA Deployment

QA deployment is a promotion step after the SIT smoke test result is successful/green.

The promotion rule is:

Successful SIT Deployment
-> SIT Smoke Test
-> Smoke Tests Green/Successful
-> QA Deployment

## Canonical Flow

Master Build
-> Build Successful
-> Generate Version Manifest
-> SIT Deployment
-> SIT Deployment Successful
-> SIT Smoke Test
-> Smoke Tests Green/Successful
-> QA Deployment
