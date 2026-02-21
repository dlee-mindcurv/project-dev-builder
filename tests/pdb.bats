#!/usr/bin/env bats

PDB="$BATS_TEST_DIRNAME/../pdb"

setup() {
  TEST_DIR=$(mktemp -d)
  FEATURE_DIR="$TEST_DIR/my-feature"
  mkdir -p "$FEATURE_DIR"
  create_fixture_prd
}

teardown() {
  rm -rf "$TEST_DIR"
}

create_fixture_prd() {
  cat > "$FEATURE_DIR/prd.json" <<'JSON'
{
  "project": "TestProject",
  "appDir": "./my-app",
  "branchName": "feature/test",
  "description": "A test feature for BATS",
  "userStories": [
    {
      "id": "US-001",
      "title": "First Story",
      "description": "First user story",
      "acceptanceCriteria": ["criterion 1"],
      "priority": 1,
      "model": "haiku",
      "passes": true,
      "notes": "some notes",
      "agents": [
        {
          "name": "build",
          "agent": "build-user-story",
          "status": "done",
          "dependsOn": null,
          "notes": "built ok"
        },
        {
          "name": "lint",
          "agent": "run-lint",
          "status": "done",
          "dependsOn": "build",
          "notes": ""
        },
        {
          "name": "test",
          "agent": "write-tests",
          "status": "failed",
          "dependsOn": "lint",
          "notes": "test failed"
        }
      ]
    },
    {
      "id": "US-002",
      "title": "Second Story",
      "description": "Second user story",
      "acceptanceCriteria": ["criterion A"],
      "priority": 2,
      "model": "haiku",
      "passes": false,
      "notes": "",
      "agents": [
        {
          "name": "build",
          "agent": "build-user-story",
          "status": "pending",
          "dependsOn": null,
          "notes": ""
        },
        {
          "name": "playwright",
          "agent": "run-playwright",
          "status": "skipped",
          "dependsOn": "build",
          "notes": ""
        }
      ]
    }
  ]
}
JSON
}

# --- --help tests ---

@test "--help prints usage" {
  run "$PDB" --help
  [ "$status" -eq 0 ]
  [[ "$output" == *"Usage: pdb"* ]]
}

@test "-h prints usage" {
  run "$PDB" -h
  [ "$status" -eq 0 ]
  [[ "$output" == *"Usage: pdb"* ]]
}

# --- no args ---

@test "no args exits 1 and shows usage" {
  run "$PDB"
  [ "$status" -eq 1 ]
  [[ "$output" == *"Usage: pdb"* ]]
}

# --- unknown option ---

@test "unknown option exits 1 with error" {
  run "$PDB" --bogus
  [ "$status" -eq 1 ]
  [[ "$output" == *"unknown option"* ]]
}

# --- --reset tests ---

@test "--reset resets all passes to false and agents to pending" {
  run "$PDB" --reset "$FEATURE_DIR"
  [ "$status" -eq 0 ]

  # Verify all passes are false
  local passes_true
  passes_true=$(jq '[.userStories[] | select(.passes == true)] | length' "$FEATURE_DIR/prd.json")
  [ "$passes_true" -eq 0 ]

  # Verify all agent statuses are pending
  local non_pending
  non_pending=$(jq '[.userStories[].agents[] | select(.status != "pending")] | length' "$FEATURE_DIR/prd.json")
  [ "$non_pending" -eq 0 ]
}

@test "--reset preserves other fields" {
  run "$PDB" --reset "$FEATURE_DIR"
  [ "$status" -eq 0 ]

  # Check structural fields are preserved
  local project id1 title1 notes1 agent_notes dep
  project=$(jq -r '.project' "$FEATURE_DIR/prd.json")
  [ "$project" = "TestProject" ]

  id1=$(jq -r '.userStories[0].id' "$FEATURE_DIR/prd.json")
  [ "$id1" = "US-001" ]

  title1=$(jq -r '.userStories[0].title' "$FEATURE_DIR/prd.json")
  [ "$title1" = "First Story" ]

  notes1=$(jq -r '.userStories[0].notes' "$FEATURE_DIR/prd.json")
  [ "$notes1" = "some notes" ]

  agent_notes=$(jq -r '.userStories[0].agents[0].notes' "$FEATURE_DIR/prd.json")
  [ "$agent_notes" = "built ok" ]

  dep=$(jq -r '.userStories[0].agents[1].dependsOn' "$FEATURE_DIR/prd.json")
  [ "$dep" = "build" ]
}

