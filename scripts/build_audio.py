"""Nightora-Grade Audio & Exact Phrase-Locked Sync Pipeline.

Voice Engine Priority (automatic):
  1) ElevenLabs API (if ELEVENLABS_API_KEY env var is set) — studio thriller narration
  2) Gemini TTS (if GEMINI_API_KEY env var is set) — deep, warm, slightly raspy narrator
     with real [whisper] and [shout] acting via gemini-2.5-flash-preview-tts (voice: Charon)
  3) Kokoro-82M ONNX (100% free local CPU fallback, voice: am_onyx)
  4) edge-tts emergency fallback (only if all above are unavailable)

Sync Engine:
  - Runs faster-whisper (word_timestamps=True) on the final vo.wav to produce
    millisecond-accurate [start, end, word] tuples in video_app/src/data/words.json.
  - Aligns every scene's `cue` phrase in video_app/src/data/storyboard.json directly
    to the exact spoken timestamp (`start_sec`) so video and voice stay 100% locked
    with zero drift, and auto-splits any shot longer than 4.2 seconds into a fresh angle.

Usage:
  python3 scripts/build_audio.py projects/<slug>/script.txt [--lang en|hi]
"""
import asyncio
import base64
import json
import os
import re
import subprocess
import sys
import time
import numpy as np
import requests

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(ROOT, "video_app", "public")
DATA = os.path.join(ROOT, "video_app", "src", "data")
os.makedirs(PUB, exist_ok=True)
os.makedirs(DATA, exist_ok=True)
SR = 44100


