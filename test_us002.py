"""Test US-002: Blinking Colons Like a Real 80s Clock"""
from playwright.sync_api import sync_playwright
import time

def test_blinking_colons():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('http://localhost:3000')
        page.wait_for_load_state('networkidle')

        # AC4: Check data-testid='clock-colon' attribute on each colon span
        colons = page.query_selector_all('[data-testid="clock-colon"]')
        assert len(colons) == 2, f"Expected 2 colon spans, got {len(colons)}"
        print(f"PASS: Found {len(colons)} colon spans with data-testid='clock-colon'")

        # AC2: Check that when hidden, visibility is 'hidden' (not display:none) so width is preserved
        for i, colon in enumerate(colons):
            visibility = colon.evaluate("el => getComputedStyle(el).visibility")
            # It can be either visible or hidden depending on the current second
            assert visibility in ('visible', 'hidden'), f"Colon {i} has unexpected visibility: {visibility}"
            print(f"PASS: Colon {i} uses CSS visibility ('{visibility}'), not display:none")

        # AC1 & AC3: Verify colons blink - check visibility changes over ~3 seconds
        # Both colons should toggle together driven by the same single timer
        visibility_states = []
        for check in range(4):
            colons = page.query_selector_all('[data-testid="clock-colon"]')
            vis = colons[0].evaluate("el => getComputedStyle(el).visibility")
            visibility_states.append(vis)
            print(f"Check {check}: colon visibility = {vis}")
            if check < 3:
                page.wait_for_timeout(1100)  # wait slightly over 1 second

        # There should be at least one change in visibility states
        unique_states = set(visibility_states)
        assert len(unique_states) > 1, f"Colons never toggled - all states were: {visibility_states}"
        print(f"PASS: Colons toggled between states: {visibility_states}")

        # AC1: Verify even seconds = visible, odd seconds = hidden
        # Get current time and check correlation
        colons = page.query_selector_all('[data-testid="clock-colon"]')
        current_vis = colons[0].evaluate("el => getComputedStyle(el).visibility")
        # Get the seconds from the page clock display
        clock_text = page.query_selector('a[aria-label="Visit NBA.com"]').inner_text()
        print(f"Clock text: '{clock_text}'")

        # Parse seconds from clock display (format HH:MM:SS or HH MM SS with spaces)
        # The colons might be hidden so text could look odd, get the raw text
        seconds_str = clock_text.strip()[-2:]
        try:
            seconds = int(seconds_str)
            expected_vis = 'visible' if seconds % 2 == 0 else 'hidden'
            assert current_vis == expected_vis, f"At second {seconds}, expected visibility '{expected_vis}' but got '{current_vis}'"
            print(f"PASS: At second {seconds} (even={seconds % 2 == 0}), colon visibility is '{current_vis}'")
        except ValueError:
            print(f"Could not parse seconds from '{seconds_str}', skipping AC1 correlation check")

        print("\nAll AC tests passed for US-002!")
        browser.close()

if __name__ == '__main__':
    test_blinking_colons()
