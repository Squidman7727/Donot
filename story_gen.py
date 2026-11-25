"""Nightora-Style Rules-Horror Long-Form Script + Fast-Paced Storyboard + Publishing Generator.
Produces:
  1) script_txt     (Nightora-style suspense script with [whisper] / [shout] acting tags)
  2) storyboard     (JSON with 20 distinct Nightora SVG scenes, exact spoken `cue` phrases,
                     anti-repetition enforcement, and fast 2.2-3.0s pacing)
  3) publishing_txt (10 viral titles, SEO description, tags, 5 thumbnail prompts)
"""
import os
import re
import json
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

SCENES = [
    "house_cutaway",
    "bedroom_view",
    "kitchen_view",
    "face_kid",
    "face_shadow",
    "face_smile",
    "face_mom_cry",
    "clock_countdown",
    "notepad_rules",
    "rule_dots",
    "rule_card",
    "strike_words",
    "door_crack",
    "stairs_creak",
    "wrist_grab",
    "lamp_reach",
    "hallway_figure",
    "window_dawn",
    "flashback_scene",
    "callback_text",
]

ALT_ANGLE = {
    "house_cutaway": "bedroom_view",
    "bedroom_view": "face_kid",
    "kitchen_view": "house_cutaway",
    "face_kid": "bedroom_view",
    "face_shadow": "door_crack",
    "face_smile": "face_kid",
    "face_mom_cry": "hallway_figure",
    "clock_countdown": "window_dawn",
    "notepad_rules": "rule_dots",
    "rule_dots": "notepad_rules",
    "rule_card": "bedroom_view",
    "strike_words": "house_cutaway",
    "door_crack": "face_kid",
    "stairs_creak": "door_crack",
    "wrist_grab": "face_shadow",
    "lamp_reach": "door_crack",
    "hallway_figure": "face_mom_cry",
    "window_dawn": "clock_countdown",
    "flashback_scene": "face_kid",
    "callback_text": "face_shadow",
}


def _discover_text_models() -> list:
    """Auto-discovers live Gemini text models on the user's API key if defaults 404."""
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
        # Prefer flash models first
        found.sort(key=lambda x: (0 if "flash" in x else 1, x), reverse=False)
        return found[:5]
    except Exception:
        return []


