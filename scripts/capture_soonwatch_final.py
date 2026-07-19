from playwright.sync_api import sync_playwright
import time
import os

BASE_URL = "http://localhost:3000"
OUTPUT_DIR = "C:/Users/bapti/Desktop/Website/assets/img/soonwatch"
VIEWPORT = {"width": 1280, "height": 800}
EMAIL = "test@test.com"
PASSWORD = "Test1234!"

os.makedirs(OUTPUT_DIR, exist_ok=True)

def goto(page, url, wait=3):
    try:
        page.goto(url, wait_until="domcontentloaded", timeout=15000)
    except Exception as e:
        print(f"  goto warning: {e}")
    time.sleep(wait)

def save(page, name, full_page=False):
    path = f"{OUTPUT_DIR}/{name}"
    page.screenshot(path=path, full_page=full_page)
    size = os.path.getsize(path)
    print(f"  Saved: {name} ({size} bytes)")
    return size

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        viewport=VIEWPORT,
        color_scheme="dark"
    )
    page = context.new_page()

    # ── 1. Login: go to /login directly (the actual form) ──────────────────────
    print("[1] Login form at /login")
    goto(page, f"{BASE_URL}/login", wait=4)
    print(f"  URL: {page.url}")
    save(page, "login.png")

    # ── 2. Register page ────────────────────────────────────────────────────────
    print("[2] Register page at /register")
    goto(page, f"{BASE_URL}/register", wait=4)
    print(f"  URL: {page.url}")
    save(page, "register.png")

    # ── Register test account (ignore error if already exists) ─────────────────
    print("[Auth] Registering account...")
    # Fill Prenom (optional)
    try:
        prenom = page.locator("input[placeholder*='prénom' i]").first
        if prenom.is_visible():
            prenom.fill("Test")
    except:
        pass
    # Fill email
    try:
        email_input = page.locator("input[type='email']").first
        if email_input.is_visible():
            email_input.fill(EMAIL)
    except:
        pass
    # Fill password
    try:
        pw = page.locator("input[type='password']").first
        if pw.is_visible():
            pw.fill(PASSWORD)
    except:
        pass
    # Submit
    try:
        btn = page.locator("button[type='submit']").first
        if btn.is_visible():
            btn.click()
    except:
        pass
    time.sleep(3)
    print(f"  After register, URL: {page.url}")

    # ── Login ───────────────────────────────────────────────────────────────────
    # If not redirected, do login
    if "login" in page.url or page.url.rstrip("/") == BASE_URL:
        print("[Auth] Logging in...")
        goto(page, f"{BASE_URL}/login", wait=2)
        try:
            email_input = page.locator("input[type='email']").first
            if email_input.is_visible():
                email_input.fill(EMAIL)
            pw = page.locator("input[type='password']").first
            if pw.is_visible():
                pw.fill(PASSWORD)
            btn = page.locator("button[type='submit']").first
            if btn.is_visible():
                btn.click()
        except Exception as e:
            print(f"  Login error: {e}")
        time.sleep(4)
        print(f"  After login, URL: {page.url}")

    # Navigate to watchlist to confirm auth works
    goto(page, f"{BASE_URL}/watchlist", wait=3)
    print(f"Watchlist URL: {page.url}")

    # ── 3. Watchlist empty state ────────────────────────────────────────────────
    print("[3] Watchlist")
    save(page, "watchlist-empty.png")

    # ── 4. Discover ─────────────────────────────────────────────────────────────
    print("[4] Discover")
    goto(page, f"{BASE_URL}/discover", wait=5)
    print(f"  URL: {page.url}")
    save(page, "discover.png")

    # ── 5. Pour toi (Swipe) ─────────────────────────────────────────────────────
    print("[5] Pour toi (swipe)")
    goto(page, f"{BASE_URL}/pour-toi", wait=5)
    print(f"  URL: {page.url}")
    save(page, "swipe.png")

    # ── 6. Search ───────────────────────────────────────────────────────────────
    print("[6] Search")
    # Go to watchlist where search bar is visible
    goto(page, f"{BASE_URL}/watchlist", wait=2)

    # Press "/" to open search (saw it works in prior run)
    page.keyboard.press("/")
    time.sleep(2)
    page.keyboard.type("inception")
    time.sleep(3)
    print(f"  After search input, URL: {page.url}")
    save(page, "search.png")

    browser.close()
    print("\n=== Final screenshots ===")
    for f in sorted(os.listdir(OUTPUT_DIR)):
        if not f.startswith("_"):
            fp = f"{OUTPUT_DIR}/{f}"
            size = os.path.getsize(fp)
            print(f"  {f}: {size:,} bytes")
