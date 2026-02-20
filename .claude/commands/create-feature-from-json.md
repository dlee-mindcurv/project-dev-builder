---
name: create-feature-from-json
allowed-tools: Read, Write, Edit, Exit, Grep, Glob, Task, Bash
argument-hint: [path to prd.json]
---

# Say Hello Command

## Bootstrap
- Set `$PRD_JSON` to the first argument passed to the command. If the argument does not end in `.json`, treat it as a directory and append `/prd.json` to it.
- Derive the feature-name from `$PRD_JSON` (e.g., for `product-development/features/pink-footer/prd.json`, the feature-name is `pink-footer`).
- Derive the feature-directory from `$PRD_JSON` (e.g., for `product-development/features/pink-footer/prd.json`, the feature-directory is `product-development/features/pink-footer/`).
- Set `$STOP_LOOP_PROMISE` to "JOBS_COMPLETE"
- Set `$LOG_FILE` to `<feature-directory>/agent-log.json`
- Set `$LEARNINGS_FILE` to `<feature-directory>/LEARNINGS.md`

## Rules
- Each agent MUST receive `$PRD_JSON` in its prompt so it may update its own status.
- ONLY ONE Story's agents can be provisioned at a time.
- Do NOT run agents in parallel
- Do NOT modify any source files unless explicitly instructed
- ONLY use tools explicitly mentioned in the steps
- Do NOT take initiative or deviate from the steps outlined in this document.


## Skill resolution

Read the **Agent Skills Mapping** table from `CLAUDE.md`

## Steps

1. Use Bash to run `jq` against `$PRD_JSON` to read each job's `userStories`'s `id`,`appDir`,`branchName`, `acceptanceCriteria`,`model`,`passes`, and `agents` status:
   ```
   jq -r 'first(.userStories | to_entries[] | select(.value.passes == false)) // empty | "\(.key) \(.value.id) \(.value.model) \(.value.passes) \(.value.agents | map("\(.name):\(.status):\(.dependsOn)") | join(","))"' "jobs.json"
   ```
- set `$APP_DIR` to the `appDir` of the job

