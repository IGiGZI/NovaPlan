import { useState, useMemo } from "react";
import { Link } from "react-router";
import questionData from "../data/questionsTree.json";
import MainNav from "../components/MainNav";

const allCareers = questionData.careers;
const allQuestions = questionData.questions;
const subFieldLabels = questionData.sub_field_labels || {};
const MIN_QUESTIONS = questionData.min_questions || 4;
const MAX_QUESTIONS = questionData.max_questions || 8;
const RESULT_THRESHOLD = questionData.result_threshold || 5;

// Build a lookup map: question ID → question object
const questionMap = {};
allQuestions.forEach((q) => {
	questionMap[q.id] = q;
});

// The first question ID in the tree
const FIRST_QUESTION_ID = allQuestions.length > 0 ? allQuestions[0].id : null;

/**
 * Filter a career pool based on a question answer.
 * Returns the subset of careers that match the filter.
 */
function filterPool(pool, question, value) {
	const key = question.filter_key;
	const type = question.filter_type;

	if (type === "pick") {
		// Direct career selection by ID
		return pool.filter((c) => c.id === parseInt(value, 10));
	}

	return pool.filter((career) => {
		const tag = career.tags[key];
		if (type === "gender_filter") {
			// Female: exclude male_only careers. Male: keep all.
			if (value === "female") return tag !== "male_only";
			return true; // male or any other value keeps everything
		}
		if (type === "contains") {
			// Tag is an array, check if value is in it
			if (Array.isArray(tag)) return tag.includes(value);
			return tag === value;
		}
		if (type === "equals") {
			return tag === value;
		}
		return true;
	});
}

/**
 * Build dynamic options for a question based on the current pool.
 * Only shows options that would yield at least 1 career.
 */
function buildDynamicOptions(question, pool) {
	const key = question.filter_key;

	if (key === "career_pick") {
		// Show individual career labels from the pool (up to 8)
		return pool.slice(0, 8).map((c) => ({
			label: c.label,
			value: String(c.id),
		}));
	}

	if (key === "sub_field") {
		// Collect unique sub_fields from the pool with counts
		const sfCounts = {};
		pool.forEach((c) => {
			const sf = c.tags.sub_field;
			if (sf && sf !== "other") {
				sfCounts[sf] = (sfCounts[sf] || 0) + 1;
			}
		});

		// Build options sorted by count (most careers first)
		const entries = Object.entries(sfCounts)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 8); // Max 8 options

		if (entries.length <= 1) return null; // Skip if only 1 option

		return entries.map(([sf]) => ({
			label: subFieldLabels[sf] || sf.replace(/_/g, " "),
			value: sf,
		}));
	}

	// For field question or branch questions: only show options that exist in pool
	if (question.all_options && question.all_options.length > 0) {
		const available = new Set();
		pool.forEach((c) => {
			const tag = c.tags[key];
			if (Array.isArray(tag)) tag.forEach((t) => available.add(t));
			else if (tag) available.add(tag);
		});

		const filtered = question.all_options.filter((opt) =>
			available.has(opt.value)
		);
		if (filtered.length <= 1) return null; // Skip if only 1 option
		return filtered;
	}

	return question.options || null;
}

/**
 * Check if a static question would actually narrow down the pool.
 * Skip questions where all options lead to the same result.
 */
function questionWouldNarrow(question, pool) {
	const key = question.filter_key;
	const type = question.filter_type;

	if (type === "pick") return true;

	// Count how many distinct values exist in the pool for this tag
	const values = new Set();
	pool.forEach((c) => {
		const tag = c.tags[key];
		if (Array.isArray(tag)) tag.forEach((t) => values.add(t));
		else if (tag) values.add(tag);
	});

	return values.size > 1;
}

/**
 * Resolve the next question to show, given a question ID.
 * Skips questions that wouldn't narrow the pool or have no useful dynamic options.
 * Returns the resolved question object with options, or null if no more questions.
 */
