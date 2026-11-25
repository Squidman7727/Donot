"""24/7 Telegram Bot for Rules Horror Studio (Style 5 — Long-Form 16:9 1080p Remotion).
Zero Blender. Zero 3D bugs. Custom duration (e.g. 2, 5, 10, 12, 15 minutes).
Python 3.14 compatible.
"""
import os, re, json, time, base64, asyncio, threading, logging
import requests
from flask import Flask
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, ContextTypes, filters
from story_gen import generate_style5_package

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("bot")

TELEGRAM_TOKEN = os.environ["TELEGRAM_TOKEN"]
GITHUB_TOKEN   = os.environ["GITHUB_TOKEN"]
GITHUB_REPO    = os.environ["GITHUB_REPO"]
GITHUB_BRANCH  = os.environ.get("GITHUB_BRANCH", "main")
ALLOWED_CHAT   = os.environ.get("ALLOWED_CHAT_ID", "").strip()

GH_HEADERS = {
    "Authorization": f"Bearer {GITHUB_TOKEN}",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
}

USER_STATE = {}


def slugify(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "_", text.strip().lower()).strip("_")
    return (s[:36] or "horror_video").strip("_")


def gh_put_file(path: str, content_str: str, message: str):
    url = f"https://api.github.com/repos/{GITHUB_REPO}/contents/{path}"
    r = requests.get(url, headers=GH_HEADERS, params={"ref": GITHUB_BRANCH}, timeout=20)
    sha = r.json().get("sha") if r.status_code == 200 else None
    payload = {
        "message": message,
        "content": base64.b64encode(content_str.encode("utf-8")).decode("ascii"),
        "branch": GITHUB_BRANCH,
    }
    if sha:
        payload["sha"] = sha
    resp = requests.put(url, headers=GH_HEADERS, json=payload, timeout=30)
    resp.raise_for_status()


def gh_trigger_workflow(slug: str, lang: str, chat_id: int):
    url = f"https://api.github.com/repos/{GITHUB_REPO}/actions/workflows/render_rules_horror.yml/dispatches"
    payload = {
        "ref": GITHUB_BRANCH,
        "inputs": {"slug": slug, "lang": lang, "chat_id": str(chat_id)},
    }
    resp = requests.post(url, headers=GH_HEADERS, json=payload, timeout=30)
    resp.raise_for_status()


def gh_latest_run():
    url = f"https://api.github.com/repos/{GITHUB_REPO}/actions/workflows/render_rules_horror.yml/runs"
    r = requests.get(url, headers=GH_HEADERS, params={"per_page": 1}, timeout=20)
    r.raise_for_status()
    runs = r.json().get("workflow_runs", [])
    return runs[0] if runs else None


def gh_run_jobs(run_id: int):
    url = f"https://api.github.com/repos/{GITHUB_REPO}/actions/runs/{run_id}/jobs"
    r = requests.get(url, headers=GH_HEADERS, params={"per_page": 30}, timeout=20)
    r.raise_for_status()
    return r.json().get("jobs", [])


def format_progress(run: dict, jobs: list, slug: str, elapsed_s: int) -> str:
    mins, secs = divmod(elapsed_s, 60)
    prep = next((j for j in jobs if j["name"] == "prepare"), None)
    fin  = next((j for j in jobs if j["name"] == "finish"), None)
    ren  = [j for j in jobs if j["name"].startswith("render")]

    def icon(j):
        if not j: return "⏳ Waiting"
        if j["status"] == "completed":
            return "✅ Done" if j["conclusion"] == "success" else f"❌ {j['conclusion']}"
        if j["status"] == "in_progress": return "🔄 Running"
        return "⏳ Queued"

    r_done = sum(1 for j in ren if j["status"] == "completed" and j["conclusion"] == "success")
    r_run  = sum(1 for j in ren if j["status"] == "in_progress")
    r_tot  = max(len(ren), 10)
    bar_n  = int(round(10 * r_done / r_tot))
    bar    = "█" * bar_n + "░" * (10 - bar_n)
    st     = run.get("status", "unknown")
    if st == "completed":
        st = f"completed ({run.get('conclusion', '')})"

    return "\n".join([
        f"🎬 Style 5 Long-Form Render: {slug}",
        f"Status: {st} | Elapsed: {mins}m {secs:02d}s",
        "",
        f"1. Voice + Ambient Audio: {icon(prep)}",
        f"2. Remotion 1080p (10 runners): [{bar}] {r_done}/{r_tot} done ({r_run} running)",
        f"3. Join + -14 LUFS Master: {icon(fin)}",
        "",
        f"Download / Logs: {run.get('html_url', '')}",
    ])


async def track_progress(msg, slug: str, prev_run_id):
    t0 = time.time()
    run = None
    for _ in range(9):
        await asyncio.sleep(5)
        try:
            cand = gh_latest_run()
            if cand and cand["id"] != prev_run_id:
                run = cand
                break
        except Exception:
            pass
    if not run:
        await msg.edit_text("Workflow started! Send /status in 15 seconds to track progress.")
        return
    run_id = run["id"]
    last = ""
    while True:
        try:
            run = requests.get(
                f"https://api.github.com/repos/{GITHUB_REPO}/actions/runs/{run_id}",
                headers=GH_HEADERS, timeout=20
            ).json()
            jobs = gh_run_jobs(run_id)
            txt = format_progress(run, jobs, slug, int(time.time() - t0))
            if txt != last:
                await msg.edit_text(txt, disable_web_page_preview=True)
                last = txt
            if run.get("status") == "completed":
                break
        except Exception as e:
            log.warning("Poll error: %s", e)
        await asyncio.sleep(20)