@test "--reset errors when feature-path is missing" {
  run "$PDB" --reset
  [ "$status" -eq 1 ]
}

@test "--reset errors when prd.json does not exist" {
  local empty_dir="$TEST_DIR/empty-feature"
  mkdir -p "$empty_dir"
  run "$PDB" --reset "$empty_dir"
  [ "$status" -eq 1 ]
  [[ "$output" == *"prd.json not found"* ]]
}

# --- --status tests ---

@test "--status shows story IDs" {
  run "$PDB" --status "$FEATURE_DIR"
  [ "$status" -eq 0 ]
  [[ "$output" == *"US-001"* ]]
  [[ "$output" == *"US-002"* ]]
}

@test "--status shows agent status labels" {
  run "$PDB" --status "$FEATURE_DIR"
  [ "$status" -eq 0 ]
  [[ "$output" == *"done"* ]]
  [[ "$output" == *"pending"* ]]
  [[ "$output" == *"failed"* ]]
  [[ "$output" == *"skipped"* ]]
}

@test "--status shows summary counts" {
  run "$PDB" --status "$FEATURE_DIR"
  [ "$status" -eq 0 ]
  [[ "$output" == *"1/2 stories passed"* ]]
  [[ "$output" == *"2 done"* ]]
  [[ "$output" == *"1 pending"* ]]
  [[ "$output" == *"1 failed"* ]]
  [[ "$output" == *"1 skipped"* ]]
}

@test "--status errors when feature-path is missing" {
  run "$PDB" --status
  [ "$status" -eq 1 ]
}

# --- cmd_run pre-flight tests ---

@test "cmd_run errors when claude CLI is not in PATH" {
  # Use env to clear PATH so claude can't be found, but keep bash/env available
  run env PATH=/usr/bin:/bin "$PDB" "$FEATURE_DIR"
  [ "$status" -eq 1 ]
  [[ "$output" == *"Claude Code CLI is required"* ]]
}

# --- --list tests ---

create_features_tree() {
  local feat_a="$TEST_DIR/product-development/features/feat-a"
  local feat_b="$TEST_DIR/product-development/features/feat-b"
  mkdir -p "$feat_a" "$feat_b"

  cat > "$feat_a/prd.json" <<'JSON'
{
  "project": "AlphaApp",
  "userStories": [
    { "id": "US-001", "title": "Story A1", "passes": true, "agents": [] },
    { "id": "US-002", "title": "Story A2", "passes": false, "agents": [] }
  ]
}
JSON

  cat > "$feat_b/prd.json" <<'JSON'
{
  "project": "BetaApp",
  "userStories": [
    { "id": "US-001", "title": "Story B1", "passes": true, "agents": [] },
    { "id": "US-002", "title": "Story B2", "passes": true, "agents": [] },
    { "id": "US-003", "title": "Story B3", "passes": false, "agents": [] }
  ]
}
JSON
}

@test "--list shows feature names" {
  create_features_tree
  cd "$TEST_DIR"
  run "$PDB" --list
  [ "$status" -eq 0 ]
  [[ "$output" == *"feat-a"* ]]
  [[ "$output" == *"feat-b"* ]]
}

@test "--list shows project names" {
  create_features_tree
  cd "$TEST_DIR"
  run "$PDB" --list
  [ "$status" -eq 0 ]
  [[ "$output" == *"AlphaApp"* ]]
  [[ "$output" == *"BetaApp"* ]]
}