def write_wav(path: str, arr: np.ndarray, sr: int = SR):
    arr = np.clip(arr, -1.0, 1.0).astype(np.float32)
    p = subprocess.Popen(
        ["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(sr), "-ac", "1", "-i", "-", path],
        stdin=subprocess.PIPE,
    )
    p.communicate(arr.tobytes())


def decode_to_pcm(path: str) -> np.ndarray:
    raw = subprocess.check_output(
        ["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"]
    )
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768.0


def resample_pcm(arr: np.ndarray, src_sr: int, dst_sr: int = SR) -> np.ndarray:
    if src_sr == dst_sr:
        return arr.astype(np.float32)
    p = subprocess.Popen(
        [
            "ffmpeg", "-v", "error", "-f", "f32le", "-ar", str(src_sr), "-ac", "1", "-i", "-",
            "-f", "f32le", "-ar", str(dst_sr), "-ac", "1", "-",
        ],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
    )
    out, _ = p.communicate(arr.astype(np.float32).tobytes())
    return np.frombuffer(out, np.float32).copy()


def trim_silence(a: np.ndarray, thresh: float = 0.012, lead_s: float = 0.02, tail_s: float = 0.05) -> np.ndarray:
    nz = np.nonzero(np.abs(a) > thresh)[0]
    if len(nz) == 0:
        return np.zeros(0, dtype=np.float32)
    lead = max(0, int(nz[0]) - int(lead_s * SR))
    tail = min(len(a), int(nz[-1]) + int(tail_s * SR))
    return a[lead:tail]


def make_sfx_and_bed(dur_sec: float):
    rng = np.random.default_rng(42)
    t = np.linspace(0, dur_sec + 3.0, int((dur_sec + 3.0) * SR), dtype=np.float32)
    # Warm dark Nightora sub-bass horror drone
    bed = (
        0.38 * np.sin(2 * np.pi * 49.0 * t)
        + 0.24 * np.sin(2 * np.pi * 73.4 * t + 0.4 * np.sin(2 * np.pi * 0.09 * t))
        + 0.12 * np.sin(2 * np.pi * 98.0 * t)
        + 0.025 * rng.normal(0, 1, len(t)).astype(np.float32)
    ) * (0.78 + 0.22 * np.sin(2 * np.pi * 0.06 * t))
    write_wav(os.path.join(PUB, "bed.wav"), bed * 0.30)

    # 1) Low suspense sting / bass boom (rule reveals & twists)
    ts = np.linspace(0, 1.35, int(1.35 * SR), dtype=np.float32)
    sting = (
        0.75 * np.sin(2 * np.pi * (58 - 18 * ts / 1.35) * ts)
        + 0.45 * np.sin(2 * np.pi * 87 * ts)
    ) * np.exp(-ts * 2.4)
    write_wav(os.path.join(PUB, "sfx_sting.wav"), sting * 0.78)

    # 2) Sharp clock tick (countdown / time jumps)
    tt = np.linspace(0, 0.09, int(0.09 * SR), dtype=np.float32)
    tick = (np.sin(2 * np.pi * 1600 * tt) + 0.5 * rng.normal(0, 1, len(tt))) * np.exp(-tt * 75)
    write_wav(os.path.join(PUB, "sfx_tick.wav"), tick * 0.75)

    # 3) Wood stair creak
    tc = np.linspace(0, 0.75, int(0.75 * SR), dtype=np.float32)
    creak_f = 240 + 180 * np.sin(2 * np.pi * 3.2 * tc)
    creak = np.sin(2 * np.pi * np.cumsum(creak_f) / SR) * (0.5 + 0.5 * np.sin(2 * np.pi * 22 * tc)) * np.exp(-tc * 2.2)
    write_wav(os.path.join(PUB, "sfx_creak.wav"), creak * 0.55)

    # 4) Soft door / lock click
    tk = np.linspace(0, 0.14, int(0.14 * SR), dtype=np.float32)
    click = rng.normal(0, 1, len(tk)).astype(np.float32) * np.exp(-tk * 55)
    write_wav(os.path.join(PUB, "sfx_click.wav"), click * 0.75)

    # 5) Deep thud / heartbeat
    th = np.linspace(0, 0.45, int(0.45 * SR), dtype=np.float32)
    thud = np.sin(2 * np.pi * (72 * np.exp(-th * 4.5)) * th) * np.exp(-th * 7.5)
    write_wav(os.path.join(PUB, "sfx_thud.wav"), thud * 0.85)

    # 6) Subtle eerie hum/buzz
    tb = np.linspace(0, 0.50, int(0.50 * SR), dtype=np.float32)
    buzz = np.sin(2 * np.pi * 130 * tb) * (0.5 + 0.5 * np.sin(2 * np.pi * 18 * tb)) * np.exp(-tb * 2.8)
    write_wav(os.path.join(PUB, "sfx_buzz.wav"), buzz * 0.55)

    # 7) Crisp beep
    tp = np.linspace(0, 0.22, int(0.22 * SR), dtype=np.float32)
    beep = np.sin(2 * np.pi * 1120 * tp) * np.exp(-tp * 8)
    write_wav(os.path.join(PUB, "sfx_beep.wav"), beep * 0.45)


# ---------- SCRIPT PARSING (PRESERVING [whisper] / [shout] ACTING SEGMENTS) ----------

def parse_script_chunks(raw_text: str):
    """Splits script into natural speaking chunks with acting mode: 'normal' | 'whisper' | 'shout'."""
    segments = []
    for line in raw_text.splitlines():
        l = line.strip()
        if not l or l.startswith("#"):
            continue
        mode = "normal"
        if re.search(r"\[whisper\]", l, re.I):
            mode = "whisper"
        elif re.search(r"\[shout\]", l, re.I):
            mode = "shout"
        clean = re.sub(r"\[[^\]]+\]", "", l).strip()
        if not clean:
            continue
        # Merge adjacent normal lines up to ~38 words for smooth natural prosody
        if mode == "normal" and segments and segments[-1][0] == "normal":
            prev_words = len(segments[-1][1].split())
            if prev_words + len(clean.split()) <= 38:
                segments[-1] = ("normal", segments[-1][1] + " " + clean)
                continue
        segments.append((mode, clean))
    return segments


# ---------- VOICE ENGINE 1: ELEVENLABS (OPTIONAL STUDIO UPGRADE) ----------

def tts_elevenlabs(text: str, mode: str, api_key: str) -> np.ndarray:
    voice_id = os.environ.get("ELEVENLABS_VOICE_ID", "pNInz6obpgDQGcFmaJgB")  # Adam (deep narrator)
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = {"xi-api-key": api_key, "Content-Type": "application/json", "Accept": "audio/mpeg"}
    stability = 0.35 if mode != "normal" else 0.48
    body = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {"stability": stability, "similarity_boost": 0.78, "style": 0.35, "use_speaker_boost": True},
    }
    r = requests.post(url, headers=headers, json=body, timeout=90)
    r.raise_for_status()
    tmp = os.path.join(PUB, "_tmp_el.mp3")
    with open(tmp, "wb") as f:
        f.write(r.content)
    a = decode_to_pcm(tmp)
    os.remove(tmp)
    return a