function resolveQuestion(questionId, pool) {
	const visited = new Set();

	let qId = questionId;
	while (qId && !visited.has(qId)) {
		visited.add(qId);
		const q = questionMap[qId];
		if (!q) return null;

		// Check if this question has useful options for the current pool
		if (q.dynamic_options) {
			const opts = buildDynamicOptions(q, pool);
			if (opts && opts.length > 1) {
				return { ...q, options: opts };
			}
		} else {
			// Static question — check it would narrow
			if (questionWouldNarrow(q, pool)) {
				// Filter options to only those with matches in pool
				const filteredOpts = q.options.filter((opt) => {
					const remaining = filterPool(pool, q, opt.value);
					return remaining.length > 0;
				});
				if (filteredOpts.length > 1) {
					return { ...q, options: filteredOpts };
				}
			}
		}

		// This question is not useful — try default_next
		qId = q.default_next || null;
	}

	return null;
}

/**
 * Get the next question ID after answering a question with a specific value.
 * Uses the branching "next" map, then falls back to "default_next".
 */
function getNextQuestionId(question, answerValue) {
	// Check the branching "next" map first
	if (question.next && question.next[answerValue]) {
		return question.next[answerValue];
	}
	// Fall back to default_next
	if (question.default_next) {
		return question.default_next;
	}
	// Last resort: find the next question in array order
	const idx = allQuestions.findIndex((q) => q.id === question.id);
	if (idx >= 0 && idx + 1 < allQuestions.length) {
		return allQuestions[idx + 1].id;
	}
	return null;
}

