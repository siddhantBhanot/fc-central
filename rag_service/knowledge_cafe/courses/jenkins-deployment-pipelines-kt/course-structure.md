---
id: jenkins-deployment-pipelines-kt
title: Jenkins Build & Deployment Pipelines — Knowledge Transfer
description: Understand Jenkins service builds, branch-based builds, build verification using Git commits, SIT and QA promotion, smoke-test gates, direct SIT deployment, and Helm configuration revisions.
target_service: home-loan-platform
domain: DevOps & CI/CD
target_audience: Developers, QA Engineers, DevOps Engineers, and Release Engineers
difficulty: Intermediate
estimated_duration: 1 hour 30 minutes
icon: Workflow
tags:
  - Jenkins
  - CI/CD
  - Build With Parameters
  - Git
  - Bitbucket
  - SIT
  - QA
  - Smoke Tests
  - Helm
  - Kubernetes
  - Deployment
---

# Jenkins Build & Deployment Pipelines — Knowledge Transfer Curriculum

## 01. Service Build Pipelines and Branch Selection

- **Summary**: How Jenkins build pipelines are organized per UI/backend service, how BUILD WITH PARAMETERS is used, and how master and non-master branch builds differ.
- **Context**:
  - lessons/01-build-pipelines/01-service-build-pipelines.md
  - lessons/01-build-pipelines/02-branch-build-behavior.md
- **Knowledge Check**:
  - **Question**: What is the primary input used when starting a service build through BUILD WITH PARAMETERS?
  - **Type**: multiple_choice
  - **Options**:
    - [x] The branch name to build
    - The QA environment URL
    - The Jenkins executor name
    - The previous build number
  - **Explanation**: The build pipeline requires the branch name so Jenkins knows which source branch to check out and build.

## 02. Build Version and Git Commit Verification

- **Summary**: How to verify that Jenkins built the expected source revision by comparing the latest Git commit prefix with the generated build/image identifier.
- **Context**:
  - lessons/02-build-verification/01-build-number-and-commit-verification.md
- **Knowledge Check**:
  - **Question**: In `home-loan-ui:build-3340-ad9cb`, what does `ad9cb` represent?
  - **Type**: multiple_choice
  - **Options**:
    - The QA deployment number
    - [x] The first five characters of the Git commit hash
    - The Helm chart name
    - The Jenkins agent ID
  - **Explanation**: The commit prefix in the build identifier can be compared with the expected Git revision to verify the source version used by the build.

## 03. Investigating Jenkins Builds and Failures

- **Summary**: How to inspect a Jenkins build number, use Console Output for troubleshooting, and understand common build-page options.
- **Context**:
  - lessons/03-build-troubleshooting/01-build-details-and-console-output.md
  - lessons/03-build-troubleshooting/02-build-page-options.md
- **Knowledge Check**:
  - **Question**: What is usually the first Jenkins page to inspect when a build fails?
  - **Type**: multiple_choice
  - **Options**:
    - Changes
    - Parameters
    - [x] Console Output
    - Previous Build
  - **Explanation**: Console Output contains the detailed execution logs and is usually the primary source for identifying the failure reason.

## 04. Master Branch Promotion: SIT, Smoke Test, and QA

- **Summary**: The master build promotion flow from successful application build to version manifest, SIT deployment, SIT smoke testing, and QA deployment.
- **Context**:
  - lessons/04-master-promotion-flow/01-master-to-sit-and-qa.md
  - lessons/04-master-promotion-flow/02-direct-sit-deployment.md
- **Knowledge Check**:
  - **Question**: In the documented automatic promotion flow, what must happen before QA deployment?
  - **Type**: multiple_choice
  - **Options**:
    - A feature branch must be merged
    - The Helm branch must be deleted
    - [x] SIT deployment must succeed and SIT smoke tests must be green
    - A new Jenkins agent must be created
  - **Explanation**: QA promotion occurs after successful SIT deployment and successful/green SIT smoke tests.

## 05. Helm Configuration and Deployment Revisions

- **Summary**: How Helm manages environment-specific configuration, how the Helm build pipeline builds a selected branch, and how the resulting revision/version is used by product deployment pipelines.
- **Context**:
  - lessons/05-helm-deployment/01-helm-configuration-and-build.md
  - lessons/05-helm-deployment/02-helm-revision-in-product-deployment.md
- **Knowledge Check**:
  - **Question**: What is the main role of the Helm build pipeline in this workflow?
  - **Type**: multiple_choice
  - **Options**:
    - Compile Java or UI source code
    - Run SIT smoke tests
    - [x] Build and version environment-specific deployment configuration
    - Create Jenkins build numbers
  - **Explanation**: The Helm build pipeline builds the selected Helm configuration branch and produces a revision/version used by the relevant product deployment pipeline.
