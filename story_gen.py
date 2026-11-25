"""Style 5 (Creepy Pictogram Cartoon) Long-Form Script + Storyboard + Publishing Generator.
Takes: topic/title, custom duration in minutes (e.g. 5, 10, 12, 15), and language (en/hi).
Produces:
  1) script_txt     (full Style 5 Lullorin-architecture script sized to exact duration)
  2) storyboard     (JSON driving pre-tested Remotion SVG scenes — ZERO code crashes!)
  3) publishing_txt (10 viral titles, SEO description, tags, 5 thumbnail prompts)
"""
import os, re, json, time
import requests

GEMINI_API_KEY  = os.environ["GEMINI_API_KEY"]
PRIMARY_MODEL   = os.environ.get("GEMINI_MODEL", "gemini-3.8-flash")
FALLBACK_MODELS = [PRIMARY_MODEL, "gemini-3.5-flash-lite", "gemini-2.5-flash"]

SCENES = [
    "rule_card", "big_word", "phone_call", "phone_text", "phone_clock",
    "phone_map", "room_doorway", "room_bed", "room_couch", "room_pet",
    "entity_grin", "rewind_clue"
]


def _call_gemini(model: str, system_prompt: str, user_prompt: str):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    headers = {"Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY}
    gen_cfg = {"temperature": 0.78, "maxOutputTokens": 24576}
    if model.startswith("gemini-3.8") or model.startswith("gemini-3"):
        gen_cfg["thinkingConfig"] = {"thinkingLevel": "low"}
    elif model.startswith("gemini-2.5"):
        gen_cfg["thinkingConfig"] = {"thinkingBudget": 0}
    body = {
        "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
        "systemInstruction": {"parts": [{"text": system_prompt}]},
        "generationConfig": gen_cfg,
    }
    r = requests.post(url, headers=headers, json=body, timeout=240)
    r.raise_for_status()
    parts = r.json()["candidates"][0]["content"]["parts"]
    return "".join(p.get("text", "") for p in parts if not p.get("thought"))


def _strip_fences(s: str) -> str:
    s = s.strip()
    s = re.sub(r"^```[a-zA-Z]*\s*", "", s)
    s = re.sub(r"\s*```$", "", s)
    return s.strip()


def generate_style5_package(topic: str, minutes: float, lang: str = "en"):
    target_words = max(150, int(round(minutes * 145)))
    target_scenes = max(12, int(round(minutes * 11)))
    lang_label = "Hindi (Devanagari, natural spoken Hindi keeping common English words like phone, rule, door)" if lang.startswith("hi") else "English"

    system_prompt = f"""You are a viral YouTube Rules-Horror writer & director for Style 5 (Creepy Pictogram Cartoon — Lullorin / Nightora format).
Write a complete {minutes}-minute video (~{target_words} spoken words) in {lang_label} following the EXACT Style 5 architecture:
1. Cold open: restate the title as immediate survival instructions + 2-3 extra don'ts.
2. "I'm not talking about... I'm talking about this." Rule out the normal explanation, then show the real anomaly in quiet domestic beats.
3. A quick test + the 7-rule promise ("There are seven rules. Rule seven explains why...").
4. Rules 1 to 7: "Rule number one. [Title]." Why you'll want to break it -> what's really happening -> "People who've tried it say..." -> exact instruction. Include 1 named victim story and a planted callback.
5. Rule 7 / finale twist reframing every small domestic thing that ever felt off, recap close, last-line chill, and a Nightora comment-game CTA.

OUTPUT FORMAT (STRICT — use these exact 3 markers):
===SCRIPT===
<Full spoken script, second-person present tense, short punchy sentences, ~{target_words} words>
===STORYBOARD_JSON===
{{
  "channel": "NIGHT FILES",
  "file_num": "08",
  "scenes": [
    {{"id": "s01", "word_start": 0, "scene": "phone_call", "rule_num": 0, "title": "DAD", "subtitle": "3:03 AM · INSIDE HOUSE", "danger": false, "sfx": "buzz"}},
    {{"id": "s02", "word_start": 14, "scene": "room_doorway", "rule_num": 0, "normal_bubble": "Are you awake?", "echo_bubble": "Are you awake?", "danger": true, "sfx": "click"}},
    {{"id": "s03", "word_start": 32, "scene": "rule_card", "rule_num": 1, "title": "DO NOT HANG UP", "sfx": "sting"}}
  ]
}}
===PUBLISHING===
<5 viral YouTube titles under 70 chars, short SEO description with chapters, comma-separated tags, and 3 thumbnail prompts>

STORYBOARD RULES:
- Generate ~{target_scenes} scenes evenly spaced across 0..{target_words - 10} (a new visual every ~12-16 words = every 4-6 seconds!).
- Allowed "scene" values ONLY: {SCENES}
- Allowed "sfx" values ONLY: "buzz", "click", "sting", "beep", or omit.
- Use "rule_card" at the start of every Rule 1..7, "big_word" on shocking punchlines, "entity_grin" on horror reveals, and alternate "phone_call", "phone_text", "phone_clock", "phone_map", "room_doorway", "room_bed", "room_couch", "room_pet", "rewind_clue".
"""
    user_prompt = f"Create the complete {minutes}-minute (~{target_words} words) Style 5 video package for:\n{topic}"
    last_err = None
    for model in list(dict.fromkeys(FALLBACK_MODELS)):
        for attempt in range(2):
            try:
                raw = _call_gemini(model, system_prompt, user_prompt)
                m_sc = re.search(r"===SCRIPT===\s*(.*?)\s*===STORYBOARD_JSON===", raw, re.S)
                m_sb = re.search(r"===STORYBOARD_JSON===\s*(.*?)\s*===PUBLISHING===", raw, re.S)
                m_pb = re.search(r"===PUBLISHING===\s*(.*)", raw, re.S)
                if not (m_sc and m_sb):
                    raise ValueError("Missing ===SCRIPT=== or ===STORYBOARD_JSON=== markers")
                script_txt = m_sc.group(1).strip()
                sb = json.loads(_strip_fences(m_sb.group(1)))
                if not sb.get("scenes"):
                    raise ValueError("Empty scenes array")
                pub_txt = m_pb.group(1).strip() if m_pb else ""
                return script_txt, sb, pub_txt
            except requests.HTTPError as e:
                last_err = e
                code = e.response.status_code if e.response is not None else 0
                if code in (429, 500, 502, 503, 504):
                    time.sleep(3 * (attempt + 1))
                    continue
                break
            except Exception as e:
                last_err = e
                time.sleep(2)
    raise RuntimeError(f"Style 5 generation failed ({last_err})")