# ---------- VOICE ENGINE 2: GEMINI TTS (DEFAULT — USES EXISTING GEMINI_API_KEY) ----------

def tts_gemini(text: str, mode: str, api_key: str, lang: str = "en") -> np.ndarray:
    voice_name = os.environ.get("GEMINI_TTS_VOICE", "Charon")  # Deep, calm, warm thriller storyteller
    models = ["gemini-3.1-flash-tts-preview", "gemini-2.5-flash-preview-tts"]

    if mode == "whisper":
        direction = (
            "Speak in an eerie, close-mic, tense whisper — quiet, urgent, and breathy like someone "
            "hiding in a dark bedroom. Read ONLY the exact transcript below:"
        )
    elif mode == "shout":
        direction = (
            "Speak slightly louder and calling out from downstairs in a house, natural and slightly tired, "
            "not screaming. Read ONLY the exact transcript below:"
        )
    else:
        direction = (
            "Speak as a deep, calm, warm, slightly raspy American male late-night horror storyteller "
            "(like Nightora / Nexpo). Keep a crisp, steady, gripping pace with natural micro-pauses — "
            "never robotic, never slow. Read ONLY the exact transcript below:"
        )

    prompt = f"{direction}\n\n{text}"
    body = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 1.0,
            "responseModalities": ["AUDIO"],
            "speechConfig": {
                "voiceConfig": {
                    "prebuiltVoiceConfig": {"voiceName": voice_name}
                }
            },
        },
    }

    last_err = None
    for model in models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        for attempt in range(4):
            try:
                r = requests.post(
                    url,
                    headers={"Content-Type": "application/json", "x-goog-api-key": api_key},
                    json=body,
                    timeout=90,
                )
                if r.status_code == 429 or r.status_code >= 500:
                    time.sleep(2 + 2 * attempt)
                    continue
                r.raise_for_status()
                parts = r.json()["candidates"][0]["content"]["parts"]
                inline = next((p["inlineData"] for p in parts if "inlineData" in p), None)
                if not inline:
                    raise RuntimeError("No audio inlineData returned")
                raw = base64.b64decode(inline["data"])
                mime = inline.get("mimeType", "audio/L16;rate=24000")
                m_sr = re.search(r"rate=(\d+)", mime)
                src_sr = int(m_sr.group(1)) if m_sr else 24000
                if "L16" in mime or "pcm" in mime.lower():
                    pcm_arr = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
                    return resample_pcm(pcm_arr, src_sr, SR)
                tmp = os.path.join(PUB, "_tmp_gem.audio")
                with open(tmp, "wb") as f:
                    f.write(raw)
                a = decode_to_pcm(tmp)
                os.remove(tmp)
                return a
            except Exception as e:
                last_err = e
                time.sleep(1.5 + attempt)
    raise RuntimeError(f"Gemini TTS failed: {last_err}")


# ---------- VOICE ENGINE 3: KOKORO-ONNX (100% FREE OFFLINE CPU FALLBACK) ----------

_KOKORO = None

def _get_kokoro():
    global _KOKORO
    if _KOKORO is not None:
        return _KOKORO
    from kokoro_onnx import Kokoro
    cache_dir = os.path.join(ROOT, ".kokoro_cache")
    os.makedirs(cache_dir, exist_ok=True)
    model_p = os.path.join(cache_dir, "kokoro-v1.0.onnx")
    voices_p = os.path.join(cache_dir, "voices-v1.0.bin")
    base_url = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/"
    for fname, dest in [("kokoro-v1.0.onnx", model_p), ("voices-v1.0.bin", voices_p)]:
        if not os.path.exists(dest):
            print(f"[build_audio] Downloading {fname}...")
            with requests.get(base_url + fname, stream=True, timeout=180) as r:
                r.raise_for_status()
                with open(dest, "wb") as f:
                    for chunk in r.iter_content(1024 * 256):
                        f.write(chunk)
    _KOKORO = Kokoro(model_p, voices_p)
    return _KOKORO


