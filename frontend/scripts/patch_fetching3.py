"""Patch Fetching.jsx Part 3: Add tabbed results view."""
from pathlib import Path

F = Path(__file__).parent.parent / "src" / "pages" / "Fetching.jsx"
c = F.read_text(encoding="utf-8")

# 1. Update header text + add tabs
old1 = '\t\t\t\t\t\t\tYour personalized roadmaps are ready!'
new1 = '\t\t\t\t\t\t\tYour personalized roadmap{followUpResult ? "s are" : "s are"} ready!'
assert old1 in c, "Header text not found"
c = c.replace(old1, new1)

# 2. Add tab buttons after the header div closes (before Detailed Roadmap)
old2 = """\t\t\t\t\t{/* Detailed Roadmap Breakdown with Milestones */}
\t\t\t\t\t<div className="space-y-6">"""
new2 = """\t\t\t\t\t{/* Tab buttons for follow-up */}
\t\t\t\t\t{followUpResult && (
\t\t\t\t\t\t<div className="flex gap-2 mb-6">
\t\t\t\t\t\t\t<button onClick={() => setActiveRoadmapTab(0)} className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${activeRoadmapTab === 0 ? "specialBtnGradient text-white shadow-lg shadow-purple-500/30 ring-2 ring-purple-400" : "border border-purple-500/30 text-gray-400 hover:border-purple-400/60 hover:text-gray-200"}`}>
\t\t\t\t\t\t\t\t🎯 {result.chosen_career}
\t\t\t\t\t\t\t</button>
\t\t\t\t\t\t\t<button onClick={() => setActiveRoadmapTab(1)} className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${activeRoadmapTab === 1 ? "specialBtnGradient text-white shadow-lg shadow-purple-500/30 ring-2 ring-purple-400" : "border border-purple-500/30 text-gray-400 hover:border-purple-400/60 hover:text-gray-200"}`}>
\t\t\t\t\t\t\t\t🔮 {followUpResult.chosen_career} (Recommended)
\t\t\t\t\t\t\t</button>
\t\t\t\t\t\t</div>
\t\t\t\t\t)}

\t\t\t\t\t{/* Detailed Roadmap Breakdown with Milestones */}
\t\t\t\t\t{(activeRoadmapTab === 0 || !followUpResult) && (
\t\t\t\t\t<div className="space-y-6">"""
assert old2 in c, "Roadmap start not found"
c = c.replace(old2, new2)
print("1-2. Tabs added")

# 3. Close conditional and add follow-up content before download
old3 = """\t\t\t\t\t</div>

\t\t\t\t\t<div className="mt-12 text-center">"""
new3 = """\t\t\t\t\t</div>
\t\t\t\t\t)}

\t\t\t\t\t{/* Follow-up roadmap tab */}
\t\t\t\t\t{activeRoadmapTab === 1 && followUpResult && (
\t\t\t\t\t\t<div className="space-y-6">
\t\t\t\t\t\t\t<h3 className="text-2xl font-bold text-cyan-400 mb-6">🔮 Follow-up Roadmap</h3>
\t\t\t\t\t\t\t{followUpResult.roadmaps?.map((r, i) => (
\t\t\t\t\t\t\t\t<div key={i} className="bg-linear-to-br from-cyan-900/20 to-transparent backdrop-blur-sm border border-cyan-500/30 rounded-2xl p-6 hover:border-cyan-400 transition-all">
\t\t\t\t\t\t\t\t\t<h4 className="text-xl font-bold text-gray-100 mb-4">{r.path_title} — {r.focus}<span className="ml-2 text-sm text-cyan-400">(Confidence: {Math.round(r.confidence_score * 100)}%)</span></h4>
\t\t\t\t\t\t\t\t\t<div className="ml-4 space-y-4">
\t\t\t\t\t\t\t\t\t\t{r.steps.map((step, si) => (
\t\t\t\t\t\t\t\t\t\t\t<div key={si} className="border-l-2 border-cyan-500/50 pl-4 py-2">
\t\t\t\t\t\t\t\t\t\t\t\t{step.milestones?.length > 0 && step.milestones.map((m, mi) => (
\t\t\t\t\t\t\t\t\t\t\t\t\t<div key={mi} className="mb-2">
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<div className="font-bold text-base text-gray-200 mb-1">{si + 1}. {typeof m === "string" ? m : m?.title}</div>
\t\t\t\t\t\t\t\t\t\t\t\t\t\t{typeof m !== "string" && m?.description && <p className="text-sm text-gray-400 whitespace-pre-line">{m.description}</p>}
\t\t\t\t\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t\t\t\t))}
\t\t\t\t\t\t\t\t\t\t\t\t{step.resources?.length > 0 && (
\t\t\t\t\t\t\t\t\t\t\t\t\t<div className="mt-3">
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<div className="font-semibold text-sm text-cyan-400 mb-2">Resources:</div>
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<ul className="space-y-1">
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t{step.resources.map((res, ri) => (
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t<li key={ri} className="flex items-start gap-2 text-sm">
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t<span className="text-cyan-500 mt-0.5 shrink-0">→</span>
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t{res?.url ? <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 hover:underline">{res.title || res.url}</a> : (res?.title || "")}
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t</li>
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t))}
\t\t\t\t\t\t\t\t\t\t\t\t\t\t</ul>
\t\t\t\t\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t\t\t\t)}
\t\t\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t\t))}
\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t))}
\t\t\t\t\t\t</div>
\t\t\t\t\t)}

\t\t\t\t\t{followUpLoading && (
\t\t\t\t\t\t<div className="text-center py-8">
\t\t\t\t\t\t\t<div className="inline-block w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mb-4"></div>
\t\t\t\t\t\t\t<p className="text-gray-400 text-sm">Generating follow-up roadmap...</p>
\t\t\t\t\t\t</div>
\t\t\t\t\t)}

\t\t\t\t\t<div className="mt-12 text-center">"""
assert old3 in c, "Roadmap end not found"
c = c.replace(old3, new3)
print("3. Follow-up tab content added")

F.write_text(c, encoding="utf-8")
print(f"Done! Part 3 complete. Size: {len(c)} bytes")