@test "--list shows pass counts" {
  create_features_tree
  cd "$TEST_DIR"
  run "$PDB" --list
  [ "$status" -eq 0 ]
  [[ "$output" == *"1/2 passed"* ]]
  [[ "$output" == *"2/3 passed"* ]]
}

@test "--list errors when features directory does not exist" {
  cd "$TEST_DIR"
  run "$PDB" --list
  [ "$status" -eq 1 ]
  [[ "$output" == *"directory not found"* ]]
}

# --- cmd_run pre-flight tests ---

@test "cmd_run errors when ralph-wiggum plugin is missing" {
  # Create a mock claude in a temp bin dir
  local mock_bin="$TEST_DIR/mock-bin"
  mkdir -p "$mock_bin"
  cat > "$mock_bin/claude" <<'SH'
#!/usr/bin/env bash
exit 0
SH
  chmod +x "$mock_bin/claude"

  # Override HOME so the plugin check fails
  run env PATH="$mock_bin:/usr/bin:/bin" HOME="$TEST_DIR" "$PDB" "$FEATURE_DIR"
  [ "$status" -eq 1 ]
  [[ "$output" == *"ralph-wiggum"* ]]
}

# --- --help mentions new commands ---

@test "--help mentions --sessions" {
  run "$PDB" --help
  [ "$status" -eq 0 ]
  [[ "$output" == *"--sessions"* ]]
}

@test "--help mentions --attach" {
  run "$PDB" --help
  [ "$status" -eq 0 ]
  [[ "$output" == *"--attach"* ]]
}

@test "--help mentions --kill" {
  run "$PDB" --help
  [ "$status" -eq 0 ]
  [[ "$output" == *"--kill"* ]]
}

@test "--help mentions --cleanup" {
  run "$PDB" --help
  [ "$status" -eq 0 ]
  [[ "$output" == *"--cleanup"* ]]
}

# --- argument validation for new commands ---

@test "--attach errors when feature-name is missing" {
  run "$PDB" --attach
  [ "$status" -eq 1 ]
  [[ "$output" == *"feature-name is required"* ]]
}

@test "--kill errors when feature-name is missing" {
  run "$PDB" --kill
  [ "$status" -eq 1 ]
  [[ "$output" == *"feature-name is required"* ]]
}

@test "--cleanup errors when feature-name is missing" {
  run "$PDB" --cleanup
  [ "$status" -eq 1 ]
  [[ "$output" == *"feature-name is required"* ]]
}

# --- tmux-dependent commands without tmux ---

@test "--sessions errors when tmux is not installed" {
  run env PATH=/usr/bin:/bin "$PDB" --sessions
  [ "$status" -eq 1 ]
  [[ "$output" == *"tmux is not installed"* ]]
}

@test "--attach errors when tmux is not installed" {
  run env PATH=/usr/bin:/bin "$PDB" --attach my-feature
  [ "$status" -eq 1 ]
  [[ "$output" == *"tmux is not installed"* ]]
}

@test "--kill errors when tmux is not installed" {
  run env PATH=/usr/bin:/bin "$PDB" --kill my-feature
  [ "$status" -eq 1 ]
  [[ "$output" == *"tmux is not installed"* ]]
}

# --- cmd_run additional pre-flight tests ---

@test "cmd_run errors when branchName is missing from prd.json" {
  # Create a prd.json without branchName
  cat > "$FEATURE_DIR/prd.json" <<'JSON'
{
  "project": "TestProject",
  "appDir": "./my-app",
  "description": "Missing branchName",
  "userStories": []
}
JSON

  # Mock claude and plugin so we get past those checks
  local mock_bin="$TEST_DIR/mock-bin"
  mkdir -p "$mock_bin"
  cat > "$mock_bin/claude" <<'SH'
#!/usr/bin/env bash
exit 0
SH
  chmod +x "$mock_bin/claude"

  local plugin_dir="$TEST_DIR/.claude/plugins/marketplaces/claude-code-plugins/plugins/ralph-wiggum"
  mkdir -p "$plugin_dir"

  run env PATH="$mock_bin:/usr/bin:/bin" HOME="$TEST_DIR" "$PDB" "$FEATURE_DIR"
  [ "$status" -eq 1 ]
  [[ "$output" == *"branchName not found"* ]]
}