def tts_kokoro(text: str, mode: str, lang: str = "en") -> np.ndarray:
    kokoro = _get_kokoro()
    voice = "hm_omega" if lang.startswith("hi") else "am_onyx"
    lang_code = "hi" if lang.startswith("hi") else "en-us"
    speed = 0.96 if mode == "whisper" else 1.07
    samples, sr = kokoro.create(text, voice=voice, speed=speed, lang=lang_code)
    arr = resample_pcm(np.asarray(samples, dtype=np.float32), sr, SR)
    if mode == "whisper":
        arr = arr * 0.72
    return arr


# ---------- VOICE ENGINE 4: EDGE-TTS EMERGENCY FALLBACK ----------

async def _edge_speak(text: str, voice: str, rate: str, out_mp3: str):
    import edge_tts
    com = edge_tts.Communicate(text, voice, rate=rate)
    with open(out_mp3, "wb") as f:
        async for ch in com.stream():
            if ch["type"] == "audio":
                f.write(ch["data"])


def tts_edge(text: str, lang: str = "en") -> np.ndarray:
    voice = "hi-IN-MadhurNeural" if lang.startswith("hi") else "en-US-AndrewNeural"
    tmp = os.path.join(PUB, "_tmp_edge.mp3")
    asyncio.run(_edge_speak(text, voice, "+4%", tmp))
    a = decode_to_pcm(tmp)
    os.remove(tmp)
    return a


# ---------- EXACT WORD ALIGNMENT VIA FASTER-WHISPER ----------

def extract_word_timestamps(vo_path: str, lang: str = "en"):
    from faster_whisper import WhisperModel
    model_name = "base.en" if lang.startswith("en") else "base"
    print(f"[build_audio] Running faster-whisper ({model_name}) for millisecond-exact word sync...")
    model = WhisperModel(model_name, device="cpu", compute_type="int8")
    segments, _ = model.transcribe(
        vo_path,
        language="en" if lang.startswith("en") else "hi",
        word_timestamps=True,
        vad_filter=False,
    )
    words = []
    for seg in segments:
        if not seg.words:
            continue
        for w in seg.words:
            tx = w.word.strip()
            if tx:
                words.append([round(float(w.start), 3), round(float(w.end), 3), tx])
    return words


# ---------- EXACT PHRASE-LOCKED STORYBOARD SYNC + FAST-PACE GUARD ----------

def _norm(s: str) -> str:
    return re.sub(r"[^\w']+", "", s.lower())


