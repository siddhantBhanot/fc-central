---
id: jenkins-deployment-pipelines-kt
title: Jenkins Deployment Pipelines — Knowledge Transfer
description: Understand Jenkins build pipelines, branch-based builds, build verification, build failure checks, Jenkins build options, and the master branch deployment flow from build through SIT and QA.
target_service: Jenkins Deployment Pipelines Service
domain: Jenkins Deployment Pipelines
target_audience: Users working with Jenkins deployment pipelines
difficulty: Intermediate
estimated_duration: Not specified
icon: Workflow
tags:
  - Jenkins
  - Build Pipeline
  - Deployment
  - SIT
  - QA
  - Master Branch
  - Branch Build
  - Version Manifest
  - Smoke Test

---

# Jenkins Deployment Pipelines — Knowledge Transfer Curriculum

## 01. Build Pipeline Overview

- **Summary**: Build pipelines exist for every service, including UI and backend services. Service naming can vary.
- **Context**:
  - lessons/01-build-pipeline/01-build-pipeline-overview.md
- **Knowledge Check**:
  - **Question**: Is there a build pipeline for every service, including UI and backend services?
  - **Type**: multiple_choice
  - **Options**:
    - [x] Yes, there will be a build pipeline for every service.
    - No, only backend services have build pipelines.
    - No, only UI services have build pipelines.
    - Only master branch services have build pipelines.
  - **Explanation**: There will be a build pipeline for every service, including UI and backend services.

## 02. Build With Parameters and Branch Selection

- **Summary**: Build pipelines use Build With Parameters, where a branch such as Feature, Hotfix, Custom, Release, or Master is provided.
- **Context**:
  - lessons/01-build-pipeline/02-build-with-parameters.md
- **Knowledge Check**:
  - **Question**: What needs to be provided when using Build With Parameters for a build pipeline?
  - **Type**: multiple_choice
  - **Options**:
    - [x] The branch to build.
    - Only the environment name.
    - Only the build number.
    - Only the service name.
  - **Explanation**: For the build pipeline, the branch needs to be provided.

## 03. Build Verification and Image Identification

- **Summary**: Builds can be verified using the latest commit, Jenkins build number, console output, image naming format, and the Kubernetes.container_image field in Kibana logs.
- **Context**:
  - lessons/01-build-pipeline/03-build-verification-and-image-format.md
- **Knowledge Check**:
  - **Question**: What can be searched in the Jenkins console output to verify the build against the latest commit?
  - **Type**: multiple_choice
  - **Options**:
    - [x] The first 5 values of the last commit.
    - The complete commit history.
    - Only the service name.
    - Only the environment name.
  - **Explanation**: The first 5 values of the last commit can be searched in the console output and matched with the build image information.

## 04. Build Failure Checks and Jenkins Build Options

- **Summary**: Failed builds can be investigated through Jenkins console output and the options available when opening a build number.
- **Context**:
  - lessons/02-build-failure-and-debugging/01-build-failure-and-jenkins-options.md
- **Knowledge Check**:
  - **Question**: What is usually the first place to check when a Jenkins build fails?
  - **Type**: multiple_choice
  - **Options**:
    - [x] Console Output
    - Previous Build
    - Timings
    - Lockable Resources
  - **Explanation**: Console Output shows the complete logs generated during the build and is usually the first place to check when a build fails.

## 05. Master Branch Build Flow

- **Summary**: A successful master branch build flows through build, version manifest generation, SIT deployment, optional SIT smoke testing, and QA deployment.
- **Context**:
  - lessons/03-master-branch-build-flow/01-master-branch-sit-qa-flow.md
- **Knowledge Check**:
  - **Question**: After SIT deployment is completed successfully, what is triggered when smoke tests are configured?
  - **Type**: multiple_choice
  - **Options**:
    - [x] Automated smoke tests.
    - Another master build.
    - A Bitbucket fetch.
    - A new feature branch.
  - **Explanation**: Once the SIT deployment is completed successfully, automated smoke tests are triggered if smoke tests are configured.

## 06. SIT and QA Manual Deployment

- **Summary**: SIT and QA deployment can be manually triggered when automated SCM triggering does not occur.
- **Context**:
  - lessons/03-master-branch-build-flow/01-master-branch-sit-qa-flow.md
- **Knowledge Check**:
  - **Question**: What can be done when automated SCM triggering does not occur?
  - **Type**: multiple_choice
  - **Options**:
    - [x] Manually deploy to the SIT and QA environments.
    - Delete the build.
    - Change the build number.
    - Skip the deployment process.
  - **Explanation**: When automated SCM triggering does not occur, deployment can be manually triggered for the SIT and QA environments.
