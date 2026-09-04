Development Agent Instructions

Core Development Workflow

For every development task, follow this workflow before submitting any work:

Inspect → Identify → Understand → Verify → Choose → Research → Implement → Test → Double-check

Do not blindly begin coding based on assumptions or memory.

---

1. Inspect the Repository First

Before making implementation changes:

- Inspect the relevant repository files and existing implementation.
- Understand the current architecture and how the affected feature works.
- Check existing components, utilities, services, configuration, and dependencies that may already solve part of the task.
- Identify potential dependencies between the requested change and other parts of the application.
- Avoid changing unrelated functionality.

Do not assume how the application is structured. Verify it from the repository.

---

2. Check the Relevant Libraries, Frameworks, Packages, APIs, and Tools

Before deciding how to implement the task, check which libraries, frameworks, packages, APIs, MCPs, and development tools are relevant and available in the repository/environment.

Inspect package manifests and configuration files to determine:

- Which libraries are installed.
- Which versions are installed.
- Which frameworks are being used.
- Which APIs or platform integrations are involved.
- Which existing project utilities or components may already provide the required functionality.
- Which connected MCPs/tools are relevant to the task.

Do not assume a library or version based on memory, training knowledge, or habit.

---

3. Understand the Relevance of the Libraries Before Choosing Them

Do not simply identify available libraries. Understand what the relevant libraries and tools are designed to do and determine how relevant each one is to the specific task before deciding which ones to use.

For each reasonable technology choice, consider:

- What problem the library/tool is designed to solve.
- Whether it actually applies to the requested task.
- Whether the project already uses it.
- Whether another installed library is better suited.
- Whether introducing a new dependency is necessary.
- Compatibility with the project's existing architecture and versions.
- Performance, maintainability, and reliability implications.

The agent must determine which library, tool, API, or combination of technologies is best suited to the task before implementing it.

Prefer the technology already established in the project when it is appropriate.

Do not introduce unnecessary dependencies simply because another library exists.

---

4. Use Context7 for Library Intelligence

Use Context7 whenever the task involves a library, framework, package, API, or other documented technology.

Context7 should be used to understand the technology before implementation, not merely after coding or when something goes wrong.

Use this sequence:

Identify the library → verify the installed version → resolve it in Context7 → retrieve the relevant documentation → understand the correct APIs and implementation patterns → choose the appropriate approach → implement.

Whenever possible:

- Research the exact installed version.
- Use focused documentation relevant to the actual task.
- Check the specific APIs, methods, lifecycle behavior, configuration, timing behavior, performance considerations, or integration patterns involved.
- Use the retrieved documentation to inform actual implementation decisions.

Do not rely solely on remembered APIs or generic knowledge when current, version-appropriate documentation is available through Context7.

If Context7 cannot resolve the required library or technology, use its authoritative documentation/source instead and clearly account for that limitation.

---

5. Context7 Must Be Meaningful

Do not make a token Context7 call simply to satisfy a requirement.

The information retrieved through Context7 must actually influence the implementation or technology decision where applicable.

The agent should be able to explain, when useful:

- Which relevant libraries were identified.
- Which versions are installed.
- Which libraries were researched.
- What was learned from the documentation.
- Why the selected library/tool/approach was appropriate.

---

6. Use All Relevant MCPs and Tools Properly

All connected MCPs and development tools that are relevant to the task must be actually called and meaningfully used.

Do not:

- Merely connect an MCP.
- Mention an MCP without using it.
- Make a token call just to satisfy a requirement.
- Use the wrong MCP simply because it is available.

Each MCP/tool should be used for the work it is best suited to perform.

For example:

- Use Context7 for current, version-specific library/framework/API documentation and implementation guidance.
- Use database-specific tools for database inspection or database work.
- Use design/prototyping tools for relevant design or UI investigation.
- Use repository/code tools for repository inspection and code changes.
- Use testing/browser tools when they are relevant to validating the actual user experience.

Do not use Neon as a substitute for Context7 when the task is about understanding or researching a library, framework, package, API, or implementation pattern.

Use every relevant connected MCP for its actual purpose.

---

7. Choose the Best Implementation Approach

After inspecting the repository, understanding the available technologies, verifying versions, and researching the relevant documentation:

Choose the best technology and implementation approach before writing the code.

The selected approach should:

- Fit the existing architecture.
- Use appropriate existing dependencies where possible.
- Match the installed versions.
- Follow current documented APIs.
- Avoid unnecessary complexity.
- Avoid unnecessary dependencies.
- Consider performance and maintainability.
- Solve the actual requested problem rather than merely masking symptoms.

If multiple approaches are viable, select the one that provides the best balance of correctness, maintainability, compatibility, and performance.

---

8. Implement the Requested Changes

Once the approach has been established:

- Implement the requested functionality.
- Keep changes focused on the actual task.
- Preserve existing working functionality.
- Follow the project's existing coding patterns where appropriate.
- Do not make unrelated refactors unless they are necessary to correctly complete the task.
- Use the libraries and tools selected during the investigation.
- Follow the relevant documentation researched through Context7.

For visual, interactive, animation, audio, or UX work, evaluate the complete user experience rather than checking only whether the code technically executes.

---

9. Test the Implementation

After implementation, test the affected functionality.

Depending on the task, this may include:

- Running the appropriate test suite.
- Running linting/type checks.
- Running a production build.
- Testing affected routes/components.
- Testing browser behavior.
- Testing responsive/mobile behavior.
- Testing performance.
- Testing animations and timing.
- Testing audio synchronization.
- Testing error and edge cases.
- Checking that existing functionality still works.

Do not consider the task complete merely because the code compiles.

---

10. Double-Check the Finished Work

Before submitting any fix or change, thoroughly double-check the completed implementation.

Verify:

- The requested problem was actually solved.
- The implementation matches the intended behavior.
- The selected libraries/tools were appropriate.
- The APIs used match the installed versions.
- Context7 guidance was followed where applicable.
- Relevant MCPs were actually used.
- No unnecessary dependencies were introduced.
- No unrelated functionality was broken.
- Tests/builds/checks pass where applicable.
- The final user experience matches the requested result.

If the task involves UI, animation, audio, or interaction, inspect the finished result rather than relying solely on the source code or build output.

Fix problems discovered during this final verification before submitting.

---

11. Do Not Stop at the First Working Version

A technically functioning implementation is not automatically a finished implementation.

After the initial implementation, ask:

- Does it actually feel correct?
- Does it behave correctly under realistic conditions?
- Are timing and synchronization correct?
- Is the user experience polished?
- Is performance acceptable?
- Are there visual or audio artifacts?
- Are there unnecessary effects or regressions?
- Does the implementation make proper use of the selected technology?

Where appropriate, improve issues discovered during verification before submitting.

---

12. Universal Rule

These instructions apply to every development task, regardless of feature or technology.

They are not limited to a particular project, page, component, animation, or feature.

The fundamental rule is:

Never blindly code against a library or technology.

For every task:

Inspect the repository → Check the relevant libraries and tools → Understand their relevance → Verify installed versions → Research with Context7 → Determine the best technology/approach → Implement → Test → Thoroughly double-check → Submit.

The goal is not simply to produce code that works.

The goal is to produce the correct implementation using the right technology, the correct version-specific APIs, the appropriate connected tools, and a properly verified result.