def _call_gemini(model: str, system_prompt: str, user_prompt: str) -> str:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    headers = {"Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY}
    gen_cfg = {"temperature": 0.78, "maxOutputTokens": 24576}
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


def _strip_fences(s: str) -> str:
    s = s.strip()
    s = re.sub(r"^```[a-zA-Z]*\s*", "", s)
    s = re.sub(r"\s*```$", "", s)
    return s.strip()


def _enforce_no_repeats(scenes: list) -> list:
    """Guarantees valid scene types, zero consecutive duplicates, and balanced variety."""
    cleaned = []
    prev_type = None
    recent = []
    for idx, sc in enumerate(scenes):
        if not isinstance(sc, dict):
            continue
        st = sc.get("scene", "house_cutaway")
        if st not in SCENES:
            st = "house_cutaway"
        if st == prev_type:
            cand = ALT_ANGLE.get(st, "face_kid")
            if cand == prev_type or cand in recent[-2:]:
                for alt in SCENES:
                    if alt not in (prev_type, "rule_card", "rule_dots", "notepad_rules") and alt not in recent[-3:]:
                        cand = alt
                        break
            st = cand
        sc["scene"] = st
        sc["id"] = f"s{idx + 1:02d}"
        cleaned.append(sc)
        prev_type = st
        recent.append(st)
    return cleaned


def generate_style5_package(topic: str, minutes: float, lang: str = "en"):
    target_words = max(160, int(round(minutes * 150)))
    target_scenes = max(20, int(round(minutes * 23)))
    lang_label = (
        "Hindi (Devanagari, natural spoken Hindi keeping common English words like phone, rule, door)"
        if lang.startswith("hi")
        else "English"
    )

    system_prompt = f"""You are a viral YouTube Rules-Horror writer & visual director recreating the exact NIGHTORA minimalist dark-pictogram thriller format.
Write a gripping {minutes}-minute video (~{target_words} spoken words) in {lang_label}:
1. Cold open (0:00-0:30): Immediately hook the viewer with the premise, a 10-second countdown tension beat, and the 7-rule promise ("There are seven rules. Six will keep you safe until morning. The seventh is the one almost nobody finds in time.").
2. Protagonist setup: Introduce a relatable kid/character (e.g., Leo, 11, 9:14 PM on a Tuesday night) and the first eerie incident.
3. Rules 1 to 6: Alternate crisp rule title cards ("Rule one. Don't answer the voice.") with vivid survival explanations AND the protagonist's real-time story unfolding beat-by-beat. Plant ONE subtle verbal mistake/callback early (like a wrong name or phrase) that pays off in the finale.
4. Rule 7 & Plot Twist Finale: Deliver a chilling psychological twist that reframes every rule they followed all night, pay off the planted callback, and close with a sharp final chill + subscribe CTA.

VOICE ACTING TAGS IN SCRIPT:
- Put [whisper] right before whispered dialogue lines (e.g. [whisper] Don't answer. I heard it too.).
- Put [shout] right before distant calling voices (e.g. [shout] Dinner! Come on down!).
- Keep narration sentences short, punchy, and tense (5-12 words each) for fast-paced delivery.

AVAILABLE 20 NIGHTORA SCENE TYPES (use ALL relevant types; NEVER repeat the same scene type twice in a row!):
- house_cutaway   (2-story white-line house cross-section, kitchen light cone, stairs, upstairs/downstairs figures; optional `bubble`, `highlight_room`: true, `both_figures`: true)
- bedroom_view    (nightstand with red LED clock, lamp, 4-pane moon/dawn window, closet, kid & dark figure; optional `clock`, `grab`: true, `dawn`: true, `trap_box`: true, `bubble`)
- kitchen_view    (steaming pot on counter, warm hanging bulb cone, dining table, chair, calling `bubble`)
- face_kid        (close-up geometric kid face; `mood`: "neutral"|"scared"|"gasp"|"cry", optional `sound_waves`: true, `bubble`)
- face_shadow     (faceless dark silhouette head in shadows; optional `bubble`)
- face_smile      (creepy wide-eyed unblinking smile reveal in gray dawn light; optional `bubble`)
- face_mom_cry    (soft geometric parent face; `mood`: "cry"|"smile", optional `bubble`)
- clock_countdown (centered glowing red LED digital box; `clock`: "0:10" for countdown or "9:14" / "11:40" / "3:02" / "5:51")
- notepad_rules   (taped yellow lined notepad; `title`: e.g. "IF IT CALLS YOU", `show_q7`: true, `rule_text`: optional line 7 text)
- rule_dots       (7 minimalist squares with glowing red 7th square)
- rule_card       (Nightora rule reveal box; `rule_num`: 1..7, `title`: ALL-CAPS rule title, `danger`: true for rule 7)
- strike_words    (3 quoted words slashed with red lines; `words`: ["COMING", "WHAT?", "OKAY"])
- door_crack      (close-up white door with amber under-door light crack, shadow feet; `feet`: true/false, `bubble`)
- stairs_creak    (white stepped staircase with sound-wave pulses climbing steps; `step`: 1..6)
- wrist_grab      (close-up horizontal white arm with dark fingers gripping; `stretch`: true for double-wrap reveal)
- lamp_reach      (zoomed nightstand lamp + clock + gray hand reaching toward lamp; `clock`)
- hallway_figure  (white silhouette figure outside closed door with hand on wood + tear; `bubble`)
- window_dawn     (4-pane window close-up; `dawn`: false for night moon, true for gray morning light)
- flashback_scene (atmospheric dark-blue water/pier memory scene with kid silhouette & swimming fish)
- callback_text   (stark centered quote card; `title`: e.g. "GOOD BOY, LEO.", `subtitle`: "9:31 PM", `danger`: true/false)

CRITICAL SYNC & PACING RULES:
- Generate approximately {target_scenes} scenes so the visual cuts EVERY 2.2 to 3.2 seconds (fast-paced, never static!).
- EVERY scene MUST have `"cue"`: the EXACT first 3 to 5 spoken words from `===SCRIPT===` where that scene begins (in exact chronological order, without [whisper]/[shout] tags). This locks video 100% to the voiceover!
- NEVER use the same `"scene"` type twice in a row. Alternate wide room shots, close-up faces, object details, clocks, and text cards.
- Include `"keywords"`: 15-25 single dramatic uppercase words from the script (like "ISN'T", "TEN", "SEVEN", "NEVER", "DARK", "WRONG", "KEEP", "REAL") that will flash red in the karaoke captions.

OUTPUT FORMAT (STRICT — use these exact 3 markers):
===SCRIPT===
<Full spoken script, short punchy sentences, ~{target_words} words, with [whisper] and [shout] tags where characters whisper or call out>
===STORYBOARD_JSON===
{{
  "channel": "NIGHTORA",
  "day": "TUESDAY",
  "file_num": "01",
  "keywords": ["ISN'T", "SEVEN", "NEVER", "DON'T", "DARK", "REAL"],
  "scenes": [
    {{
      "id": "s01",
      "cue": "If you hear your mom",
      "scene": "house_cutaway",
      "rule_num": 0,
      "clock": "9:14",
      "bubble": "Dinner!",
      "sfx": "buzz"
    }}
  ]
}}
===PUBLISHING===
<10 viral YouTube titles, SEO description, comma-separated tags, and 5 thumbnail prompts>
"""

    user_prompt = (
        f"Topic / premise: {topic}\n"
        f"Target length: {minutes} minutes (~{target_words} spoken words, ~{target_scenes} fast-paced scenes).\n"
        f"Language: {lang_label}.\n"
        f"Remember: every scene needs an exact chronological `cue` (3-5 words copied verbatim from ===SCRIPT===) and NO consecutive duplicate scene types."
    )

    tried = []
    candidates = list(dict.fromkeys(FALLBACK_MODELS))
    last_err = None
    raw = None

    for model in candidates:
        tried.append(model)
        try:
            raw = _call_gemini(model, system_prompt, user_prompt)
            if "===SCRIPT===" in raw and "===STORYBOARD_JSON===" in raw:
                break
        except Exception as e:
            last_err = e
            continue

    # If hardcoded models all failed (e.g. 404), auto-discover live models on this API key
    if not raw or "===SCRIPT===" not in raw:
        for model in _discover_text_models():
            if model in tried:
                continue
            try:
                raw = _call_gemini(model, system_prompt, user_prompt)
                if "===SCRIPT===" in raw and "===STORYBOARD_JSON===" in raw:
                    break
            except Exception as e:
                last_err = e
                continue

    if not raw or "===SCRIPT===" not in raw:
        raise RuntimeError(f"Gemini generation failed: {last_err}")

    m_sc = re.search(r"===SCRIPT===\s*(.*?)\s*===STORYBOARD_JSON===", raw, re.S)
    m_sb = re.search(r"===STORYBOARD_JSON===\s*(.*?)\s*===PUBLISHING===", raw, re.S)
    m_pb = re.search(r"===PUBLISHING===\s*(.*)", raw, re.S)

    script_txt = m_sc.group(1).strip() if m_sc else ""
    sb_raw = _strip_fences(m_sb.group(1)) if m_sb else "{}"
    publishing_txt = m_pb.group(1).strip() if m_pb else ""

    storyboard = json.loads(sb_raw)
    storyboard["scenes"] = _enforce_no_repeats(storyboard.get("scenes", []))
    return script_txt, storyboard, publishing_txt
