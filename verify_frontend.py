from playwright.sync_api import sync_playwright

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            print("Navigating to http://localhost:3000")
            page.goto("http://localhost:3000")

            print("Checking title...")
            title = page.title()
            print(f"Page title: {title}")
            assert "TLP Video Tool" in title

            print("Waiting for main content...")
            # Wait for the "TLP Video Tool" heading
            page.wait_for_selector("text=TLP Video Tool")

            print("Taking screenshot...")
            page.screenshot(path="verification.png")
            print("Screenshot saved to verification.png")

        except Exception as e:
            print(f"Error: {e}")
            # print page content if error
            try:
                print(page.content())
            except:
                pass
        finally:
            browser.close()

if __name__ == "__main__":
    verify_frontend()
