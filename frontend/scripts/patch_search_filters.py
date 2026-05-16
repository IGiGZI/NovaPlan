"""Patch Search.jsx to add filtering menu above categories."""
from pathlib import Path

F = Path(__file__).parent.parent / "src" / "pages" / "Search.jsx"
c = F.read_text(encoding="utf-8")

# 1. Update flattenCareers and buildCategoryMap to include new fields
old_flatten = """\t\t\t\t\tcareer: careerObj.career,
\t\t\t\t\tcategory,
\t\t\t\t\tskills: careerObj.skills ?? [],
\t\t\t\t\tsub_fields: careerObj.sub_fields ?? [],
\t\t\t\t\tlanguages: careerObj.languages ?? [],
\t\t\t\t});"""
new_flatten = """\t\t\t\t\tcareer: careerObj.career,
\t\t\t\t\tcategory,
\t\t\t\t\tskills: careerObj.skills ?? [],
\t\t\t\t\tsub_fields: careerObj.sub_fields ?? [],
\t\t\t\t\tlanguages: careerObj.languages ?? [],
\t\t\t\t\teducation_level: careerObj.education_level ?? "Not Specified",
\t\t\t\t\tpopular_in_egypt: careerObj.popular_in_egypt ?? false,
\t\t\t\t});"""
c = c.replace(old_flatten, new_flatten)

old_bmap = """\t\t\t\t\t\tcareer: careerObj.career,
\t\t\t\t\t\tskills: careerObj.skills ?? [],
\t\t\t\t\t\tsub_fields: careerObj.sub_fields ?? [],
\t\t\t\t\t\tlanguages: careerObj.languages ?? [],
\t\t\t\t\t});"""
new_bmap = """\t\t\t\t\t\tcareer: careerObj.career,
\t\t\t\t\t\tskills: careerObj.skills ?? [],
\t\t\t\t\t\tsub_fields: careerObj.sub_fields ?? [],
\t\t\t\t\t\tlanguages: careerObj.languages ?? [],
\t\t\t\t\t\teducation_level: careerObj.education_level ?? "Not Specified",
\t\t\t\t\t\tpopular_in_egypt: careerObj.popular_in_egypt ?? false,
\t\t\t\t\t});"""
c = c.replace(old_bmap, new_bmap)

# 2. Add filter states and extraction logic inside Search component
old_state = """\tconst [allCategories, setAllCategories] = useState([]);
\tconst [dataLoading, setDataLoading] = useState(true);"""
new_state = """\tconst [allCategories, setAllCategories] = useState([]);
\tconst [dataLoading, setDataLoading] = useState(true);

\t// Filter state
\tconst [filterLanguage, setFilterLanguage] = useState("");
\tconst [filterEducation, setFilterEducation] = useState("");
\tconst [filterPopular, setFilterPopular] = useState(false);
\tconst [skillSearch, setSkillSearch] = useState("");
\tconst [selectedSkills, setSelectedSkills] = useState([]);

\t// Extracted options for dropdowns
\tconst [uniqueLanguages, setUniqueLanguages] = useState([]);
\tconst [uniqueEducations, setUniqueEducations] = useState([]);
\tconst [topSkills, setTopSkills] = useState([]);"""
c = c.replace(old_state, new_state)

