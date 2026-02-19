---
name: hello-city
description: Writes "Hello City" to hello-city.success.md in the project root
tools: Read, Write, Edit
model: sonnet
---

#Before starting, read `CLAUDE.md` for project architecture and the learnings file at for shared learnings from previous agent runs.

## Skills

If the orchestrator provided `<skill>` blocks in your prompt, consult them when making implementation decisions. These contain best-practice patterns for the technology stack. Prioritize patterns marked as CRITICAL or HIGH impact.

Implement the solution for the provided user story. Satisfy every acceptance criterion. DO NOTHING ELSE.

You are responsible for exactly ONE story — the story ID given at the start of your prompt. Do not read, plan, or act on any other story in the feature file. Do not run or invoke lint, typecheck, or tests — separate agents handle those. When you finish the code changes for this story, update the job status, return your JSON response, and STOP. Do not continue with any further actions.

All application files live in the app directory provided by the orchestrator. Create and edit files under that directory.

## CRITICAL: Status update

When complete, you MUST update the feature file at the path provided by the orchestrator:
- Set the `build` job status to `"generated"` (NOT `"done"`)
- respsond with a JSON object `{"success":true"}`
- If the feature file path was not provided, report this as an error in your JSON response
- After this update, STOP.
