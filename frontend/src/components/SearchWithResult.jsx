import { TECH_ENG_CATEGORIES } from "../data/Data";
import { getDocLink } from "../util/helperFunctions";

function SearchWithResult({
	dataLoading,
	result,
	inputRef,
	query,
	handleQueryChange,
	setDropdownOpen,
	handleClear,
	dropdownOpen,
	filtered,
	dropdownRef,
	handleSelect,
	showFilters,
	setShowFilters,
	isFilteringActive,
	selected,
	setSelectedSubField,
	selectedSubField,
	setSelectedLanguage,
	setExperienceLevel,
	hasDirectLanguages,
	sortedSubFieldLanguages,
	getTiobeRank,
	getTiobeAwards,
	sortedLanguages,
	setPreferPaid,
	setRecommendedFields,
	selectedRecommendedField,
	setSelectedRecommendedField,
	recommendedFields,
	error,
	difficultyFilter,
	setDifficultyFilter,
	fetchRecommendations,
	selectedLanguage,
	experienceLevel,
	preferPaid,
	handleGenerate,
	loading,
	followUpLoading,
}) {
	function isTechOrEngineering(category) {
		return TECH_ENG_CATEGORIES.has(category);
	}

	const isDisabled =
		loading ||
		followUpLoading ||
		(selected?.sub_fields?.length > 0 && !selectedSubField) ||
		(selectedSubField?.languages?.length > 0 && !selectedLanguage) ||
		(hasDirectLanguages && !selectedLanguage) ||
		(((selected?.sub_fields?.length > 0 && selectedSubField) ||
			isTechOrEngineering(selected?.category)) &&
			!experienceLevel) ||
		(selectedLanguage &&
			(hasDirectLanguages || selectedSubField?.languages?.length > 0) &&
			preferPaid === null);

	return (
		<>
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

							{/* Sub-field selection */}
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
																			<option
																				value="default"
																				className="bg-gray-900 text-gray-200"
																			>
																				Default
																				order
																			</option>
																			<option
																				value="easiest"
																				className="bg-gray-900 text-gray-200"
																			>
																				Easiest
																				first
																			</option>
																			<option
																				value="hardest"
																				className="bg-gray-900 text-gray-200"
																			>
																				Hardest
																				first
																			</option>
																			<option
																				value="popular"
																				className="bg-gray-900 text-gray-200"
																			>
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

							{/* Level picker */}
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

							{/* Direct Language Selection */}
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

							{/* Paid / Free Resources Toggle */}
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
												, select one to also generate a
												roadmap for it — or skip to
												continue:
											</p>
										</div>
										<div className="grid gap-2">
											{recommendedFields.map(
												(rf, idx) => (
													<button
														key={idx}
														onClick={() =>
															setSelectedRecommendedField(
																selectedRecommendedField?.field ===
																	rf.field
																	? null
																	: rf,
															)
														}
														className={`text-left rounded-lg px-4 py-3 border text-sm transition-all ${
															selectedRecommendedField?.field ===
															rf.field
																? "border-cyan-500 ring-1 ring-cyan-500 bg-cyan-500/20"
																: "border-cyan-500/20 bg-cyan-900/10 hover:border-cyan-400/40 hover:bg-cyan-900/20"
														}`}
													>
														<div
															className={`font-semibold ${selectedRecommendedField?.field === rf.field ? "text-cyan-200" : "text-cyan-300"}`}
														>
															{selectedRecommendedField?.field ===
															rf.field
																? "✅ "
																: ""}
															{rf.field}
														</div>
														<p className="text-xs text-gray-400 mt-1">
															{rf.description}
														</p>
													</button>
												),
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
								disabled={isDisabled}
								className="specialBtnGradient rounded-full px-8 py-3 text-white font-semibold shadow-lg shadow-purple-500/50 disabled:opacity-60 disabled:cursor-not-allowed hover:scale-105 transition-transform"
							>
								{loading
									? "Generating..."
									: followUpLoading
										? "Generating follow-up..."
										: isDisabled
											? "Please complete all selections"
											: "Generate Roadmap"}
							</button>
						</div>
					)}
				</div>
			)}
		</>
	);
}

export default SearchWithResult;
