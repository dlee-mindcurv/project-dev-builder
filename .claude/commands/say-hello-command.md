---
name: say-hello-command
allowed-tools: Read, Write, Edit, Exit, Grep, Glob, Task, Bash
argument-hint: [path to prd.json]
---

# Say Hello Command

## Bootstrap
- set `$PRD_JSON` to the first argument passed to the command
- set `$STOP_LOOP_PROMISE` to "JOBS_COMPLETE"

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

1. Use Bash to run `jq` against `jobs.json` (where `$APP_DIR` is the project root) to read each job's `userStories`'s `id`,`acceptanceCriteria`,`model`,`passes`, and `agents` status:
   ```
   jq -r 'first(.userStories | to_entries[] | select(.value.passes == false)) // empty | "\(.key) \(.value.id) \(.value.model) \(.value.passes) \(.value.agents | map("\(.name):\(.status):\(.dependsOn)") | join(","))"' "jobs.json"
   ```

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
   - Skill content: include any `<skill>` blocks resolved for this agent type from the Provisioned Agent step. Wrap each skill's content as: `<skill name="skill-name">\n[file content]\n</skill>`
   - Use Bash to DISPATCH a provisioned agent with its associated skills.
   - **CRITICAL**: Every agent prompt MUST include the following: 
     - `Feature file: $PRD_JSON` 
     - Story's acceptance criteria
   - Analyze the output of the agent to determine if it succeeded or failed.
   - If the agent succeeded, update the `jobs.json` file with the agent's name and `"status":"done"`. When updating `jobs.json`, use the story index (`STORY_INDEX`) to target the specific story. For example: `.userStories[INDEX].agents[] | select(.name == "AGENT_NAME")` — **never** use `.userStories[].agents[]` (which updates all stories).


## All Stories Complete
1. Output no more stories available to be processed: <promise>`$STOP_LOOP_PROMISE`<promise>"
2. Remove the `.claude/ralph-loop.local.md` file (if exists)
3. Display a combined report showing each agent from the skills mapping table along with:
    - Its assigned skills (from CLAUDE.md)
    - Its job status (from jobs.json), or "no job found" if the agent isn't listed in jobs.json

      Format the output as a readable markdown table:

      | Agent | Skills | Job Status |
      |-------|--------|------------|
      | ... | ... | ... |
4. Exit the script