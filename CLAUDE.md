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

- [write-tests] US-001: When testing React components that use requestAnimationFrame for fade-in effects, mock RAF in beforeEach but use a separate test with a manually-triggered RAF callback to verify the opacity transition from 0 to 1.
- [write-tests] US-001: SVG attribute stroke-width is rendered as a lowercase hyphenated attribute in JSDOM, so use getAttribute("stroke-width") rather than camelCase strokeWidth when querying path elements in tests.
- [build-user-story] US-001: When building an SVG rainbow arc with fade-in, use requestAnimationFrame in useEffect to trigger opacity transition from 0 to 1, ensuring the animation fires after the component mounts in the browser.
- [build-user-story] US-001: For semi-circular SVG arcs, the SVG arc command "M startX startY A r r 0 0 1 endX endY" with startX=cx-r and endX=cx+r produces a proper upper semi-circle (sweep-flag=1 goes clockwise, creating the top half).
- [build-user-story] US-001: viewBox padding should account for stroke-width to prevent arc clipping at edges; use cx*2+strokeWidth for width and cy+strokeWidth for height when arcs sit on the horizontal center line.
- [run-playwright] US-001: All 12 E2E tests passed on first run. The opacity transition test works by checking style.opacity after page load — requestAnimationFrame fires quickly enough that the opacity is already 1 when the test reads it. For the transition check, verify the inline style contains both "opacity" and "1s" substrings.
