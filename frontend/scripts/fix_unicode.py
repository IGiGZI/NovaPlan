"""Fix unicode escapes in Search.jsx that were inserted by Python patch."""
from pathlib import Path

F = Path(__file__).parent.parent / "src" / "pages" / "Search.jsx"
c = F.read_text(encoding="utf-8")

# Replace Python-style unicode escapes with actual characters
c = c.replace("\\u{1F3AF}", "\U0001F3AF")  # 🎯
c = c.replace("\\u{1F52E}", "\U0001F52E")  # 🔮
c = c.replace("\\u{2192}", "\u2192")        # →

F.write_text(c, encoding="utf-8")
print("Fixed unicode escapes in Search.jsx")

# Also fix Fetching.jsx
F2 = Path(__file__).parent.parent / "src" / "pages" / "Fetching.jsx"
c2 = F2.read_text(encoding="utf-8")
c2 = c2.replace("\\u{1F3AF}", "\U0001F3AF")
c2 = c2.replace("\\u{1F52E}", "\U0001F52E")
c2 = c2.replace("\\u{2192}", "\u2192")
F2.write_text(c2, encoding="utf-8")
print("Fixed unicode escapes in Fetching.jsx")
