# Using Helm Revisions in Product Build and Deployment

## Deployment Inputs

The product build/deployment pipeline works with two important versioned inputs:

1. Application image/artifact version.
2. Helm configuration revision/version.

The application build provides the application version.

The Helm build provides the Helm revision/version.

## Product Deployment Flow

Application Source Branch
-> Application Build Pipeline
-> Application Image/Artifact Version

Helm Configuration Branch
-> Helm Build Pipeline
-> Latest Helm Revision/Version

Application Version
+
Helm Revision/Version
-> Product Build/Deploy Pipeline
-> Target Environment Deployment

## Latest Helm Revision

After a Helm branch is built, the resulting latest revision/version is picked up by the build and deployment pipeline for the relevant product according to the configured deployment process.

## Responsibilities

Application Build Pipeline:

Builds the actual application source code and produces the application image/artifact.

Helm Build Pipeline:

Builds and versions the deployment configuration, including environment-specific configuration.

Product Deployment Pipeline:

Uses the required application version together with the relevant/latest Helm revision/version to deploy the product to the target environment.
