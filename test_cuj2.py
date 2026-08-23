from playwright.sync_api import sync_playwright
import os

def run_cuj(page):
    # Navigate to the widget page
    page.goto("http://localhost:3000/widget/daily-meter")
    page.wait_for_timeout(2000)

    # Click the reveal button
    page.get_by_role("button", name="Reveal My Resonance").click()

    # Wait for the resonance to complete (which takes 10s based on LuckyGenerator.tsx)
    page.wait_for_timeout(11000)

    # Take screenshot at the final state
    page.screenshot(path="/home/jules/verification/screenshots/verification2.png")
    page.wait_for_timeout(1000)  # Hold final state for the video

if __name__ == "__main__":
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()  # MUST close context to save the video
            browser.close()
