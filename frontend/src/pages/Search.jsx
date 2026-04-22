import { useState, useMemo, useRef, useEffect } from "react";
import { Link } from "react-router";
import MainNav from "../components/MainNav";

// Flatten all careers from the JSON into a searchable list
function flattenCareers(data) {
	const flat = [];
	for (const categoryObj of data) {
		const { category, careers_by_learning_path } = categoryObj;
		for (const [, careers] of Object.entries(careers_by_learning_path)) {
			for (const careerObj of careers) {
				flat.push({
					career: careerObj.career,
					category,
					skills: careerObj.skills ?? [],
					sub_fields: careerObj.sub_fields ?? [],
				});
			}
		}
	}
	const seen = new Set();
	return flat.filter((c) => {
		if (seen.has(c.career)) return false;
		seen.add(c.career);
		return true;
	});
}

// Build a map of category → careers (deduplicated)
function buildCategoryMap(data) {
	const map = {};
	for (const categoryObj of data) {
		const { category, careers_by_learning_path } = categoryObj;
		const seen = new Set();
		const careers = [];
		for (const [, careerList] of Object.entries(careers_by_learning_path)) {
			for (const careerObj of careerList) {
				if (!seen.has(careerObj.career)) {
					seen.add(careerObj.career);
					careers.push({
						career: careerObj.career,
						skills: careerObj.skills ?? [],
						sub_fields: careerObj.sub_fields ?? [],
					});
				}
			}
		}
		map[category] = careers;
	}
	return map;
}


// Icon map for categories
const CATEGORY_ICONS = {
	"Programming & Software Development": "💻",
	"Data & Artificial Intelligence": "🤖",
	"Cloud & IT Infrastructure": "☁️",
	"Cybersecurity & IT Auditing": "🛡️",
	"ICT & Business Technology": "📡",
	"Healthcare & Medicine": "🏥",
	"Mental Health & Social Work": "🧠",
	"Veterinary & Animal Care": "🐾",
	"Engineering - Civil & Construction": "🏗️",
	"Engineering - Mechanical & Electrical": "⚙️",
	"Engineering - Aerospace & Transportation": "🚀",
	"Renewable & Solar Energy": "☀️",
	"Electrical Trades": "⚡",
	"Welding & Skilled Trades": "🔧",
	"Aviation & Piloting": "✈️",
	"Education & Teaching": "📚",
	"Finance & Accounting": "💰",
	"Business, Management & HR": "💼",
	"Legal": "⚖️",
	"Architecture & Urban Planning": "🏛️",
};

const TECH_ENG_CATEGORIES = new Set([
	"Programming & Software Development",
	"Data & Artificial Intelligence",
	"Cloud & IT Infrastructure",
	"Cybersecurity & IT Auditing",
	"ICT & Business Technology",
	"Engineering - Civil & Construction",
	"Engineering - Mechanical & Electrical",
	"Engineering - Aerospace & Transportation"
]);

function isTechOrEngineering(category) {
	return TECH_ENG_CATEGORIES.has(category);
}

