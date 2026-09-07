# Service Build Pipelines

## Purpose

Each application service has its own Jenkins build pipeline. This applies to both UI/frontend services and backend services.

Examples:

- `home-loan-home-loan-ui-build` for the Home Loan UI.
- `home-loan-home-loan-orchestrator-build` for the Home Loan Orchestrator backend service.

A service build pipeline is responsible for building the source code for the selected service and running the checks configured in that pipeline.

## Starting a Build

Builds are started using `BUILD WITH PARAMETERS`.

The important build input is the branch name. Jenkins uses the branch parameter to determine which source branch should be fetched and built.

Possible branch categories include:

- Master
- Feature
- Hotfix
- Custom
- Release

Examples:

`BRANCH = master`

`BRANCH = feature/MAX-12345`

## Key Facts

- There is a separate build pipeline for each service.
- UI and backend services both follow this model.
- The branch parameter identifies the source branch Jenkins should build.
