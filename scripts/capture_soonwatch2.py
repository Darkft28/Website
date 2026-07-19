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

def save(page, name):
    path = f"{OUTPUT_DIR}/{name}"
    page.screenshot(path=path, full_page=False)
    size = os.path.getsize(path)
    print(f"  Saved: {path} ({size} bytes)")
    return size

def login(page):
    """Login using the login form."""
    print("  Going to login page...")
    goto(page, f"{BASE_URL}/login", wait=2)

    # Dump all inputs for debugging
    inputs = page.locator("input").all()
    print(f"  Found {len(inputs)} input(s) on page")
    for i, inp in enumerate(inputs):
        try:
            t = inp.get_attribute("type")
            n = inp.get_attribute("name")
            p = inp.get_attribute("placeholder")
            print(f"    [{i}] type={t} name={n} placeholder={p}")
        except:
            pass

    # Fill email
    for sel in ["input[type='email']", "input[name='email']", "input[placeholder*='mail' i]"]:
        try:
            el = page.locator(sel).first
            if el.is_visible():
                el.fill(EMAIL)
                print(f"  Filled email ({sel})")
                break
        except:
            continue

    # Fill password
    try:
        pw_inputs = page.locator("input[type='password']").all()
        for pw in pw_inputs:
            if pw.is_visible():
                pw.fill(PASSWORD)
                print("  Filled password")
                break
    except Exception as e:
        print(f"  Password fill error: {e}")

    # Take screenshot of filled form for debug
    page.screenshot(path=f"{OUTPUT_DIR}/_debug_login_filled.png")

    # Submit
    for sel in ["button[type='submit']", "button:has-text('Se connecter')",
                "button:has-text('Connexion')", "button:has-text('Login')",
                "button:has-text('Sign in')"]:
        try:
            el = page.locator(sel).first
            if el.is_visible():
                el.click()
                print(f"  Clicked submit: {sel}")
                break
        except:
            continue

    time.sleep(4)
    print(f"  After login, URL: {page.url}")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        viewport=VIEWPORT,
        color_scheme="dark"
    )
    page = context.new_page()

    # Login
    login(page)
    time.sleep(2)

    print(f"Current URL: {page.url}")

    # Try navigating to watchlist to see if we're authenticated
    goto(page, f"{BASE_URL}/watchlist", wait=3)
    print(f"Watchlist URL: {page.url}")
    page.screenshot(path=f"{OUTPUT_DIR}/_debug_watchlist.png")

    # ── "Pour toi" / Swipe ────────────────────────────────────────────────────
    print("\n[Swipe] Getting nav links...")
    # Get all nav links for debugging
    nav_links = page.locator("nav a, aside a, [class*='sidebar'] a, [class*='nav'] a").all()
    print(f"  Found {len(nav_links)} nav links")
    for link in nav_links:
        try:
            href = link.get_attribute("href")
            text = link.inner_text()
            print(f"    '{text.strip()}' -> {href}")
        except:
            pass

    # Click "Pour toi" link
    pour_toi = page.locator("a:has-text('Pour toi')").first
    count = pour_toi.count()
    print(f"  'Pour toi' count: {count}")
    if count > 0:
        href = pour_toi.get_attribute("href")
        print(f"  href: {href}")
        pour_toi.click()
        time.sleep(4)
        print(f"  After click, URL: {page.url}")
        save(page, "swipe.png")
    else:
        # Try via URL from what we know
        for url in [f"{BASE_URL}/pour-toi", f"{BASE_URL}/for-you", f"{BASE_URL}/swipe",
                    f"{BASE_URL}/recommend"]:
            goto(page, url, wait=4)
            print(f"  Tried {url}, URL now: {page.url}")
            sz = save(page, f"_debug_{url.split('/')[-1]}.png")
            if sz > 10000:
                # This one has content
                import shutil
                shutil.copy(f"{OUTPUT_DIR}/_debug_{url.split('/')[-1]}.png", f"{OUTPUT_DIR}/swipe.png")
                print(f"  Using this as swipe.png")
                break

    # ── Search modal ──────────────────────────────────────────────────────────
    print("\n[Search] Opening search...")
    goto(page, f"{BASE_URL}/watchlist", wait=2)

    # Log all inputs
    inputs = page.locator("input").all()
    print(f"  Found {len(inputs)} input(s)")
    for inp in inputs:
        try:
            t = inp.get_attribute("type")
            p_val = inp.get_attribute("placeholder")
            cls = inp.get_attribute("class")
            visible = inp.is_visible()
            print(f"    type={t} placeholder={p_val} class={cls} visible={visible}")
        except:
            pass

    # Try clicking the search input
    search_done = False
    for sel in [
        "input[placeholder*='Rechercher' i]",
        "input[placeholder*='films' i]",
        "input[placeholder*='séries' i]",
        "input[type='search']",
        "input[type='text']",
    ]:
        try:
            el = page.locator(sel).first
            if el.count() > 0 and el.is_visible():
                el.click()
                time.sleep(1)
                el.fill("inception")
                time.sleep(2)
                print(f"  Search typed via {sel}")
                save(page, "search.png")
                search_done = True
                break
        except Exception as e:
            print(f"  {sel}: {e}")

    if not search_done:
        # Try keyboard shortcut "/" (common search shortcut)
        page.keyboard.press("/")
        time.sleep(2)
        print(f"  After '/' keypress, URL: {page.url}")
        page.keyboard.type("inception")
        time.sleep(2)
        save(page, "search.png")

    browser.close()
    print("\n=== Final files: ===")
    for f in sorted(os.listdir(OUTPUT_DIR)):
        if not f.startswith("_"):
            fp = f"{OUTPUT_DIR}/{f}"
            size = os.path.getsize(fp)
            print(f"  {f}: {size} bytes")
