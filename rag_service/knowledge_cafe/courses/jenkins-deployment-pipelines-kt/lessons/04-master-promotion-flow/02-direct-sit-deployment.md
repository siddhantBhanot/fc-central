# Direct SIT Deployment

## Direct SIT Path

SIT deployment does not have to be reached only through the full automatic master promotion flow.

The SIT Deploy pipeline can also be run directly.

Conceptual flow:

Selected Application Version
-> Run SIT Deploy Pipeline
-> SIT Deployment

## Important Context

The automatic master path is:

Master Build
-> Version Manifest
-> SIT Deployment
-> SIT Smoke Test
-> QA Deployment after successful/green smoke tests

The direct SIT path allows the SIT deployment pipeline to be triggered independently when required.

The exact deployment parameters and validations depend on the Jenkins SIT deployment pipeline configuration.
