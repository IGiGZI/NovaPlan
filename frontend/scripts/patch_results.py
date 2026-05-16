"""Patch Search.jsx to add tabbed roadmap results view."""
from pathlib import Path

SEARCH_JSX = Path(__file__).parent.parent / "src" / "pages" / "Search.jsx"

content = SEARCH_JSX.read_text(encoding="utf-8")

# 1. Update the header text to be dynamic
old_header = '\t\t\t\t\t\t<p className="text-gray-400 mb-8">Your personalized roadmap is ready!</p>'

new_header = """\t\t\t\t\t\t<p className="text-gray-400 mb-8">Your personalized roadmap{followUpResult ? "s are" : " is"} ready!</p>

\t\t\t\t\t\t{/* Tabbed view for main + follow-up roadmap */}
\t\t\t\t\t\t{followUpResult && (
\t\t\t\t\t\t\t<div className="flex gap-2 mb-6">
\t\t\t\t\t\t\t\t<button onClick={() => setActiveRoadmapTab(0)} className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${activeRoadmapTab === 0 ? "specialBtnGradient text-white shadow-lg shadow-purple-500/30 ring-2 ring-purple-400" : "border border-purple-500/30 text-gray-400 hover:border-purple-400/60 hover:text-gray-200"}`}>
\t\t\t\t\t\t\t\t\t\\u{1F3AF} {result.chosen_career}
\t\t\t\t\t\t\t\t</button>
\t\t\t\t\t\t\t\t<button onClick={() => setActiveRoadmapTab(1)} className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${activeRoadmapTab === 1 ? "specialBtnGradient text-white shadow-lg shadow-purple-500/30 ring-2 ring-purple-400" : "border border-purple-500/30 text-gray-400 hover:border-purple-400/60 hover:text-gray-200"}`}>
\t\t\t\t\t\t\t\t\t\\u{1F52E} {followUpResult.chosen_career} (Recommended)
\t\t\t\t\t\t\t\t</button>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t)}"""

if old_header not in content:
    print(f"ERROR: Could not find header. Searching...")
    idx = content.find("personalized roadmap is ready")
    print(f"  Found at index: {idx}")
    if idx >= 0:
        print(f"  Context: {repr(content[max(0,idx-30):idx+60])}")
    exit(1)

content = content.replace(old_header, new_header)
print("1. Header patched")

# 2. Wrap roadmap paths in tab conditional
old_roadmap_start = """\t\t\t\t\t{/* Roadmap paths */}
\t\t\t\t\t<div className="space-y-10">"""

new_roadmap_start = """\t\t\t\t\t{/* Roadmap paths — main or follow-up based on active tab */}
\t\t\t\t\t{(activeRoadmapTab === 0 || !followUpResult) && (
\t\t\t\t\t<div className="space-y-10">"""

if old_roadmap_start not in content:
    print("ERROR: Could not find roadmap start block")
    exit(1)

content = content.replace(old_roadmap_start, new_roadmap_start)
print("2. Roadmap start patched")

# 3. Close the tab conditional and add follow-up tab content
old_roadmap_end = """\t\t\t\t\t</div>

\t\t\t\t\t{/* Download */}"""

