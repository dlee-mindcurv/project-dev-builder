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

- [write-tests] US-002: When the DigitalClock component was updated to use separate span elements for colons (with visibility toggling), existing tests using `screen.getByText("HH:MM:SS")` broke because the text is now split across multiple DOM nodes. Use `clockDiv?.textContent` to check the combined text content instead of `getByText` for split text nodes.
