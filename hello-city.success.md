Hello City: jobs.json

Acceptance Criteria:
- The two colon characters (:) between HH:MM and MM:SS toggle visibility every second (visible on even seconds, hidden on odd seconds)
- When hidden, the colons are replaced with an equal-width blank space so the digits do not shift or jump
- The blinking is driven by the same timer as the clock update, not a separate interval
- A data-testid='clock-colon' attribute is on each colon span for testability
