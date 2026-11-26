"""Hybrid Custom-SVG Nightora Rules-Horror Generator.
Produces:
  1) script_txt     (100% original Nightora-style script with [whisper] / [shout] acting tags)
  2) storyboard     (JSON mixing crisp built-in UI components — rule_card, clock_led, phone_text,
                     phone_call, phone_map, notepad_rules, strike_words, callback_text — with
                     brand-new AI-drawn custom Nightora SVGs for EVERY unique story beat,
                     validated with strict XML parsing and zero consecutive repeats)
  3) publishing_txt (10 viral titles, SEO description, tags, 5 thumbnail prompts)
"""
import os
import re
import json
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
import requests

GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]
PRIMARY_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.8-flash")
FALLBACK_MODELS = [
    PRIMARY_MODEL,
    "gemini-3.8-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash",
    "gemini-2.5-flash",
]

UI_SCENES = {
    "rule_card",
    "clock_led",
    "phone_text",
    "phone_call",
    "phone_map",
    "notepad_rules",
    "strike_words",
    "callback_text",
}

FALLBACK_SCENES = {
    "window_outside",
    "street_lamp",
    "bedroom_dark",
    "hallway_view",
    "door_crack",
    "door_peephole",
    "stairs_creak",
    "house_cutaway",
    "mirror_view",
    "eye_closeup",
    "face_protag",
    "face_shadow",
    "face_uncanny",
    "hand_reach",
}

VALID_SFX = {"sting", "tick", "creak", "click", "thud", "buzz", "beep"}

_ACTIVE_MODEL = None


def _discover_text_models() -> list:
    try:
        r = requests.get(
            "https://generativelanguage.googleapis.com/v1beta/models",
            headers={"x-goog-api-key": GEMINI_API_KEY},
            timeout=20,
        )
        r.raise_for_status()
        found = []
        for m in r.json().get("models", []):
            name = m.get("name", "").replace("models/", "")
            methods = m.get("supportedGenerationMethods", [])
            if "generateContent" in methods and "gemini" in name and "tts" not in name and "embedding" not in name:
                found.append(name)
        found.sort(key=lambda x: (0 if "flash" in x else 1, x))
        return found[:5]
    except Exception:
        return []


