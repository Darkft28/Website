from playwright.sync_api import sync_playwright
import time
import os

BASE_URL = "http://localhost:3000"
OUTPUT_DIR = "C:/Users/bapti/Desktop/Website/assets/img/soonwatch"
VIEWPORT = {"width": 1280, "height": 800}
EMAIL = "test@test.com"
PASSWORD = "Test1234!"

os.makedirs(OUTPUT_DIR, exist_ok=True)

def goto(page, url, wait=2):
    """Navigate to a URL, tolerating SPA 200 responses."""
    try:
        page.goto(url, wait_until="domcontentloaded", timeout=15000)
    except Exception as e:
        print(f"  goto warning for {url}: {e}")
    time.sleep(wait)

def save(page, name):
    path = f"{OUTPUT_DIR}/{name}"
    page.screenshot(path=path, full_page=True)
    print(f"Saved: {path}")

def try_fill(page, selectors, value):
    for sel in selectors:
        try:
            el = page.locator(sel).first
            if el.count() > 0 and el.is_visible():
                el.fill(value)
                return True
        except:
            continue
    return False

def try_click(page, selectors):
    for sel in selectors:
        try:
            el = page.locator(sel).first
            if el.count() > 0 and el.is_visible():
                el.click()
                return sel
        except:
            continue
    return None

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        viewport=VIEWPORT,
        color_scheme="dark"
    )
    page = context.new_page()

    # ── 1. Login page ──────────────────────────────────────────────────────────
    print("\n[1] Login page")
    goto(page, BASE_URL, wait=3)
    print(f"  URL: {page.url}")
    save(page, "login.png")

    # ── 2. Register page ───────────────────────────────────────────────────────
    print("\n[2] Register page")
    # Try clicking a register/signup link on the current page first
    reg_link_found = try_click(page, [
        "a[href*='register']", "a[href*='signup']", "a[href*='sign-up']",
        "a[href*='Register']",
        "text=Register", "text=Sign up", "text=S'inscrire", "text=Inscription",
        "text=Créer un compte", "text=Create account",
        "button:has-text('Register')", "button:has-text('Sign up')",
    ])
    if reg_link_found:
        time.sleep(2)
        print(f"  Clicked: {reg_link_found}, URL: {page.url}")
    else:
        # Try direct URL navigation
        for url in [f"{BASE_URL}/register", f"{BASE_URL}/signup", f"{BASE_URL}/sign-up", f"{BASE_URL}/auth/register"]:
            goto(page, url, wait=2)
            print(f"  Tried {url}, landed at {page.url}")
            break
    save(page, "register.png")

    # ── Register account ───────────────────────────────────────────────────────
    # Make sure we're on register page and fill the form
    print("\n[Register account] Filling registration form...")

    # If we're not on a register-looking page, try again
    current_url = page.url
    if "register" not in current_url and "signup" not in current_url:
        goto(page, BASE_URL, wait=2)
        try_click(page, [
            "a[href*='register']", "a[href*='signup']",
            "text=Register", "text=Sign up", "text=S'inscrire",
            "text=Créer un compte", "text=Create account"
        ])
        time.sleep(2)

    print(f"  On page: {page.url}")

    # Fill registration form
    # Username (if present)
    try_fill(page, [
        "input[name='username']", "input[name='name']", "input[id='username']",
        "input[placeholder*='username' i]", "input[placeholder*='nom' i]",
        "input[placeholder*='pseudo' i]"
    ], "testuser")

    # Email
    try_fill(page, [
        "input[type='email']", "input[name='email']", "input[id='email']",
        "input[placeholder*='email' i]", "input[placeholder*='mail' i]"
    ], EMAIL)

    # Password(s)
    pw_inputs = page.locator("input[type='password']").all()
    print(f"  Found {len(pw_inputs)} password field(s)")
    for pw in pw_inputs:
        try:
            if pw.is_visible():
                pw.fill(PASSWORD)
        except:
            pass

    # Submit
    submitted = try_click(page, [
        "button[type='submit']",
        "button:has-text('Register')", "button:has-text('Sign up')",
        "button:has-text('S\\'inscrire')", "button:has-text('Créer')",
        "button:has-text('Create')", "button:has-text('Inscription')",
    ])
    print(f"  Submit clicked: {submitted}")
    time.sleep(3)
    print(f"  After register, URL: {page.url}")

    # ── Login ──────────────────────────────────────────────────────────────────
    print("\n[Login] Logging in...")
    # If already redirected to dashboard, great. Otherwise login.
    if "login" in page.url or page.url.rstrip("/") == BASE_URL:
        goto(page, BASE_URL, wait=2)

        # Fill login form
        try_fill(page, [
            "input[type='email']", "input[name='email']", "input[id='email']",
            "input[placeholder*='email' i]"
        ], EMAIL)

        pw_inputs = page.locator("input[type='password']").all()
        for pw in pw_inputs:
            try:
                if pw.is_visible():
                    pw.fill(PASSWORD)
                    break
            except:
                pass

        submitted = try_click(page, [
            "button[type='submit']",
            "button:has-text('Login')", "button:has-text('Sign in')",
            "button:has-text('Connexion')", "button:has-text('Se connecter')",
        ])
        print(f"  Login submit clicked: {submitted}")
        time.sleep(3)

    print(f"  After login, URL: {page.url}")
    logged_in_url = page.url

    # ── 3. Main dashboard / watchlist empty state ──────────────────────────────
    print("\n[3] Watchlist / Dashboard")
    # Try navigating to watchlist or home
    watchlist_found = False
    for url in [f"{BASE_URL}/watchlist", f"{BASE_URL}/home", f"{BASE_URL}/dashboard", logged_in_url]:
        goto(page, url, wait=2)
        print(f"  Tried {url}, landed at {page.url}")
        # Check we have app content
        if page.locator("body").count() > 0:
            save(page, "watchlist-empty.png")
            watchlist_found = True
            break

    if not watchlist_found:
        save(page, "watchlist-empty.png")

    # ── 4. Discover page ───────────────────────────────────────────────────────
    print("\n[4] Discover page")
    discover_found = False
    for url in [f"{BASE_URL}/discover", f"{BASE_URL}/browse", f"{BASE_URL}/explorer", f"{BASE_URL}/search"]:
        goto(page, url, wait=3)
        print(f"  Tried {url}, landed at {page.url}")
        if page.url != BASE_URL + "/" and BASE_URL in page.url:
            save(page, "discover.png")
            discover_found = True
            break

    if not discover_found:
        # Try nav links
        goto(page, logged_in_url, wait=2)
        nav_clicked = try_click(page, [
            "nav a:has-text('Discover')", "nav a:has-text('Découvrir')",
            "nav a:has-text('Browse')", "nav a:has-text('Explorer')",
            "a:has-text('Discover')", "a:has-text('Découvrir')",
            "[class*='nav'] a:nth-child(2)", "[class*='nav'] a:nth-child(3)",
        ])
        time.sleep(2)
        print(f"  Nav click: {nav_clicked}, URL: {page.url}")
        save(page, "discover.png")

    # ── 5. Swipe / "Pour toi" page ─────────────────────────────────────────────
    print("\n[5] Swipe / Pour toi page")
    swipe_found = False
    for url in [f"{BASE_URL}/swipe", f"{BASE_URL}/for-you", f"{BASE_URL}/pour-toi",
                f"{BASE_URL}/recommendations", f"{BASE_URL}/suggest"]:
        goto(page, url, wait=3)
        print(f"  Tried {url}, landed at {page.url}")
        if page.url != BASE_URL + "/" and BASE_URL in page.url:
            save(page, "swipe.png")
            swipe_found = True
            break

    if not swipe_found:
        goto(page, logged_in_url, wait=2)
        swipe_clicked = try_click(page, [
            "a:has-text('Pour toi')", "a:has-text('Swipe')",
            "a:has-text('For you')", "a:has-text('Recommand')",
            "nav a:nth-child(3)", "nav a:nth-child(4)",
        ])
        time.sleep(2)
        print(f"  Swipe click: {swipe_clicked}, URL: {page.url}")
        save(page, "swipe.png")

    # ── 6. Search page / modal ─────────────────────────────────────────────────
    print("\n[6] Search page")
    search_found = False
    for url in [f"{BASE_URL}/search", f"{BASE_URL}/recherche", f"{BASE_URL}/find"]:
        goto(page, url, wait=3)
        print(f"  Tried {url}, landed at {page.url}")
        if page.url != BASE_URL + "/" and BASE_URL in page.url:
            save(page, "search.png")
            search_found = True
            break

    if not search_found:
        goto(page, logged_in_url, wait=2)
        search_clicked = try_click(page, [
            "button[aria-label*='search' i]", "a:has-text('Search')",
            "a:has-text('Recherche')", "a:has-text('Chercher')",
            "[class*='search-btn']", "[class*='searchBtn']",
            "input[type='search']",
        ])
        if search_clicked:
            time.sleep(2)
            print(f"  Search click: {search_clicked}, URL: {page.url}")
        save(page, "search.png")

    browser.close()
    print("\n=== All screenshots done ===")
    for f in os.listdir(OUTPUT_DIR):
        fp = f"{OUTPUT_DIR}/{f}"
        size = os.path.getsize(fp)
        print(f"  {f} ({size} bytes)")
