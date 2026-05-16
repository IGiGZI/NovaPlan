"""Patch Search.jsx to enhance umbrella career sub-field language selection
with difficulty filter, pick-easiest, and recommendations."""
from pathlib import Path

F = Path(__file__).parent.parent / "src" / "pages" / "Search.jsx"
c = F.read_text(encoding="utf-8")

# 1. Add sortedSubFieldLanguages memo after sortedLanguages
old_memo = """\t// Fetch recommended fields when language is selected
\tconst fetchRecommendations = async (careerName, langName) => {"""
new_memo = """\t// Sort sub-field languages by difficulty filter
\tconst sortedSubFieldLanguages = useMemo(() => {
\t\tif (!selectedSubField?.languages?.length) return [];
\t\tconst langs = [...selectedSubField.languages];
\t\tif (difficultyFilter === "easiest") langs.sort((a, b) => (a.difficulty ?? 99) - (b.difficulty ?? 99));
\t\telse if (difficultyFilter === "hardest") langs.sort((a, b) => (b.difficulty ?? 0) - (a.difficulty ?? 0));
\t\telse if (difficultyFilter === "popular") langs.sort((a, b) => (getTiobeRank(a.name) ?? 999) - (getTiobeRank(b.name) ?? 999));
\t\treturn langs;
\t}, [selectedSubField, difficultyFilter, tiobeData]);

\t// Fetch recommended fields when language is selected
\tconst fetchRecommendations = async (careerName, langName) => {"""
assert old_memo in c, "Memo anchor not found"
c = c.replace(old_memo, new_memo)
print("1. Added sortedSubFieldLanguages memo")

# 2. Replace the sub-field language section with enhanced version
# Find the old sub-field language block
old_sf_lang = """\t\t\t\t\t\t\t\t\t\t\t{/* Language/Tool links */}
\t\t\t\t\t\t\t\t\t\t\t{selectedSubField?.name === sf.name && sf.languages && sf.languages.length > 0 && (
\t\t\t\t\t\t\t\t\t\t\t\t<div className="ml-4 mt-2 space-y-2">
\t\t\t\t\t\t\t\t\t\t\t\t\t<p className="text-xs text-purple-400 font-medium uppercase tracking-wide">📚 Select a Language & Tool</p>
\t\t\t\t\t\t\t\t\t\t\t\t\t<div className="grid gap-2">
\t\t\t\t\t\t\t\t\t\t\t\t\t\t{sf.languages.map((lang, lIdx) => ("""

new_sf_lang = """\t\t\t\t\t\t\t\t\t\t\t{/* Language/Tool links */}
\t\t\t\t\t\t\t\t\t\t\t{selectedSubField?.name === sf.name && sf.languages && sf.languages.length > 0 && (
\t\t\t\t\t\t\t\t\t\t\t\t<div className="ml-4 mt-2 space-y-3">
\t\t\t\t\t\t\t\t\t\t\t\t\t<p className="text-sm text-pink-400 font-medium uppercase tracking-widest">\U0001F5E3\uFE0F Which of these languages/tools have you heard of or know about?</p>
\t\t\t\t\t\t\t\t\t\t\t\t\t<p className="text-gray-400 text-xs">Select the one you'd like to learn. Use the filter to sort by difficulty.</p>
\t\t\t\t\t\t\t\t\t\t\t\t\t<div className="flex items-center gap-3">
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<label className="text-xs text-gray-500 uppercase tracking-wider">Sort by:</label>
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)} className="bg-purple-900/30 border border-purple-500/30 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-500/40 transition-all cursor-pointer">
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t<option value="default">Default order</option>
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t<option value="easiest">Easiest first</option>
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t<option value="hardest">Hardest first</option>
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t<option value="popular">Most popular (TIOBE)</option>
\t\t\t\t\t\t\t\t\t\t\t\t\t\t</select>
\t\t\t\t\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t\t\t\t\t<div className="grid gap-2">
\t\t\t\t\t\t\t\t\t\t\t\t\t\t{sortedSubFieldLanguages.map((lang, lIdx) => ("""
assert old_sf_lang in c, "Sub-field language anchor not found"
c = c.replace(old_sf_lang, new_sf_lang)
print("2. Replaced sub-field language header with enhanced version")

