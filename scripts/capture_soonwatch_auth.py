from playwright.sync_api import sync_playwright
import time
import os

BASE_URL = "http://localhost:3000"
OUTPUT_DIR = "C:/Users/bapti/Desktop/Website/assets/img/soonwatch"
VIEWPORT = {"width": 1280, "height": 800}
EMAIL = "test@test.com"
EMAIL2 = "test2@test.com"  # backup in case test@test.com fails
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
    print(f"  Saved: {name} ({size:,} bytes)")
    return size

def is_logged_in(page):
    """Check if we're on a protected page (not login/register)."""
    url = page.url
    return "/watchlist" in url or "/discover" in url or "/pour-toi" in url

def try_login(page, email, password):
    goto(page, f"{BASE_URL}/login", wait=2)
    # Fill email
    for sel in ["input[type='email']", "input[placeholder*='mail' i]"]:
        try:
            el = page.locator(sel).first
            if el.is_visible():
                el.fill(email)
                break
        except: pass
    # Fill password
    try:
        pw = page.locator("input[type='password']").first
        if pw.is_visible():
            pw.fill(password)
    except: pass
    # Submit
    try:
        btn = page.locator("button[type='submit']").first
        if btn.is_visible():
            btn.click()
    except: pass
    time.sleep(4)
    print(f"  After login attempt with {email}, URL: {page.url}")
    return page.url

def try_register(page, email, password):
    goto(page, f"{BASE_URL}/register", wait=2)
    # Prenom (optional)
    try:
        el = page.locator("input[placeholder*='prénom' i]").first
        if el.count() > 0 and el.is_visible():
            el.fill("TestUser")
    except: pass
    # Email
    for sel in ["input[type='email']", "input[placeholder*='mail' i]"]:
        try:
            el = page.locator(sel).first
            if el.is_visible():
                el.fill(email)
                break
        except: pass
    # Password
    try:
        pw = page.locator("input[type='password']").first
        if pw.is_visible():
            pw.fill(password)
    except: pass
    # Screenshot before submit
    page.screenshot(path=f"{OUTPUT_DIR}/_debug_register_filled.png")
    # Submit
    try:
        btn = page.locator("button[type='submit']").first
        if btn.is_visible():
            btn.click()
    except: pass
    time.sleep(4)
    # Screenshot after submit (check for error messages)
    page.screenshot(path=f"{OUTPUT_DIR}/_debug_register_after.png")
    # Check for error text
    error_texts = []
    for sel in ["[class*='error']", "[class*='alert']", "[role='alert']", "p[class*='red']", "span[class*='error']"]:
        try:
            els = page.locator(sel).all()
            for el in els:
                try:
                    t = el.inner_text()
                    if t.strip():
                        error_texts.append(t.strip())
                except: pass
        except: pass
    print(f"  After register with {email}, URL: {page.url}")
    if error_texts:
        print(f"  Errors found: {error_texts}")
    return page.url

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        viewport=VIEWPORT,
        color_scheme="dark"
    )
    page = context.new_page()

    # Try to login first (account might already exist from prior run)
    print("=== Attempting login with test@test.com ===")
    url_after = try_login(page, EMAIL, PASSWORD)

    if not is_logged_in(page):
        print("=== Login failed, trying register ===")
        url_after = try_register(page, EMAIL, PASSWORD)

        if not is_logged_in(page):
            print("=== Register failed too, trying login again ===")
            url_after = try_login(page, EMAIL, PASSWORD)

        if not is_logged_in(page):
            print("=== Trying with test2@test.com ===")
            url_after = try_register(page, EMAIL2, PASSWORD)
            if not is_logged_in(page):
                url_after = try_login(page, EMAIL2, PASSWORD)

    print(f"\nAuthentication status: {'LOGGED IN' if is_logged_in(page) else 'FAILED'}")
    print(f"Current URL: {page.url}")

    if is_logged_in(page):
        # ── 3. Watchlist empty state ────────────────────────────────────────────
        print("\n[3] Watchlist")
        goto(page, f"{BASE_URL}/watchlist", wait=3)
        save(page, "watchlist-empty.png")

        # ── 4. Discover ─────────────────────────────────────────────────────────
        print("[4] Discover")
        goto(page, f"{BASE_URL}/discover", wait=5)
        save(page, "discover.png")

        # ── 5. Pour toi (Swipe) ──────────────────────────────────────────────────
        print("[5] Pour toi (swipe)")
        goto(page, f"{BASE_URL}/pour-toi", wait=5)
        save(page, "swipe.png")

        # ── 6. Search ────────────────────────────────────────────────────────────
        print("[6] Search")
        goto(page, f"{BASE_URL}/watchlist", wait=2)
        page.keyboard.press("/")
        time.sleep(2)
        page.keyboard.type("inception")
        time.sleep(3)
        save(page, "search.png")
    else:
        print("Could not authenticate — check _debug_* screenshots")

    browser.close()
    print("\n=== Files: ===")
    for f in sorted(os.listdir(OUTPUT_DIR)):
        fp = f"{OUTPUT_DIR}/{f}"
        size = os.path.getsize(fp)
        print(f"  {f}: {size:,} bytes")
