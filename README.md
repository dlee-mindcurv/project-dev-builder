# project-dev-builder

An agent orchestration framework for [Claude Code](https://claude.ai/code) that drives feature development from JSON-based PRDs (Product Requirement Documents) through a pipeline of specialized agents.

## How It Works

Define your feature as a PRD JSON file with user stories and acceptance criteria. The orchestrator command dispatches a sequence of agents — each responsible for one phase of the development lifecycle — and tracks their progress in the PRD itself.

### Agent Pipeline

Each user story is processed through these agents in order:

| Agent | Role |
|-------|------|
| `build-user-story` | Implements the feature code based on acceptance criteria |
| `run-playwright` | Writes and runs E2E tests to validate the UI |
| `run-lint` | Runs the linter and fixes violations |
| `run-typecheck` | Runs TypeScript type checking and fixes errors |
| `write-tests` | Writes and runs unit tests |

### Skill Injection

Agents can receive external skill documents at dispatch time. The mapping is defined in `CLAUDE.md`:

| Agent | Skills |
|-------|--------|
| `build-user-story` | `vercel-react-best-practices:full` |
| `run-playwright` | `webapp-testing` |

Skills are resolved from `~/.agents/skills/`, `~/.claude/skills/`, or local `.agents/skills/` directories. Append `:full` to load the full `AGENTS.md` instead of the compact `SKILL.md`.

## Project Structure

```
.claude/
  agents/              # Agent definitions (build, playwright, lint, typecheck, tests)
  commands/            # Orchestrator command (create-feature-from-json)
product-development/
  features/
    <feature-name>/
      prd.json         # PRD with user stories, acceptance criteria, and agent statuses
      agent-log.json   # Timestamped log of agent runs
my-app/                # Example Next.js application used as a build target
```

## Usage

### 1. Define a PRD

Create a JSON file under `product-development/features/<feature-name>/prd.json`:

```json
{
  "project": "MyProject",
  "appDir": "./my-app",
  "userStories": [
    {
      "id": "US-001",
      "title": "Feature Title",
      "acceptanceCriteria": ["..."],
      "passes": false,
      "agents": [
        { "name": "build", "agent": "build-user-story", "status": "pending", "dependsOn": null },
        { "name": "playwright", "agent": "run-playwright", "status": "pending", "dependsOn": "build" },
        { "name": "lint", "agent": "run-lint", "status": "pending", "dependsOn": "playwright" },
        { "name": "typecheck", "agent": "run-typecheck", "status": "pending", "dependsOn": "lint" },
        { "name": "test", "agent": "write-tests", "status": "pending", "dependsOn": "typecheck" }
      ]
    }
  ]
}
```

### 2. Run the orchestrator

```
/create-feature-from-json product-development/features/<feature-name>/prd.json
```

The orchestrator will:
1. Find the first story with `passes: false`
2. Dispatch agents sequentially, respecting `dependsOn` chains
3. Inject resolved skills into each agent's prompt
4. Log each agent run to `agent-log.json`
5. Mark the story as `passes: true` when all agents complete
6. Repeat for the next story

### 3. Autonomous mode (Ralph Loop)

For fully autonomous runs, use the Ralph Wiggum loop:

```
/ralph-wiggum:ralph-loop "/create-feature-from-json product-development/features/<feature-name>/prd.json" --completion-promise JOBS_COMPLETE
```

This creates a self-referential loop that re-runs the command until all stories pass.

## Git Worktree Support

The orchestrator detects worktrees at `.worktrees/<feature-name>/` and automatically adjusts the app directory and learnings file paths for isolated development.

## License

Private