- Run a single consolidated status query:
```bash
jq '{
  branchName: ([.branchName] | @tsv),
  featureDescription: ([.description] | @tsv),
  freshStart: ([.userStories[0].agents[].status] | all(. == "pending")),
}' $PRD_JSON
```
If `freshStart` is `true` (or if `$LOG_FILE` doesn't exist), create/reset `$LOG_FILE` to `[]`.

## Git Worktree detection **CRITICAL**
- Check if a worktree exists at `.worktrees/<feature-name>/`. If it does:
  - prepend `.worktrees/` to `$APP_DIR` (e.g for `./myApp` the new value is `.worktrees/myApp`)
  - Set `$LEARNINGS_FILE` to `.worktrees/<feature-name>/LEARNINGS.md`

## Provision Story
   - If no user story is available with a `passes:false` status (jq output is empty), jump to **All Stories Complete** task, **DOING NOTHING ELSE**
   - The jq output fields are: `STORY_INDEX ID MODEL PASSES AGENTS`. Record the story's array index (the first field, `STORY_INDEX`). Use this index in **all** subsequent jq updates to target only this story's agents.
   - Select the first story in the list with `passes:false` for provisioning **ONLY PROVISION THIS USER STORY**.
   

## Provision Agents

   - Read the `agents` of the **Provisioned Story**
   - If no agents are available with a `"status":"pending"` status:
     1. Set `passes:true` of the **Provisioned Story** in the `jobs.json` file
     2. Output "No more jobs for `{userStory.name}` available to be processed"
     3. jump to **All Stories Complete** task, **DOING NOTHING ELSE**
   
   - If at least one agent is available with a `"status":"pending"` status, **ONLY PROVISION THIS AGENT** if its `dependOn` value dependancy's `"complete":"pending"` status is `done` OR if its `dependOn` value is `null`. 
   - For **Provisioned Agent**:
       1. Parse each skill entry: if it ends with `:full`, strip the suffix and set target to `AGENTS.md`; otherwise set target to `SKILL.md`
       2. Resolve the file path in order:
          - `$HOME/.agents/skills/<skill-name>/<target>` (primary)
          - `$HOME/.claude/skills/<skill-name>/<target>` (fallback location 1)
          - `.agents/skills/<skill-name>/<target>` (fallback location 2)
          - `.claude/skills/<skill-name>/<target>` (fallback location 3)
          - If the target file doesn't exist at either location, try the other file (AGENTS.md → SKILL.md or vice versa) at both locations
       3. Read the resolved file content
       4. If not found at any location, log a warning but continue without that skill
       5. Store resolved skills as a mapping of agent type → list of `{name, content}` pairs for use during DISPATCH.
     
## Dispatch Agents
   - Before dispatching agent, capture: `BATCH_START=$(date -u +%Y-%m-%dT%H:%M:%SZ)`
   - Skill content: include any `<skill>` blocks resolved for this agent type from the Provisioned Agent step. Wrap each skill's content as: `<skill name="skill-name">\n[file content]\n</skill>`
   - Use Bash to DISPATCH a provisioned agent with its associated skills.
   - **CRITICAL**: Every agent prompt MUST include the following:
     - **begin with:** `Your assigned story is {id} ("{title}"). Work ONLY on this story — do not implement, plan, or act on any other story.`
     - Story's acceptance criteria
     - `Feature file: $PRD_JSON`
     - Application directory: `$APP_DIR`
     - `$LEARNINGS_FILE` — the learnings file path, which may be in a worktree (for reading/writing learnings)
   - After agent dispatch response, capture: `BATCH_END=$(date -u +%Y-%m-%dT%H:%M:%SZ)`.

# Write log entries

For each agent that ran, parse its JSON response. Construct a log entry object with:
- `storyId`, `job`, `agent` from the dispatch context
- `status`, `iterations`, `error` from the agent's JSON response
- `startedAt`/`finishedAt` from the agent's JSON response; if either is `null`, substitute `$BATCH_START`/`$BATCH_END` respectively

Read `$LOG_FILE`, append the new entries to the array, and write it back.



## All Stories Complete

### Pre git cleanup
1. Read `$LEARNINGS_FILE`, If it contains findings beyond the initial template (i.e., not just "(none yet)"), read the worktree's `CLAUDE.md` at `$APP_DIR/CLAUDE.md` and append the learnings to a `## Learnings` section at the bottom. If the section already exists, merge the new findings into it. Write the updated file back to CLAUDE.md.
2. Output no more stories available to be processed: <promise>`$STOP_LOOP_PROMISE`<promise>"
3. Remove the `.claude/ralph-loop.local.md` file (if exists)
4. Display a combined report showing each agent from the skills mapping table along with:
    - Its assigned skills (from CLAUDE.md)
    - Its job status (from jobs.json), or "no job found" if the agent isn't listed in jobs.json

      Format the output as a readable markdown table:

      | Agent | Skills | Job Status | Iterations|
      |-------|--------|------------|-----------|
      | ... | ... | ... |...|

### Commit changes and create a PR
1. Stage app changes: "git -C `$APP_DIR` add <original-appDir>/"
2. Stage CLAUDE.md if it was modified: "git -C  `$APP_DIR` add CLAUDE.md"
3. Check if there are staged changes: "git -C  `$APP_DIR` diff --cached --quiet". If there are **no** staged changes, skip steps 4-6 (nothing to commit/push/PR) and proceed to "Exit Claude".
4. Commit: 'git -C `$APP_DIR` commit -m "feat(<feature-name>): `featureDescription`"'
5. Push: "git -C `$APP_DIR` push -u origin `$branchName`"
6. Create PR (only if one doesn't already exist for `branchName`)

### Exit Claude
- run `/exit`