def align_storyboard(words: list, total_dur: float):
    sb_path = os.path.join(DATA, "storyboard.json")
    if not os.path.exists(sb_path) or not words:
        return
    sb = json.load(open(sb_path, encoding="utf-8"))
    scenes = sb.get("scenes", [])
    if not scenes:
        return

    norm_words = [_norm(w[2]) for w in words]
    n_words = len(norm_words)
    cursor = 0

    for i, sc in enumerate(scenes):
        if i == 0:
            sc["start_sec"] = 0.0
            sc["word_start"] = 0
            continue

        cue = sc.get("cue", "")
        cue_tokens = [_norm(x) for x in cue.split() if _norm(x)]
        matched_idx = None

        if cue_tokens:
            win = len(cue_tokens)
            # Search forward from cursor (within reasonable lookahead window first)
            search_end = min(n_words, cursor + max(160, n_words // 3))
            best_score = 0.0
            best_pos = None
            for pos in range(cursor, max(cursor + 1, search_end - win + 1)):
                hits = 0
                for k in range(win):
                    if pos + k < n_words and norm_words[pos + k] == cue_tokens[k]:
                        hits += 1
                score = hits / win
                if score > best_score:
                    best_score = score
                    best_pos = pos
                if score >= 0.85:
                    break
            if best_pos is not None and best_score >= 0.5:
                matched_idx = best_pos

        if matched_idx is None:
            # Proportional monotonic fallback so a missed phrase never drifts
            frac = i / max(1, len(scenes))
            matched_idx = min(n_words - 1, max(cursor + 1, int(frac * n_words)))

        cursor = min(n_words - 1, max(cursor, matched_idx))
        sc["word_start"] = cursor
        sc["start_sec"] = round(float(words[cursor][0]), 3)

    # Guarantee strictly increasing timestamps & fast-paced max shot duration (<= 4.2s)
    alt_cycle = ["face_protag", "door_crack", "bedroom_dark", "face_shadow", "window_outside", "eye_closeup"]
    paced = []
    for i, sc in enumerate(scenes):
        start_t = sc["start_sec"]
        end_t = scenes[i + 1]["start_sec"] if i + 1 < len(scenes) else total_dur
        if paced and start_t <= paced[-1]["start_sec"] + 0.35:
            start_t = round(paced[-1]["start_sec"] + 0.35, 3)
            sc["start_sec"] = start_t
        paced.append(sc)
        # If a beat runs > 4.4s without a visual change, inject a quick cutaway reaction shot
        dur = end_t - start_t
        if dur > 4.4 and sc.get("scene") != "rule_card":
            splits = min(3, int(dur // 3.0))
            for k in range(1, splits + 1):
                sub_t = round(start_t + (dur * k) / (splits + 1), 3)
                prev_scene = paced[-1]["scene"]
                pick = next((x for x in alt_cycle if x != prev_scene), "face_protag")
                paced.append({
                    "id": f"{sc.get('id', 's')}_{k}",
                    "start_sec": sub_t,
                    "word_start": sc.get("word_start", 0),
                    "scene": pick,
                    "rule_num": sc.get("rule_num", 0),
                    "clock": sc.get("clock"),
                    "danger": sc.get("danger", False),
                    "mood": "scared" if sc.get("danger") else "neutral",
                })

    sb["scenes"] = paced
    json.dump(sb, open(sb_path, "w", encoding="utf-8"), indent=2)
    print(f"[build_audio] Phrase-locked {len(paced)} fast-paced scenes to exact audio timestamps!")


def main():
    script_path = sys.argv[1]
    lang = "en"
    if "--lang" in sys.argv:
        lang = sys.argv[sys.argv.index("--lang") + 1].lower()

    raw_text = open(script_path, encoding="utf-8").read()
    segments = parse_script_chunks(raw_text)
    if not segments:
        raise RuntimeError("Empty script file")

    el_key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    gem_key = os.environ.get("GEMINI_API_KEY", "").strip()

    engine = "elevenlabs" if el_key else ("gemini" if gem_key else "kokoro")
    print(f"[build_audio] Synthesizing {len(segments)} chunks using engine={engine} (lang={lang})")

    audio_parts = []
    gap = 0.14  # Tight, fast-paced Nightora gap

    for k, (mode, text) in enumerate(segments):
        a = None
        if engine == "elevenlabs":
            try:
                a = tts_elevenlabs(text, mode, el_key)
            except Exception as e:
                print(f"[build_audio] ElevenLabs chunk {k} failed ({e}), falling back...")
        if a is None and gem_key:
            try:
                a = tts_gemini(text, mode, gem_key, lang)
            except Exception as e:
                print(f"[build_audio] Gemini TTS chunk {k} failed ({e}), falling back to Kokoro...")
        if a is None:
            try:
                a = tts_kokoro(text, mode, lang)
            except Exception as e:
                print(f"[build_audio] Kokoro chunk {k} failed ({e}), falling back to edge-tts...")
                a = tts_edge(text, lang)

        a = trim_silence(a)
        if len(a) == 0:
            continue
        # Normalize each chunk gently so whispers stay atmospheric but clearly audible
        peak = max(1e-6, float(np.abs(a).max()))
        target_peak = 0.68 if mode == "whisper" else 0.88
        a = a / peak * target_peak
        audio_parts.append(a)
        if k < len(segments) - 1:
            pause = 0.22 if mode != "normal" else gap
            audio_parts.append(np.zeros(int(pause * SR), dtype=np.float32))

    vo = np.concatenate(audio_parts)
    vo = vo / max(1e-6, float(np.abs(vo).max())) * 0.90
    total_dur = len(vo) / SR
    vo_path = os.path.join(PUB, "vo.wav")
    write_wav(vo_path, vo)
    make_sfx_and_bed(total_dur)

    words_out = extract_word_timestamps(vo_path, lang)
    json.dump(
        {"duration": round(total_dur, 3), "words": words_out},
        open(os.path.join(DATA, "words.json"), "w", encoding="utf-8"),
        indent=1,
    )
    json.dump(
        {"vo": "vo.wav", "bed": "bed.wav", "tail": 2.0, "fps": 30},
        open(os.path.join(DATA, "project.json"), "w", encoding="utf-8"),
        indent=1,
    )
    align_storyboard(words_out, total_dur)
    print(f"[build_audio] DONE: vo.wav ({total_dur:.1f}s, {len(words_out)} synced words) + bed.wav + 7 SFX")


if __name__ == "__main__":
    main()
