import { useState, useEffect } from "react";
import { Link } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { CATEGORY_ICONS, DOC_LINKS, TECH_ENG_CATEGORIES } from "../data/Data";
import {
	useSearchData,
	useCareerFilters,
	useCareerSelection,
	useRoadmapGeneration,
	useCategoryBrowser,
} from "../util/customHooks";
import MainNav from "../components/MainNav";
import SearchWithResult from "../components/SearchWithResult";

function Search() {
	const { user } = useAuth();

	const {
		allCareers,
		categoryMap,
		allCategories,
		dataLoading,
		getTiobeRank,
		getTiobeAwards,
		initialCategory,
		initialPopular,
	} = useSearchData();

	const selection = useCareerSelection({ allCareers, getTiobeRank });
	const {
		setQuery,
		selected,
		selectedSubField,
		setSelectedSubField,
		selectedLanguage,
		setSelectedLanguage,
		experienceLevel,
		setExperienceLevel,
		preferPaid,
		hasDirectLanguages,
	} = selection;

	const {
		activeCategory,
		categoryRef,
		categoryCareers,
		handleCategoryClick,
	} = useCategoryBrowser({ categoryMap, initialCategory });

	const {
		filterLanguage,
		setFilterLanguage,
		filterEducation,
		setFilterEducation,
		filterPopular,
		setFilterPopular,
		skillSearch,
		setSkillSearch,
		selectedSkills,
		setSelectedSkills,
		isFilteringActive,
		filteredCareersGroupedByCategory,
		uniqueLanguages,
		uniqueEducations,
		topSkills,
	} = useCareerFilters({
		allCareers,
		allCategories,
		query: selection.query,
		activeCategory,
	});

	const roadmap = useRoadmapGeneration({
		selected,
		selectedSubField,
		selectedLanguage,
		experienceLevel,
		preferPaid,
		hasDirectLanguages,
		user,
	});

	const {
		result,
		followUpResult,
		followUpLoading,
		activeRoadmapTab,
		setActiveRoadmapTab,
		saveStatus,
		saveError,
		handleSaveRoadmap,
	} = roadmap;

	const filters = useCareerFilters({
		allCareers,
		allCategories,
		query: selection.query,
		activeCategory,
	});
	const category = useCategoryBrowser({ categoryMap, initialCategory });

	useEffect(() => {
		if (initialPopular) setFilterPopular(true);
	}, [initialPopular]);

	const [showFilters, setShowFilters] = useState(false);

	const handleQueryChange = (e) => {
		selection.handleQueryChange(e);
		roadmap.reset();
	};

	const handleSelect = (careerObj) => {
		selection.handleSelect(careerObj);
		roadmap.reset();
	};

	const handleClear = () => {
		selection.reset();
		setQuery("");
		roadmap.reset();
		selection.inputRef.current?.focus();
	};

	const handleSelectFromCategory = (careerObj, category) => {
		selection.handleSelect({ ...careerObj, category });
		setQuery(careerObj.career);
		roadmap.reset();
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

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

			{/* Search + selected card - hide once result is shown */}
			<SearchWithResult
				{...selection}
				{...filters}
				{...roadmap}
				{...category}
				getTiobeRank={getTiobeRank}
				getTiobeAwards={getTiobeAwards}
				dataLoading={dataLoading}
				showFilters={showFilters}
				setShowFilters={setShowFilters}
				handleQueryChange={handleQueryChange}
				handleSelect={handleSelect}
				handleClear={handleClear}
				handleSelectFromCategory={handleSelectFromCategory}
			/>

			{/* ── Filter & Category Browsing Section ── */}
			{!dataLoading && !result && (
				<section className="max-w-7xl mx-auto px-4 pb-20">
					<div className="flex items-center gap-4 mb-8">
						<div className="flex-1 h-px bg-purple-500/20"></div>
						<p className="text-sm text-purple-400/70 uppercase tracking-widest whitespace-nowrap">
							Filter or Browse Categories
						</p>
						<div className="flex-1 h-px bg-purple-500/20"></div>
					</div>

					<div className="flex flex-col md:flex-row gap-8">
						{/* Filters Sidebar */}
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
												handleCategoryClick(null);
											}}
											className="w-full mb-6 py-2 bg-purple-500/10 text-pink-400 border border-purple-500/20 rounded-lg hover:bg-purple-500/20 hover:text-pink-300 transition-colors text-sm font-medium"
										>
											Clear All Filters
										</button>
									)}

									<div className="space-y-8">
										{uniqueLanguages.length > 0 && (
											<div>
												<label className="block text-xs font-medium text-purple-300 mb-3 uppercase tracking-wider">
													Language / Tool
												</label>
												<div className="space-y-2.5 max-h-48 overflow-y-auto custom-scrollbar pr-2">
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

						{/* Results Grid */}
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
																handleCategoryClick(
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
																	selection.handleSelect(
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

									{activeCategory && (
										<div
											ref={categoryRef}
											className="animate-fadeIn"
										>
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
														handleCategoryClick(
															null,
														)
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

			{/* Result Section */}
			{result && (
				<section className="max-w-5xl mx-auto px-4 pb-20">
					<div className="bg-linear-to-br from-purple-900/30 to-transparent backdrop-blur-sm border border-purple-500/30 rounded-2xl p-8 mb-8">
						<h2 className="text-3xl font-bold mb-2 bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent capitalize">
							{result.chosen_career}
						</h2>
						<p className="text-gray-400 mb-8">
							Your personalized roadmap
							{followUpResult ? "s are" : " is"} ready!
						</p>

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
						<div className="flex flex-wrap gap-4 items-center">
							<Link to="/flowmap">
								<button className="specialBtnGradient rounded-full px-8 py-3 text-white font-semibold shadow-lg shadow-purple-500/50 hover:scale-105 transition-transform">
									View Visual Roadmap
								</button>
							</Link>
							<button
								onClick={handleSaveRoadmap}
								disabled={
									saveStatus === "saving" ||
									saveStatus === "saved"
								}
								className={`rounded-full px-8 py-3 border font-semibold transition-all hover:scale-105
									${
										saveStatus === "saved"
											? "border-green-500 bg-green-500/20 text-green-300 cursor-default"
											: saveStatus === "error" || saveStatus === "already_saved"
												? "border-red-500/60 bg-red-500/10 text-red-400 hover:border-red-400"
												: "border-purple-500/40 text-gray-300 hover:border-purple-400 hover:text-white"
									} disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100`}
							>
								{saveStatus === "saving"
									? "Saving..."
									: saveStatus === "saved"
										? "✅ Saved!"
										: saveStatus === "already_saved"
											? "🔄 Already Saved!"
											: "💾 Save Roadmap"}
							</button>
							<button
								onClick={handleClear}
								className="rounded-full px-8 py-3 border border-purple-500/40 text-gray-300 hover:border-purple-400 hover:text-white transition-all"
							>
								Search Again
							</button>
						</div>
						{/* Save feedback messages */}
						{saveStatus === "error" && saveError && (
							<p className="mt-3 text-sm text-red-400 flex items-center gap-2">
								<span>⚠️</span>
								{saveError}
								{saveError.includes("logged in") && (
									<Link
										to="/login"
										className="underline text-purple-400 hover:text-purple-300 ml-1"
									>
										Log in →
									</Link>
								)}
							</p>
						)}
						{saveStatus === "saved" && (
							<p className="mt-3 text-sm text-green-400">
								Roadmap saved to your profile successfully.
							</p>
						)}
						{saveStatus === "already_saved" && (
							<p className="mt-3 text-sm text-blue-400">
								Roadmap is already saved to your profile.
							</p>
						)}
					</div>

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

									<div className="relative">
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
														<div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-linear-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-purple-500/30 z-10">
															{sIdx + 1}
														</div>

														<div className="bg-black/20 border border-purple-500/20 rounded-xl p-5 hover:border-purple-500/40 transition-all">
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

					{followUpLoading && (
						<div className="text-center py-8">
							<div className="inline-block w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mb-4"></div>
							<p className="text-gray-400 text-sm">
								Generating follow-up roadmap...
							</p>
						</div>
					)}

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