# 3. Update the onClick for sub-field language cards to also fetch recommendations
old_sf_click = """\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tonClick={(e) => {
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\te.stopPropagation();
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tsetSelectedLanguage(lang);
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t}}
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tclassName={`cursor-pointer block rounded-lg px-4 py-3 border transition-all group ${selectedLanguage?.name === lang.name
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t? "border-pink-500 bg-pink-500/20 ring-1 ring-pink-500"
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t: "border-pink-500/20 bg-purple-900/10 hover:bg-pink-500/10 hover:border-pink-400/40"
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t}`}"""
new_sf_click = """\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tonClick={(e) => {
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\te.stopPropagation();
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tsetSelectedLanguage(lang);
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tsetPreferPaid(null);
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tsetRecommendedFields([]);
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tsetSelectedRecommendedField(null);
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tsetWantsFollowUpRoadmap(null);
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tfetchRecommendations(selected.career, lang.name);
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t}}
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tclassName={`cursor-pointer block rounded-lg px-4 py-3 border transition-all group ${selectedLanguage?.name === lang.name
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t? "border-pink-500 bg-pink-500/20 ring-1 ring-pink-500"
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t: "border-pink-500/20 bg-purple-900/10 hover:bg-pink-500/10 hover:border-pink-400/40"
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t}`}"""
assert old_sf_click in c, "Sub-field click anchor not found"
c = c.replace(old_sf_click, new_sf_click)
print("3. Updated sub-field language onClick to fetch recommendations")

# 4. Add difficulty stars to sub-field language cards (after lang.name in the sub-field section)
# Find the sub-field lang.name display and add stars + "pick easiest" button after the grid
old_sf_desc = """\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t{lang.description && (
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t<p className="text-xs text-gray-400 mt-1 leading-relaxed">{lang.description}</p>
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t)}
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t))}
\t\t\t\t\t\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t\t\t\t)}"""
new_sf_desc = """\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t{lang.description && (
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t<p className="text-xs text-gray-400 mt-1 leading-relaxed">{lang.description}</p>
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t)}
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t))}
\t\t\t\t\t\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<button onClick={() => { const easiest = [...sf.languages].sort((a, b) => (a.difficulty ?? 99) - (b.difficulty ?? 99))[0]; if (easiest) { setSelectedLanguage(easiest); setDifficultyFilter("easiest"); setPreferPaid(null); setRecommendedFields([]); setSelectedRecommendedField(null); setWantsFollowUpRoadmap(null); fetchRecommendations(selected.career, easiest.name); } }} className="w-full text-left rounded-lg px-4 py-3 border border-dashed border-purple-500/30 text-gray-400 hover:border-purple-400 hover:text-gray-200 transition-all text-sm">
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\U0001F937 I haven't heard of any of these \u2014 pick the easiest for me
\t\t\t\t\t\t\t\t\t\t\t\t\t\t</button>
\t\t\t\t\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t\t\t\t)}"""
assert old_sf_desc in c, "Sub-field desc anchor not found"
c = c.replace(old_sf_desc, new_sf_desc)
print("4. Added 'pick easiest' button for sub-field languages")

# 5. Add difficulty stars to sub-field language name display
# The sub-field language section has: {selectedLanguage?.name === lang.name ? "✅ " : "🔗 "}{lang.name}
# followed by getTiobeRank. We need to add difficulty stars between lang.name and getTiobeRank
old_name_sf = """\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t{selectedLanguage?.name === lang.name ? "✅ " : "🔗 "}{lang.name}
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t{getTiobeRank(lang.name) && ("""
new_name_sf = """\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t{selectedLanguage?.name === lang.name ? "✅ " : "🔗 "}{lang.name}
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t{lang.difficulty && <span className="ml-2 text-xs text-gray-500">{"\u2B50".repeat(Math.min(lang.difficulty, 5))}</span>}
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t{getTiobeRank(lang.name) && ("""
assert old_name_sf in c, "Sub-field lang name anchor not found"
c = c.replace(old_name_sf, new_name_sf)
print("5. Added difficulty stars to sub-field language cards")

F.write_text(c, encoding="utf-8")
print(f"Done! Search.jsx patched. Size: {len(c)}")