new_roadmap_end = """\t\t\t\t\t</div>
\t\t\t\t\t)}

\t\t\t\t\t{/* Follow-up roadmap tab content */}
\t\t\t\t\t{activeRoadmapTab === 1 && followUpResult && (
\t\t\t\t\t<div className="space-y-10">
\t\t\t\t\t\t<h3 className="text-2xl font-bold text-cyan-400">\\u{1F52E} Follow-up Roadmap</h3>
\t\t\t\t\t\t{followUpResult.roadmaps?.map((roadmap, rIdx) => (
\t\t\t\t\t\t\t<div key={rIdx} className="bg-linear-to-br from-cyan-900/20 to-transparent backdrop-blur-sm border border-cyan-500/30 rounded-2xl p-6 md:p-8">
\t\t\t\t\t\t\t\t<div className="flex flex-wrap items-center justify-between gap-2 mb-8">
\t\t\t\t\t\t\t\t\t<div>
\t\t\t\t\t\t\t\t\t\t<h4 className="text-xl font-bold text-gray-100 capitalize">{roadmap.path_title}</h4>
\t\t\t\t\t\t\t\t\t\t<p className="text-sm text-cyan-400 mt-0.5">{roadmap.focus} Path</p>
\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t<span className="text-sm text-gray-500 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-3 py-1">{Math.round(roadmap.confidence_score * 100)}% confidence</span>
\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t<div className="relative">
\t\t\t\t\t\t\t\t\t<div className="absolute left-4 top-0 bottom-0 w-px bg-cyan-500/20"></div>
\t\t\t\t\t\t\t\t\t<div className="space-y-8">
\t\t\t\t\t\t\t\t\t\t{roadmap.steps.map((step, sIdx) => {
\t\t\t\t\t\t\t\t\t\t\tconst milestone = step.milestones?.[0];
\t\t\t\t\t\t\t\t\t\t\treturn (
\t\t\t\t\t\t\t\t\t\t\t\t<div key={sIdx} className="relative pl-12">
\t\t\t\t\t\t\t\t\t\t\t\t\t<div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-linear-to-br from-cyan-600 to-teal-500 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-cyan-500/30 z-10">{sIdx + 1}</div>
\t\t\t\t\t\t\t\t\t\t\t\t\t<div className="bg-black/20 border border-cyan-500/20 rounded-xl p-5 hover:border-cyan-500/40 transition-all">
\t\t\t\t\t\t\t\t\t\t\t\t\t\t{milestone && (
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t<>
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t<h5 className="text-base font-bold text-gray-100 mb-2">{milestone.title}</h5>
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t{milestone.description && <p className="text-sm text-gray-400 leading-relaxed mb-4 whitespace-pre-line">{milestone.description}</p>}
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t</>
\t\t\t\t\t\t\t\t\t\t\t\t\t\t)}
\t\t\t\t\t\t\t\t\t\t\t\t\t\t{step.resources?.length > 0 && (
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t<div>
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t<p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">Resources</p>
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t<ul className="space-y-1.5">
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t{step.resources.map((res, resIdx) => (
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t<li key={resIdx} className="flex items-start gap-2">
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t<span className="text-cyan-500 mt-0.5 shrink-0">\\u{2192}</span>
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t{res.url ? (
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t<a href={res.url} target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-400 hover:text-cyan-300 hover:underline leading-snug">{res.title || res.url}</a>
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t) : (
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t<span className="text-sm text-gray-400 leading-snug">{res.title || res}</span>
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t)}
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t</li>
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t))}
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t</ul>
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t\t\t\t\t\t)}
\t\t\t\t\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t\t\t);
\t\t\t\t\t\t\t\t\t\t})}
\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t))}
\t\t\t\t\t</div>
\t\t\t\t\t)}

\t\t\t\t\t{/* Follow-up loading indicator */}
\t\t\t\t\t{followUpLoading && (
\t\t\t\t\t\t<div className="text-center py-8">
\t\t\t\t\t\t\t<div className="inline-block w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mb-4"></div>
\t\t\t\t\t\t\t<p className="text-gray-400 text-sm">Generating follow-up roadmap...</p>
\t\t\t\t\t\t</div>
\t\t\t\t\t)}

\t\t\t\t\t{/* Download */}"""

if old_roadmap_end not in content:
    print("ERROR: Could not find roadmap end block")
    # debug
    idx = content.find("{/* Download */}")
    print(f"  Download comment at index: {idx}")
    if idx >= 0:
        print(f"  Before: {repr(content[max(0,idx-60):idx])}")
    exit(1)

content = content.replace(old_roadmap_end, new_roadmap_end)
print("3. Roadmap end + follow-up tab patched")

SEARCH_JSX.write_text(content, encoding="utf-8")
print(f"Done! Search.jsx patched with tabbed results. Size: {len(content)} bytes")
