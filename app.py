from flask import Flask, render_template, request, jsonify
import os, re
from dotenv import load_dotenv

try:
    import google.generativeai as genai
    GEMINI_OK = True
except ImportError:
    genai = None
    GEMINI_OK = False

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "change-this-secret")

PROGRAMMING_LANGUAGES = [
    "Python", "C++", "Java", "C", "C#", "JavaScript", "SQL", "Go",
    "Delphi/Object Pascal", "Visual Basic", "Fortran", "Rust", "PHP",
    "R", "MATLAB", "Assembly", "COBOL", "Ruby", "Swift", "Kotlin",
    "TypeScript", "Scala", "Perl", "Haskell", "Lua"
]

def _strip_comments(code: str) -> str:
    lines, out, in_block = code.splitlines(), [], False
    for raw in lines:
        txt = raw.strip()
        if in_block:
            if "*/" in txt:
                in_block = False
            continue
        if txt.startswith("/*"):
            in_block = True
            continue
        if txt.startswith("//") or txt.startswith("#"):
            continue
        cleaned = re.split(r'(?<!["\'])//|(?<!["\'])#', raw)[0].rstrip()
        if cleaned:
            out.append(cleaned)
    return "\n".join(out)

def translate_with_gemini(src_code: str, src_lang: str, tgt_lang: str) -> dict:
    if not GEMINI_OK:
        return fail("google-generativeai not installed")
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return fail("GOOGLE_API_KEY missing in environment")
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = (
            f"You are an expert programmer. Convert this {src_lang} code "
            f"to {tgt_lang}. Preserve logic and structure. "
            f"Return ONLY the translated code without extra comments.\n\n"
            f"{src_lang} code:\n{src_code}\n\n{tgt_lang} version:"
        )
        resp = model.generate_content(prompt)
        text = resp.text.strip()
        if text.startswith("```"):
            text = "\n".join(
                line for line in text.splitlines()
                if not line.strip().startswith("```")
            )
        cleaned = _strip_comments(text)
        return {"success": True, "translated_code": cleaned}
    except Exception as err:
        return fail(f"Gemini error: {err}")

BASIC_MAP = {
    ("Python", "JavaScript"): {
        "def ": "function ", "print(": "console.log(",
        "True": "true", "False": "false", "None": "null",
        "#": "//", "elif": "else if", "and": "&&", "or": "||", "not": "!"
    },
    ("JavaScript", "Python"): {
        "function ": "def ", "console.log(": "print(",
        "true": "True", "false": "False", "null": "None",
        "//": "#", "else if": "elif", "&&": "and", "||": "or"
    },
    ("Python", "C++"): {
        "def ": "int ", "print(": "cout << ",
        "True": "true", "False": "false", "None": "nullptr",
        "#": "//", "elif": "else if"
    }
}

def simple_template(src_code: str, src_lang: str, tgt_lang: str) -> dict:
    txt = src_code
    for old, new in BASIC_MAP.get((src_lang, tgt_lang), {}).items():
        txt = txt.replace(old, new)
    txt = _strip_comments(txt)
    return {"success": True, "translated_code": txt}

def fail(msg):
    return {"success": False, "translated_code": "", "message": msg}

@app.route("/")
def index():
    return render_template("index.html", languages=PROGRAMMING_LANGUAGES)

@app.route("/api/languages")
def list_languages():
    return jsonify(PROGRAMMING_LANGUAGES)

@app.route("/api/search_languages")
def search_lang():
    q = request.args.get("q", "").lower()
    hits = [l for l in PROGRAMMING_LANGUAGES if q in l.lower()]
    return jsonify(hits or PROGRAMMING_LANGUAGES)

@app.route("/api/translate", methods=["POST"])
def translate():
    try:
        data = request.get_json(force=True)
        code = data.get("code", "").strip()
        src  = data.get("source_lang", "")
        tgt  = data.get("target_lang", "")
        if not code:
            return bad("Please paste some code to translate.")
        if not src or not tgt:
            return bad("Select both source and target languages.")
        if src == tgt:
            return bad("Source and target languages cannot be the same.")
        res = translate_with_gemini(code, src, tgt)
        if res["success"]:
            return jsonify(res)
        return jsonify(simple_template(code, src, tgt) | {"message": res["message"]})
    except Exception as err:
        return bad(f"Server error: {err}", 500)

def bad(msg, status=400):
    return jsonify({"success": False, "message": msg}), status

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run("0.0.0.0", port=port, debug=False)
