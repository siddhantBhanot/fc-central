# Build Verification and Image Identification

## Confirming a Build

A build can be confirmed using the last commit on the branch.

Example:

The last commit on the `master` branch can be compared with the Jenkins build information.

## Jenkins Build Number

The Jenkins build number can be opened to verify the build.

Example build image format:

`Home-loan-ui:build-3340-ad9cb`

## Commit Verification

In the console output of the Jenkins build number:

- Search for the first 5 values of the last commit.
- The values should match.

## Image Format

The image format is:

`service-name:build-buildNo.-first 5 values of the commit`

Example:

`Home-loan-ui:build-3340-ad9cb`

Where:

- `service-name` is the service name.
- `buildNo.` is the Jenkins build number.
- The last value contains the first 5 values of the commit.

## Kibana Log Verification

The build image can also be verified in the latest Kibana logs of the service.

Check the:

`Kubernetes.container_image`

field.

Its value contains:

`servicename:Env-buildNo.-first 5 values of the commit`
