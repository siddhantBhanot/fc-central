# Helm Configuration and Helm Build Pipeline

## Purpose of Helm

Helm is used for environment-specific deployment configuration.

The Helm configuration can include values related to:

- application configuration
- environment variables
- service configuration
- resource configuration
- replica configuration
- URLs and endpoints
- Kubernetes deployment configuration

Different environments can use different configuration values.

Examples include:

- SIT
- QA
- UAT
- Production

## Helm Build Pipeline

A separate Helm build pipeline is configured for the Helm configuration.

The Helm build is started by selecting the branch to build.

Example:

`BRANCH = master`

Another example:

`BRANCH = feature/MAX-12345`

The Helm build pipeline builds the selected Helm branch and produces a Helm revision/version.

## Key Principle

Application code and Helm configuration are built as related but separate concerns.

Application build:

Application source code
-> application image/artifact

Helm build:

Helm configuration branch
-> Helm revision/version
