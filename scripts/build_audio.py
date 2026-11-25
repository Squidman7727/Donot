"""Generates free edge-tts voiceover (English or Hindi), exact words.json ([start, end, word] tuples),
dark ambient drone bed, and domestic horror SFX inside video_app/public/ and video_app/src/data/.
Usage:
  python3 scripts/build_audio.py projects/<slug>/script.txt [--lang en|hi]
"""
import asyncio, json, os, re, subprocess, sys, time
import numpy as np
import edge_tts

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(ROOT, "video_app", "public")
DATA = os.path.join(ROOT, "video_app", "src", "data")
os.makedirs(PUB, exist_ok=True)
os.makedirs(DATA, exist_ok=True)
SR = 44100


def write_wav(path, arr):
    arr = np.clip(arr, -1.0, 1.0).astype(np.float32)
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", path], stdin=subprocess.PIPE)
    p.communicate(arr.tobytes())


def make_sfx_and_bed(dur_sec: float):
    t = np.linspace(0, dur_sec + 3.0, int((dur_sec + 3.0) * SR), dtype=np.float32)
    bed = (
        0.35 * np.sin(2 * np.pi * 55.0 * t)
        + 0.25 * np.sin(2 * np.pi * 82.4 * t + 0.5 * np.sin(2 * np.pi * 0.12 * t))
        + 0.15 * np.sin(2 * np.pi * 110.5 * t)
        + 0.04 * np.random.default_rng(42).normal(0, 1, len(t)).astype(np.float32)
    ) * (0.75 + 0.25 * np.sin(2 * np.pi * 0.07 * t))
    write_wav(os.path.join(PUB, "bed.wav"), bed * 0.35)

    tb = np.linspace(0, 0.55, int(0.55 * SR), dtype=np.float32)
    buzz = np.sin(2 * np.pi * 145 * tb) * (0.5 + 0.5 * np.sin(2 * np.pi * 24 * tb)) * np.exp(-tb * 2.5)
    write_wav(os.path.join(PUB, "sfx_buzz.wav"), buzz * 0.65)

    tc = np.linspace(0, 0.18, int(0.18 * SR), dtype=np.float32)
    click = np.random.default_rng(7).normal(0, 1, len(tc)).astype(np.float32) * np.exp(-tc * 45)
    write_wav(os.path.join(PUB, "sfx_click.wav"), click * 0.8)

    ts = np.linspace(0, 1.2, int(1.2 * SR), dtype=np.float32)
    sting = (np.sin(2 * np.pi * 65 * ts) + 0.6 * np.sin(2 * np.pi * 92 * ts)) * np.exp(-ts * 2.6)
    write_wav(os.path.join(PUB, "sfx_sting.wav"), sting * 0.75)

    tp = np.linspace(0, 0.28, int(0.28 * SR), dtype=np.float32)
    beep = np.sin(2 * np.pi * 1180 * tp) * np.exp(-tp * 6)
    write_wav(os.path.join(PUB, "sfx_beep.wav"), beep * 0.5)


async def speak(text, voice, rate, out_mp3):
    com = edge_tts.Communicate(text, voice, rate=rate, boundary="WordBoundary")
    words = []
    with open(out_mp3, "wb") as f:
        async for ch in com.stream():
            if ch["type"] == "audio":
                f.write(ch["data"])
            elif ch["type"] == "WordBoundary":
                words.append([ch["offset"] / 1e7, (ch["offset"] + ch["duration"]) / 1e7, ch["text"]])
    return words


def pcm(path):
    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"])
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768.0


def main():
    script_path = sys.argv[1]
    lang = "en"
    if "--lang" in sys.argv:
        lang = sys.argv[sys.argv.index("--lang") + 1].lower()

    voice = "hi-IN-MadhurNeural" if lang.startswith("hi") else "en-US-AndrewNeural"
    rate = "-4%" if lang.startswith("en") else "+0%"

    raw_text = open(script_path, encoding="utf-8").read()
    clean_lines = []
    for line in raw_text.splitlines():
        l = line.strip()
        if not l or l.startswith("#"):
            continue
        l = re.sub(r"\[[^\]]+\]", "", l).strip()
        if l:
            clean_lines.append(l)

    chunks_txt = []
    buf = []
    for l in clean_lines:
        buf.append(l)
        if sum(len(x.split()) for x in buf) >= 35:
            chunks_txt.append(" ".join(buf))
            buf = []
    if buf:
        chunks_txt.append(" ".join(buf))

    audio_parts = []
    words_out = []
    t = 0.0
    gap = 0.22

    for k, text in enumerate(chunks_txt):
        mp3 = os.path.join(PUB, f"_vo_{k}.mp3")
        for attempt in range(6):
            try:
                wb = asyncio.run(speak(text, voice, rate, mp3))
                break
            except Exception:
                if attempt == 5:
                    raise
                time.sleep(2 + 2 * attempt)
        a = pcm(mp3).copy()
        os.remove(mp3)
        nz = np.nonzero(np.abs(a) > 0.01)[0]
        if len(nz) == 0:
            continue
        lead = max(0, nz[0] - int(0.02 * SR))
        tail = min(len(a), nz[-1] + int(0.06 * SR))
        a = a[lead:tail]
        lead_s = lead / SR
        dur_s = len(a) / SR
        for st, en, tx in wb:
            # Exact [start, end, word] tuple expected by Remotion kit/timing.ts
            words_out.append([
                round(max(0.0, st - lead_s) + t, 3),
                round(min(dur_s, en - lead_s) + t, 3),
                tx,
            ])
        audio_parts.append(a)
        t += dur_s
        if k < len(chunks_txt) - 1:
            audio_parts.append(np.zeros(int(gap * SR), np.float32))
            t += gap

    vo = np.concatenate(audio_parts)
    vo = vo / max(1e-6, np.abs(vo).max()) * 0.89
    total_dur = len(vo) / SR
    write_wav(os.path.join(PUB, "vo.wav"), vo)
    make_sfx_and_bed(total_dur)

    json.dump({"duration": round(total_dur, 3), "words": words_out}, open(os.path.join(DATA, "words.json"), "w", encoding="utf-8"), indent=1)
    json.dump({"vo": "vo.wav", "bed": "bed.wav", "tail": 2.0, "fps": 30}, open(os.path.join(DATA, "project.json"), "w", encoding="utf-8"), indent=1)
    print(f"[build_audio] wrote vo.wav ({total_dur:.1f}s, {len(words_out)} words) + bed.wav + 4 SFX")


if __name__ == "__main__":
    main()