import os
from playwright.sync_api import sync_playwright

def run_cuj(page):
    # Ensure directories exist
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)

    # 1. Navigate to Daily Lucky Meter Page
    print("Navigating to http://localhost:3000/lucky-meter...")
    page.goto("http://localhost:3000/lucky-meter")
    page.wait_for_timeout(2000) # Wait to capture standby background and stars

    # Take initial standby screenshot
    page.screenshot(path="/home/jules/verification/screenshots/standby.png", full_page=True)

    # 2. Click the Awaken button to trigger generate flow
    print("Clicking 'AWAKEN LUCKY METER' button...")
    button = page.get_by_role("button", name="AWAKEN LUCKY METER")
    if button.is_visible():
        button.click()
    else:
        page.get_by_text("AWAKEN LUCKY METER").click()

    # 3. Wait for the 8-second animation to finish completely plus a buffer
    print("Waiting for animation (9 seconds)...")
    page.wait_for_timeout(9000)

    # 4. Take full page screenshot of the final revealed state
    print("Taking final screenshot...")
    page.screenshot(path="/home/jules/verification/screenshots/verification_full.png", full_page=True)
    page.wait_for_timeout(1000) # Hold final state

if __name__ == "__main__":
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1280, "height": 950},
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        except Exception as e:
            print(f"An error occurred: {e}")
        finally:
            context.close()
            browser.close()
    print("Finished verification script.")
