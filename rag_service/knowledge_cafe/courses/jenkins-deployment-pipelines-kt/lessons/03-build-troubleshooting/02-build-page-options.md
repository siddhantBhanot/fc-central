# Jenkins Build Page Options

## Status

Shows the current or final build result.

Examples:

- Running
- Success
- Failed
- Aborted

## Changes

Shows the source code changes or Git commits associated with the build.

## Console Output

Shows the complete logs generated during pipeline execution.

Use it for:

- debugging failures
- checking the Git revision
- checking stage output
- investigating scan or test failures

Console Output is usually the first place to check when a build fails.

## View Build Information

Shows build metadata such as:

- build number
- duration
- start time
- result
- trigger information

## Parameters

Shows the values used to start the build.

Example:

`BRANCH = master`

## Timings

Shows how much time different parts of the build took.

Useful for identifying slow stages.

## Git Build Data

Shows Git-related information such as:

- branch
- commit
- revision

## See Fingerprints

Shows artifact fingerprints used to track artifacts across Jenkins builds and jobs.

## Lockable Resources

Shows resources locked or reserved during the build.

This can prevent simultaneous builds from using the same shared resource or environment.

## Rebuild

Runs the build again. Depending on the Jenkins/plugin configuration, the same or modified parameters may be used.

## Open Blue Ocean

Opens a visual representation of:

- pipeline stages
- stage status
- build flow
- failures

## Restart from Stage

Allows a supported Jenkins pipeline to restart from a selected stage instead of running the entire pipeline from the beginning.

## Pipeline Steps

Shows detailed internal steps executed by the Jenkins Pipeline.

Useful for advanced debugging.

## Previous Build

Opens the build immediately before the current build.

## Next Build

Opens the build immediately after the current build, if it exists.

## Multiple Rebuild Entries

Some Jenkins configurations or plugins can expose more than one rebuild action. The exact behavior depends on the installed plugins and job configuration.
