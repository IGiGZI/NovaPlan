"""Patch Fetching.jsx Part 2: Add UI elements for language picker, paid/free, recommendations, button update."""
from pathlib import Path

F = Path(__file__).parent.parent / "src" / "pages" / "Fetching.jsx"
c = F.read_text(encoding="utf-8")

# 1. Add direct language picker + paid/free + recommendations before error display
old_error = """\t\t\t\t\t\t\t{error && (
\t\t\t\t\t\t\t\t<p className="text-red-400 font-medium">
\t\t\t\t\t\t\t\t\t{error}
\t\t\t\t\t\t\t\t</p>
\t\t\t\t\t\t\t)}"""

new_sections = """\t\t\t\t\t\t\t{/* ── Direct Language Selection ── */}
\t\t\t\t\t\t\t{hasDirectLanguages && (
\t\t\t\t\t\t\t\t<div className="space-y-4">
\t\t\t\t\t\t\t\t\t<div>
\t\t\t\t\t\t\t\t\t\t<p className="text-sm text-pink-400 font-medium mb-1 uppercase tracking-widest">🗣️ Which of these languages/tools have you heard of or know about?</p>
\t\t\t\t\t\t\t\t\t\t<p className="text-gray-400 text-sm">Select the one you'd like to learn. Use the filter to sort by difficulty.</p>
\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t<div className="flex items-center gap-3">
\t\t\t\t\t\t\t\t\t\t<label className="text-xs text-gray-500 uppercase tracking-wider">Sort by difficulty:</label>
\t\t\t\t\t\t\t\t\t\t<select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)} className="bg-purple-900/30 border border-purple-500/30 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-500/40 transition-all cursor-pointer">
\t\t\t\t\t\t\t\t\t\t\t<option value="default">Default order</option>
\t\t\t\t\t\t\t\t\t\t\t<option value="easiest">Easiest first</option>
\t\t\t\t\t\t\t\t\t\t\t<option value="hardest">Hardest first</option>
\t\t\t\t\t\t\t\t\t\t</select>
\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t<div className="grid gap-2">
\t\t\t\t\t\t\t\t\t\t{sortedLanguages.map((lang, lIdx) => (
\t\t\t\t\t\t\t\t\t\t\t<div key={lIdx} onClick={() => { setSelectedLanguage(lang); setPreferPaid(null); setRecommendedFields([]); setSelectedRecommendedField(null); setWantsFollowUpRoadmap(null); fetchRecommendations(selectedCareer.career, lang.name); }} className={`cursor-pointer block rounded-lg px-4 py-3 border transition-all group ${selectedLanguage?.name === lang.name ? "border-pink-500 bg-pink-500/20 ring-1 ring-pink-500" : "border-pink-500/20 bg-purple-900/10 hover:bg-pink-500/10 hover:border-pink-400/40"}`}>
\t\t\t\t\t\t\t\t\t\t\t\t<div className="flex items-center justify-between">
\t\t\t\t\t\t\t\t\t\t\t\t\t<span className={`font-semibold text-sm ${selectedLanguage?.name === lang.name ? "text-pink-200" : "text-pink-300 group-hover:text-pink-200"}`}>
\t\t\t\t\t\t\t\t\t\t\t\t\t\t{selectedLanguage?.name === lang.name ? "✅ " : "🔗 "}{lang.name}
\t\t\t\t\t\t\t\t\t\t\t\t\t\t{lang.difficulty && <span className="ml-2 text-xs text-gray-500">{"⭐".repeat(Math.min(lang.difficulty, 5))}</span>}
\t\t\t\t\t\t\t\t\t\t\t\t\t</span>
\t\t\t\t\t\t\t\t\t\t\t\t\t<a href={lang.link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-xs text-blue-400 hover:text-blue-300 hover:underline z-10 relative">View courses →</a>
\t\t\t\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t\t\t\t{lang.description && <p className="text-xs text-gray-400 mt-1 leading-relaxed">{lang.description}</p>}
\t\t\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t\t))}
\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t<button onClick={() => { const easiest = [...selectedCareer.languages].sort((a, b) => (a.difficulty ?? 99) - (b.difficulty ?? 99))[0]; if (easiest) { setSelectedLanguage(easiest); setDifficultyFilter("easiest"); setPreferPaid(null); setRecommendedFields([]); setSelectedRecommendedField(null); setWantsFollowUpRoadmap(null); fetchRecommendations(selectedCareer.career, easiest.name); } }} className="w-full text-left rounded-lg px-4 py-3 border border-dashed border-purple-500/30 text-gray-400 hover:border-purple-400 hover:text-gray-200 transition-all text-sm">
\t\t\t\t\t\t\t\t\t\t🤷 I haven't heard of any of these — pick the easiest for me
\t\t\t\t\t\t\t\t\t</button>
\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t)}

\t\t\t\t\t\t\t{/* ── Paid / Free Toggle ── */}
\t\t\t\t\t\t\t{(selectedLanguage && (hasDirectLanguages || selectedSubField?.languages?.length > 0)) && (
\t\t\t\t\t\t\t\t<div className="space-y-3">
\t\t\t\t\t\t\t\t\t<div>
\t\t\t\t\t\t\t\t\t\t<p className="text-sm text-green-400 font-medium mb-1 uppercase tracking-widest">💰 Are you willing to spend money on courses?</p>
\t\t\t\t\t\t\t\t\t\t<p className="text-gray-400 text-sm">This controls whether your roadmap includes paid or free resources.</p>
\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t<div className="grid grid-cols-2 gap-3">
\t\t\t\t\t\t\t\t\t\t{[{ value: true, emoji: "💳", label: "Yes, paid is fine", desc: "Premium courses & certifications" }, { value: false, emoji: "🆓", label: "No, free only", desc: "YouTube, freeCodeCamp, docs" }].map((opt) => (
\t\t\t\t\t\t\t\t\t\t\t<button key={String(opt.value)} onClick={() => setPreferPaid(opt.value)} className={`text-center rounded-lg px-3 py-4 border transition-all duration-150 ${preferPaid === opt.value ? "border-green-500 ring-2 ring-green-500 bg-green-500/20 shadow-lg shadow-green-500/20" : "border-purple-500/20 hover:border-green-400/50 bg-purple-900/10"}`}>
\t\t\t\t\t\t\t\t\t\t\t\t<div className="text-2xl mb-1">{opt.emoji}</div>
\t\t\t\t\t\t\t\t\t\t\t\t<div className="font-semibold text-gray-100 text-sm">{opt.label}</div>
\t\t\t\t\t\t\t\t\t\t\t\t<div className="text-xs text-gray-400 mt-0.5">{opt.desc}</div>
\t\t\t\t\t\t\t\t\t\t\t</button>
\t\t\t\t\t\t\t\t\t\t))}
\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t)}

\t\t\t\t\t\t\t{/* ── Recommended Fields ── */}
\t\t\t\t\t\t\t{recommendedFields.length > 0 && preferPaid !== null && (
\t\t\t\t\t\t\t\t<div className="space-y-4">
\t\t\t\t\t\t\t\t\t<div>
\t\t\t\t\t\t\t\t\t\t<p className="text-sm text-cyan-400 font-medium mb-1 uppercase tracking-widest">🔮 Fields you can pursue after</p>
\t\t\t\t\t\t\t\t\t\t<p className="text-gray-400 text-sm">Based on your choice of <span className="text-pink-300 font-medium">{selectedLanguage?.name}</span> and <span className="text-purple-300 font-medium capitalize">{selectedCareer.career}</span>, you might also enjoy:</p>
\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t<div className="grid gap-2">
\t\t\t\t\t\t\t\t\t\t{recommendedFields.map((rf, idx) => (
\t\t\t\t\t\t\t\t\t\t\t<div key={idx} className="rounded-lg px-4 py-3 border border-cyan-500/20 bg-cyan-900/10 text-sm">
\t\t\t\t\t\t\t\t\t\t\t\t<div className="font-semibold text-cyan-200">{rf.field}</div>
\t\t\t\t\t\t\t\t\t\t\t\t<p className="text-xs text-gray-400 mt-1">{rf.description}</p>
\t\t\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t\t))}
\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t<div className="space-y-3">
\t\t\t\t\t\t\t\t\t\t<p className="text-sm text-gray-300">Would you like to generate a roadmap for any of these fields too?</p>
\t\t\t\t\t\t\t\t\t\t<div className="flex gap-3">
\t\t\t\t\t\t\t\t\t\t\t<button onClick={() => { setWantsFollowUpRoadmap(true); setSelectedRecommendedField(null); }} className={`rounded-lg px-4 py-2 border text-sm transition-all ${wantsFollowUpRoadmap === true ? "border-cyan-500 ring-1 ring-cyan-500 bg-cyan-500/20 text-cyan-200" : "border-purple-500/20 text-gray-400 hover:border-cyan-400/50"}`}>Yes, pick one</button>
\t\t\t\t\t\t\t\t\t\t\t<button onClick={() => { setWantsFollowUpRoadmap(false); setSelectedRecommendedField(null); }} className={`rounded-lg px-4 py-2 border text-sm transition-all ${wantsFollowUpRoadmap === false ? "border-purple-500 ring-1 ring-purple-500 bg-purple-500/20 text-purple-200" : "border-purple-500/20 text-gray-400 hover:border-purple-400/50"}`}>No, just continue</button>
\t\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t\t{wantsFollowUpRoadmap === true && (
\t\t\t\t\t\t\t\t\t\t\t<div className="grid gap-2 ml-2">
\t\t\t\t\t\t\t\t\t\t\t\t{recommendedFields.map((rf, idx) => (
\t\t\t\t\t\t\t\t\t\t\t\t\t<button key={idx} onClick={() => setSelectedRecommendedField(rf)} className={`text-left rounded-lg px-4 py-2 border text-sm transition-all ${selectedRecommendedField?.field === rf.field ? "border-cyan-500 ring-1 ring-cyan-500 bg-cyan-500/20" : "border-cyan-500/20 hover:border-cyan-400/40 bg-purple-900/10"}`}>
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<span className={selectedRecommendedField?.field === rf.field ? "text-cyan-200" : "text-gray-300"}>{selectedRecommendedField?.field === rf.field ? "✅ " : ""}{rf.field}</span>
\t\t\t\t\t\t\t\t\t\t\t\t\t</button>
\t\t\t\t\t\t\t\t\t\t\t\t))}
\t\t\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t\t)}
\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t)}

""" + old_error