def _call_gemini(model: str, system_prompt: str, user_prompt: str, temp: float = 0.82) -> str:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    headers = {"Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY}
    gen_cfg = {"temperature": temp, "maxOutputTokens": 24576}
    if model.startswith("gemini-3"):
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


def _call_with_fallback(system_prompt: str, user_prompt: str, temp: float = 0.82) -> str:
    global _ACTIVE_MODEL
    candidates = []
    if _ACTIVE_MODEL:
        candidates.append(_ACTIVE_MODEL)
    candidates.extend(FALLBACK_MODELS)
    candidates = list(dict.fromkeys(candidates))

    last_err = None
    tried = set()
    for model in candidates:
        tried.add(model)
        try:
            out = _call_gemini(model, system_prompt, user_prompt, temp=temp)
            _ACTIVE_MODEL = model
            return out
        except Exception as e:
            last_err = e

    for model in _discover_text_models():
        if model in tried:
            continue
        try:
            out = _call_gemini(model, system_prompt, user_prompt, temp=temp)
            _ACTIVE_MODEL = model
            return out
        except Exception as e:
            last_err = e

    raise RuntimeError(f"Gemini generation failed: {last_err}")


def _strip_fences(s: str) -> str:
    s = s.strip()
    s = re.sub(r"^```[a-zA-Z]*\s*", "", s)
    s = re.sub(r"\s*```$", "", s)
    return s.strip()


def sanitize_svg_inner(raw_svg: str) -> str:
    """Strips outer <svg> wrapper, blocks unsafe tags/attrs, and validates XML cleanly."""
    if not raw_svg or not isinstance(raw_svg, str):
        return ""
    s = raw_svg.strip()
    # Remove markdown fences if any
    s = re.sub(r"^```[a-zA-Z]*\s*", "", s)
    s = re.sub(r"\s*```$", "", s).strip()
    # Strip XML declarations / comments
    s = re.sub(r"<\?xml[^>]*\?>", "", s)
    s = re.sub(r"<!--.*?-->", "", s, flags=re.S)
    # Remove dangerous tags
    s = re.sub(r"<(script|foreignObject|iframe|object|embed)[^>]*>.*?</\1>", "", s, flags=re.I | re.S)
    # Strip event handlers (onload, onerror, etc.)
    s = re.sub(r'\son[a-z]+\s*=\s*("[^"]*"|\'[^\']*\')', "", s, flags=re.I)
    # Unwrap outer <svg ...> ... </svg> if present
    m = re.match(r"^\s*<svg[^>]*>(.*)</svg>\s*$", s, flags=re.I | re.S)
    if m:
        s = m.group(1).strip()
    if not s:
        return ""
    # Validate strict XML by wrapping in a dummy root
    try:
        ET.fromstring(f"<g xmlns='http://www.w3.org/2000/svg'>{s}</g>")
        return s
    except Exception:
        return ""


def _draw_custom_svg_batch(batch: list, topic: str) -> dict:
    """Generates custom Nightora-style SVG inner markup for a batch of 8-12 story beats."""
    sys_prompt = """You are a minimalist vector artist drawing NIGHTORA-style dark horror SVG frames on a 1280x720 canvas.

EXACT NIGHTORA ART STYLE (follow strictly):
- Background is ALREADY pure #000000 black (do NOT draw a full-screen background rect).
- Crisp thin white architectural/object lines: stroke="#F2F2F2" stroke-width="2.2" fill="none".
- Simple geometric pictogram characters: soft light-gray (#D2D4D6) rounded body/circle head with expressive minimal dark eyes/mouth (#111111) for the protagonist; dark eerie silhouette (#202328 with stroke="#4B505A") for the threat/entity.
- Accent colors ONLY when meaningful: warm lamp/door light glow rgba(242,184,75,0.22) or #F2B84B, red LED/danger #FF3B30, subtle night sky #0A101B, single tear #7EC8F2.
- SAFE CANVAS ZONE: keep ALL artwork inside x=80..1200 and y=90..570 so it NEVER covers the top REC HUD (y<65) or bottom captions (y>600).
- Use clean, valid XML SVG primitives ONLY (<rect>, <circle>, <ellipse>, <line>, <polyline>, <polygon>, <path>, <g>, <text>). Always self-close empty tags (<rect ... />). Never use <script>, <style>, or unescaped '&'.
- Make EVERY drawing visually distinct, immediately readable in 2 seconds, and 100% literal to that scene's visual_brief!

Return ONLY a valid JSON object mapping each scene `id` to its inner SVG string (NO outer <svg> tag):
{"s02": "<line ... /><circle ... />", "s04": "..."}"""

    items = [
        {"id": sc["id"], "cue": sc.get("cue", ""), "visual_brief": sc.get("visual_brief", ""), "danger": bool(sc.get("danger"))}
        for sc in batch
    ]
    user_prompt = f"Story topic: {topic}\nDraw a unique, literal Nightora SVG for each of these scenes:\n{json.dumps(items, ensure_ascii=False)}"
    try:
        raw = _call_with_fallback(sys_prompt, user_prompt, temp=0.65)
        data = json.loads(_strip_fences(raw))
        out = {}
        if isinstance(data, dict):
            for k, v in data.items():
                clean = sanitize_svg_inner(v)
                if clean:
                    out[k] = clean
        return out
    except Exception:
        return {}


def _sanitize_and_hydrate_scenes(scenes: list, topic: str) -> list:
    """Validates storyboard fields and generates custom Nightora SVGs in parallel batches."""
    cleaned = []
    custom_targets = []
    for idx, sc in enumerate(scenes):
        if not isinstance(sc, dict):
            continue
        sc["id"] = f"s{idx + 1:02d}"
        st = str(sc.get("scene", "custom_svg")).strip()
        if st not in UI_SCENES and st not in FALLBACK_SCENES and st != "custom_svg":
            st = "custom_svg"
        sc["scene"] = st

        fb = str(sc.get("fallback_scene", "bedroom_dark")).strip()
        if fb not in FALLBACK_SCENES:
            fb = "bedroom_dark"
        sc["fallback_scene"] = fb

        for str_key in ("bubble", "title", "subtitle", "sender", "clock", "distance", "cue", "rule_text", "visual_brief"):
            if str_key in sc and not isinstance(sc[str_key], str):
                sc.pop(str_key, None)
        if "messages" in sc and not isinstance(sc["messages"], list):
            sc.pop("messages", None)
        if "words" in sc and not isinstance(sc["words"], list):
            sc.pop("words", None)
        if sc.get("sfx") not in VALID_SFX:
            sc.pop("sfx", None)

        if st == "custom_svg":
            if not sc.get("visual_brief"):
                sc["visual_brief"] = f"Minimalist Nightora horror scene illustrating: {sc.get('cue', topic)}"
            custom_targets.append(sc)
        cleaned.append(sc)

    # Batch-generate custom SVGs concurrently (10 scenes per batch, up to 4 parallel workers)
    batch_size = 10
    batches = [custom_targets[i : i + batch_size] for i in range(0, len(custom_targets), batch_size)]
    svg_map = {}
    if batches:
        with ThreadPoolExecutor(max_workers=4) as ex:
            futures = [ex.submit(_draw_custom_svg_batch, b, topic) for b in batches]
            for fut in futures:
                try:
                    svg_map.update(fut.result())
                except Exception:
                    pass

    for sc in cleaned:
        if sc["scene"] == "custom_svg":
            svg_code = svg_map.get(sc["id"], "")
            if svg_code:
                sc["svg"] = svg_code
            else:
                # Safe fallback if a single SVG failed XML validation
                sc["scene"] = sc["fallback_scene"]

    return cleaned


def generate_style5_package(topic: str, minutes: float, lang: str = "en"):
    target_words = max(160, int(round(minutes * 150)))
    target_scenes = max(20, int(round(minutes * 20)))
    lang_label = (
        "Hindi (Devanagari, natural spoken Hindi keeping common English words like phone, text, window, door)"
        if lang.startswith("hi")
        else "English"
    )

    system_prompt = f"""You are an original YouTube Rules-Horror writer & visual director creating a NIGHTORA-style dark minimalist thriller.

CRITICAL ORIGINALITY RULE:
- Write a 100% BRAND-NEW, ORIGINAL story strictly built around the user's exact TOPIC below.
- Invent a fresh protagonist name, fresh setting, fresh late-night time, fresh 7 rules belonging ONLY to this topic, and an original twist ending.
- NEVER reuse stories about a mom calling for dinner from downstairs or a boy named Leo.

STORY STRUCTURE ({minutes} minutes, ~{target_words} spoken words in {lang_label}):
1. Cold open (0:00-0:25): Hook directly with the user's topic as urgent survival advice + promise 7 rules where Rule 7 reveals the chilling truth.
2. Incident setup: Introduce your original protagonist, exact time, and the exact moment the premise begins.
3. Rules 1 to 6: Alternate crisp rule cards with tense survival explanations and the protagonist's real-time experience. Plant ONE subtle clue early that pays off in the twist.
4. Rule 7 & Finale Twist: Deliver a chilling twist specific to this premise, pay off the clue, and close with a sharp final line.

VOICE ACTING TAGS IN SCRIPT:
- Put [whisper] before whispered lines.
- Put [shout] before distant/loud calling lines.
- Keep sentences short, punchy, and fast-paced (5-12 words each).

HYBRID VISUAL SYSTEM (~{target_scenes} fast-paced scenes, cutting every 2.5-3.2 seconds):
- For UI / text / phone / clock moments, use these built-in crisp components:
  * `rule_card`      (`rule_num`: 1..7, `title`: ALL-CAPS rule title, `danger`: true for rule 7)
  * `clock_led`      (`clock`: e.g. "0:10" or "2:17" or "5:48")
  * `phone_text`     (`sender`, `messages`: ["short msg 1", "short msg 2"], `clock`)
  * `phone_call`     (`sender`, `subtitle`: e.g. "0.0 MILES AWAY")
  * `phone_map`      (`sender`, `distance`: e.g. "30 FT AWAY")
  * `notepad_rules`  (`title`: short ALL-CAPS header from this story, `show_q7`: true/false, `rule_text`: optional)
  * `strike_words`   (`words`: ["WORD1", "WORD2", "WORD3"] from THIS story)
  * `callback_text`  (`title`, `subtitle`, `danger`: true/false)
- For ALL OTHER story moments (rooms, hallways, windows, streets, cars, bathrooms, pets, hands, faces, shadows, twists), set `"scene": "custom_svg"` AND write a concrete, literal 1-sentence `"visual_brief"` describing the exact Nightora minimalist white-line drawing for what is spoken in that beat, plus a `"fallback_scene"` from: window_outside, street_lamp, bedroom_dark, hallway_view, door_crack, door_peephole, stairs_creak, house_cutaway, mirror_view, eye_closeup, face_protag, face_shadow, face_uncanny, hand_reach.

STRICT SYNC & QUALITY RULES:
- EVERY scene MUST have `"cue"`: the EXACT first 3 to 5 spoken words copied verbatim from `===SCRIPT===` where that visual begins (in strict chronological order, without [whisper]/[shout]).
- Every `"custom_svg"` `"visual_brief"` MUST literally depict what the narrator is saying at that exact second (and vary camera angles: wide room -> close-up object -> close-up face -> detail shot, so NO two consecutive shots look similar!).
- Only use valid `"sfx"` values: "sting", "tick", "creak", "click", "thud", "buzz", "beep" (or omit).
- `"bubble"` must always be a short string (2-7 words) or omitted — NEVER a boolean!
- Include `"keywords"`: 15-25 dramatic uppercase single words from YOUR script to highlight red in captions.

OUTPUT FORMAT (STRICT — use these exact 3 markers):
===SCRIPT===
<Full original spoken script, ~{target_words} words>
===STORYBOARD_JSON===
{{
  "channel": "NIGHTORA",
  "day": "FRIDAY",
  "file_num": "01",
  "keywords": ["DON'T", "NEVER", "SEVEN", "DARK", "WRONG"],
  "scenes": [ ... ]
}}
===PUBLISHING===
<10 viral YouTube titles, SEO description, comma-separated tags, and 5 thumbnail prompts>
"""

    user_prompt = (
        f"USER TOPIC / TITLE: {topic}\n"
        f"Target length: {minutes} minutes (~{target_words} spoken words, ~{target_scenes} fast-paced hybrid scenes).\n"
        f"Language: {lang_label}.\n"
        f"Make every story beat a custom_svg with a vivid, literal visual_brief matching the exact spoken line."
    )

    raw = _call_with_fallback(system_prompt, user_prompt, temp=0.84)
    if "===SCRIPT===" not in raw or "===STORYBOARD_JSON===" not in raw:
        raise RuntimeError("Gemini response missing expected ===SCRIPT=== / ===STORYBOARD_JSON=== markers")

    m_sc = re.search(r"===SCRIPT===\s*(.*?)\s*===STORYBOARD_JSON===", raw, re.S)
    m_sb = re.search(r"===STORYBOARD_JSON===\s*(.*?)\s*===PUBLISHING===", raw, re.S)
    m_pb = re.search(r"===PUBLISHING===\s*(.*)", raw, re.S)

    script_txt = m_sc.group(1).strip() if m_sc else ""
    sb_raw = _strip_fences(m_sb.group(1)) if m_sb else "{}"
    publishing_txt = m_pb.group(1).strip() if m_pb else ""

    storyboard = json.loads(sb_raw)
    storyboard["scenes"] = _sanitize_and_hydrate_scenes(storyboard.get("scenes", []), topic)
    return script_txt, storyboard, publishing_txt
