from playwright.sync_api import sync_playwright
import os

os.makedirs("/home/jules/verification/videos", exist_ok=True)
os.makedirs("/home/jules/verification/screenshots", exist_ok=True)

def run_cuj(page):
    page.goto("http://localhost:3000/lucky-meter")
    page.wait_for_timeout(2000)

    # Initial state
    page.screenshot(path="/home/jules/verification/screenshots/initial_meter2.png")
    page.wait_for_timeout(1000)

    # Clear localStorage just in case it's locked
    page.evaluate("localStorage.clear()")
    page.reload()
    page.wait_for_timeout(2000)

    # Click the ENGAGE METER button
    page.get_by_role("button", name="ENGAGE METER").click()
    page.wait_for_timeout(500)

    # Wait for resonance/scrambling...
    page.wait_for_timeout(8000)

    # Wait for reveal
    page.wait_for_timeout(3000)

    # Final state
    page.screenshot(path="/home/jules/verification/screenshots/final_meter2.png")
    page.wait_for_timeout(2000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
