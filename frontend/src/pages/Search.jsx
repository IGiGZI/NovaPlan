import { useState, useMemo, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router";
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
					languages: careerObj.languages ?? [],
					education_level:
						careerObj.education_level ?? "Not Specified",
					popular_in_egypt: careerObj.popular_in_egypt ?? false,
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
						languages: careerObj.languages ?? [],
						education_level:
							careerObj.education_level ?? "Not Specified",
						popular_in_egypt: careerObj.popular_in_egypt ?? false,
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
	Legal: "⚖️",
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
	"Engineering - Aerospace & Transportation",
]);

function isTechOrEngineering(category) {
	return TECH_ENG_CATEGORIES.has(category);
}

function Search() {
	const [allCareers, setAllCareers] = useState([]);
	const [categoryMap, setCategoryMap] = useState({});
	const [allCategories, setAllCategories] = useState([]);
	const [dataLoading, setDataLoading] = useState(true);
	const [tiobeData, setTiobeData] = useState({});
	const [tiobeAwards, setTiobeAwards] = useState({});

	const DOC_LINKS = {
		python: "https://docs.python.org/3/",
		java: "https://docs.oracle.com/en/java/",
		javascript: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
		"c#": "https://learn.microsoft.com/en-us/dotnet/csharp/",
		"c++": "https://en.cppreference.com/w/cpp",
		c: "https://en.cppreference.com/w/c",
		typescript: "https://www.typescriptlang.org/docs/",
		ruby: "https://ruby-doc.org/",
		php: "https://www.php.net/manual/en/",
		swift: "https://docs.swift.org/swift-book/",
		go: "https://go.dev/doc/",
		rust: "https://doc.rust-lang.org/",
		kotlin: "https://kotlinlang.org/docs/home.html",
		dart: "https://dart.dev/guides",
		sql: "https://dev.mysql.com/doc/",
		html: "https://developer.mozilla.org/en-US/docs/Web/HTML",
		css: "https://developer.mozilla.org/en-US/docs/Web/CSS",
		react: "https://react.dev/",
		angular: "https://angular.io/docs",
		vue: "https://vuejs.org/guide/introduction.html",
		"node.js": "https://nodejs.org/en/docs/",
		flutter: "https://docs.flutter.dev/",
		django: "https://docs.djangoproject.com/en/stable/",
		flask: "https://flask.palletsprojects.com/",
		spring: "https://spring.io/projects/spring-framework",
		laravel: "https://laravel.com/docs",
		tensorflow: "https://www.tensorflow.org/api_docs",
		pytorch: "https://pytorch.org/docs/stable/index.html",
		pandas: "https://pandas.pydata.org/docs/",
		numpy: "https://numpy.org/doc/",
		docker: "https://docs.docker.com/",
		kubernetes: "https://kubernetes.io/docs/home/",
		aws: "https://docs.aws.amazon.com/",
		azure: "https://learn.microsoft.com/en-us/azure/",
		gcp: "https://cloud.google.com/docs",
	};

	const getDocLink = (langName) => {
		const name = langName.split("/")[0].split("(")[0].trim().toLowerCase();
		return (
			DOC_LINKS[name] ||
			`https://devdocs.io/#q=${encodeURIComponent(name)}`
		);
	};

	const getTiobeRank = (langName) => {
		if (!tiobeData) return null;
		let name = langName.split("/")[0].split("(")[0].trim().toLowerCase();
		if (name === "flutter") name = "dart";
		return tiobeData[name] || null;
	};

	const getTiobeAwards = (langName) => {
		if (!tiobeAwards) return null;
		let name = langName.split("/")[0].split("(")[0].trim().toLowerCase();
		if (name === "flutter") name = "dart";
		const years = tiobeAwards[name];
		if (years && years.length > 0) {
			// Get most recent year or all years
			return `Best in ${years[0]}`;
		}
		return null;
	};

	const location = useLocation();

	// Filter state
	const [filterLanguage, setFilterLanguage] = useState("");
	const [filterEducation, setFilterEducation] = useState("");
	const [filterPopular, setFilterPopular] = useState(false);
	const [skillSearch, setSkillSearch] = useState("");
	const [selectedSkills, setSelectedSkills] = useState([]);

	// Extracted options for dropdowns (now dynamically computed via useMemo below)

	useEffect(() => {
		fetch("/api/careers_data")
			.then((res) => res.json())
			.then((data) => {
				const flatCareers = flattenCareers(data);
				setAllCareers(flatCareers);
				const map = buildCategoryMap(data);
				setCategoryMap(map);
				setAllCategories(Object.keys(map));

				setDataLoading(false);

				// Parse category from URL after loading data
				const searchParams = new URLSearchParams(location.search);
				const categoryParam = searchParams.get("category");
				if (categoryParam && map[categoryParam]) {
					setActiveCategory(categoryParam);
				}
				const topParam = searchParams.get("top");
				if (topParam === "true") {
					setFilterPopular(true);
				}
			})
			.catch((err) => {
				console.error("Failed to load careers dataset:", err);
				setDataLoading(false);
			});

		// Fetch TIOBE data
		fetch("/api/tiobe")
			.then((res) => res.json())
			.then((data) => {
				if (data.rankings) setTiobeData(data.rankings);
				if (data.awards) setTiobeAwards(data.awards);
			})
			.catch((err) => console.error("Failed to load TIOBE data:", err));
	}, [location.search]);

	const [query, setQuery] = useState("");
	const [showFilters, setShowFilters] = useState(false);
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

	// New feature state
	const [difficultyFilter, setDifficultyFilter] = useState("default"); // "easiest" | "hardest" | "default"
	const [preferPaid, setPreferPaid] = useState(null); // true | false | null
	const [recommendedFields, setRecommendedFields] = useState([]);
	const [selectedRecommendedField, setSelectedRecommendedField] =
		useState(null);
	const [wantsFollowUpRoadmap, setWantsFollowUpRoadmap] = useState(null); // true | false | null
	const [followUpResult, setFollowUpResult] = useState(null);
	const [followUpLoading, setFollowUpLoading] = useState(false);
	const [activeRoadmapTab, setActiveRoadmapTab] = useState(0); // 0 = main, 1 = follow-up

	const isFilteringActive =
		filterLanguage ||
		filterEducation ||
		filterPopular ||
		skillSearch.trim() ||
		selectedSkills.length > 0 ||
		query.trim();

	const baseCareers = useMemo(() => {
		let sourceCareers = allCareers;
		if (activeCategory) {
			sourceCareers = allCareers.filter(
				(c) => c.category === activeCategory,
			);
		}

		if (!query.trim()) return sourceCareers;
		const q = query.toLowerCase();

		// 1. Check if the query matches any category name
		const matchingCategories = allCategories.filter((cat) =>
			cat.toLowerCase().includes(q),
		);

		let results = [];

		if (matchingCategories.length > 0) {
			// Smart filtering: if user searches for a category (e.g. "health" -> "Healthcare & Medicine")
			// only return careers in those categories, or careers that match the name exactly/strongly.
			results = sourceCareers.filter(
				(c) =>
					matchingCategories.includes(c.category) ||
					c.career.toLowerCase().includes(q),
			);
		} else {
			// Normal search: includes skills and languages
			results = sourceCareers.filter(
				(c) =>
					c.career.toLowerCase().includes(q) ||
					c.skills.some((s) => s.toLowerCase().includes(q)) ||
					c.languages.some((l) => l.name.toLowerCase().includes(q)),
			);
		}

		// 2. Score and sort so the best matches bubble up to the top
		const scoredCareers = results.map((c) => {
			let score = 0;
			const careerLower = c.career.toLowerCase();
			const catLower = c.category.toLowerCase();

			if (careerLower === q) score += 100;
			else if (careerLower.startsWith(q)) score += 50;
			else if (careerLower.includes(q)) score += 20;

			if (catLower === q) score += 80;
			else if (catLower.includes(q)) score += 40;

			const exactSkill = c.skills.some((s) => s.toLowerCase() === q);
			if (exactSkill) score += 10;
			else if (c.skills.some((s) => s.toLowerCase().includes(q)))
				score += 2;

			const exactLang = c.languages.some(
				(l) => l.name.toLowerCase() === q,
			);
			if (exactLang) score += 15;
			else if (c.languages.some((l) => l.name.toLowerCase().includes(q)))
				score += 3;

			return { ...c, __score: score };
		});

		// Sort by score descending
		scoredCareers.sort((a, b) => b.__score - a.__score);

		return scoredCareers;
	}, [query, allCareers, allCategories]);

	const { uniqueLanguages, uniqueEducations, topSkills } = useMemo(() => {
		const langs = new Set();
		const edus = new Set();
		const skillCounts = {};

		baseCareers.forEach((c) => {
			c.languages.forEach((l) => langs.add(l.name));
			c.sub_fields.forEach((sf) =>
				sf.languages?.forEach((l) => langs.add(l.name)),
			);
			edus.add(c.education_level);
			c.skills.forEach((s) => {
				const cleanS = s.toLowerCase().trim();
				skillCounts[cleanS] = (skillCounts[cleanS] || 0) + 1;
			});
		});

		const uLangs = Array.from(langs).sort();
		const uEdus = Array.from(edus)
			.filter((e) => e !== "Not Specified")
			.sort();

		// Get top 20 skills
		const tSkills = Object.entries(skillCounts)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 20)
			.map((s) => s[0]);

		return {
			uniqueLanguages: uLangs,
			uniqueEducations: uEdus,
			topSkills: tSkills,
		};
	}, [baseCareers]);

	const filteredCareersGroupedByCategory = useMemo(() => {
		if (!isFilteringActive) return null;
		const grouped = {};

		baseCareers.forEach((c) => {
			let match = true;

			// 1. Language Filter
			if (filterLanguage) {
				const hasLang =
					c.languages.some((l) => l.name === filterLanguage) ||
					c.sub_fields.some((sf) =>
						sf.languages?.some((l) => l.name === filterLanguage),
					);
				if (!hasLang) match = false;
			}

			// 2. Education Filter
			if (
				match &&
				filterEducation &&
				c.education_level !== filterEducation
			) {
				match = false;
			}

			// 3. Popular in Egypt Filter
			if (match && filterPopular && !c.popular_in_egypt) {
				match = false;
			}

			// 4. Skills Match (Checkbox & Text Search)
			if (match) {
				const careerSkills = c.skills.map((s) => s.toLowerCase());

				// Checkbox match: ALL selected skills must be present
				if (selectedSkills.length > 0) {
					const hasAllSelectedSkills = selectedSkills.every((ss) =>
						careerSkills.some((cs) => cs.includes(ss)),
					);
					if (!hasAllSelectedSkills) match = false;
				}

				// Text search match: ANY skill must match the typed text
				if (match && skillSearch.trim()) {
					const q = skillSearch.toLowerCase().trim();
					const hasSkill = careerSkills.some((cs) => cs.includes(q));
					if (!hasSkill) match = false;
				}
			}

			if (match) {
				if (!grouped[c.category]) grouped[c.category] = [];
				grouped[c.category].push(c);
			}
		});
		return grouped;
	}, [
		allCareers,
		filterLanguage,
		filterEducation,
		filterPopular,
		skillSearch,
		selectedSkills,
		isFilteringActive,
	]);

	const filtered = useMemo(() => {
		if (!query.trim()) return [];
		const q = query.toLowerCase();
		return allCareers
			.filter(
				(c) =>
					c.career.toLowerCase().includes(q) ||
					c.category.toLowerCase().includes(q),
			)
			.slice(0, 12);
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
			categoryRef.current.scrollIntoView({
				behavior: "smooth",
				block: "start",
			});
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
		setDifficultyFilter("default");
		setPreferPaid(null);
		setRecommendedFields([]);
		setSelectedRecommendedField(null);
		setWantsFollowUpRoadmap(null);
		setFollowUpResult(null);
		setActiveRoadmapTab(0);
	};

	// Check if career has direct languages (no sub_fields but has languages array)
	const hasDirectLanguages =
		selected &&
		!selected.sub_fields?.length &&
		selected.languages?.length > 0;

	// Sort languages by difficulty filter
	const sortedLanguages = useMemo(() => {
		const langs = hasDirectLanguages ? [...selected.languages] : [];
		if (difficultyFilter === "easiest")
			langs.sort((a, b) => (a.difficulty ?? 99) - (b.difficulty ?? 99));
		else if (difficultyFilter === "hardest")
			langs.sort((a, b) => (b.difficulty ?? 0) - (a.difficulty ?? 0));
		else if (difficultyFilter === "popular")
			langs.sort(
				(a, b) =>
					(getTiobeRank(a.name) ?? 999) -
					(getTiobeRank(b.name) ?? 999),
			);
		return langs;
	}, [selected, hasDirectLanguages, difficultyFilter, tiobeData]);

	// Sort sub-field languages by difficulty filter
	const sortedSubFieldLanguages = useMemo(() => {
		if (!selectedSubField?.languages?.length) return [];
		const langs = [...selectedSubField.languages];
		if (difficultyFilter === "easiest")
			langs.sort((a, b) => (a.difficulty ?? 99) - (b.difficulty ?? 99));
		else if (difficultyFilter === "hardest")
			langs.sort((a, b) => (b.difficulty ?? 0) - (a.difficulty ?? 0));
		else if (difficultyFilter === "popular")
			langs.sort(
				(a, b) =>
					(getTiobeRank(a.name) ?? 999) -
					(getTiobeRank(b.name) ?? 999),
			);
		return langs;
	}, [selectedSubField, difficultyFilter, tiobeData]);

	// Fetch recommended fields when language is selected
	const fetchRecommendations = async (careerName, langName) => {
		try {
			const res = await fetch("http://localhost:8000/recommend_fields", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					career: careerName,
					language: langName,
				}),
			});
			if (res.ok) {
				const data = await res.json();
				setRecommendedFields(data.recommendations || []);
			}
		} catch (err) {
			console.error("Failed to fetch recommendations:", err);
		}
	};

	const handleGenerate = async () => {
		if (!selected) return;
		const hasSubFields =
			selected.sub_fields && selected.sub_fields.length > 0;
		const isTechEng = isTechOrEngineering(selected.category);
		const needsLevel = hasSubFields ? !!selectedSubField : isTechEng;
		const needsLang = hasDirectLanguages;

		if (hasSubFields && !selectedSubField) return;
		if (selectedSubField?.languages?.length > 0 && !selectedLanguage)
			return;
		if (needsLang && !selectedLanguage) return;
		if (needsLevel && !experienceLevel) return;
		if (
			(needsLang || selectedSubField?.languages?.length > 0) &&
			preferPaid === null
		)
			return;

		setError("");
		setLoading(true);
		setResult(null);
		setFollowUpResult(null);
		setActiveRoadmapTab(0);

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
					selected_language:
						selectedLanguage?.name || selectedLanguage || "",
					prefer_paid: preferPaid,
				}),
			});
			if (!res.ok) throw new Error("Failed to generate roadmap");
			const data = await res.json();
			setResult(data);
			localStorage.setItem("roadmapResult", JSON.stringify(data));

			// Generate follow-up roadmap if user requested one
			if (wantsFollowUpRoadmap && selectedRecommendedField) {
				setFollowUpLoading(true);
				try {
					const res2 = await fetch("http://localhost:8000/generate", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							answers: [],
							careers: [selectedRecommendedField.field],
							category: selected.category,
							user_summary: "",
							experience_level: experienceLevel || "",
							selected_language:
								selectedLanguage?.name ||
								selectedLanguage ||
								"",
							prefer_paid: preferPaid,
						}),
					});
					if (res2.ok) {
						const data2 = await res2.json();
						setFollowUpResult(data2);
					}
				} catch (err2) {
					console.error("Follow-up roadmap error:", err2);
				} finally {
					setFollowUpLoading(false);
				}
			}
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
		setDifficultyFilter("default");
		setPreferPaid(null);
		setRecommendedFields([]);
		setSelectedRecommendedField(null);
		setWantsFollowUpRoadmap(null);
		setFollowUpResult(null);
		setActiveRoadmapTab(0);
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
		setDifficultyFilter("default");
		setPreferPaid(null);
		setRecommendedFields([]);
		setSelectedRecommendedField(null);
		setWantsFollowUpRoadmap(null);
		setFollowUpResult(null);
		setActiveRoadmapTab(0);
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
					Browse our full career dataset and generate a personalized
					roadmap for any role
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
					<div className="flex gap-2">
						<div className="relative flex-1">
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
									onFocus={() =>
										query && setDropdownOpen(true)
									}
									placeholder="Search for a career or category..."
									className="w-full bg-transparent pl-12 pr-12 py-4 text-gray-100 placeholder-gray-500 focus:outline-none text-base"
								/>
								{query && (
									<button
										onClick={handleClear}
										className="absolute right-4 text-gray-500 hover:text-gray-300 transition-colors"
									>
										<svg
											className="w-5 h-5"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M6 18L18 6M6 6l12 12"
											/>
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

							{dropdownOpen &&
								query.trim() &&
								filtered.length === 0 && (
									<div className="absolute z-50 mt-2 w-full bg-black/90 backdrop-blur-md border border-purple-500/30 rounded-xl shadow-xl px-4 py-4 text-gray-400 text-sm text-center">
										No careers found for "{query}"
									</div>
								)}
						</div>
						<button
							onClick={() => setShowFilters(!showFilters)}
							className={`px-4 py-4 rounded-xl border transition-all flex items-center gap-2 font-medium shrink-0 ${showFilters || (isFilteringActive && !query.trim()) ? "bg-purple-500/20 border-purple-400 text-purple-200 shadow-lg shadow-purple-500/20" : "bg-black/30 border-purple-500/30 text-gray-400 hover:text-gray-200 hover:border-purple-400"}`}
						>
							<svg
								className="w-5 h-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
								/>
							</svg>
							<span className="hidden sm:inline">Filters</span>
						</button>
					</div>

					{/* Selected career preview card */}
					{selected && (
						<div className="mt-6 bg-linear-to-br from-purple-900/20 to-transparent backdrop-blur-sm border border-purple-500/30 rounded-xl p-6 space-y-4">
							<div>
								<p className="text-xs text-purple-400 uppercase tracking-widest mb-1">
									Selected Career
								</p>
								<h2 className="text-2xl font-bold text-gray-100 capitalize">
									{selected.career}
								</h2>
								<p className="text-sm text-gray-400 mt-1">
									{selected.category}
								</p>
							</div>

							{selected.skills.length > 0 && (
								<div>
									<p className="text-xs text-purple-400 font-semibold mb-2 uppercase tracking-wider">
										Key Skills
									</p>
									<div className="flex flex-wrap gap-2">
										{selected.skills
											.slice(0, 8)
											.map((skill, i) => (
												<span
													key={i}
													className="text-xs px-3 py-1 rounded-full border border-purple-500/30 text-gray-300 bg-purple-500/10 capitalize"
												>
													{skill}
												</span>
											))}
										{selected.skills.length > 8 && (
											<span className="text-xs px-3 py-1 rounded-full border border-purple-500/20 text-gray-500">
												+{selected.skills.length - 8}{" "}
												more
											</span>
										)}
									</div>
								</div>
							)}

							{/* Sub-field selection — for careers with sub_fields */}
							{selected.sub_fields &&
								selected.sub_fields.length > 0 && (
									<div className="space-y-4 pt-2">
										<div>
											<p className="text-sm text-pink-400 font-medium mb-1 uppercase tracking-widest">
												🎯 Choose a Specialization
											</p>
											<p className="text-gray-400 text-sm">
												Narrow your roadmap to a
												specific sub-field:
											</p>
										</div>
										<div className="grid gap-3">
											{selected.sub_fields.map(
												(sf, idx) => (
													<div key={idx}>
														<button
															onClick={() => {
																setSelectedSubField(
																	selectedSubField?.name ===
																		sf.name
																		? null
																		: sf,
																);
																setSelectedLanguage(
																	null,
																);
																setExperienceLevel(
																	"",
																);
															}}
															className={`w-full text-left rounded-lg px-4 py-3 border transition-all duration-150 ${
																selectedSubField?.name ===
																sf.name
																	? "border-pink-500 ring-2 ring-pink-500 bg-linear-to-r from-pink-600/30 to-purple-500/30"
																	: "border-purple-500/20 hover:border-pink-400/50 bg-purple-900/10"
															}`}
														>
															<div className="font-semibold text-gray-100">
																{sf.name}
															</div>
															<div className="text-sm text-gray-400 mt-1">
																{sf.description}
															</div>
														</button>

														{/* Language/Tool links */}
														{selectedSubField?.name ===
															sf.name &&
															sf.languages &&
															sf.languages
																.length > 0 && (
																<div className="ml-4 mt-2 space-y-3">
																	<p className="text-sm text-pink-400 font-medium uppercase tracking-widest">
																		🗣️ Which
																		of these
																		languages/tools
																		have you
																		heard of
																		or know
																		about?
																	</p>
																	<p className="text-gray-400 text-xs">
																		Select
																		the one
																		you'd
																		like to
																		learn.
																		Use the
																		filter
																		to sort
																		by
																		difficulty.
																	</p>
																	<div className="flex items-center gap-3">
																		<label className="text-xs text-gray-500 uppercase tracking-wider">
																			Sort
																			by:
																		</label>
																		<select
																			value={
																				difficultyFilter
																			}
																			onChange={(
																				e,
																			) =>
																				setDifficultyFilter(
																					e
																						.target
																						.value,
																				)
																			}
																			className="bg-purple-900/30 border border-purple-500/30 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-500/40 transition-all cursor-pointer"
																		>
																			<option value="default">
																				Default
																				order
																			</option>
																			<option value="easiest">
																				Easiest
																				first
																			</option>
																			<option value="hardest">
																				Hardest
																				first
																			</option>
																			<option value="popular">
																				Most
																				popular
																				(TIOBE)
																			</option>
																		</select>
																	</div>
																	<div className="grid gap-2">
																		{sortedSubFieldLanguages.map(
																			(
																				lang,
																				lIdx,
																			) => (
																				<div
																					key={
																						lIdx
																					}
																					onClick={(
																						e,
																					) => {
																						e.stopPropagation();
																						setSelectedLanguage(
																							lang,
																						);
																						setPreferPaid(
																							null,
																						);
																						setRecommendedFields(
																							[],
																						);
																						setSelectedRecommendedField(
																							null,
																						);
																						setWantsFollowUpRoadmap(
																							null,
																						);
																						fetchRecommendations(
																							selectedSubField?.name ||
																								selected.career,
																							lang.name,
																						);
																					}}
																					className={`cursor-pointer block rounded-lg px-4 py-3 border transition-all group ${
																						selectedLanguage?.name ===
																						lang.name
																							? "border-pink-500 bg-pink-500/20 ring-1 ring-pink-500"
																							: "border-pink-500/20 bg-purple-900/10 hover:bg-pink-500/10 hover:border-pink-400/40"
																					}`}
																				>
																					<div className="flex items-center justify-between">
																						<span
																							className={`font-semibold text-sm ${selectedLanguage?.name === lang.name ? "text-pink-200" : "text-pink-300 group-hover:text-pink-200"}`}
																						>
																							{selectedLanguage?.name ===
																							lang.name
																								? "✅ "
																								: "🔗 "}
																							{
																								lang.name
																							}
																							{lang.difficulty && (
																								<span className="ml-2 text-xs text-gray-500">
																									{"⭐".repeat(
																										Math.min(
																											lang.difficulty,
																											5,
																										),
																									)}
																								</span>
																							)}
																							{getTiobeRank(
																								lang.name,
																							) && (
																								<span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/30">
																									TIOBE
																									Rank:
																									#
																									{getTiobeRank(
																										lang.name,
																									)}
																								</span>
																							)}
																							{getTiobeAwards(
																								lang.name,
																							) && (
																								<span className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-500/30">
																									🏆{" "}
																									{getTiobeAwards(
																										lang.name,
																									)}
																								</span>
																							)}
																						</span>
																						<a
																							href={getDocLink(
																								lang.name,
																							)}
																							target="_blank"
																							rel="noopener noreferrer"
																							onClick={(
																								e,
																							) =>
																								e.stopPropagation()
																							}
																							className="text-xs text-blue-400 hover:text-blue-300 hover:underline z-10 relative px-2 py-1 bg-blue-900/20 rounded-md border border-blue-500/20"
																						>
																							Documentation
																							→
																						</a>
																					</div>
																					{lang.description && (
																						<p className="text-xs text-gray-400 mt-1 leading-relaxed">
																							{
																								lang.description
																							}
																						</p>
																					)}
																				</div>
																			),
																		)}
																	</div>
																	<button
																		onClick={() => {
																			const easiest =
																				[
																					...sf.languages,
																				].sort(
																					(
																						a,
																						b,
																					) =>
																						(a.difficulty ??
																							99) -
																						(b.difficulty ??
																							99),
																				)[0];
																			if (
																				easiest
																			) {
																				setSelectedLanguage(
																					easiest,
																				);
																				setDifficultyFilter(
																					"easiest",
																				);
																				setPreferPaid(
																					null,
																				);
																				setRecommendedFields(
																					[],
																				);
																				setSelectedRecommendedField(
																					null,
																				);
																				setWantsFollowUpRoadmap(
																					null,
																				);
																				fetchRecommendations(
																					selectedSubField?.name ||
																						selected.career,
																					easiest.name,
																				);
																			}
																		}}
																		className="w-full text-left rounded-lg px-4 py-3 border border-dashed border-purple-500/30 text-gray-400 hover:border-purple-400 hover:text-gray-200 transition-all text-sm"
																	>
																		🤷 I
																		haven't
																		heard of
																		any of
																		these —
																		pick the
																		easiest
																		for me
																	</button>
																</div>
															)}
													</div>
												),
											)}
										</div>
									</div>
								)}

							{/* Level picker — conditionally shown based on category or subfield */}
							{((selected.sub_fields &&
								selected.sub_fields.length > 0 &&
								selectedSubField) ||
								(!(
									selected.sub_fields &&
									selected.sub_fields.length > 0
								) &&
									isTechOrEngineering(
										selected.category,
									))) && (
								<div className="space-y-3 pt-2">
									<div>
										<p className="text-sm text-purple-400 font-medium mb-1 uppercase tracking-widest">
											📊 What's Your Experience Level?
										</p>
										<p className="text-gray-400 text-sm">
											This determines the depth and type
											of resources in your roadmap:
										</p>
									</div>
									<div className="grid grid-cols-3 gap-3">
										{[
											{
												value: "beginner",
												emoji: "🌱",
												label: "Beginner",
												desc: "Just starting out",
											},
											{
												value: "intermediate",
												emoji: "🔧",
												label: "Intermediate",
												desc: "Can build projects",
											},
											{
												value: "pro",
												emoji: "🚀",
												label: "Pro",
												desc: "Deep expertise",
											},
										].map((lvl) => (
											<button
												key={lvl.value}
												onClick={() =>
													setExperienceLevel(
														lvl.value,
													)
												}
												className={`text-center rounded-lg px-3 py-4 border transition-all duration-150 ${
													experienceLevel ===
													lvl.value
														? "border-purple-500 ring-2 ring-purple-500 bg-linear-to-r from-purple-600/30 to-pink-500/30 shadow-lg shadow-purple-500/30"
														: "border-purple-500/20 hover:border-purple-400/50 bg-purple-900/10"
												}`}
											>
												<div className="text-2xl mb-1">
													{lvl.emoji}
												</div>
												<div className="font-semibold text-gray-100 text-sm">
													{lvl.label}
												</div>
												<div className="text-xs text-gray-400 mt-0.5">
													{lvl.desc}
												</div>
											</button>
										))}
									</div>
									{experienceLevel && (
										<p className="text-sm text-gray-400">
											{experienceLevel === "beginner" &&
												"You'll get a comprehensive step-by-step roadmap with beginner-friendly resources."}
											{experienceLevel ===
												"intermediate" &&
												"You'll get a full roadmap with intermediate-level, project-based resources."}
											{experienceLevel === "pro" &&
												"You'll get an accelerated roadmap focused on advanced topics and fast job-readiness."}
										</p>
									)}
								</div>
							)}

							{/* ── Direct Language Selection ── */}
							{hasDirectLanguages && (
								<div className="space-y-4 pt-2">
									<div>
										<p className="text-sm text-pink-400 font-medium mb-1 uppercase tracking-widest">
											🗣️ Which of these languages/tools
											have you heard of or know about?
										</p>
										<p className="text-gray-400 text-sm">
											Select the one you'd like to learn.
											If you're not sure, use the filter
											to sort by difficulty.
										</p>
									</div>
									<div className="flex items-center gap-3">
										<label className="text-xs text-gray-500 uppercase tracking-wider">
											Sort by difficulty:
										</label>
										<select
											value={difficultyFilter}
											onChange={(e) =>
												setDifficultyFilter(
													e.target.value,
												)
											}
											className="bg-purple-900/30 border border-purple-500/30 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-500/40 transition-all cursor-pointer"
										>
											<option
												value="default"
												className="bg-gray-900 text-gray-200"
											>
												Default order
											</option>
											<option
												value="easiest"
												className="bg-gray-900 text-gray-200"
											>
												Easiest first
											</option>
											<option
												value="hardest"
												className="bg-gray-900 text-gray-200"
											>
												Hardest first
											</option>
											<option
												value="popular"
												className="bg-gray-900 text-gray-200"
											>
												Most popular (TIOBE)
											</option>
										</select>
									</div>
									<div className="grid gap-2">
										{sortedLanguages.map((lang, lIdx) => (
											<div
												key={lIdx}
												onClick={() => {
													setSelectedLanguage(lang);
													setPreferPaid(null);
													setRecommendedFields([]);
													setSelectedRecommendedField(
														null,
													);
													setWantsFollowUpRoadmap(
														null,
													);
													fetchRecommendations(
														selected.career,
														lang.name,
													);
												}}
												className={`cursor-pointer block rounded-lg px-4 py-3 border transition-all group ${selectedLanguage?.name === lang.name ? "border-pink-500 bg-pink-500/20 ring-1 ring-pink-500" : "border-pink-500/20 bg-purple-900/10 hover:bg-pink-500/10 hover:border-pink-400/40"}`}
											>
												<div className="flex items-center justify-between">
													<span
														className={`font-semibold text-sm ${selectedLanguage?.name === lang.name ? "text-pink-200" : "text-pink-300 group-hover:text-pink-200"}`}
													>
														{selectedLanguage?.name ===
														lang.name
															? "✅ "
															: "🔗 "}
														{lang.name}
														{lang.difficulty && (
															<span className="ml-2 text-xs text-gray-500">
																{"⭐".repeat(
																	Math.min(
																		lang.difficulty,
																		5,
																	),
																)}
															</span>
														)}
														{getTiobeRank(
															lang.name,
														) && (
															<span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/30">
																TIOBE Rank: #
																{getTiobeRank(
																	lang.name,
																)}
															</span>
														)}
														{getTiobeAwards(
															lang.name,
														) && (
															<span className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-500/30">
																🏆{" "}
																{getTiobeAwards(
																	lang.name,
																)}
															</span>
														)}
													</span>
													<a
														href={getDocLink(
															lang.name,
														)}
														target="_blank"
														rel="noopener noreferrer"
														onClick={(e) =>
															e.stopPropagation()
														}
														className="text-xs text-blue-400 hover:text-blue-300 hover:underline z-10 relative px-2 py-1 bg-blue-900/20 rounded-md border border-blue-500/20"
													>
														Documentation →
													</a>
												</div>
												{lang.description && (
													<p className="text-xs text-gray-400 mt-1 leading-relaxed">
														{lang.description}
													</p>
												)}
											</div>
										))}
									</div>
									<button
										onClick={() => {
											const easiest = [
												...selected.languages,
											].sort(
												(a, b) =>
													(a.difficulty ?? 99) -
													(b.difficulty ?? 99),
											)[0];
											if (easiest) {
												setSelectedLanguage(easiest);
												setDifficultyFilter("easiest");
												setPreferPaid(null);
												setRecommendedFields([]);
												setSelectedRecommendedField(
													null,
												);
												setWantsFollowUpRoadmap(null);
												fetchRecommendations(
													selected.career,
													easiest.name,
												);
											}
										}}
										className="w-full text-left rounded-lg px-4 py-3 border border-dashed border-purple-500/30 text-gray-400 hover:border-purple-400 hover:text-gray-200 transition-all text-sm"
									>
										🤷 I haven't heard of any of these —
										pick the easiest for me
									</button>
								</div>
							)}

							{/* ── Paid / Free Resources Toggle ── */}
							{selectedLanguage &&
								(hasDirectLanguages ||
									selectedSubField?.languages?.length >
										0) && (
									<div className="space-y-3 pt-2">
										<div>
											<p className="text-sm text-green-400 font-medium mb-1 uppercase tracking-widest">
												💰 Are you willing to spend
												money on courses?
											</p>
											<p className="text-gray-400 text-sm">
												This controls whether your
												roadmap includes paid or free
												resources.
											</p>
										</div>
										<div className="grid grid-cols-2 gap-3">
											{[
												{
													value: true,
													emoji: "💳",
													label: "Yes, paid is fine",
													desc: "Premium courses & certifications",
												},
												{
													value: false,
													emoji: "🆓",
													label: "No, free only",
													desc: "YouTube, freeCodeCamp, docs",
												},
											].map((opt) => (
												<button
													key={String(opt.value)}
													onClick={() =>
														setPreferPaid(opt.value)
													}
													className={`text-center rounded-lg px-3 py-4 border transition-all duration-150 ${preferPaid === opt.value ? "border-green-500 ring-2 ring-green-500 bg-green-500/20 shadow-lg shadow-green-500/20" : "border-purple-500/20 hover:border-green-400/50 bg-purple-900/10"}`}
												>
													<div className="text-2xl mb-1">
														{opt.emoji}
													</div>
													<div className="font-semibold text-gray-100 text-sm">
														{opt.label}
													</div>
													<div className="text-xs text-gray-400 mt-0.5">
														{opt.desc}
													</div>
												</button>
											))}
										</div>
									</div>
								)}

							{/* ── Recommended Fields ── */}
							{recommendedFields.length > 0 &&
								preferPaid !== null && (
									<div className="space-y-4 pt-2">
										<div>
											<p className="text-sm text-cyan-400 font-medium mb-1 uppercase tracking-widest">
												🔮 Fields you can pursue after
											</p>
											<p className="text-gray-400 text-sm">
												Based on your choice of{" "}
												<span className="text-pink-300 font-medium">
													{selectedLanguage?.name}
												</span>{" "}
												and{" "}
												<span className="text-purple-300 font-medium capitalize">
													{selected.career}
												</span>
												, you might also enjoy:
											</p>
										</div>
										<div className="grid gap-2">
											{recommendedFields.map(
												(rf, idx) => (
													<div
														key={idx}
														className="rounded-lg px-4 py-3 border border-cyan-500/20 bg-cyan-900/10 text-sm"
													>
														<div className="font-semibold text-cyan-200">
															{rf.field}
														</div>
														<p className="text-xs text-gray-400 mt-1">
															{rf.description}
														</p>
													</div>
												),
											)}
										</div>
										<div className="space-y-3">
											<p className="text-sm text-gray-300">
												Would you like to generate a
												roadmap for any of these fields
												too?
											</p>
											<div className="flex gap-3">
												<button
													onClick={() => {
														setWantsFollowUpRoadmap(
															true,
														);
														setSelectedRecommendedField(
															null,
														);
													}}
													className={`rounded-lg px-4 py-2 border text-sm transition-all ${wantsFollowUpRoadmap === true ? "border-cyan-500 ring-1 ring-cyan-500 bg-cyan-500/20 text-cyan-200" : "border-purple-500/20 text-gray-400 hover:border-cyan-400/50"}`}
												>
													Yes, pick one
												</button>
												<button
													onClick={() => {
														setWantsFollowUpRoadmap(
															false,
														);
														setSelectedRecommendedField(
															null,
														);
													}}
													className={`rounded-lg px-4 py-2 border text-sm transition-all ${wantsFollowUpRoadmap === false ? "border-purple-500 ring-1 ring-purple-500 bg-purple-500/20 text-purple-200" : "border-purple-500/20 text-gray-400 hover:border-purple-400/50"}`}
												>
													No, just continue
												</button>
											</div>
											{wantsFollowUpRoadmap === true && (
												<div className="grid gap-2 ml-2">
													{recommendedFields.map(
														(rf, idx) => (
															<button
																key={idx}
																onClick={() =>
																	setSelectedRecommendedField(
																		rf,
																	)
																}
																className={`text-left rounded-lg px-4 py-2 border text-sm transition-all ${selectedRecommendedField?.field === rf.field ? "border-cyan-500 ring-1 ring-cyan-500 bg-cyan-500/20" : "border-cyan-500/20 hover:border-cyan-400/40 bg-purple-900/10"}`}
															>
																<span
																	className={
																		selectedRecommendedField?.field ===
																		rf.field
																			? "text-cyan-200"
																			: "text-gray-300"
																	}
																>
																	{selectedRecommendedField?.field ===
																	rf.field
																		? "✅ "
																		: ""}
																	{rf.field}
																</span>
															</button>
														),
													)}
												</div>
											)}
										</div>
									</div>
								)}

							{error && (
								<p className="text-red-400 text-sm font-medium">
									{error}
								</p>
							)}

							<button
								onClick={handleGenerate}
								disabled={
									loading ||
									followUpLoading ||
									(selected.sub_fields &&
										selected.sub_fields.length > 0 &&
										!selectedSubField) ||
									(selectedSubField?.languages?.length > 0 &&
										!selectedLanguage) ||
									(hasDirectLanguages && !selectedLanguage) ||
									(((selected.sub_fields &&
										selected.sub_fields.length > 0 &&
										selectedSubField) ||
										isTechOrEngineering(
											selected.category,
										)) &&
										!experienceLevel) ||
									(selectedLanguage &&
										(hasDirectLanguages ||
											selectedSubField?.languages
												?.length > 0) &&
										preferPaid === null) ||
									(wantsFollowUpRoadmap === true &&
										!selectedRecommendedField)
								}
								className="specialBtnGradient rounded-full px-8 py-3 text-white font-semibold shadow-lg shadow-purple-500/50 disabled:opacity-60 disabled:cursor-not-allowed hover:scale-105 transition-transform"
							>
								{loading
									? "Generating..."
									: followUpLoading
										? "Generating follow-up..."
										: "Generate Roadmap"}
							</button>
						</div>
					)}
				</div>
			)}

			{/* ── Filter & Category Browsing Section ── */}
			{!dataLoading && !result && (
				<section className="max-w-7xl mx-auto px-4 pb-20">
					{/* Divider */}
					<div className="flex items-center gap-4 mb-8">
						<div className="flex-1 h-px bg-purple-500/20"></div>
						<p className="text-sm text-purple-400/70 uppercase tracking-widest whitespace-nowrap">
							Filter or Browse Categories
						</p>
						<div className="flex-1 h-px bg-purple-500/20"></div>
					</div>

					<div className="flex flex-col md:flex-row gap-8">
						{/* ── Filters Sidebar ── */}
						{showFilters && (
							<div className="w-full md:w-80 shrink-0">
								<div className="sticky top-24 bg-black/30 border border-purple-500/30 rounded-2xl p-6 shadow-lg shadow-purple-900/20 backdrop-blur-sm animate-fadeIn">
									<div className="flex flex-wrap items-center justify-between gap-4 mb-4">
										<h3 className="text-lg font-bold text-gray-200 flex items-center gap-2">
											<span className="text-purple-400">
												🎛️
											</span>{" "}
											Filters
										</h3>
										<button
											onClick={() =>
												setShowFilters(false)
											}
											className="text-gray-400 hover:text-white p-1 transition-colors bg-purple-900/20 rounded-lg border border-purple-500/20 hover:bg-purple-500/20"
										>
											<svg
												className="w-5 h-5"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M6 18L18 6M6 6l12 12"
												/>
											</svg>
										</button>
									</div>

									{isFilteringActive && (
										<button
											onClick={() => {
												setFilterLanguage("");
												setFilterEducation("");
												setFilterPopular(false);
												setSkillSearch("");
												setSelectedSkills([]);
												setActiveCategory(null);
											}}
											className="w-full mb-6 py-2 bg-purple-500/10 text-pink-400 border border-purple-500/20 rounded-lg hover:bg-purple-500/20 hover:text-pink-300 transition-colors text-sm font-medium"
										>
											Clear All Filters
										</button>
									)}

									<div className="space-y-8">
										{/* Languages */}
										{uniqueLanguages.length > 0 && (
											<div>
												<label className="block text-xs font-medium text-purple-300 mb-3 uppercase tracking-wider">
													Language / Tool
												</label>
												<div className="space-y-2.5 max-h-48 overflow-y-auto custom-scrollbar pr-2">
													{/* "Any Language" option */}
													<button
														onClick={() =>
															setFilterLanguage(
																"",
															)
														}
														className="w-full flex items-center gap-3 group text-left"
													>
														<div
															className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors shrink-0 ${filterLanguage === "" ? "bg-purple-500 border-purple-500" : "border-purple-500/50 group-hover:border-purple-400"}`}
														>
															{filterLanguage ===
																"" && (
																<div className="w-1.5 h-1.5 bg-white rounded-full" />
															)}
														</div>
														<span
															className={`text-sm transition-colors ${filterLanguage === "" ? "text-purple-200 font-medium" : "text-gray-400 group-hover:text-gray-200"}`}
														>
															Any Language
														</span>
													</button>

													{uniqueLanguages.map(
														(l) => (
															<button
																key={l}
																onClick={() =>
																	setFilterLanguage(
																		l,
																	)
																}
																className="w-full flex items-center gap-3 group text-left"
															>
																<div
																	className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors shrink-0 ${filterLanguage === l ? "bg-purple-500 border-purple-500" : "border-purple-500/50 group-hover:border-purple-400"}`}
																>
																	{filterLanguage ===
																		l && (
																		<div className="w-1.5 h-1.5 bg-white rounded-full" />
																	)}
																</div>
																<span
																	className={`text-sm transition-colors ${filterLanguage === l ? "text-purple-200 font-medium" : "text-gray-400 group-hover:text-gray-200"}`}
																>
																	{l}
																</span>
															</button>
														),
													)}
												</div>
											</div>
										)}

										{/* Education */}
										<div>
											<label className="block text-xs font-medium text-purple-300 mb-3 uppercase tracking-wider">
												Education Level
											</label>
											<div className="space-y-2.5">
												<button
													onClick={() =>
														setFilterEducation("")
													}
													className="w-full flex items-center gap-3 group text-left"
												>
													<div
														className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors shrink-0 ${filterEducation === "" ? "bg-purple-500 border-purple-500" : "border-purple-500/50 group-hover:border-purple-400"}`}
													>
														{filterEducation ===
															"" && (
															<div className="w-1.5 h-1.5 bg-white rounded-full" />
														)}
													</div>
													<span
														className={`text-sm transition-colors ${filterEducation === "" ? "text-purple-200 font-medium" : "text-gray-400 group-hover:text-gray-200"}`}
													>
														Any Education
													</span>
												</button>

												{uniqueEducations.map((e) => (
													<button
														key={e}
														onClick={() =>
															setFilterEducation(
																e,
															)
														}
														className="w-full flex items-center gap-3 group text-left"
													>
														<div
															className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors shrink-0 ${filterEducation === e ? "bg-purple-500 border-purple-500" : "border-purple-500/50 group-hover:border-purple-400"}`}
														>
															{filterEducation ===
																e && (
																<div className="w-1.5 h-1.5 bg-white rounded-full" />
															)}
														</div>
														<span
															className={`text-sm transition-colors ${filterEducation === e ? "text-purple-200 font-medium" : "text-gray-400 group-hover:text-gray-200"}`}
														>
															{e}
														</span>
													</button>
												))}
											</div>
										</div>

										{/* Popularity Toggle — already works, keeping as-is */}
										<div>
											<label className="block text-xs font-medium text-purple-300 mb-3 uppercase tracking-wider">
												Popularity
											</label>
											<button
												onClick={() =>
													setFilterPopular(
														!filterPopular,
													)
												}
												className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${filterPopular ? "bg-cyan-500/20 border-cyan-500 ring-1 ring-cyan-500" : "bg-purple-900/10 border-purple-500/30 hover:border-cyan-400/50 hover:bg-cyan-900/10"}`}
											>
												<span
													className={`text-sm font-medium ${filterPopular ? "text-cyan-200" : "text-gray-400"}`}
												>
													Top / Popular in Egypt
												</span>
												<span className="text-lg">
													{filterPopular
														? "✅"
														: "⬜"}
												</span>
											</button>
										</div>

										{/* Skills */}
										<div>
											<label className="block text-xs font-medium text-purple-300 mb-2 uppercase tracking-wider">
												Required Skills
											</label>
											<input
												type="text"
												placeholder="Search skills..."
												value={skillSearch}
												onChange={(e) =>
													setSkillSearch(
														e.target.value,
													)
												}
												className="w-full bg-purple-900/20 border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-500/40 transition-all mb-3"
											/>
											<div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
												{topSkills.map((skill) => {
													const isSelected =
														selectedSkills.includes(
															skill,
														);
													return (
														<button
															key={skill}
															onClick={() =>
																setSelectedSkills(
																	(prev) =>
																		isSelected
																			? prev.filter(
																					(
																						s,
																					) =>
																						s !==
																						skill,
																				)
																			: [
																					...prev,
																					skill,
																				],
																)
															}
															className={`px-3 py-1.5 rounded-full text-xs border transition-all ${isSelected ? "bg-purple-500 border-purple-400 text-white shadow-md shadow-purple-500/20" : "bg-black/20 border-purple-500/20 text-gray-400 hover:border-purple-400/50 hover:text-gray-200"}`}
														>
															{skill}
														</button>
													);
												})}
											</div>
										</div>
									</div>
								</div>
							</div>
						)}

						{/* ── Results Grid ── */}
						<div className="flex-1">
							{isFilteringActive ? (
								<div className="space-y-8 animate-fadeIn">
									{Object.keys(
										filteredCareersGroupedByCategory,
									).length === 0 ? (
										<div className="text-center py-12 border border-dashed border-purple-500/30 rounded-2xl bg-black/20">
											<p className="text-gray-400">
												No careers match your filters.
												Try clearing some options.
											</p>
										</div>
									) : (
										Object.entries(
											filteredCareersGroupedByCategory,
										).map(([catName, careers]) => (
											<div
												key={catName}
												className="bg-black/20 border border-purple-500/20 rounded-2xl p-6"
											>
												<div className="flex items-center gap-3 mb-6 border-b border-purple-500/20 pb-4">
													<span className="text-2xl">
														{CATEGORY_ICONS[
															catName
														] ?? "📁"}
													</span>
													<h3 className="text-xl font-bold text-gray-200">
														{catName}
													</h3>
													<span className="ml-auto text-xs font-semibold text-purple-400 bg-purple-900/30 px-3 py-1 rounded-full">
														{careers.length} results
													</span>
													{activeCategory ===
														catName && (
														<button
															onClick={() => {
																setActiveCategory(
																	null,
																);
																setQuery("");
																setFilterLanguage(
																	"",
																);
																setFilterEducation(
																	"",
																);
																setFilterPopular(
																	false,
																);
																setSkillSearch(
																	"",
																);
																setSelectedSkills(
																	[],
																);
															}}
															className="ml-4 text-sm text-pink-400 hover:text-white underline underline-offset-2"
														>
															Back to Categories
														</button>
													)}
												</div>
												<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
													{careers.map(
														(careerObj, i) => (
															<button
																key={i}
																onClick={() => {
																	setSelected(
																		careerObj,
																	);
																	setSelectedSubField(
																		null,
																	);
																	setSelectedLanguage(
																		null,
																	);
																	setExperienceLevel(
																		"",
																	);
																	window.scrollTo(
																		{
																			top: 0,
																			behavior:
																				"smooth",
																		},
																	);
																}}
																className="flex items-center justify-between px-4 py-4 rounded-xl border border-purple-500/30 bg-purple-900/10 hover:bg-purple-500/20 hover:border-purple-400 transition-all text-left group"
															>
																<div>
																	<span className="font-semibold text-purple-200 group-hover:text-white transition-colors">
																		{
																			careerObj.career
																		}
																	</span>
																	{careerObj.popular_in_egypt && (
																		<span className="ml-2 text-xs">
																			⭐
																		</span>
																	)}
																</div>
																<span className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
																	→
																</span>
															</button>
														),
													)}
												</div>
											</div>
										))
									)}
								</div>
							) : (
								<>
									{/* Category buttons grid */}
									<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-10">
										{allCategories.map((category) => {
											const isActive =
												activeCategory === category;
											return (
												<button
													key={category}
													onClick={() =>
														handleCategoryClick(
															category,
														)
													}
													className={`
										group relative flex flex-col items-center gap-2 px-3 py-4 rounded-xl border text-center
										transition-all duration-200 hover:scale-105
										${
											isActive
												? "border-purple-400 bg-purple-500/20 shadow-lg shadow-purple-500/20"
												: "border-purple-500/20 bg-black/20 hover:border-purple-500/50 hover:bg-purple-500/10"
										}
									`}
												>
													<span className="text-2xl">
														{CATEGORY_ICONS[
															category
														] ?? "📁"}
													</span>
													<span
														className={`text-xs font-medium leading-tight transition-colors ${
															isActive
																? "text-purple-300"
																: "text-gray-400 group-hover:text-gray-200"
														}`}
													>
														{category}
													</span>
													{isActive && (
														<span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-purple-400 shadow-sm shadow-purple-400/50"></span>
													)}
													<span
														className={`text-xs transition-colors ${
															isActive
																? "text-purple-400"
																: "text-gray-600 group-hover:text-gray-500"
														}`}
													>
														{
															categoryMap[
																category
															].length
														}{" "}
														careers
													</span>
												</button>
											);
										})}
									</div>

									{/* Careers list for active category */}
									{activeCategory && (
										<div
											ref={categoryRef}
											className="animate-fadeIn"
										>
											{/* Category header */}
											<div className="flex items-center justify-between mb-6">
												<div className="flex items-center gap-3">
													<span className="text-3xl">
														{
															CATEGORY_ICONS[
																activeCategory
															]
														}
													</span>
													<div>
														<h3 className="text-xl font-bold text-gray-100">
															{activeCategory}
														</h3>
														<p className="text-sm text-purple-400">
															{
																categoryCareers.length
															}{" "}
															careers available
														</p>
													</div>
												</div>
												<button
													onClick={() =>
														setActiveCategory(null)
													}
													className="text-gray-500 hover:text-gray-300 transition-colors p-2 rounded-lg hover:bg-purple-500/10"
													title="Close"
												>
													<svg
														className="w-5 h-5"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M6 18L18 6M6 6l12 12"
														/>
													</svg>
												</button>
											</div>

											{/* Careers grid */}
											<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
												{categoryCareers.map(
													(careerObj, idx) => (
														<button
															key={idx}
															onClick={() =>
																handleSelectFromCategory(
																	careerObj,
																	activeCategory,
																)
															}
															className="group text-left bg-black/20 border border-purple-500/20 rounded-xl p-4 hover:border-purple-400/50 hover:bg-purple-500/10 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/10"
														>
															<div className="flex items-start justify-between gap-2">
																<div>
																	<h4 className="text-sm font-semibold text-gray-200 group-hover:text-white capitalize leading-snug">
																		{
																			careerObj.career
																		}
																	</h4>
																	{careerObj.sub_fields &&
																		careerObj
																			.sub_fields
																			.length >
																			0 && (
																			<span className="text-xs text-pink-400/70 mt-0.5 block">
																				🎯{" "}
																				{
																					careerObj
																						.sub_fields
																						.length
																				}{" "}
																				specializations
																			</span>
																		)}
																</div>
																<svg
																	className="w-4 h-4 text-purple-500/40 group-hover:text-purple-400 shrink-0 mt-0.5 transition-colors"
																	fill="none"
																	stroke="currentColor"
																	viewBox="0 0 24 24"
																>
																	<path
																		strokeLinecap="round"
																		strokeLinejoin="round"
																		strokeWidth={
																			2
																		}
																		d="M9 5l7 7-7 7"
																	/>
																</svg>
															</div>
															{careerObj.skills
																.length > 0 && (
																<div className="mt-2 flex flex-wrap gap-1">
																	{careerObj.skills
																		.slice(
																			0,
																			3,
																		)
																		.map(
																			(
																				skill,
																				si,
																			) => (
																				<span
																					key={
																						si
																					}
																					className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400/70 capitalize"
																				>
																					{
																						skill
																					}
																				</span>
																			),
																		)}
																	{careerObj
																		.skills
																		.length >
																		3 && (
																		<span className="text-xs px-2 py-0.5 text-gray-600">
																			+
																			{careerObj
																				.skills
																				.length -
																				3}
																		</span>
																	)}
																</div>
															)}
														</button>
													),
												)}
											</div>
										</div>
									)}
								</>
							)}
						</div>
					</div>
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
						<p className="text-gray-400 mb-8">
							Your personalized roadmap
							{followUpResult ? "s are" : " is"} ready!
						</p>

						{/* Tabbed view for main + follow-up roadmap */}
						{followUpResult && (
							<div className="flex gap-2 mb-6">
								<button
									onClick={() => setActiveRoadmapTab(0)}
									className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${activeRoadmapTab === 0 ? "specialBtnGradient text-white shadow-lg shadow-purple-500/30 ring-2 ring-purple-400" : "border border-purple-500/30 text-gray-400 hover:border-purple-400/60 hover:text-gray-200"}`}
								>
									🎯 {result.chosen_career}
								</button>
								<button
									onClick={() => setActiveRoadmapTab(1)}
									className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${activeRoadmapTab === 1 ? "specialBtnGradient text-white shadow-lg shadow-purple-500/30 ring-2 ring-purple-400" : "border border-purple-500/30 text-gray-400 hover:border-purple-400/60 hover:text-gray-200"}`}
								>
									🔮 {followUpResult.chosen_career}{" "}
									(Recommended)
								</button>
							</div>
						)}
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

					{/* Roadmap paths — main or follow-up based on active tab */}
					{(activeRoadmapTab === 0 || !followUpResult) && (
						<div className="space-y-10">
							<h3 className="text-2xl font-bold text-purple-400">
								Detailed Roadmap Breakdown
							</h3>

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
											<p className="text-sm text-purple-400 mt-0.5">
												{roadmap.focus} Path
											</p>
										</div>
										<span className="text-sm text-gray-500 bg-purple-500/10 border border-purple-500/20 rounded-full px-3 py-1">
											{Math.round(
												roadmap.confidence_score * 100,
											)}
											% confidence
										</span>
									</div>

									{/* Steps */}
									<div className="relative">
										{/* Vertical timeline line */}
										<div className="absolute left-4 top-0 bottom-0 w-px bg-purple-500/20"></div>

										<div className="space-y-8">
											{roadmap.steps.map((step, sIdx) => {
												const milestone =
													step.milestones?.[0];
												return (
													<div
														key={sIdx}
														className="relative pl-12"
													>
														{/* Step number bubble */}
														<div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-linear-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-purple-500/30 z-10">
															{sIdx + 1}
														</div>

														<div className="bg-black/20 border border-purple-500/20 rounded-xl p-5 hover:border-purple-500/40 transition-all">
															{/* Milestone title */}
															{milestone && (
																<>
																	<h5 className="text-base font-bold text-gray-100 mb-2">
																		{
																			milestone.title
																		}
																	</h5>
																	{milestone.description && (
																		<p className="text-sm text-gray-400 leading-relaxed mb-4 whitespace-pre-line">
																			{
																				milestone.description
																			}
																		</p>
																	)}
																</>
															)}

															{/* Resources */}
															{step.resources
																?.length >
																0 && (
																<div>
																	<p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">
																		Resources
																	</p>
																	<ul className="space-y-1.5">
																		{step.resources.map(
																			(
																				res,
																				resIdx,
																			) => (
																				<li
																					key={
																						resIdx
																					}
																					className="flex items-start gap-2"
																				>
																					<span className="text-blue-500 mt-0.5 shrink-0">
																						→
																					</span>
																					{res.url ? (
																						<a
																							href={
																								res.url
																							}
																							target="_blank"
																							rel="noopener noreferrer"
																							className="text-sm text-blue-400 hover:text-blue-300 hover:underline leading-snug"
																						>
																							{res.title ||
																								res.url}
																						</a>
																					) : (
																						<span className="text-sm text-gray-400 leading-snug">
																							{res.title ||
																								res}
																						</span>
																					)}
																				</li>
																			),
																		)}
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
					)}

					{/* Follow-up roadmap tab content */}
					{activeRoadmapTab === 1 && followUpResult && (
						<div className="space-y-10">
							<h3 className="text-2xl font-bold text-cyan-400">
								🔮 Follow-up Roadmap
							</h3>
							{followUpResult.roadmaps?.map((roadmap, rIdx) => (
								<div
									key={rIdx}
									className="bg-linear-to-br from-cyan-900/20 to-transparent backdrop-blur-sm border border-cyan-500/30 rounded-2xl p-6 md:p-8"
								>
									<div className="flex flex-wrap items-center justify-between gap-2 mb-8">
										<div>
											<h4 className="text-xl font-bold text-gray-100 capitalize">
												{roadmap.path_title}
											</h4>
											<p className="text-sm text-cyan-400 mt-0.5">
												{roadmap.focus} Path
											</p>
										</div>
										<span className="text-sm text-gray-500 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-3 py-1">
											{Math.round(
												roadmap.confidence_score * 100,
											)}
											% confidence
										</span>
									</div>
									<div className="relative">
										<div className="absolute left-4 top-0 bottom-0 w-px bg-cyan-500/20"></div>
										<div className="space-y-8">
											{roadmap.steps.map((step, sIdx) => {
												const milestone =
													step.milestones?.[0];
												return (
													<div
														key={sIdx}
														className="relative pl-12"
													>
														<div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-linear-to-br from-cyan-600 to-teal-500 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-cyan-500/30 z-10">
															{sIdx + 1}
														</div>
														<div className="bg-black/20 border border-cyan-500/20 rounded-xl p-5 hover:border-cyan-500/40 transition-all">
															{milestone && (
																<>
																	<h5 className="text-base font-bold text-gray-100 mb-2">
																		{
																			milestone.title
																		}
																	</h5>
																	{milestone.description && (
																		<p className="text-sm text-gray-400 leading-relaxed mb-4 whitespace-pre-line">
																			{
																				milestone.description
																			}
																		</p>
																	)}
																</>
															)}
															{step.resources
																?.length >
																0 && (
																<div>
																	<p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">
																		Resources
																	</p>
																	<ul className="space-y-1.5">
																		{step.resources.map(
																			(
																				res,
																				resIdx,
																			) => (
																				<li
																					key={
																						resIdx
																					}
																					className="flex items-start gap-2"
																				>
																					<span className="text-cyan-500 mt-0.5 shrink-0">
																						→
																					</span>
																					{res.url ? (
																						<a
																							href={
																								res.url
																							}
																							target="_blank"
																							rel="noopener noreferrer"
																							className="text-sm text-cyan-400 hover:text-cyan-300 hover:underline leading-snug"
																						>
																							{res.title ||
																								res.url}
																						</a>
																					) : (
																						<span className="text-sm text-gray-400 leading-snug">
																							{res.title ||
																								res}
																						</span>
																					)}
																				</li>
																			),
																		)}
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
					)}

					{/* Follow-up loading indicator */}
					{followUpLoading && (
						<div className="text-center py-8">
							<div className="inline-block w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mb-4"></div>
							<p className="text-gray-400 text-sm">
								Generating follow-up roadmap...
							</p>
						</div>
					)}

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
