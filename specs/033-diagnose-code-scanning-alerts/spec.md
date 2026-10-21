# Feature Specification: Diagnose Code Scanning Alerts Access

## Overview

Diagnose Jules's inability to retrieve and process GitHub CODE SCANNING ALERTS in Luckypickcanada, determine whether an additional GitHub credential or permission is genuinely required, and establish the precise evidence-based remedy.

## Target Audience

- The repository owner (David) who needs to authorize and configure the correct permissions.

## Business Goals & Success Criteria

- **Goal 1:** Identify the exact failure point preventing Code Scanning Alerts access.
- **Goal 2:** Establish the required GitHub permissions based on official GitHub API documentation.
- **Goal 3:** Determine the minimum required fix, distinguishing between the need for a separate credential (e.g., PAT) or modifying the Jules GitHub App installation.
- **Success Criteria 1:** The diagnosis must provide a verified, evidence-backed explanation for the 401 Unauthorized errors observed when accessing the `/code-scanning/alerts` endpoint.
- **Success Criteria 2:** The PR summary clearly states the exact required action (if any) the owner must take to grant Jules access.

## Core Features & Requirements

1. **Reproduce the Failure:** Verify the inability to access Code Scanning alerts.
2. **Verify Permissions:** Check GitHub documentation for the specific permissions needed to read and update code scanning alerts.
3. **Compare Access:** Explain why Dependabot alerts might succeed while Code Scanning alerts fail, if applicable to Jules's current authentication state.
4. **Determine Remedy:** Provide the precise remedy supported by the evidence, detailing the type of token/credential required, minimum permissions, and where it must be configured.

## Assumptions & Dependencies

- The task is strictly diagnostic. No credentials, permissions, or repository settings will be changed during this task.
- Application source code will not be modified.
- The outcome will dictate the prerequisites for a future remediation phase.
