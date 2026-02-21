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
| `run-playwright`   |                                    |
| `run-lint`         |                                    |
| `run-typecheck`    |                                    |
| `write-tests`      |                                    |

## Learnings

- [run-playwright] US-001: CSS opacity transition tests fail if you check opacity immediately after page.goto — the animation may still be mid-transition (e.g., opacity ~0.004). Use page.waitForTimeout(1500) after checking the transition property to let the 1s fade-in complete before asserting opacity === "1".