@test "cmd_run errors when jq is not in PATH" {
  # Mock claude but exclude jq from PATH
  local mock_bin="$TEST_DIR/mock-bin"
  mkdir -p "$mock_bin"
  cat > "$mock_bin/claude" <<'SH'
#!/usr/bin/env bash
exit 0
SH
  chmod +x "$mock_bin/claude"

  # PATH with mock claude but without jq (only /usr/bin:/bin may have it, so use empty + mock)
  # We need bash and basic utils but not jq. Create a minimal PATH.
  local restricted_bin="$TEST_DIR/restricted-bin"
  mkdir -p "$restricted_bin"
  # Link only essential commands (not jq)
  for cmd in env bash dirname basename realpath mkdir cat chmod; do
    local cmd_path
    cmd_path=$(command -v "$cmd" 2>/dev/null || true)
    if [[ -n "$cmd_path" ]]; then
      ln -sf "$cmd_path" "$restricted_bin/$cmd"
    fi
  done

  run env PATH="$mock_bin:$restricted_bin" "$PDB" "$FEATURE_DIR"
  [ "$status" -eq 1 ]
  [[ "$output" == *"jq"* ]]
}

# --- worktree + session lifecycle (temp git repo) ---

setup_git_repo() {
  ORIGIN_DIR=$(mktemp -d)
  git -C "$ORIGIN_DIR" init --bare --quiet
  REPO_DIR=$(mktemp -d)
  git clone --quiet "$ORIGIN_DIR" "$REPO_DIR"
  git -C "$REPO_DIR" config user.email "test@test.com"
  git -C "$REPO_DIR" config user.name "Test"
  git -C "$REPO_DIR" commit --allow-empty -m "init" --quiet
  git -C "$REPO_DIR" push --quiet origin main 2>/dev/null || \
    git -C "$REPO_DIR" push --quiet origin master 2>/dev/null

  # Create feature dir inside the cloned repo
  REPO_FEATURE_DIR="$REPO_DIR/my-feature"
  mkdir -p "$REPO_FEATURE_DIR"
  cat > "$REPO_FEATURE_DIR/prd.json" <<'JSON'
{
  "project": "WorktreeTest",
  "appDir": "./app",
  "branchName": "feature/wt-test",
  "description": "Worktree lifecycle test",
  "userStories": []
}
JSON
  git -C "$REPO_DIR" add -A
  git -C "$REPO_DIR" commit -m "add feature" --quiet
  git -C "$REPO_DIR" push --quiet 2>/dev/null || true
}

teardown_git_repo() {
  rm -rf "$ORIGIN_DIR" "$REPO_DIR"
}

@test "cmd_run creates worktree directory" {
  setup_git_repo

  # Mock claude and plugin
  local mock_bin="$REPO_DIR/mock-bin"
  mkdir -p "$mock_bin"
  cat > "$mock_bin/claude" <<'SH'
#!/usr/bin/env bash
exit 0
SH
  chmod +x "$mock_bin/claude"

  local plugin_dir="$REPO_DIR/.claude/plugins/marketplaces/claude-code-plugins/plugins/ralph-wiggum"
  mkdir -p "$plugin_dir"

  # Run from the cloned repo (which is a real git repo with an origin)
  cd "$REPO_DIR"
  # Use restricted PATH without tmux so it falls through to foreground exec,
  # but we need to prevent exec from actually running claude.
  # Instead, just check that the worktree was created by calling ensure_worktree directly.
  run bash -c "
    source '$PDB'_not_exists 2>/dev/null
    cd '$REPO_DIR'
    source /dev/stdin <<'FUNCS'
$(sed -n '/^ensure_worktree/,/^}/p' "$PDB")
FUNCS
    WORKTREE_DIR='.worktrees'
    ensure_worktree 'my-feature' 'feature/wt-test'
  "
  [ "$status" -eq 0 ]
  [ -d "$REPO_DIR/.worktrees/my-feature" ]

  # Clean up
  git -C "$REPO_DIR" worktree remove .worktrees/my-feature --force 2>/dev/null || true
  teardown_git_repo
}

