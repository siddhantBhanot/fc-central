# Jenkins Build Details and Failure Investigation

## Build Number

Each execution of a Jenkins job has a build number, for example:

`#3340`

The build number identifies one specific execution of that Jenkins pipeline.

The build page can provide information such as:

- build result
- build artifacts
- trigger information
- build duration
- Git revision information
- warnings
- related downstream or upstream jobs

## First Place to Check for Failure

When a Jenkins build fails, the primary place to investigate is usually:

`Console Output`

Console Output contains the detailed execution logs.

## Example Failure Categories

A build can fail because of:

- Bitbucket fetch or checkout issues
- source retrieval problems
- compilation or build errors
- dependency issues
- vulnerability scan failures
- security scan failures
- quality gate failures
- failed test cases
- image/artifact creation failures
- pipeline configuration issues
- other configured validation failures

## Investigation Flow

1. Open the failed build number.
2. Check `Status`.
3. Open `Console Output`.
4. Identify the stage where the failure occurred.
5. Search for relevant error messages such as `ERROR`, `FAILED`, or `FAILURE`.
6. Read the detailed error near the failing command or stage.
7. Use `Pipeline Steps` or Blue Ocean when additional stage-level debugging is needed.