def is_allowed(chat_id: int) -> bool:
    return not ALLOWED_CHAT or str(chat_id) == ALLOWED_CHAT


async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    cid = update.effective_chat.id
    if not is_allowed(cid):
        return
    USER_STATE[cid] = {"step": "topic"}
    await update.message.reply_text(
        "Rules Horror Studio (Style 5 — 2D Remotion, Long-Form 16:9 1080p)\n\n"
        "Step 1/3 — Paste your video TITLE or TOPIC:\n"
        "(e.g. If Your Dad Ever Calls You From Inside Your House at 3 AM… ANSWER IT)\n\n"
        "Commands: /status · /cancel"
    )


async def cmd_cancel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    USER_STATE.pop(update.effective_chat.id, None)
    await update.message.reply_text("Cancelled. Send /start anytime.")


async def cmd_status(update: Update, context: ContextTypes.DEFAULT_TYPE):
    cid = update.effective_chat.id
    if not is_allowed(cid):
        return
    try:
        run = gh_latest_run()
        if not run:
            await update.message.reply_text("No renders yet.")
            return
        jobs = gh_run_jobs(run["id"])
        await update.message.reply_text(format_progress(run, jobs, "latest", 0), disable_web_page_preview=True)
    except Exception as e:
        await update.message.reply_text(f"Error: {e}")


async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not update.message or not update.message.text:
        return
    cid = update.effective_chat.id
    if not is_allowed(cid):
        return

    text = update.message.text.strip()
    st = USER_STATE.get(cid)
    if not st:
        USER_STATE[cid] = {"step": "topic"}
        await update.message.reply_text("Step 1/3 — Paste your video TITLE or TOPIC:")
        return

    if st["step"] == "topic":
        USER_STATE[cid] = {"step": "duration", "topic": text}
        await update.message.reply_text(
            "Topic saved!\n\nStep 2/3 — Reply with your custom DURATION in minutes (e.g. 2, 5, 10, 12, or 15):"
        )
        return

    if st["step"] == "duration":
        m = re.search(r"(\d+(?:\.\d+)?)", text)
        mins = float(m.group(1)) if m else 10.0
        mins = max(1.0, min(20.0, mins))
        USER_STATE[cid] = {"step": "lang", "topic": st["topic"], "minutes": mins}
        await update.message.reply_text(
            f"Duration set to {mins:g} min.\n\nStep 3/3 — Reply with LANGUAGE: English or Hindi"
        )
        return

    if st["step"] == "lang":
        lang = "hi" if "hi" in text.lower() else "en"
        topic = st["topic"]
        mins = st["minutes"]
        USER_STATE.pop(cid, None)
        slug = slugify(topic)
        status = await update.message.reply_text(
            f"Writing {mins:g}-minute Style 5 script + 2D storyboard ({lang.upper()}) for '{topic}'..."
        )
        try:
            script_txt, sb, pub_txt = generate_style5_package(topic, mins, lang)
            wc = len(script_txt.split())
            gh_put_file(f"projects/{slug}/script.txt", script_txt, f"Add script {slug}")
            gh_put_file(f"projects/{slug}/storyboard.json", json.dumps(sb, indent=1), f"Add storyboard {slug}")
            if pub_txt:
                gh_put_file(f"projects/{slug}/publishing.txt", pub_txt, f"Add publishing {slug}")

            prev = gh_latest_run()
            prev_id = prev["id"] if prev else None
            gh_trigger_workflow(slug, lang, cid)

            await status.edit_text(
                f"Generated {wc} words & {len(sb['scenes'])} animated 2D scenes! Starting 10 parallel Remotion runners..."
            )
            if pub_txt:
                await update.message.reply_text(f"Publishing Package:\n\n{pub_txt[:3800]}")
            asyncio.create_task(track_progress(status, slug, prev_id))
        except Exception as e:
            log.exception("Generation failed")
            await status.edit_text(f"Error: {e}\n\nSend /start to try again.")


web = Flask(__name__)

@web.route("/")
@web.route("/health")
def health():
    return "OK", 200


def run_web():
    port = int(os.environ.get("PORT", "10000"))
    web.run(host="0.0.0.0", port=port, use_reloader=False)


def main():
    threading.Thread(target=run_web, daemon=True).start()
    app = Application.builder().token(TELEGRAM_TOKEN).build()
    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("new", cmd_start))
    app.add_handler(CommandHandler("cancel", cmd_cancel))
    app.add_handler(CommandHandler("status", cmd_status))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))
    log.info("Rules Horror Style 5 Bot started...")
    asyncio.set_event_loop(asyncio.new_event_loop())
    app.run_polling(drop_pending_updates=True)


if __name__ == "__main__":
    main()