function Search() {
	const [allCareers, setAllCareers] = useState([]);
	const [categoryMap, setCategoryMap] = useState({});
	const [allCategories, setAllCategories] = useState([]);
	const [dataLoading, setDataLoading] = useState(true);

	useEffect(() => {
		fetch("/api/careers_data")
			.then((res) => res.json())
			.then((data) => {
				setAllCareers(flattenCareers(data));
				const map = buildCategoryMap(data);
				setCategoryMap(map);
				setAllCategories(Object.keys(map));
				setDataLoading(false);
			})
			.catch((err) => {
				console.error("Failed to load careers dataset:", err);
				setDataLoading(false);
			});
	}, []);

	const [query, setQuery] = useState("");
	const [selected, setSelected] = useState(null);
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState(null);
	const [error, setError] = useState("");
	const inputRef = useRef(null);
	const dropdownRef = useRef(null);

	// Category browsing state
	const [activeCategory, setActiveCategory] = useState(null);
	const categoryRef = useRef(null);

	// Sub-field and level state
	const [selectedSubField, setSelectedSubField] = useState(null);
	const [selectedLanguage, setSelectedLanguage] = useState(null);
	const [experienceLevel, setExperienceLevel] = useState("");

	const filtered = useMemo(() => {
		if (!query.trim()) return [];
		const q = query.toLowerCase();
		return allCareers.filter(
			(c) =>
				c.career.toLowerCase().includes(q) ||
				c.category.toLowerCase().includes(q)
		).slice(0, 12);
	}, [query, allCareers]);

	useEffect(() => {
		function handleClick(e) {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(e.target) &&
				inputRef.current &&
				!inputRef.current.contains(e.target)
			) {
				setDropdownOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, []);

	// Scroll to category results when a category is selected
	useEffect(() => {
		if (activeCategory && categoryRef.current) {
			categoryRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
		}
	}, [activeCategory]);

	const handleQueryChange = (e) => {
		setQuery(e.target.value);
		setSelected(null);
		setDropdownOpen(true);
		setResult(null);
		setError("");
	};

	const handleSelect = (careerObj) => {
		setSelected(careerObj);
		setQuery(careerObj.career);
		setDropdownOpen(false);
		setResult(null);
		setError("");
		setSelectedSubField(null);
		setSelectedLanguage(null);
		setExperienceLevel("");
	};

	const handleGenerate = async () => {
		if (!selected) return;
		const hasSubFields = selected.sub_fields && selected.sub_fields.length > 0;
		const isTechEng = isTechOrEngineering(selected.category);
		const needsLevel = hasSubFields ? !!selectedSubField : isTechEng;

		if (hasSubFields && !selectedSubField) return;
		if (selectedSubField?.languages?.length > 0 && !selectedLanguage) return;
		if (needsLevel && !experienceLevel) return;

		setError("");
		setLoading(true);
		setResult(null);

		try {
			const res = await fetch("http://localhost:8000/generate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					answers: [],
					careers: [selected.career],
					category: selected.category,
					user_summary: "",
					experience_level: experienceLevel || "",
					sub_field: selectedSubField?.name || "",
					selected_language: selectedLanguage?.name || "",
				}),
			});
			if (!res.ok) throw new Error("Failed to generate roadmap");
			const data = await res.json();
			setResult(data);
			localStorage.setItem("roadmapResult", JSON.stringify(data));
		} catch (err) {
			setError(err.message || "Something went wrong");
		} finally {
			setLoading(false);
		}
	};

	const handleClear = () => {
		setQuery("");
		setSelected(null);
		setResult(null);
		setError("");
		setSelectedSubField(null);
		setSelectedLanguage(null);
		setExperienceLevel("");
		inputRef.current?.focus();
	};

	const handleCategoryClick = (category) => {
		setActiveCategory((prev) => (prev === category ? null : category));
	};

	const handleSelectFromCategory = (careerObj, category) => {
		setSelected({ ...careerObj, category });
		setQuery(careerObj.career);
		setResult(null);
		setError("");
		setSelectedSubField(null);
		setSelectedLanguage(null);
		setExperienceLevel("");
		// Scroll back up to the search area smoothly
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const categoryCareers = activeCategory ? categoryMap[activeCategory] : [];

	return (
		<main className="min-h-screen">
			<MainNav />

			{/* Background effects */}
			<div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
				<div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
				<div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-3xl"></div>
			</div>

			<header className="max-w-3xl mx-auto mt-32 text-center px-4 mb-12">
				<h1 className="text-4xl md:text-5xl font-bold mb-4 bg-linear-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
					Search Careers
				</h1>
				<p className="text-lg text-gray-300">
					Browse our full career dataset and generate a personalized roadmap for any role
				</p>
			</header>

			{dataLoading && (
				<div className="flex justify-center items-center h-48">
					<div className="text-lg text-purple-400 animate-pulse bg-purple-900/20 px-8 py-4 rounded-full border border-purple-500/30">
						Loading career dataset...
					</div>
				</div>
			)}

			{/* Search + selected card — hide once result is shown */}
			{!dataLoading && !result && (
				<div className="max-w-2xl mx-auto px-4 pb-12">
					<div className="relative">
						<div className="relative flex items-center bg-black/30 backdrop-blur-sm border border-purple-500/30 rounded-xl shadow-lg shadow-purple-500/10 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-500/30 transition-all">
							<svg
								className="absolute left-4 w-5 h-5 text-purple-400 pointer-events-none"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
								/>
							</svg>
							<input
								ref={inputRef}
								type="text"
								value={query}
								onChange={handleQueryChange}
								onFocus={() => query && setDropdownOpen(true)}
								placeholder="Search for a career or category..."
								className="w-full bg-transparent pl-12 pr-12 py-4 text-gray-100 placeholder-gray-500 focus:outline-none text-base"
							/>
							{query && (
								<button
									onClick={handleClear}
									className="absolute right-4 text-gray-500 hover:text-gray-300 transition-colors"
								>
									<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							)}
						</div>

						{/* Dropdown results */}
						{dropdownOpen && filtered.length > 0 && (
							<div
								ref={dropdownRef}
								className="absolute z-50 mt-2 w-full bg-black/90 backdrop-blur-md border border-purple-500/30 rounded-xl shadow-2xl shadow-purple-500/20 overflow-hidden"
							>
								{filtered.map((c, idx) => (
									<button
										key={idx}
										onMouseDown={() => handleSelect(c)}
										className="w-full text-left px-4 py-3 hover:bg-purple-500/20 transition-colors border-b border-purple-500/10 last:border-0 group"
									>
										<div className="text-gray-100 text-sm font-medium group-hover:text-white capitalize">
											{c.career}
										</div>
										<div className="text-xs text-purple-400/70 mt-0.5">
											{c.category}
										</div>
									</button>
								))}
							</div>
						)}

						{dropdownOpen && query.trim() && filtered.length === 0 && (
							<div className="absolute z-50 mt-2 w-full bg-black/90 backdrop-blur-md border border-purple-500/30 rounded-xl shadow-xl px-4 py-4 text-gray-400 text-sm text-center">
								No careers found for "{query}"
							</div>
						)}
					</div>

					{/* Selected career preview card */}
					{selected && (
						<div className="mt-6 bg-linear-to-br from-purple-900/20 to-transparent backdrop-blur-sm border border-purple-500/30 rounded-xl p-6 space-y-4">
							<div>
								<p className="text-xs text-purple-400 uppercase tracking-widest mb-1">Selected Career</p>
								<h2 className="text-2xl font-bold text-gray-100 capitalize">{selected.career}</h2>
								<p className="text-sm text-gray-400 mt-1">{selected.category}</p>
							</div>

							{selected.skills.length > 0 && (
								<div>
									<p className="text-xs text-purple-400 font-semibold mb-2 uppercase tracking-wider">Key Skills</p>
									<div className="flex flex-wrap gap-2">
										{selected.skills.slice(0, 8).map((skill, i) => (
											<span
												key={i}
												className="text-xs px-3 py-1 rounded-full border border-purple-500/30 text-gray-300 bg-purple-500/10 capitalize"
											>
												{skill}
											</span>
										))}
										{selected.skills.length > 8 && (
											<span className="text-xs px-3 py-1 rounded-full border border-purple-500/20 text-gray-500">
												+{selected.skills.length - 8} more
											</span>
										)}
									</div>
								</div>
							)}

							{/* Sub-field selection — for careers with sub_fields */}
							{selected.sub_fields && selected.sub_fields.length > 0 && (
								<div className="space-y-4 pt-2">
									<div>
										<p className="text-sm text-pink-400 font-medium mb-1 uppercase tracking-widest">
											🎯 Choose a Specialization
										</p>
										<p className="text-gray-400 text-sm">
											Narrow your roadmap to a specific sub-field:
										</p>
									</div>
									<div className="grid gap-3">
										{selected.sub_fields.map((sf, idx) => (
											<div key={idx}>
												<button
													onClick={() => {
														setSelectedSubField(selectedSubField?.name === sf.name ? null : sf);
														setSelectedLanguage(null);
														setExperienceLevel("");
													}}
													className={`w-full text-left rounded-lg px-4 py-3 border transition-all duration-150 ${selectedSubField?.name === sf.name
														? "border-pink-500 ring-2 ring-pink-500 bg-linear-to-r from-pink-600/30 to-purple-500/30"
														: "border-purple-500/20 hover:border-pink-400/50 bg-purple-900/10"
														}`}
												>
													<div className="font-semibold text-gray-100">{sf.name}</div>
													<div className="text-sm text-gray-400 mt-1">{sf.description}</div>
												</button>

												{/* Language/Tool links */}
												{selectedSubField?.name === sf.name && sf.languages && sf.languages.length > 0 && (
													<div className="ml-4 mt-2 space-y-2">
														<p className="text-xs text-purple-400 font-medium uppercase tracking-wide">📚 Select a Language & Tool</p>
														<div className="grid gap-2">
															{sf.languages.map((lang, lIdx) => (
																<div
																	key={lIdx}
																	onClick={(e) => {
																		e.stopPropagation();
																		setSelectedLanguage(lang);
																	}}
																	className={`cursor-pointer block rounded-lg px-4 py-3 border transition-all group ${
																		selectedLanguage?.name === lang.name
																			? "border-pink-500 bg-pink-500/20 ring-1 ring-pink-500"
																			: "border-pink-500/20 bg-purple-900/10 hover:bg-pink-500/10 hover:border-pink-400/40"
																	}`}
																>
																	<div className="flex items-center justify-between">
																		<span className={`font-semibold text-sm ${selectedLanguage?.name === lang.name ? "text-pink-200" : "text-pink-300 group-hover:text-pink-200"}`}>
																			{selectedLanguage?.name === lang.name ? "✅ " : "🔗 "}{lang.name}
																		</span>
																		<a
																			href={lang.link}
																			target="_blank"
																			rel="noopener noreferrer"
																			onClick={(e) => e.stopPropagation()}
																			className="text-xs text-blue-400 hover:text-blue-300 hover:underline z-10 relative"
																		>
																			View courses →
																		</a>
																	</div>
																	{lang.description && (
																		<p className="text-xs text-gray-400 mt-1 leading-relaxed">{lang.description}</p>
																	)}
																</div>
															))}
														</div>
													</div>
												)}
											</div>
										))}
									</div>
								</div>
							)}

							{/* Level picker — conditionally shown based on category or subfield */}
							{((selected.sub_fields && selected.sub_fields.length > 0 && selectedSubField) || 
							  (!(selected.sub_fields && selected.sub_fields.length > 0) && isTechOrEngineering(selected.category))) && (
								<div className="space-y-3 pt-2">
									<div>
										<p className="text-sm text-purple-400 font-medium mb-1 uppercase tracking-widest">
											📊 What's Your Experience Level?
										</p>
										<p className="text-gray-400 text-sm">
											This determines the depth and type of resources in your roadmap:
										</p>
									</div>
									<div className="grid grid-cols-3 gap-3">
										{[
											{ value: "beginner", emoji: "🌱", label: "Beginner", desc: "Just starting out" },
											{ value: "intermediate", emoji: "🔧", label: "Intermediate", desc: "Can build projects" },
											{ value: "pro", emoji: "🚀", label: "Pro", desc: "Deep expertise" },
										].map((lvl) => (
											<button
												key={lvl.value}
												onClick={() => setExperienceLevel(lvl.value)}
												className={`text-center rounded-lg px-3 py-4 border transition-all duration-150 ${experienceLevel === lvl.value
													? "border-purple-500 ring-2 ring-purple-500 bg-linear-to-r from-purple-600/30 to-pink-500/30 shadow-lg shadow-purple-500/30"
													: "border-purple-500/20 hover:border-purple-400/50 bg-purple-900/10"
													}`}
											>
												<div className="text-2xl mb-1">{lvl.emoji}</div>
												<div className="font-semibold text-gray-100 text-sm">{lvl.label}</div>
												<div className="text-xs text-gray-400 mt-0.5">{lvl.desc}</div>
											</button>
										))}
									</div>
									{experienceLevel && (
										<p className="text-sm text-gray-400">
											{experienceLevel === "beginner" && "You'll get a comprehensive step-by-step roadmap with beginner-friendly resources."}
											{experienceLevel === "intermediate" && "You'll get a full roadmap with intermediate-level, project-based resources."}
											{experienceLevel === "pro" && "You'll get an accelerated roadmap focused on advanced topics and fast job-readiness."}
										</p>
									)}
								</div>
							)}

							{error && <p className="text-red-400 text-sm font-medium">{error}</p>}

							<button
								onClick={handleGenerate}
								disabled={loading || (selected.sub_fields && selected.sub_fields.length > 0 && !selectedSubField) || (selectedSubField?.languages?.length > 0 && !selectedLanguage) || (((selected.sub_fields && selected.sub_fields.length > 0 && selectedSubField) || isTechOrEngineering(selected.category)) && !experienceLevel)}
								className="specialBtnGradient rounded-full px-8 py-3 text-white font-semibold shadow-lg shadow-purple-500/50 disabled:opacity-60 disabled:cursor-not-allowed hover:scale-105 transition-transform"
							>
								{loading ? "Generating..." : "Generate Roadmap"}
							</button>
						</div>
					)}
				</div>
			)}

			{/* ── Category Browsing Section ── */}
			{!dataLoading && !result && (
				<section className="max-w-5xl mx-auto px-4 pb-20">
					{/* Divider */}
					<div className="flex items-center gap-4 mb-8">
						<div className="flex-1 h-px bg-purple-500/20"></div>
						<p className="text-sm text-purple-400/70 uppercase tracking-widest whitespace-nowrap">
							Or browse by category
						</p>
						<div className="flex-1 h-px bg-purple-500/20"></div>
					</div>

					{/* Category buttons grid */}
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-10">
						{allCategories.map((category) => {
							const isActive = activeCategory === category;
							return (
								<button
									key={category}
									onClick={() => handleCategoryClick(category)}
									className={`
										group relative flex flex-col items-center gap-2 px-3 py-4 rounded-xl border text-center
										transition-all duration-200 hover:scale-105
										${isActive
											? "border-purple-400 bg-purple-500/20 shadow-lg shadow-purple-500/20"
											: "border-purple-500/20 bg-black/20 hover:border-purple-500/50 hover:bg-purple-500/10"
										}
									`}
								>
									<span className="text-2xl">{CATEGORY_ICONS[category] ?? "📁"}</span>
									<span
										className={`text-xs font-medium leading-tight transition-colors ${isActive ? "text-purple-300" : "text-gray-400 group-hover:text-gray-200"
											}`}
									>
										{category}
									</span>
									{isActive && (
										<span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-purple-400 shadow-sm shadow-purple-400/50"></span>
									)}
									<span
										className={`text-xs transition-colors ${isActive ? "text-purple-400" : "text-gray-600 group-hover:text-gray-500"
											}`}
									>
										{categoryMap[category].length} careers
									</span>
								</button>
							);
						})}
					</div>

					{/* Careers list for active category */}
					{activeCategory && (
						<div ref={categoryRef} className="animate-fadeIn">
							{/* Category header */}
							<div className="flex items-center justify-between mb-6">
								<div className="flex items-center gap-3">
									<span className="text-3xl">{CATEGORY_ICONS[activeCategory]}</span>
									<div>
										<h3 className="text-xl font-bold text-gray-100">{activeCategory}</h3>
										<p className="text-sm text-purple-400">{categoryCareers.length} careers available</p>
									</div>
								</div>
								<button
									onClick={() => setActiveCategory(null)}
									className="text-gray-500 hover:text-gray-300 transition-colors p-2 rounded-lg hover:bg-purple-500/10"
									title="Close"
								>
									<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>

							{/* Careers grid */}
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
								{categoryCareers.map((careerObj, idx) => (
									<button
										key={idx}
										onClick={() => handleSelectFromCategory(careerObj, activeCategory)}
										className="group text-left bg-black/20 border border-purple-500/20 rounded-xl p-4 hover:border-purple-400/50 hover:bg-purple-500/10 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/10"
									>
										<div className="flex items-start justify-between gap-2">
											<div>
												<h4 className="text-sm font-semibold text-gray-200 group-hover:text-white capitalize leading-snug">
													{careerObj.career}
												</h4>
												{careerObj.sub_fields && careerObj.sub_fields.length > 0 && (
													<span className="text-xs text-pink-400/70 mt-0.5 block">
														🎯 {careerObj.sub_fields.length} specializations
													</span>
												)}
											</div>
											<svg
												className="w-4 h-4 text-purple-500/40 group-hover:text-purple-400 shrink-0 mt-0.5 transition-colors"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
											</svg>
										</div>
										{careerObj.skills.length > 0 && (
											<div className="mt-2 flex flex-wrap gap-1">
												{careerObj.skills.slice(0, 3).map((skill, si) => (
													<span
														key={si}
														className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400/70 capitalize"
													>
														{skill}
													</span>
												))}
												{careerObj.skills.length > 3 && (
													<span className="text-xs px-2 py-0.5 text-gray-600">
														+{careerObj.skills.length - 3}
													</span>
												)}
											</div>
										)}
									</button>
								))}
							</div>
						</div>
					)}
				</section>
			)}

			{/* ── Result Section ── */}
			{result && (
				<section className="max-w-5xl mx-auto px-4 pb-20">

					{/* Header card */}
					<div className="bg-linear-to-br from-purple-900/30 to-transparent backdrop-blur-sm border border-purple-500/30 rounded-2xl p-8 mb-8">
						<h2 className="text-3xl font-bold mb-2 bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent capitalize">
							{result.chosen_career}
						</h2>
						<p className="text-gray-400 mb-8">Your personalized roadmap is ready!</p>
						<div className="flex flex-wrap gap-4">
							<Link to="/flowmap">
								<button className="specialBtnGradient rounded-full px-8 py-3 text-white font-semibold shadow-lg shadow-purple-500/50 hover:scale-105 transition-transform">
									View Visual Roadmap
								</button>
							</Link>
							<button
								onClick={handleClear}
								className="rounded-full px-8 py-3 border border-purple-500/40 text-gray-300 hover:border-purple-400 hover:text-white transition-all"
							>
								Search Again
							</button>
						</div>
					</div>

					{/* Roadmap paths */}
					<div className="space-y-10">
						<h3 className="text-2xl font-bold text-purple-400">Detailed Roadmap Breakdown</h3>

						{result.roadmaps?.map((roadmap, rIdx) => (
							<div
								key={rIdx}
								className="bg-linear-to-br from-purple-900/20 to-transparent backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6 md:p-8"
							>
								{/* Path header */}
								<div className="flex flex-wrap items-center justify-between gap-2 mb-8">
									<div>
										<h4 className="text-xl font-bold text-gray-100 capitalize">
											{roadmap.path_title}
										</h4>
										<p className="text-sm text-purple-400 mt-0.5">{roadmap.focus} Path</p>
									</div>
									<span className="text-sm text-gray-500 bg-purple-500/10 border border-purple-500/20 rounded-full px-3 py-1">
										{Math.round(roadmap.confidence_score * 100)}% confidence
									</span>
								</div>

								{/* Steps */}
								<div className="relative">
									{/* Vertical timeline line */}
									<div className="absolute left-4 top-0 bottom-0 w-px bg-purple-500/20"></div>

									<div className="space-y-8">
										{roadmap.steps.map((step, sIdx) => {
											const milestone = step.milestones?.[0];
											return (
												<div key={sIdx} className="relative pl-12">
													{/* Step number bubble */}
													<div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-linear-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-purple-500/30 z-10">
														{sIdx + 1}
													</div>

													<div className="bg-black/20 border border-purple-500/20 rounded-xl p-5 hover:border-purple-500/40 transition-all">
														{/* Milestone title */}
														{milestone && (
															<>
																<h5 className="text-base font-bold text-gray-100 mb-2">
																	{milestone.title}
																</h5>
																{milestone.description && (
																	<p className="text-sm text-gray-400 leading-relaxed mb-4 whitespace-pre-line">
																		{milestone.description}
																	</p>
																)}
															</>
														)}

														{/* Resources */}
														{step.resources?.length > 0 && (
															<div>
																<p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">
																	Resources
																</p>
																<ul className="space-y-1.5">
																	{step.resources.map((res, resIdx) => (
																		<li key={resIdx} className="flex items-start gap-2">
																			<span className="text-blue-500 mt-0.5 shrink-0">→</span>
																			{res.url ? (
																				<a
																					href={res.url}
																					target="_blank"
																					rel="noopener noreferrer"
																					className="text-sm text-blue-400 hover:text-blue-300 hover:underline leading-snug"
																				>
																					{res.title || res.url}
																				</a>
																			) : (
																				<span className="text-sm text-gray-400 leading-snug">
																					{res.title || res}
																				</span>
																			)}
																		</li>
																	))}
																</ul>
															</div>
														)}
													</div>
												</div>
											);
										})}
									</div>
								</div>
							</div>
						))}
					</div>

					{/* Download */}
					<div className="mt-12 text-center">
						<a
							href="http://localhost:8000/download"
							target="_blank"
							rel="noreferrer"
							className="inline-block specialBtnGradient rounded-full px-8 py-4 text-white font-semibold shadow-lg shadow-purple-500/50 hover:scale-105 transition-transform"
						>
							Download Complete Roadmap JSON
						</a>
					</div>
				</section>
			)}

			<style>{`
				@keyframes fadeIn {
					from { opacity: 0; transform: translateY(12px); }
					to { opacity: 1; transform: translateY(0); }
				}
				.animate-fadeIn {
					animation: fadeIn 0.3s ease forwards;
				}
			`}</style>
		</main>
	);
}

export default Search;