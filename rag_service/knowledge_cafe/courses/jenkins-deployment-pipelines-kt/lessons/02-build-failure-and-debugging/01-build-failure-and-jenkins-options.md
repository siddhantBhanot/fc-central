# Build Failure Checks and Jenkins Build Options

## Build Failure

A build can fail due to reasons including:

- Bitbucket fetch issue
- Vulnerability failure
- Test case failure
- Any other check failure

When a build fails, the failure can be checked in the console output of the Jenkins build number.

## Jenkins Build Options

When clicking on the build number, the left-side panel provides multiple options.

### Status

Shows the current result of the build.

Examples include:

- Running
- Success
- Failed
- Aborted

### Changes

Shows the code changes or Git commits included in the build.

### Console Output

Shows the complete logs generated during the build.

This is usually the first place to check when a build fails.

### View Build Information

Shows build details including:

- Build number
- Duration
- Start time
- Result
- Information about who or what triggered the build

### Parameters

Shows the parameters and values used when triggering the build.

### Timings

Shows how much time different parts of the build took.

Useful for finding slow stages or processes.

### Git Build Data

Shows Git-related information for the build, including:

- Branch
- Commit
- Revision used

### See Fingerprints

Shows artifact fingerprints.

Jenkins uses these to track which builds produced or used particular artifacts across different jobs.

### Lockable Resources

Shows resources that were locked or reserved during the build.

Example:

Preventing multiple builds from using the same server or environment simultaneously.

### Rebuild

Runs the build with the same or modified parameters.

### Open Blue Ocean

Opens the build in the Blue Ocean interface.

Blue Ocean provides a more visual representation of Pipeline stages and their execution status.

### Restart from Stage

Allows the Pipeline to be restarted from a particular stage instead of running the entire Pipeline from the beginning.

### Rebuild (Second Option)

Runs the same build again.

### Pipeline Steps

Shows detailed internal steps executed by the Jenkins Pipeline.

Useful for advanced debugging.

### Previous Build

Opens the build immediately before the current build.

### Next Build

Opens the build immediately after the current build, if one exists.
