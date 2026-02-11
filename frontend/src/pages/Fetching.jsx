import { useState } from "react";
import { Link } from "react-router";
import questions from "../data/questions.json";
import MainNav from "../components/MainNav";

function Fetching() {
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState(null);
	const [error, setError] = useState("");
	const [answers, setAnswers] = useState({});
	const [summary, setSummary] = useState("");

	const handleRadioChange = (questionId, value) => {
		setAnswers((prev) => ({
			...prev,
			[questionId]: value,
		}));
	};

	const handleSubmit = async () => {
		setError("");

		// Validate that all questions are answered
		const allAnswered = questions.every((q) => answers[q.id]);
		if (!allAnswered) {
			setError("Please answer all questions");
			return;
		}

		setLoading(true);
		setResult(null);

		const formattedAnswers = questions.map((q) => ({
			questionId: q.id,
			type: answers[q.id],
		}));

		try {
			const res = await fetch("http://localhost:8000/generate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ answers: formattedAnswers, summary }),
			});
			if (!res.ok) throw new Error("Failed to generate roadmaps");
			const data = await res.json();
			setResult(data);
		} catch (err) {
			setError(err.message || "Something went wrong");
		} finally {
			setLoading(false);
		}
	};

	console.log(result);

	return (
		<main className="min-h-screen">
			{/* Navbar */}
			<MainNav/>

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
					Answer the following questions to help us tailor a career
					roadmap just for you
				</p>
			</header>

			<div className="max-w-3xl mx-auto my-10 bg-linear-to-br from-purple-900/20 to-transparent backdrop-blur-sm p-6 md:p-8 rounded-xl shadow-lg border border-purple-500/30 space-y-6">
				{questions.map((question) => (
					<fieldset className="group" key={question.id}>
						<legend className="mb-4 text-lg font-semibold text-gray-100">
							{question.question}
						</legend>
						<div className="grid gap-3">
							{question.options.map((opt, idx) => (
								<div key={idx} className="flex items-center">
									<input
										type="radio"
										name={`question-${question.id}`}
										id={`${question.id}-${idx}`}
										value={opt.type}
										checked={
											answers[question.id] === opt.type
										}
										onChange={() =>
											handleRadioChange(
												question.id,
												opt.type,
											)
										}
										className="peer sr-only"
									/>
									<label
										htmlFor={`${question.id}-${idx}`}
										className="flex-1 cursor-pointer rounded-lg px-4 py-3 border border-purple-500/30 hover:border-purple-400 transition-all duration-150 text-gray-200 peer-checked:ring-2 peer-checked:ring-purple-500 peer-checked:bg-linear-to-r peer-checked:from-purple-600 peer-checked:to-pink-500 peer-checked:shadow-lg peer-checked:shadow-purple-500/50"
									>
										<div className="font-medium">
											{opt.text}
										</div>
									</label>
								</div>
							))}
						</div>
					</fieldset>
				))}

				<div>
					<label className="block text-lg font-semibold mb-2 text-gray-100">
						Write a brief summary about yourself
					</label>
					<textarea
						value={summary}
						onChange={(e) => setSummary(e.target.value)}
						placeholder="Talk about yourself, your interests, skills, and career aspirations..."
						className="w-full rounded-lg border border-purple-500/30 bg-black/20 backdrop-blur-sm p-3 placeholder-gray-500 text-gray-200 h-32 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
					/>
				</div>

				<div className="flex items-center justify-between gap-4">
					<button
						onClick={handleSubmit}
						disabled={loading}
						className="specialBtnGradient rounded-full px-8 py-3 text-white font-semibold shadow-lg shadow-purple-500/50 disabled:opacity-60 disabled:cursor-not-allowed hover:scale-105 transition-transform"
					>
						{loading ? "Generating..." : "Generate Roadmap"}
					</button>
					{error && (
						<p className="text-red-400 font-medium">{error}</p>
					)}
				</div>
			</div>

			{result && (
				<section className="max-w-5xl mx-auto px-4 pb-20">
					<div className="bg-linear-to-br from-purple-900/30 to-transparent backdrop-blur-sm border border-purple-500/30 rounded-2xl p-8 mb-8">
						<h2 className="text-3xl font-bold mb-2 bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
							Suggested Career: {result.chosen_career}
						</h2>
						<p className="text-gray-400 mb-8">
							Your personalized roadmaps are ready!
						</p>
						<Link to={"/FlowT2"}>
							<button className="specialBtnGradient rounded-full px-8 py-3 text-white font-semibold shadow-lg shadow-purple-500/50 disabled:opacity-60 disabled:cursor-not-allowed hover:scale-105 transition-transform">
								View Visual Roadmap
							</button>
						</Link>
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

								{/* Render hierarchical steps with milestones */}
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
												Duration: {step.duration_months}{" "}
												month
												{step.duration_months !== 1
													? "s"
													: ""}
											</div>

											{/* Milestones */}
											{step.milestones &&
												step.milestones.length > 0 && (
													<div className="ml-4 mb-3">
														<div className="font-semibold text-xs text-green-400 mb-1">
															Milestones:
														</div>
														<ul className="list-disc list-inside space-y-1">
															{step.milestones.map(
																(
																	milestone,
																	mIndex,
																) => (
																	<li
																		key={
																			mIndex
																		}
																		className="text-xs text-gray-300"
																	>
																		{
																			milestone
																		}
																	</li>
																),
															)}
														</ul>
													</div>
												)}

											{/* Prerequisites */}
											{step.prerequisites &&
												step.prerequisites.length >
													0 && (
													<div className="ml-4 mb-3">
														<div className="font-semibold text-xs text-red-400 mb-1">
															Prerequisites:
														</div>
														<div className="text-xs text-gray-400">
															{step.prerequisites.join(
																", ",
															)}
														</div>
													</div>
												)}

											{/* Tasks */}
											{step.tasks &&
												step.tasks.length > 0 && (
													<div className="ml-4 mb-3">
														<div className="font-semibold text-xs text-purple-400 mb-1">
															Specific Tasks:
														</div>
														<ol className="list-decimal list-inside space-y-1">
															{step.tasks.map(
																(
																	task,
																	tIndex,
																) => (
																	<li
																		key={
																			tIndex
																		}
																		className="text-xs text-gray-300"
																	>
																		{task}
																	</li>
																),
															)}
														</ol>
													</div>
												)}

											{/* Child Steps (Branching) */}
											{step.children &&
												step.children.length > 0 && (
													<div className="ml-4 mt-3 space-y-3">
														<div className="font-semibold text-sm text-purple-400 mb-2">
															Sub-steps:
														</div>
														{step.children.map(
															(
																child,
																childIndex,
															) => (
																<div
																	key={
																		childIndex
																	}
																	className="border-l-2 border-purple-500/30 pl-4 py-2 bg-purple-900/10 rounded"
																>
																	<div className="font-semibold text-sm text-gray-200 mb-1">
																		{
																			child.title
																		}
																	</div>
																	<div className="text-xs text-gray-400 mb-1">
																		{
																			child.objective
																		}
																	</div>
																	<div className="text-xs text-gray-500 mb-2">
																		Duration:{" "}
																		{
																			child.duration_months
																		}{" "}
																		month
																		{child.duration_months !==
																		1
																			? "s"
																			: ""}
																	</div>

																	{child.milestones &&
																		child
																			.milestones
																			.length >
																			0 && (
																			<div className="ml-2 mb-2">
																				<div className="font-semibold text-xs text-green-400 mb-1">
																					Milestones:
																				</div>
																				<ul className="list-disc list-inside space-y-1">
																					{child.milestones.map(
																						(
																							milestone,
																							mIndex,
																						) => (
																							<li
																								key={
																									mIndex
																								}
																								className="text-xs text-gray-300"
																							>
																								{
																									milestone
																								}
																							</li>
																						),
																					)}
																				</ul>
																			</div>
																		)}

																	{child.tasks &&
																		child
																			.tasks
																			.length >
																			0 && (
																			<div className="ml-2">
																				<div className="font-semibold text-xs text-purple-400 mb-1">
																					Tasks:
																				</div>
																				<ol className="list-decimal list-inside space-y-1">
																					{child.tasks.map(
																						(
																							task,
																							tIndex,
																						) => (
																							<li
																								key={
																									tIndex
																								}
																								className="text-xs text-gray-300"
																							>
																								{
																									task
																								}
																							</li>
																						),
																					)}
																				</ol>
																			</div>
																		)}
																</div>
															),
														)}
													</div>
												)}
										</div>
									))}
								</div>
							</div>
						))}
					</div>

					{/* Download link for JSON */}
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
