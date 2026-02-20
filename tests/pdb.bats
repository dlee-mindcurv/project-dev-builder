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