function Fetching() {
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState(null);
	const [error, setError] = useState("");

	// Core state — now tracks question by ID instead of index
	const [pool, setPool] = useState(allCareers);
	const [currentQuestionId, setCurrentQuestionId] = useState(FIRST_QUESTION_ID);
	const [answeredCount, setAnsweredCount] = useState(0);
	const [selected, setSelected] = useState(null);
	const [history, setHistory] = useState([]); // { pool, currentQuestionId, answeredCount, selected }
	const [answers, setAnswers] = useState([]);
	const [reachedResult, setReachedResult] = useState(false);
	const [resultCareers, setResultCareers] = useState([]);
	const [selectedCareer, setSelectedCareer] = useState(null);
	const [userSummary, setUserSummary] = useState("");
	const [showSummaryInput, setShowSummaryInput] = useState(false);

	// NLP "Tell us about yourself" state
	const [showAboutMe, setShowAboutMe] = useState(false);
	const [aboutMeText, setAboutMeText] = useState("");
	const [nlpLoading, setNlpLoading] = useState(false);
	const [nlpSuggestions, setNlpSuggestions] = useState([]);
	const [nlpError, setNlpError] = useState("");

	const [summarySubmitting, setSummarySubmitting] = useState(false);

	// Resolve the current question (skipping useless ones)
	const currentQuestion = useMemo(() => {
		if (reachedResult || !currentQuestionId) return null;
		return resolveQuestion(currentQuestionId, pool);
	}, [currentQuestionId, pool, reachedResult]);

	// Check if we should show results
	const shouldShowResults = useMemo(() => {
		if (reachedResult) return true;

		// Check conditions: min questions answered AND pool small enough, OR max questions exceeded
		if (answeredCount >= MIN_QUESTIONS && pool.length <= RESULT_THRESHOLD) return true;
		if (answeredCount >= MAX_QUESTIONS) return true;
		// Only end when out of questions if we've met the minimum
		if (!currentQuestion && answeredCount >= MIN_QUESTIONS) return true;

		return false;
	}, [answeredCount, pool, currentQuestion, reachedResult]);

	// Auto-trigger results or summary
	if (shouldShowResults && !reachedResult) {
		// If pool is still large, show summary input first
		if (pool.length > RESULT_THRESHOLD && !showSummaryInput) {
			setShowSummaryInput(true);
		} else if (!showSummaryInput) {
			setReachedResult(true);
			setResultCareers(pool.slice(0, RESULT_THRESHOLD));
		}
	} else if (!currentQuestion && answeredCount < MIN_QUESTIONS && !showSummaryInput && !reachedResult) {
		// Ran out of questions before reaching minimum — show summary input as fallback
		setShowSummaryInput(true);
	}

	const handleSelect = (idx) => setSelected(idx);

	const handleNext = () => {
		if (selected === null || !currentQuestion) return;

		const option = currentQuestion.options[selected];
		const newPool = filterPool(pool, currentQuestion, option.value);

		// Save history for back navigation
		setHistory([
			...history,
			{ pool, currentQuestionId, answeredCount, selected, answers: [...answers] },
		]);

		const newAnswers = [
			...answers,
			{ questionId: currentQuestion.id, label: option.label },
		];
		setAnswers(newAnswers);
		setPool(newPool.length > 0 ? newPool : pool); // Don't empty the pool

		// Follow the branching tree to the next question
		const nextId = getNextQuestionId(currentQuestion, option.value);
		setCurrentQuestionId(nextId);
		setAnsweredCount(answeredCount + 1);
		setSelected(null);
	};

	const handleBack = () => {
		if (history.length === 0) return;

		const prev = history[history.length - 1];
		setHistory(history.slice(0, -1));
		setPool(prev.pool);
		setCurrentQuestionId(prev.currentQuestionId);
		setAnsweredCount(prev.answeredCount);
		setSelected(prev.selected);
		setAnswers(prev.answers);
		setReachedResult(false);
		setResultCareers([]);
		setSelectedCareer(null);
		setResult(null);
		setError("");
		setShowSummaryInput(false);
	};

	const handleSubmit = async () => {
		if (!selectedCareer) return;

		setError("");
		setLoading(true);
		setResult(null);

		try {
			const res = await fetch("http://localhost:8000/generate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					answers: answers.map((a) => ({
						questionId: a.questionId,
						label: a.label,
					})),
					careers: [selectedCareer.career],
					category: selectedCareer.category,
					user_summary: userSummary || "",
				}),
			});
			if (!res.ok) throw new Error("Failed to generate roadmaps");
			const data = await res.json();
			setResult(data);
			localStorage.setItem("roadmapResult", JSON.stringify(data));
		} catch (err) {
			setError(err.message || "Something went wrong");
		} finally {
			setLoading(false);
		}
	};

	const handleRestart = () => {
		setHistory([]);
		setAnswers([]);
		setPool(allCareers);
		setCurrentQuestionId(FIRST_QUESTION_ID);
		setAnsweredCount(0);
		setSelected(null);
		setReachedResult(false);
		setResultCareers([]);
		setSelectedCareer(null);
		setResult(null);
		setError("");
		setUserSummary("");
		setShowSummaryInput(false);
		setShowAboutMe(false);
		setAboutMeText("");
		setNlpSuggestions([]);
		setNlpError("");
	};

	const handleAboutMeSubmit = async () => {
		if (!aboutMeText.trim()) return;
		setNlpLoading(true);
		setNlpError("");
		setNlpSuggestions([]);
		try {
			const res = await fetch("http://localhost:8000/nlp_suggest", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ user_summary: aboutMeText }),
			});
			if (!res.ok) throw new Error("Failed to get suggestions");
			const data = await res.json();
			setNlpSuggestions(data.suggestions || []);
		} catch (err) {
			setNlpError(err.message || "Something went wrong");
		} finally {
			setNlpLoading(false);
		}
	};

	const handleSummaryContinue = async () => {
		if (!userSummary.trim()) {
			// If empty, just skip and show what we have
			setShowSummaryInput(false);
			setReachedResult(true);
			setResultCareers(pool.slice(0, RESULT_THRESHOLD));
			return;
		}

		setSummarySubmitting(true);
		try {
			const res = await fetch("http://localhost:8000/nlp_suggest", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ user_summary: userSummary }),
			});
			if (!res.ok) throw new Error("Failed to analyze summary");
			const data = await res.json();
			const suggestions = data.suggestions || [];

			// We want to intersect the returned NLP suggestions with our current 'pool'
			// so the user only gets careers that match both their answers AND their text.
			const poolNames = new Set(pool.map(c => c.career.toLowerCase()));
			const matchedCareers = pool.filter(pc =>
				suggestions.some(s => s.career.toLowerCase() === pc.career.toLowerCase())
			);

			// If intersection is empty or too small, fallback to NLP suggestions entirely 
			// mapped back to our dataset.
			let finalResults = matchedCareers;
			if (finalResults.length === 0) {
				const suggestedNames = new Set(suggestions.map(s => s.career.toLowerCase()));
				finalResults = allCareers.filter(c => suggestedNames.has(c.career.toLowerCase()));
			}

			setShowSummaryInput(false);
			setReachedResult(true);
			setResultCareers(finalResults.slice(0, RESULT_THRESHOLD));
		} catch (err) {
			console.error("NLP error:", err);
			// Fallback: just show the pool
			setShowSummaryInput(false);
			setReachedResult(true);
			setResultCareers(pool.slice(0, RESULT_THRESHOLD));
		} finally {
			setSummarySubmitting(false);
		}
	};

	const progressPercent = Math.min(
		((answeredCount) / MIN_QUESTIONS) * 100,
		100
	);

	return (
		<main className="min-h-screen">
			<MainNav />

			{/* Background effects */}
			<div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
				<div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
				<div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
			</div>

			<header className="max-w-3xl mx-auto mt-32 text-center px-4 mb-12">
				<h1 className="text-4xl md:text-5xl font-bold mb-4 bg-linear-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
					Launch Your Career
				</h1>
				<p className="text-center text-lg text-gray-300">
					Answer a few questions and we'll tailor a career roadmap just
					for you
				</p>
			</header>

			{!result && (
				<div className="max-w-2xl mx-auto px-4 pb-20">
					{/* Progress bar */}
					{answeredCount > 0 && (
						<div className="mb-6">
							<div className="flex items-center justify-between text-xs text-gray-500 mb-1">
								<span>
									Question {answeredCount}
									{!reachedResult &&
										` · ${pool.length} career${pool.length !== 1 ? "s" : ""} remaining`}
								</span>
								<button
									onClick={handleRestart}
									className="text-purple-400 hover:text-purple-300 transition-colors"
								>
									Restart
								</button>
							</div>
							<div className="w-full h-1 bg-purple-900/40 rounded-full">
								<div
									className="h-1 bg-linear-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
									style={{
										width: `${progressPercent}%`,
									}}
								/>
							</div>
						</div>
					)}

					{!reachedResult && currentQuestion ? (
						/* Question card */
						<div className="bg-linear-to-br from-purple-900/20 to-transparent backdrop-blur-sm p-6 md:p-8 rounded-xl shadow-lg border border-purple-500/30 space-y-6">
							<p className="text-xl font-semibold text-gray-100">
								{currentQuestion.question}
							</p>

							<div className="grid gap-3">
								{currentQuestion.options.map((opt, idx) => (
									<button
										key={idx}
										onClick={() => handleSelect(idx)}
										className={`w-full text-left rounded-lg px-4 py-3 border transition-all duration-150 text-gray-200 ${selected === idx
											? "border-purple-500 ring-2 ring-purple-500 bg-linear-to-r from-purple-600 to-pink-500 shadow-lg shadow-purple-500/50"
											: "border-purple-500/30 hover:border-purple-400"
											}`}
									>
										{opt.label}
									</button>
								))}
							</div>

							<div className="flex items-center gap-3">
								{history.length > 0 && (
									<button
										onClick={handleBack}
										className="rounded-full px-6 py-3 border border-purple-500/40 text-gray-300 hover:border-purple-400 hover:text-white transition-all"
									>
										← Back
									</button>
								)}
								<button
									onClick={handleNext}
									disabled={selected === null}
									className="specialBtnGradient rounded-full px-8 py-3 text-white font-semibold shadow-lg shadow-purple-500/50 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 transition-transform"
								>
									Next →
								</button>
							</div>
						</div>
					) : showSummaryInput && !reachedResult ? (
						/* NLP Summary input card */
						<div className="bg-linear-to-br from-purple-900/20 to-transparent backdrop-blur-sm p-6 md:p-8 rounded-xl shadow-lg border border-purple-500/30 space-y-6">
							<div>
								<p className="text-sm text-purple-400 font-medium mb-1 uppercase tracking-widest">
									Tell Us More About Yourself
								</p>
								<p className="text-gray-300 mb-4">
									We still have {pool.length} potential careers for you.
									To help us narrow it down, tell us about your
									interests, skills, hobbies, or what kind of career
									excites you.
								</p>
							</div>

							<textarea
								value={userSummary}
								onChange={(e) => setUserSummary(e.target.value)}
								placeholder="E.g. I love working with computers and solving problems. I'm interested in cybersecurity and enjoy learning about how hackers break into systems..."
								rows={5}
								className="w-full rounded-lg px-4 py-3 bg-purple-900/30 border border-purple-500/30 text-gray-200 placeholder-gray-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all resize-none"
							/>

							<div className="flex items-center gap-3">
								<button
									onClick={handleBack}
									className="rounded-full px-6 py-3 border border-purple-500/40 text-gray-300 hover:border-purple-400 hover:text-white transition-all"
								>
									← Back
								</button>
								<button
									onClick={handleSummaryContinue}
									disabled={summarySubmitting}
									className="specialBtnGradient rounded-full px-8 py-3 text-white font-semibold shadow-lg shadow-purple-500/50 hover:scale-105 transition-transform disabled:opacity-50"
								>
									{summarySubmitting
										? "Analyzing..."
										: userSummary.trim()
											? "Continue with Summary →"
											: "Skip & See Results →"}
								</button>
							</div>
						</div>
					) : reachedResult ? (
						/* Result discovery card */
						<div className="bg-linear-to-br from-purple-900/20 to-transparent backdrop-blur-sm p-6 md:p-8 rounded-xl shadow-lg border border-purple-500/30 space-y-6">
							<div>
								<p className="text-sm text-purple-400 font-medium mb-1 uppercase tracking-widest">
									{resultCareers.length === 1
										? "Career Match Found"
										: `Top ${resultCareers.length} Career Matches`}
								</p>
								<p className="text-gray-300 mb-4">
									Based on your answers, here are your best career matches.
									Select one to generate your personalized roadmap:
								</p>
							</div>

							<div className="grid gap-3">
								{resultCareers.map((career, idx) => (
									<button
										key={career.id}
										onClick={() => setSelectedCareer(career)}
										className={`w-full text-left rounded-lg px-4 py-3 border transition-all duration-150 ${selectedCareer?.id === career.id
											? "border-purple-500 ring-2 ring-purple-500 bg-linear-to-r from-purple-600 to-pink-500 shadow-lg shadow-purple-500/50"
											: "border-purple-500/30 hover:border-purple-400"
											}`}
									>
										<div className="font-semibold text-gray-100">
											{career.career
												.split(" ")
												.map(
													(w) =>
														w.charAt(0).toUpperCase() +
														w.slice(1)
												)
												.join(" ")}
										</div>
										<div className="text-sm text-gray-400 mt-1">
											{career.category} ·{" "}
											{career.education_min}
										</div>
									</button>
								))}
							</div>

							{error && (
								<p className="text-red-400 font-medium">
									{error}
								</p>
							)}

							<div className="flex flex-wrap items-center gap-3">
								<button
									onClick={handleBack}
									className="rounded-full px-6 py-3 border border-purple-500/40 text-gray-300 hover:border-purple-400 hover:text-white transition-all"
								>
									← Back
								</button>
								<button
									onClick={handleSubmit}
									disabled={loading || !selectedCareer}
									className="specialBtnGradient rounded-full px-8 py-3 text-white font-semibold shadow-lg shadow-purple-500/50 disabled:opacity-60 disabled:cursor-not-allowed hover:scale-105 transition-transform"
								>
									{loading
										? "Generating..."
										: "Generate Roadmap"}
								</button>
								<button
									onClick={handleRestart}
									className="rounded-full px-6 py-3 border border-purple-500/40 text-gray-300 hover:border-purple-400 hover:text-white transition-all"
								>
									Start Over
								</button>
							</div>

							{/* ── Tell Us About Yourself ── */}
							<div className="mt-6 pt-6 border-t border-purple-500/20">
								{!showAboutMe ? (
									<button
										onClick={() => setShowAboutMe(true)}
										className="w-full text-left rounded-lg px-4 py-3 border border-dashed border-purple-500/40 text-gray-400 hover:border-purple-400 hover:text-gray-200 transition-all"
									>
										✍️ <span className="font-medium">Tell Us About Yourself</span>
										<span className="block text-xs text-gray-500 mt-1">
											Describe your interests, hobbies, and skills — our AI will suggest a career for you
										</span>
									</button>
								) : (
									<div className="space-y-4">
										<div>
											<p className="text-sm text-purple-400 font-medium mb-1 uppercase tracking-widest">
												Tell Us About Yourself
											</p>
											<p className="text-gray-400 text-sm mb-3">
												Describe your interests, hobbies, personality, and what you enjoy doing.
												Our AI will find the best career match for you.
											</p>
										</div>
										<textarea
											value={aboutMeText}
											onChange={(e) => setAboutMeText(e.target.value)}
											placeholder="E.g. I love tinkering with computers, I'm good at math, I enjoy solving puzzles and I'm interested in how networks work..."
											rows={4}
											className="w-full rounded-lg px-4 py-3 bg-purple-900/30 border border-purple-500/30 text-gray-200 placeholder-gray-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all resize-none"
										/>
										<div className="flex items-center gap-3">
											<button
												onClick={() => {
													setShowAboutMe(false);
													setNlpSuggestions([]);
													setNlpError("");
												}}
												className="rounded-full px-5 py-2 border border-purple-500/40 text-gray-400 hover:text-white transition-all text-sm"
											>
												Cancel
											</button>
											<button
												onClick={handleAboutMeSubmit}
												disabled={nlpLoading || !aboutMeText.trim()}
												className="specialBtnGradient rounded-full px-6 py-2 text-white font-semibold shadow-lg shadow-purple-500/50 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 transition-transform text-sm"
											>
												{nlpLoading ? "Finding Careers..." : "Find My Career ✨"}
											</button>
										</div>

										{nlpError && (
											<p className="text-red-400 text-sm">{nlpError}</p>
										)}

										{nlpSuggestions.length > 0 && (
											<div className="space-y-2">
												<p className="text-sm text-purple-400 font-medium">
													🤖 AI-Suggested Careers Based On Your Description:
												</p>
												{nlpSuggestions.map((sug, idx) => (
													<button
														key={idx}
														onClick={() => setSelectedCareer({
															career: sug.career,
															category: sug.category,
															education_min: sug.education_min,
															id: `nlp_${idx}`,
														})}
														className={`w-full text-left rounded-lg px-4 py-3 border transition-all duration-150 ${selectedCareer?.id === `nlp_${idx}`
															? "border-pink-500 ring-2 ring-pink-500 bg-linear-to-r from-pink-600 to-purple-500 shadow-lg shadow-pink-500/50"
															: "border-pink-500/30 hover:border-pink-400"
															}`}
													>
														<div className="font-semibold text-gray-100">
															{sug.career.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
														</div>
														<div className="text-sm text-gray-400 mt-1">
															{sug.category} · {sug.education_min}
															<span className="ml-2 text-pink-400 text-xs">
																{Math.round(sug.score * 100)}% match
															</span>
														</div>
													</button>
												))}
											</div>
										)}
									</div>
								)}
							</div>
						</div>
					) : null}
				</div>
			)}

			{result && (
				<section className="max-w-5xl mx-auto px-4 pb-20">
					<div className="bg-linear-to-br from-purple-900/30 to-transparent backdrop-blur-sm border border-purple-500/30 rounded-2xl p-8 mb-8">
						<h2 className="text-3xl font-bold mb-2 bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
							Suggested Career: {result.chosen_career}
						</h2>
						<p className="text-gray-400 mb-8">
							Your personalized roadmaps are ready!
						</p>
						<div className="flex flex-wrap gap-4">
							<Link to={"/flowmap"}>
								<button className="specialBtnGradient rounded-full px-8 py-3 text-white font-semibold shadow-lg shadow-purple-500/50 hover:scale-105 transition-transform">
									View Visual Roadmap
								</button>
							</Link>
							<button
								onClick={handleRestart}
								className="rounded-full px-8 py-3 border border-purple-500/40 text-gray-300 hover:border-purple-400 hover:text-white transition-all"
							>
								Start Over
							</button>
						</div>
					</div>

					{/* Detailed Roadmap Breakdown with Milestones */}
					<div className="space-y-6">
						<h3 className="text-2xl font-bold text-purple-400 mb-6">
							Detailed Roadmap Breakdown
						</h3>
						{result.roadmaps?.map((r, i) => (
							<div
								key={i}
								className="bg-linear-to-br from-purple-900/20 to-transparent backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6 hover:border-purple-400 transition-all"
							>
								<h4 className="text-xl font-bold text-gray-100 mb-4">
									{r.path_title} — {r.focus}
									<span className="ml-2 text-sm text-purple-400">
										(Confidence:{" "}
										{Math.round(r.confidence_score * 100)}%)
									</span>
								</h4>

								<div className="ml-4 space-y-4">
									{r.steps.map((step, stepIndex) => (
										<div
											key={stepIndex}
											className="border-l-2 border-purple-500/50 pl-4 py-2"
										>
											{step.milestones?.length > 0 && (
												<div className="mb-3">
													{step.milestones.map(
														(milestone, mIndex) => (
															<div
																key={mIndex}
																className="mb-2"
															>
																<div className="font-bold text-base text-gray-200 mb-1">
																	{stepIndex +
																		1}
																	.{" "}
																	{typeof milestone ===
																		"string"
																		? milestone
																		: milestone?.title}
																</div>
																{typeof milestone !==
																	"string" &&
																	milestone?.description && (
																		<p className="text-sm text-gray-400 italic ml-4">
																			{
																				milestone.description
																			}
																		</p>
																	)}
															</div>
														)
													)}
												</div>
											)}

											{step.resources?.length > 0 && (
												<div className="ml-4 mb-3">
													<div className="font-semibold text-xs text-blue-400 mb-1">
														Resources:
													</div>
													<ul className="list-disc list-inside space-y-1">
														{step.resources.map(
															(
																resource,
																rIndex
															) => (
																<li
																	key={rIndex}
																	className="text-xs text-gray-300"
																>
																	{typeof resource ===
																		"string" ? (
																		resource
																	) : resource?.url ? (
																		<a
																			href={
																				resource.url
																			}
																			target="_blank"
																			rel="noopener noreferrer"
																			className="text-blue-400 hover:text-blue-300 hover:underline"
																		>
																			{resource.title ||
																				resource.url}
																		</a>
																	) : (
																		resource?.title ||
																		""
																	)}
																</li>
															)
														)}
													</ul>
												</div>
											)}

											{step.children?.length > 0 && (
												<div className="ml-4 mt-3 space-y-3">
													<div className="font-semibold text-sm text-purple-400 mb-2">
														Sub-steps:
													</div>
													{step.children.map(
														(child, childIndex) => (
															<div
																key={childIndex}
																className="border-l-2 border-purple-500/30 pl-4 py-2 bg-purple-900/10 rounded"
															>
																{child
																	.milestones
																	?.length >
																	0 && (
																		<div className="mb-2">
																			{child.milestones.map(
																				(
																					milestone,
																					mIndex
																				) => (
																					<div
																						key={
																							mIndex
																						}
																					>
																						<div className="font-semibold text-sm text-gray-200 mb-1">
																							{typeof milestone ===
																								"string"
																								? milestone
																								: milestone?.title}
																						</div>
																						{typeof milestone !==
																							"string" &&
																							milestone?.description && (
																								<p className="text-xs text-gray-400 italic ml-2">
																									{
																										milestone.description
																									}
																								</p>
																							)}
																					</div>
																				)
																			)}
																		</div>
																	)}
															</div>
														)
													)}
												</div>
											)}
										</div>
									))}
								</div>
							</div>
						))}
					</div>

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
		</main>
	);
}

export default Fetching;