# 3. Update useEffect to extract dropdown options
old_effect = """\t\t\t\tsetAllCareers(flattenCareers(data));
\t\t\t\tconst map = buildCategoryMap(data);
\t\t\t\tsetCategoryMap(map);
\t\t\t\tsetAllCategories(Object.keys(map));
\t\t\t\tsetDataLoading(false);"""
new_effect = """\t\t\t\tconst flatCareers = flattenCareers(data);
\t\t\t\tsetAllCareers(flatCareers);
\t\t\t\tconst map = buildCategoryMap(data);
\t\t\t\tsetCategoryMap(map);
\t\t\t\tsetAllCategories(Object.keys(map));

\t\t\t\t// Extract unique languages, education levels, and top skills
\t\t\t\tconst langs = new Set();
\t\t\t\tconst edus = new Set();
\t\t\t\tconst skillCounts = {};

\t\t\t\tflatCareers.forEach(c => {
\t\t\t\t\tc.languages.forEach(l => langs.add(l.name));
\t\t\t\t\tc.sub_fields.forEach(sf => sf.languages?.forEach(l => langs.add(l.name)));
\t\t\t\t\tedus.add(c.education_level);
\t\t\t\t\tc.skills.forEach(s => {
\t\t\t\t\t\tconst cleanS = s.toLowerCase().trim();
\t\t\t\t\t\tskillCounts[cleanS] = (skillCounts[cleanS] || 0) + 1;
\t\t\t\t\t});
\t\t\t\t});

\t\t\t\tsetUniqueLanguages(Array.from(langs).sort());
\t\t\t\tsetUniqueEducations(Array.from(edus).filter(e => e !== "Not Specified").sort());
\t\t\t\t
\t\t\t\t// Get top 20 skills
\t\t\t\tconst sortedSkills = Object.entries(skillCounts)
\t\t\t\t\t.sort((a, b) => b[1] - a[1])
\t\t\t\t\t.slice(0, 20)
\t\t\t\t\t.map(s => s[0]);
\t\t\t\tsetTopSkills(sortedSkills);

\t\t\t\tsetDataLoading(false);"""
c = c.replace(old_effect, new_effect)

# 4. Add filteredCareersGroupedByCategory useMemo
old_memo = """\tconst filtered = useMemo(() => {"""
new_memo = """\tconst isFilteringActive = filterLanguage || filterEducation || filterPopular || skillSearch.trim() || selectedSkills.length > 0;

\tconst filteredCareersGroupedByCategory = useMemo(() => {
\t\tif (!isFilteringActive) return null;
\t\tconst grouped = {};
\t\t
\t\tallCareers.forEach(c => {
\t\t\tlet match = true;
\t\t\t
\t\t\t// 1. Language Filter
\t\t\tif (filterLanguage) {
\t\t\t\tconst hasLang = c.languages.some(l => l.name === filterLanguage) || 
\t\t\t\t                c.sub_fields.some(sf => sf.languages?.some(l => l.name === filterLanguage));
\t\t\t\tif (!hasLang) match = false;
\t\t\t}
\t\t\t
\t\t\t// 2. Education Filter
\t\t\tif (match && filterEducation && c.education_level !== filterEducation) {
\t\t\t\tmatch = false;
\t\t\t}
\t\t\t
\t\t\t// 3. Popular in Egypt Filter
\t\t\tif (match && filterPopular && !c.popular_in_egypt) {
\t\t\t\tmatch = false;
\t\t\t}
\t\t\t
\t\t\t// 4. Skills Match (Checkbox & Text Search)
\t\t\tif (match) {
\t\t\t\tconst careerSkills = c.skills.map(s => s.toLowerCase());
\t\t\t\t
\t\t\t\t// Checkbox match: ALL selected skills must be present
\t\t\t\tif (selectedSkills.length > 0) {
\t\t\t\t\tconst hasAllSelectedSkills = selectedSkills.every(ss => careerSkills.some(cs => cs.includes(ss)));
\t\t\t\t\tif (!hasAllSelectedSkills) match = false;
\t\t\t\t}
\t\t\t\t
\t\t\t\t// Text search match: ANY skill must match the typed text
\t\t\t\tif (match && skillSearch.trim()) {
\t\t\t\t\tconst q = skillSearch.toLowerCase().trim();
\t\t\t\t\tconst hasSkill = careerSkills.some(cs => cs.includes(q));
\t\t\t\t\tif (!hasSkill) match = false;
\t\t\t\t}
\t\t\t}
\t\t\t
\t\t\tif (match) {
\t\t\t\tif (!grouped[c.category]) grouped[c.category] = [];
\t\t\t\tgrouped[c.category].push(c);
\t\t\t}
\t\t});
\t\treturn grouped;
\t}, [allCareers, filterLanguage, filterEducation, filterPopular, skillSearch, selectedSkills, isFilteringActive]);

\tconst filtered = useMemo(() => {"""
c = c.replace(old_memo, new_memo)

