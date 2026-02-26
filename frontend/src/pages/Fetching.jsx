import { useState } from "react";
import { Link } from "react-router";
import questionTree from "../data/questionsTree.json";
import MainNav from "../components/MainNav";

const questions = questionTree.questions;

function Fetching() {
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState(null);
	const [error, setError] = useState("");

	// History of { questionId, selectedOptionIndex } for back navigation
	const [history, setHistory] = useState([]);
	// Accumulated answers: array of { questionId, label, next }
	const [answers, setAnswers] = useState([]);
	// Current question ID
	const [currentId, setCurrentId] = useState(questionTree.start);
	// Selected option index (before confirming)
	const [selected, setSelected] = useState(null);
	// Whether we've reached a result node
	const [reachedResult, setReachedResult] = useState(false);
	const [resultNode, setResultNode] = useState(null);

	const currentQuestion = questions[currentId];

	const handleSelect = (idx) => {
		setSelected(idx);
	};

	const handleNext = () => {
		if (selected === null) return;

		const option = currentQuestion.options[selected];
		const nextId = option.next;
		const nextNode = questions[nextId];

		const newAnswers = [
			...answers,
			{ questionId: currentId, label: option.label, next: nextId },
		];
		setAnswers(newAnswers);
		setHistory([...history, { questionId: currentId, selectedOptionIndex: selected }]);
		setSelected(null);

		if (!nextNode || nextNode.type === "result") {
			setReachedResult(true);
			setResultNode(nextNode || null);
		} else {
			setCurrentId(nextId);
		}
	};

	const handleBack = () => {
		if (history.length === 0) return;

		const prevHistory = [...history];
		const last = prevHistory.pop();

		setHistory(prevHistory);
		setAnswers(answers.slice(0, -1));
		setCurrentId(last.questionId);
		setSelected(last.selectedOptionIndex);
		setReachedResult(false);
		setResultNode(null);
		setResult(null);
		setError("");
	};

	const handleSubmit = async () => {
		setError("");
		setLoading(true);
		setResult(null);

		const formattedAnswers = answers.map((a) => ({
			questionId: a.questionId,
			label: a.label,
		}));

		try {
			const res = await fetch("http://localhost:8000/generate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					answers: formattedAnswers,
					careers: resultNode?.careers ?? [],
					category: resultNode?.category ?? "",
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
		setCurrentId(questionTree.start);
		setSelected(null);
		setReachedResult(false);
		setResultNode(null);
		setResult(null);
		setError("");
	};

	const progressSteps = history.length + (reachedResult ? 1 : 0);

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
					Answer a few questions and we'll tailor a career roadmap just for you
				</p>
			</header>

			{!result && (
				<div className="max-w-2xl mx-auto px-4 pb-20">
					{/* Progress bar */}
					{progressSteps > 0 && (
						<div className="mb-6">
							<div className="flex items-center justify-between text-xs text-gray-500 mb-1">
								<span>Question {progressSteps}</span>
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
									style={{ width: `${Math.min(progressSteps * 8, 100)}%` }}
								/>
							</div>
						</div>
					)}

					{!reachedResult ? (
						/* Question card */
						<div className="bg-linear-to-br from-purple-900/20 to-transparent backdrop-blur-sm p-6 md:p-8 rounded-xl shadow-lg border border-purple-500/30 space-y-6">
							<p className="text-xl font-semibold text-gray-100">
								{currentQuestion?.question}
							</p>

							<div className="grid gap-3">
								{currentQuestion?.options.map((opt, idx) => (
									<button
										key={idx}
										onClick={() => handleSelect(idx)}
										className={`w-full text-left rounded-lg px-4 py-3 border transition-all duration-150 text-gray-200 ${
											selected === idx
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
					) : (
						/* Result discovery card */
						<div className="bg-linear-to-br from-purple-900/20 to-transparent backdrop-blur-sm p-6 md:p-8 rounded-xl shadow-lg border border-purple-500/30 space-y-6">
							<div>
								<p className="text-sm text-purple-400 font-medium mb-1 uppercase tracking-widest">
									Career Match Found
								</p>
								<h2 className="text-2xl font-bold text-gray-100 mb-2">
									{resultNode?.careers?.join(", ") ?? "Your career path"}
								</h2>
								{resultNode?.category && (
									<p className="text-sm text-gray-400">
										Category: {resultNode.category}
									</p>
								)}
								{resultNode?.education_min && (
									<p className="text-sm text-gray-400">
										Minimum education: {resultNode.education_min}
									</p>
								)}
							</div>

							<p className="text-gray-300">
								Ready to generate your personalized roadmap for this career?
							</p>

							{error && <p className="text-red-400 font-medium">{error}</p>}

							<div className="flex flex-wrap items-center gap-3">
								<button
									onClick={handleBack}
									className="rounded-full px-6 py-3 border border-purple-500/40 text-gray-300 hover:border-purple-400 hover:text-white transition-all"
								>
									← Back
								</button>
								<button
									onClick={handleSubmit}
									disabled={loading}
									className="specialBtnGradient rounded-full px-8 py-3 text-white font-semibold shadow-lg shadow-purple-500/50 disabled:opacity-60 disabled:cursor-not-allowed hover:scale-105 transition-transform"
								>
									{loading ? "Generating..." : "Generate Roadmap"}
								</button>
								<button
									onClick={handleRestart}
									className="rounded-full px-6 py-3 border border-purple-500/40 text-gray-300 hover:border-purple-400 hover:text-white transition-all"
								>
									Start Over
								</button>
							</div>
						</div>
					)}
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
										(Confidence: {Math.round(r.confidence_score * 100)}%)
									</span>
								</h4>

								<div className="ml-4 space-y-4">
									{r.steps.map((step, stepIndex) => (
										<div
											key={stepIndex}
											className="border-l-2 border-purple-500/50 pl-4 py-2"
										>
											<div className="font-bold text-base text-gray-200 mb-2">
												{stepIndex + 1}. {step.title}
											</div>
											<div className="text-sm text-gray-400 mb-2 italic">
												{step.objective}
											</div>
											<div className="text-xs text-gray-500 mb-3">
												Duration: {step.duration_months} month
												{step.duration_months !== 1 ? "s" : ""}
											</div>

											{step.milestones?.length > 0 && (
												<div className="ml-4 mb-3">
													<div className="font-semibold text-xs text-green-400 mb-1">
														Milestones:
													</div>
													<ul className="list-disc list-inside space-y-1">
														{step.milestones.map((milestone, mIndex) => (
															<li key={mIndex} className="text-xs text-gray-300">
																{milestone}
															</li>
														))}
													</ul>
												</div>
											)}

											{step.prerequisites?.length > 0 && (
												<div className="ml-4 mb-3">
													<div className="font-semibold text-xs text-red-400 mb-1">
														Prerequisites:
													</div>
													<div className="text-xs text-gray-400">
														{step.prerequisites.join(", ")}
													</div>
												</div>
											)}

											{step.tasks?.length > 0 && (
												<div className="ml-4 mb-3">
													<div className="font-semibold text-xs text-purple-400 mb-1">
														Specific Tasks:
													</div>
													<ol className="list-decimal list-inside space-y-1">
														{step.tasks.map((task, tIndex) => (
															<li key={tIndex} className="text-xs text-gray-300">
																{task}
															</li>
														))}
													</ol>
												</div>
											)}

											{step.children?.length > 0 && (
												<div className="ml-4 mt-3 space-y-3">
													<div className="font-semibold text-sm text-purple-400 mb-2">
														Sub-steps:
													</div>
													{step.children.map((child, childIndex) => (
														<div
															key={childIndex}
															className="border-l-2 border-purple-500/30 pl-4 py-2 bg-purple-900/10 rounded"
														>
															<div className="font-semibold text-sm text-gray-200 mb-1">
																{child.title}
															</div>
															<div className="text-xs text-gray-400 mb-1">
																{child.objective}
															</div>
															<div className="text-xs text-gray-500 mb-2">
																Duration: {child.duration_months} month
																{child.duration_months !== 1 ? "s" : ""}
															</div>

															{child.milestones?.length > 0 && (
																<div className="ml-2 mb-2">
																	<div className="font-semibold text-xs text-green-400 mb-1">
																		Milestones:
																	</div>
																	<ul className="list-disc list-inside space-y-1">
																		{child.milestones.map((milestone, mIndex) => (
																			<li key={mIndex} className="text-xs text-gray-300">
																				{milestone}
																			</li>
																		))}
																	</ul>
																</div>
															)}

															{child.tasks?.length > 0 && (
																<div className="ml-2">
																	<div className="font-semibold text-xs text-purple-400 mb-1">
																		Tasks:
																	</div>
																	<ol className="list-decimal list-inside space-y-1">
																		{child.tasks.map((task, tIndex) => (
																			<li key={tIndex} className="text-xs text-gray-300">
																				{task}
																			</li>
																		))}
																	</ol>
																</div>
															)}
														</div>
													))}
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