assert old_error in c, f"Error block not found"
c = c.replace(old_error, new_sections)
print("5. UI sections added")

# 2. Update generate button disabled condition
old_btn = 'disabled={loading || !selectedCareer || (selectedCareer.sub_fields && selectedCareer.sub_fields.length > 0 && !selectedSubField) || (selectedSubField?.languages?.length > 0 && !selectedLanguage) || (((selectedCareer.sub_fields && selectedCareer.sub_fields.length > 0 && selectedSubField) || isTechOrEngineering(selectedCareer.category)) && !experienceLevel)}'

new_btn = 'disabled={loading || followUpLoading || !selectedCareer || (selectedCareer.sub_fields && selectedCareer.sub_fields.length > 0 && !selectedSubField) || (selectedSubField?.languages?.length > 0 && !selectedLanguage) || (hasDirectLanguages && !selectedLanguage) || (((selectedCareer.sub_fields && selectedCareer.sub_fields.length > 0 && selectedSubField) || isTechOrEngineering(selectedCareer.category)) && !experienceLevel) || ((selectedLanguage && (hasDirectLanguages || selectedSubField?.languages?.length > 0)) && preferPaid === null) || (wantsFollowUpRoadmap === true && !selectedRecommendedField)}'

assert old_btn in c, "Button disabled not found"
c = c.replace(old_btn, new_btn)
print("6. Button disabled updated")

# 3. Update button text
old_txt = """\t\t\t\t\t\t\t\t\t{loading
\t\t\t\t\t\t\t\t\t\t? "Generating..."
\t\t\t\t\t\t\t\t\t\t: "Generate Roadmap"}"""
new_txt = """\t\t\t\t\t\t\t\t\t{loading ? "Generating..." : followUpLoading ? "Generating follow-up..." : "Generate Roadmap"}"""
assert old_txt in c, "Button text not found"
c = c.replace(old_txt, new_txt)
print("7. Button text updated")

F.write_text(c, encoding="utf-8")
print(f"Done! Part 2 complete. Size: {len(c)} bytes")