# 5. Add UI for Filter Menu and Filtered Results Rendering
old_browse = """\t\t\t{/* ── Category Browsing Section ── */}
\t\t\t{!dataLoading && !result && (
\t\t\t\t<section className="max-w-5xl mx-auto px-4 pb-20">
\t\t\t\t\t{/* Divider */}
\t\t\t\t\t<div className="flex items-center gap-4 mb-8">
\t\t\t\t\t\t<div className="flex-1 h-px bg-purple-500/20"></div>
\t\t\t\t\t\t<p className="text-sm text-purple-400/70 uppercase tracking-widest whitespace-nowrap">
\t\t\t\t\t\t\tOr browse by category
\t\t\t\t\t\t</p>
\t\t\t\t\t\t<div className="flex-1 h-px bg-purple-500/20"></div>
\t\t\t\t\t</div>

\t\t\t\t\t{/* Category buttons grid */}
\t\t\t\t\t<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-10">"""

new_browse = """\t\t\t{/* ── Filter & Category Browsing Section ── */}
\t\t\t{!dataLoading && !result && (
\t\t\t\t<section className="max-w-5xl mx-auto px-4 pb-20">
\t\t\t\t\t{/* Divider */}
\t\t\t\t\t<div className="flex items-center gap-4 mb-8">
\t\t\t\t\t\t<div className="flex-1 h-px bg-purple-500/20"></div>
\t\t\t\t\t\t<p className="text-sm text-purple-400/70 uppercase tracking-widest whitespace-nowrap">
\t\t\t\t\t\t\tFilter or Browse Categories
\t\t\t\t\t\t</p>
\t\t\t\t\t\t<div className="flex-1 h-px bg-purple-500/20"></div>
\t\t\t\t\t</div>

\t\t\t\t\t{/* ── Filters Menu ── */}
\t\t\t\t\t<div className="bg-black/30 border border-purple-500/30 rounded-2xl p-6 mb-10 shadow-lg shadow-purple-900/20 backdrop-blur-sm">
\t\t\t\t\t\t<div className="flex flex-wrap items-center justify-between gap-4 mb-4">
\t\t\t\t\t\t\t<h3 className="text-lg font-bold text-gray-200 flex items-center gap-2">
\t\t\t\t\t\t\t\t<span className="text-purple-400">🎛️</span> Advanced Filters
\t\t\t\t\t\t\t</h3>
\t\t\t\t\t\t\t{isFilteringActive && (
\t\t\t\t\t\t\t\t<button onClick={() => { setFilterLanguage(""); setFilterEducation(""); setFilterPopular(false); setSkillSearch(""); setSelectedSkills([]); setActiveCategory(null); }} className="text-sm text-pink-400 hover:text-pink-300 underline underline-offset-2">
\t\t\t\t\t\t\t\t\tClear All Filters
\t\t\t\t\t\t\t\t</button>
\t\t\t\t\t\t\t)}
\t\t\t\t\t\t</div>
\t\t\t\t\t\t<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
\t\t\t\t\t\t\t{/* Languages */}
\t\t\t\t\t\t\t<div>
\t\t\t\t\t\t\t\t<label className="block text-xs font-medium text-purple-300 mb-2 uppercase tracking-wider">Language / Tool</label>
\t\t\t\t\t\t\t\t<select value={filterLanguage} onChange={(e) => setFilterLanguage(e.target.value)} className="w-full bg-purple-900/20 border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-500/40 transition-all cursor-pointer">
\t\t\t\t\t\t\t\t\t<option value="">Any Language</option>
\t\t\t\t\t\t\t\t\t{uniqueLanguages.map(l => <option key={l} value={l}>{l}</option>)}
\t\t\t\t\t\t\t\t</select>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t{/* Education */}
\t\t\t\t\t\t\t<div>
\t\t\t\t\t\t\t\t<label className="block text-xs font-medium text-purple-300 mb-2 uppercase tracking-wider">Education Level</label>
\t\t\t\t\t\t\t\t<select value={filterEducation} onChange={(e) => setFilterEducation(e.target.value)} className="w-full bg-purple-900/20 border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-500/40 transition-all cursor-pointer">
\t\t\t\t\t\t\t\t\t<option value="">Any Education</option>
\t\t\t\t\t\t\t\t\t{uniqueEducations.map(e => <option key={e} value={e}>{e}</option>)}
\t\t\t\t\t\t\t\t</select>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t{/* Popularity Toggle */}
\t\t\t\t\t\t\t<div className="flex flex-col justify-end">
\t\t\t\t\t\t\t\t<button onClick={() => setFilterPopular(!filterPopular)} className={`w-full flex items-center justify-between px-4 py-2 rounded-lg border transition-all ${filterPopular ? "bg-cyan-500/20 border-cyan-500 ring-1 ring-cyan-500" : "bg-purple-900/20 border-purple-500/30 hover:border-cyan-400/50"}`}>
\t\t\t\t\t\t\t\t\t<span className={`text-sm font-medium ${filterPopular ? "text-cyan-200" : "text-gray-400"}`}>⭐ Top / Popular in Egypt</span>
\t\t\t\t\t\t\t\t\t<span className="text-xl">{filterPopular ? "✅" : "⬜"}</span>
\t\t\t\t\t\t\t\t</button>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t</div>
\t\t\t\t\t\t{/* Skills */}
\t\t\t\t\t\t<div className="mt-6 pt-6 border-t border-purple-500/20">
\t\t\t\t\t\t\t<label className="block text-xs font-medium text-purple-300 mb-2 uppercase tracking-wider">Required Skills</label>
\t\t\t\t\t\t\t<input type="text" placeholder="Type a skill (e.g. 'SQL', 'React', 'Management')..." value={skillSearch} onChange={(e) => setSkillSearch(e.target.value)} className="w-full bg-purple-900/20 border border-purple-500/30 rounded-lg px-4 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-500/40 transition-all mb-4" />
\t\t\t\t\t\t\t<p className="text-xs text-gray-500 mb-2">Or select from popular skills:</p>
\t\t\t\t\t\t\t<div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar pr-2">
\t\t\t\t\t\t\t\t{topSkills.map(skill => {
\t\t\t\t\t\t\t\t\tconst isSelected = selectedSkills.includes(skill);
\t\t\t\t\t\t\t\t\treturn (
\t\t\t\t\t\t\t\t\t\t<button key={skill} onClick={() => setSelectedSkills(prev => isSelected ? prev.filter(s => s !== skill) : [...prev, skill])} className={`px-3 py-1 rounded-full text-xs border transition-all ${isSelected ? "bg-purple-500/30 border-purple-400 text-purple-100" : "bg-black/20 border-purple-500/20 text-gray-400 hover:border-purple-400/50"}`}>
\t\t\t\t\t\t\t\t\t\t\t{skill}
\t\t\t\t\t\t\t\t\t\t</button>
\t\t\t\t\t\t\t\t\t);
\t\t\t\t\t\t\t\t})}
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>

\t\t\t\t\t{/* ── Rendering: Filtered Results OR Category Grid ── */}
\t\t\t\t\t{isFilteringActive ? (
\t\t\t\t\t\t<div className="space-y-8 animate-fadeIn">
\t\t\t\t\t\t\t{Object.keys(filteredCareersGroupedByCategory).length === 0 ? (
\t\t\t\t\t\t\t\t<div className="text-center py-12 border border-dashed border-purple-500/30 rounded-2xl bg-black/20">
\t\t\t\t\t\t\t\t\t<p className="text-gray-400">No careers match your filters. Try clearing some options.</p>
\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t) : (
\t\t\t\t\t\t\t\tObject.entries(filteredCareersGroupedByCategory).map(([catName, careers]) => (
\t\t\t\t\t\t\t\t\t<div key={catName} className="bg-black/20 border border-purple-500/20 rounded-2xl p-6">
\t\t\t\t\t\t\t\t\t\t<div className="flex items-center gap-3 mb-6 border-b border-purple-500/20 pb-4">
\t\t\t\t\t\t\t\t\t\t\t<span className="text-2xl">{CATEGORY_ICONS[catName] ?? "📁"}</span>
\t\t\t\t\t\t\t\t\t\t\t<h3 className="text-xl font-bold text-gray-200">{catName}</h3>
\t\t\t\t\t\t\t\t\t\t\t<span className="ml-auto text-xs font-semibold text-purple-400 bg-purple-900/30 px-3 py-1 rounded-full">{careers.length} results</span>
\t\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t\t<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
\t\t\t\t\t\t\t\t\t\t\t{careers.map((careerObj, i) => (
\t\t\t\t\t\t\t\t\t\t\t\t<button
\t\t\t\t\t\t\t\t\t\t\t\t\tkey={i}
\t\t\t\t\t\t\t\t\t\t\t\t\tonClick={() => {
\t\t\t\t\t\t\t\t\t\t\t\t\t\tsetSelected(careerObj);
\t\t\t\t\t\t\t\t\t\t\t\t\t\tsetSelectedSubField(null);
\t\t\t\t\t\t\t\t\t\t\t\t\t\tsetSelectedLanguage(null);
\t\t\t\t\t\t\t\t\t\t\t\t\t\tsetExperienceLevel("");
\t\t\t\t\t\t\t\t\t\t\t\t\t\twindow.scrollTo({ top: 0, behavior: "smooth" });
\t\t\t\t\t\t\t\t\t\t\t\t\t}}
\t\t\t\t\t\t\t\t\t\t\t\t\tclassName="flex items-center justify-between px-4 py-4 rounded-xl border border-purple-500/30 bg-purple-900/10 hover:bg-purple-500/20 hover:border-purple-400 transition-all text-left group"
\t\t\t\t\t\t\t\t\t\t\t\t>
\t\t\t\t\t\t\t\t\t\t\t\t\t<div>
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<span className="font-semibold text-purple-200 group-hover:text-white transition-colors">{careerObj.career}</span>
\t\t\t\t\t\t\t\t\t\t\t\t\t\t{careerObj.popular_in_egypt && <span className="ml-2 text-xs">⭐</span>}
\t\t\t\t\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t\t\t\t\t<span className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
\t\t\t\t\t\t\t\t\t\t\t\t</button>
\t\t\t\t\t\t\t\t\t\t\t))}
\t\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t))
\t\t\t\t\t\t\t)}
\t\t\t\t\t\t</div>
\t\t\t\t\t) : (
\t\t\t\t\t\t<>
\t\t\t\t\t\t\t{/* Category buttons grid */}
\t\t\t\t\t\t\t<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-10">"""
c = c.replace(old_browse, new_browse)

# 6. Close the fragments wrapping the category grid
old_cat_close = """\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t</div>
\t\t\t\t\t)}
\t\t\t\t</section>
\t\t\t)}
\t\t</main>
\t);
}

export default Search;"""
new_cat_close = """\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t</div>
\t\t\t\t\t)}
\t\t\t\t\t\t</>
\t\t\t\t\t)}
\t\t\t\t</section>
\t\t\t)}
\t\t</main>
\t);
}

export default Search;"""
c = c.replace(old_cat_close, new_cat_close)

F.write_text(c, encoding="utf-8")
print(f"Patched Search.jsx! Size: {len(c)}")
