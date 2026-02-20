# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Node.js project used for testing Claude Code agents. Entry point is `index.js`.

## Commands

- **Run**: `node index.js`

## Custom Agents

Agent definitions live in `.claude/agents/`

## Agent Skills Mapping

Skills to inject into subagents. The orchestrator reads this mapping and passes skill content inline to each agent type. Append `:full` to a skill name to load AGENTS.md (full rules with code examples) instead of the default SKILL.md (compact index).

| Agent              | Skills                             |
|--------------------|------------------------------------|
| `build-user-story` | `vercel-react-best-practices:full` |
| `run-playwright`   | `webapp-testing`                   |
| `run-lint`         |                                    |
| `run-typecheck`    |                                    |
| `write-tests`      |                                    |

## Learnings

- [build-user-story] US-001: The my-app directory lives at `/Users/david.g.lee/Documents/project-dev-builder/.worktrees/digital-clock/my-app` (not `.worktrees/my-app`) — always check the worktree branch name to derive the correct path.
- [build-user-story] US-001: `@/*` in tsconfig maps to `./src/*`, so `@/components/Footer` resolves to `src/components/Footer.tsx`.
- [build-user-story] US-001: DigitalClock is a client component (uses useState/useEffect) and must have `"use client"` directive at the top; Footer can remain a server component and just import DigitalClock.
- [write-tests] US-002: When clock splits time into separate text nodes (hh, colon span, mm, colon span, ss), `getByText("12:00:00")` fails — use `link.textContent` to check combined text; use `getAllByTestId("clock-colon")` to target colon spans.