@test "cmd_run reuses existing valid worktree" {
  setup_git_repo
  cd "$REPO_DIR"

  # Create worktree first time
  git worktree add .worktrees/my-feature -b feature/wt-test 2>/dev/null

  # Call ensure_worktree - should print "Reusing"
  run bash -c "
    cd '$REPO_DIR'
    WORKTREE_DIR='.worktrees'
    $(sed -n '/^ensure_worktree/,/^}/p' "$PDB")
    ensure_worktree 'my-feature' 'feature/wt-test'
  "
  [ "$status" -eq 0 ]
  [[ "$output" == *"Reusing"* ]]

  # Clean up
  git -C "$REPO_DIR" worktree remove .worktrees/my-feature --force 2>/dev/null || true
  teardown_git_repo
}

@test "cmd_cleanup removes worktree" {
  setup_git_repo
  cd "$REPO_DIR"

  # Create a worktree
  git worktree add .worktrees/my-feature -b feature/wt-test 2>/dev/null
  [ -d "$REPO_DIR/.worktrees/my-feature" ]

  # Run cleanup (use restricted PATH without tmux - cleanup handles that gracefully)
  WORKTREE_DIR=".worktrees"
  run bash -c "
    cd '$REPO_DIR'
    WORKTREE_DIR='.worktrees'
    TMUX_PREFIX='pdb'
    $(sed -n '/^cmd_cleanup/,/^}/p' "$PDB")
    cmd_cleanup 'my-feature'
  "
  [ "$status" -eq 0 ]
  [[ "$output" == *"Removed worktree"* ]]
  [ ! -d "$REPO_DIR/.worktrees/my-feature" ]

  teardown_git_repo
}

@test "cmd_cleanup reports missing worktree" {
  setup_git_repo
  cd "$REPO_DIR"

  run bash -c "
    cd '$REPO_DIR'
    WORKTREE_DIR='.worktrees'
    TMUX_PREFIX='pdb'
    $(sed -n '/^cmd_cleanup/,/^}/p' "$PDB")
    cmd_cleanup 'nonexistent'
  "
  [ "$status" -eq 0 ]
  [[ "$output" == *"No worktree found"* ]]

  teardown_git_repo
}

# --- helper function unit tests ---

@test "read_prd_field returns field value" {
  run bash -c "
    $(sed -n '/^read_prd_field/,/^}/p' "$PDB")
    read_prd_field '$FEATURE_DIR/prd.json' '.project'
  "
  [ "$status" -eq 0 ]
  [ "$output" = "TestProject" ]
}

@test "read_prd_field returns empty for missing field" {
  run bash -c "
    $(sed -n '/^read_prd_field/,/^}/p' "$PDB")
    read_prd_field '$FEATURE_DIR/prd.json' '.nonExistentField'
  "
  [ "$status" -eq 0 ]
  [ -z "$output" ]
}

@test "feature_name_from_path extracts basename" {
  run bash -c "
    $(sed -n '/^feature_name_from_path/,/^}/p' "$PDB")
    feature_name_from_path '/some/path/my-feature'
  "
  [ "$status" -eq 0 ]
  [ "$output" = "my-feature" ]
}

@test "feature_name_from_path handles trailing slash" {
  run bash -c "
    $(sed -n '/^feature_name_from_path/,/^}/p' "$PDB")
    feature_name_from_path '/some/path/my-feature/'
  "
  [ "$status" -eq 0 ]
  [ "$output" = "my-feature" ]
}

# --- git path resolution tests (worktree vs non-worktree) ---

@test "git add APP_DIR/ works from worktree root" {
  setup_git_repo
  cd "$REPO_DIR"

  # Create a worktree
  git worktree add .worktrees/my-feature -b feature/wt-test 2>/dev/null

  # Create APP_DIR and a file inside the worktree
  mkdir -p "$REPO_DIR/.worktrees/my-feature/app"
  echo "hello" > "$REPO_DIR/.worktrees/my-feature/app/test.txt"

  # From worktree root, git add ./app/ should succeed
  run git -C "$REPO_DIR/.worktrees/my-feature" add ./app/
  [ "$status" -eq 0 ]

  # Verify the file is staged
  run git -C "$REPO_DIR/.worktrees/my-feature" diff --cached --name-only
  [ "$status" -eq 0 ]
  [[ "$output" == *"app/test.txt"* ]]

  # Clean up
  git -C "$REPO_DIR" worktree remove .worktrees/my-feature --force 2>/dev/null || true
  teardown_git_repo
}

@test "git -C APP_DIR fails when APP_DIR is .worktrees path that doesn't exist in worktree" {
  setup_git_repo
  cd "$REPO_DIR"

  # Create a worktree
  git worktree add .worktrees/my-app -b feature/wt-test 2>/dev/null

  # From worktree root, git -C .worktrees/my-app should fail because
  # .worktrees/my-app is not a valid path relative to inside the worktree
  run git -C "$REPO_DIR/.worktrees/my-app" git -C .worktrees/my-app status
  [ "$status" -ne 0 ]

  # Clean up
  git -C "$REPO_DIR" worktree remove .worktrees/my-app --force 2>/dev/null || true
  teardown_git_repo
}

@test "git add APP_DIR/ works from repo root (non-worktree)" {
  setup_git_repo
  cd "$REPO_DIR"

  # Create APP_DIR and a file in the main repo (no worktree)
  mkdir -p "$REPO_DIR/app"
  echo "hello" > "$REPO_DIR/app/test.txt"

  # From repo root, git add ./app/ should succeed
  run git -C "$REPO_DIR" add ./app/
  [ "$status" -eq 0 ]

  # Verify the file is staged
  run git -C "$REPO_DIR" diff --cached --name-only
  [ "$status" -eq 0 ]
  [[ "$output" == *"app/test.txt"* ]]

  teardown_git_repo
}

# --- Playwright env var configuration tests ---

@test "playwright.config.ts reads PW_PORT from env" {
  run grep -c 'PW_PORT' "$BATS_TEST_DIRNAME/../my-app/playwright.config.ts"
  [ "$status" -eq 0 ]
  [ "$output" -ge 1 ]
}

@test "playwright.config.ts reads PW_TEST_DIR from env" {
  run grep -c 'PW_TEST_DIR' "$BATS_TEST_DIRNAME/../my-app/playwright.config.ts"
  [ "$status" -eq 0 ]
  [ "$output" -ge 1 ]
}

@test "playwright.config.ts defaults port to 3000" {
  run grep 'PW_PORT.*3000' "$BATS_TEST_DIRNAME/../my-app/playwright.config.ts"
  [ "$status" -eq 0 ]
}

@test "playwright.config.ts defaults testDir to ./e2e" {
  run grep 'PW_TEST_DIR.*\./e2e' "$BATS_TEST_DIRNAME/../my-app/playwright.config.ts"
  [ "$status" -eq 0 ]
}

@test "run-playwright agent picks available port" {
  run grep 'PW_PORT=.*createServer' "$BATS_TEST_DIRNAME/../.claude/agents/run-playwright.md"
  [ "$status" -eq 0 ]
}

@test "run-playwright agent scopes tests under FEATURE_NAME" {
  run grep 'e2e/\$FEATURE_NAME' "$BATS_TEST_DIRNAME/../.claude/agents/run-playwright.md"
  [ "$status" -eq 0 ]
}

@test "create-feature-from-json passes FEATURE_NAME to agents" {
  run grep 'Feature name.*FEATURE_NAME' "$BATS_TEST_DIRNAME/../.claude/commands/create-feature-from-json.md"
  [ "$status" -eq 0 ]
}
