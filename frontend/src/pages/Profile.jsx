import { useState, useEffect } from "react";
import MainNav from "../components/MainNav";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router";

function Avatar({ username }) {
	const initials = username ? username.slice(0, 2).toUpperCase() : "??";
	return (
		<div className="relative">
			<div className="w-24 h-24 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-purple-500/40 ring-4 ring-purple-500/30">
				{initials}
			</div>
			<span className="absolute bottom-1 right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-[#0e0b1a]"></span>
		</div>
	);
}

function StatCard({ label, value }) {
	return (
		<div className="flex flex-col items-center justify-center bg-purple-900/20 border border-purple-500/20 rounded-xl px-6 py-4">
			<span className="text-2xl font-bold bg-linear-to-br from-purple-400 to-pink-400 bg-clip-text text-transparent">
				{value}
			</span>
			<span className="text-xs text-gray-500 mt-1 uppercase tracking-widest">
				{label}
			</span>
		</div>
	);
}

function RoadmapCard({ roadmap, onClick, onDelete }) {
	const [deleting, setDeleting] = useState(false);

	const date = new Date(roadmap.createdAt).toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});

	const handleDelete = async (e) => {
		e.stopPropagation(); // prevent triggering onClick on the card
		setDeleting(true);
		try {
			const token = localStorage.getItem("token");
			const res = await fetch(
				`${import.meta.env.VITE_API_URL}/api/auth/roadmap/${roadmap._id}`,
				{
					method: "DELETE",
					headers: { Authorization: `Bearer ${token}` },
				},
			);
			if (!res.ok) throw new Error("Failed to delete.");
			onDelete(roadmap._id); // notify parent to remove it from the list
		} catch (err) {
			console.error(err.message);
			setDeleting(false);
		}
	};

	

	return (
		<div
			onClick={onClick}
			className="group relative flex flex-col justify-between rounded-xl border border-purple-500/30 bg-purple-900/20 hover:border-purple-400/60 hover:bg-purple-900/30 transition-all duration-300 p-5 cursor-pointer min-h-40"
		>
			<div>
				<span className="inline-block text-xs text-purple-400 bg-purple-900/40 border border-purple-500/20 rounded-full px-3 py-0.5 mb-3">
					Career Path
				</span>
				<h3 className="text-white font-semibold text-base leading-snug group-hover:text-purple-200 transition-colors">
					{roadmap.career || "Untitled Roadmap"}
				</h3>
			</div>

			<div className="mt-4 flex items-center justify-between">
				<span className="text-xs text-gray-500">{date}</span>
			</div>

			{/* Arrow icon — hidden when delete button is visible */}
			<div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
				<svg
					className="w-4 h-4 text-purple-400"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M9 5l7 7-7 7"
					/>
				</svg>
			</div>

			{/* Delete button */}
			<button
				onClick={handleDelete}
				disabled={deleting}
				className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-red-400 hover:text-red-300 bg-red-900/20 hover:bg-red-900/40 border border-red-500/20 rounded-full px-2.5 py-0.5 disabled:opacity-40"
			>
				{deleting ? "Deleting..." : "Delete"}
			</button>
		</div>
	);
}

function EmptyRoadmapCard() {
	return (
		<Link to="/fetch">
			<div className="group relative flex flex-col items-center justify-center rounded-xl border border-dashed border-purple-500/30 bg-purple-900/10 hover:border-purple-400/50 hover:bg-purple-900/20 transition-all duration-300 min-h-40 cursor-pointer">
				<div className="w-10 h-10 rounded-full bg-purple-900/40 border border-purple-500/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
					<svg
						className="w-5 h-5 text-purple-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={1.5}
							d="M12 4v16m8-8H4"
						/>
					</svg>
				</div>
				<p className="text-sm text-gray-500 group-hover:text-gray-400 transition-colors">
					Generate your first roadmap
				</p>
			</div>
		</Link>
	);
}




export default function Profile() {
	const { user, handleLogout, authLoading } = useAuth();
	const [activeTab, setActiveTab] = useState("roadmaps");
	const [roadmaps, setRoadmaps] = useState([]);
	const [roadmapsLoading, setRoadmapsLoading] = useState(true);
	const [roadmapsError, setRoadmapsError] = useState("");
	const [selectedRoadmap, setSelectedRoadmap] = useState(null);

	const navigate = useNavigate();

	const handleDelete = (deletedId) => {
		setRoadmaps((prev) => prev.filter((r) => r._id !== deletedId));
		setSelectedRoadmap((prev) => (prev?._id === deletedId ? null : prev));
	};

	const handleDeleteAccount = async () => {
    const confirmed = window.confirm("Are you sure you want to delete your account? This cannot be undone.");
    if (!confirmed) return;

    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/delete-account`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
				navigate('/')
        if (!res.ok) throw new Error("Failed to delete account.");
        handleLogoutSequence(); // clear token and redirect
    } catch (err) {
        console.error(err.message);
    }
};

	function handleLogoutSequence(){
		handleLogout()
		navigate('/')
	}

	useEffect(() => {
		const fetchRoadmaps = async () => {
			try {
				const token = localStorage.getItem("token");
				const res = await fetch(
					`${import.meta.env.VITE_API_URL}/api/auth/my-roadmaps`,
					{
						headers: { Authorization: `Bearer ${token}` },
					},
				);
				if (!res.ok) throw new Error("Failed to fetch roadmaps.");
				const data = await res.json();
				setRoadmaps(data.roadmaps || []);
			} catch (err) {
				setRoadmapsError(err.message);
			} finally {
				setRoadmapsLoading(false);
			}
		};

		if (user?.id) fetchRoadmaps();
	}, [user?.id]);

	// for old users and new users
	const getJoinDate = () => {
    if (user?.createdAt) {
        return new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" });
    }
    if (user?.id) {
        // Extract timestamp from MongoDB ObjectId
        const timestamp = parseInt(user.id.substring(0, 8), 16) * 1000;
        return new Date(timestamp).toLocaleDateString("en-US", { year: "numeric", month: "long" });
    }
    return "Unknown";
};

	const userDetails = {
    username: user?.username || "Anonymous",
    email: user?.email || "Not provided",
    joinDate: getJoinDate(),
};

	const tabs = [
		{ id: "roadmaps", label: "My Roadmaps", icon: "🗺️" },
		{ id: "settings", label: "Settings", icon: "⚙️" },
	];

	
	if (authLoading) return null;

	return (
		<main className="min-h-screen">
			<MainNav />

			<div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
				<div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
				<div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-800/5 rounded-full blur-3xl"></div>
			</div>

			<div className="max-w-4xl mx-auto px-4 pt-32 pb-20">
				{/* Profile Hero Card */}
				<div className="relative bg-linear-to-br from-purple-900/30 to-transparent backdrop-blur-sm border border-purple-500/30 rounded-2xl p-8 mb-8 overflow-hidden">
					<div className="absolute top-0 left-0 w-full h-px bg-linear-to-br from-transparent via-purple-500/60 to-transparent"></div>

					<div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
						<Avatar username={userDetails.username} />

						<div className="flex-1 text-center sm:text-left">
							<h1 className="text-3xl font-bold text-white mb-1">
								{userDetails.username}
							</h1>
							<p className="text-gray-400 text-sm mb-4">
								Member since {userDetails.joinDate}
							</p>
							<div className="flex flex-wrap justify-center sm:justify-start gap-3">
								<span className="inline-flex items-center gap-2 bg-purple-900/40 border border-purple-500/30 rounded-full px-4 py-1.5 text-sm text-gray-300">
									<svg
										className="w-4 h-4 text-purple-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
										/>
									</svg>
									{userDetails.email}
								</span>
							</div>
						</div>

						<button
							onClick={handleLogout}
							className="self-start sm:self-auto flex items-center gap-2 rounded-full px-5 py-2.5 border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-400 transition-all text-sm font-medium"
						>
							<svg
								className="w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
								/>
							</svg>
							<Link to="/">Logout</Link>
						</button>
					</div>

					<div className="mt-8 pt-8 border-t border-purple-500/20">
						<StatCard
							label="Roadmaps"
							value={roadmapsLoading ? "..." : roadmaps.length}
						/>
					</div>
				</div>

				{/* Tabs */}
				<div className="flex gap-1 bg-purple-900/20 border border-purple-500/20 rounded-xl p-1 mb-6">
					{tabs.map((tab) => (
						<button
							key={tab.id}
							onClick={() => setActiveTab(tab.id)}
							className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
								activeTab === tab.id
									? "bg-linear-to-br from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/30"
									: "text-gray-400 hover:text-gray-200"
							}`}
						>
							<span>{tab.icon}</span>
							{tab.label}
						</button>
					))}
				</div>

				{/* Roadmaps Tab */}
				{activeTab === "roadmaps" && (
					<div className="bg-linear-to-br from-purple-900/20 to-transparent backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6">
						<div className="flex items-center justify-between mb-6">
							<div>
								<h2 className="text-xl font-bold text-white">
									My Roadmaps
								</h2>
								<p className="text-gray-500 text-sm mt-0.5">
									Your generated career roadmaps will appear
									here
								</p>
							</div>
							<Link
								to="/search"
								className="specialBtnGradient rounded-full px-5 py-2 text-white text-sm font-semibold shadow-lg shadow-purple-500/30 hover:scale-105 transition-transform"
							>
								+ Add a new roadmap
							</Link>
						</div>

						{/* Loading */}
						{roadmapsLoading && (
							<div className="flex justify-center py-12">
								<div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"></div>
							</div>
						)}

						{/* Error */}
						{!roadmapsLoading && roadmapsError && (
							<p className="text-center text-red-400 text-sm py-8">
								{roadmapsError}
							</p>
						)}

						{/* Has roadmaps */}
						{!roadmapsLoading &&
							!roadmapsError &&
							roadmaps.length > 0 && (
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									{roadmaps.map((roadmap) => (
										<RoadmapCard
											key={roadmap._id}
											roadmap={roadmap}
											onClick={() =>
												setSelectedRoadmap((prev) =>
													prev?._id === roadmap._id
														? null
														: roadmap,
												)
											}
											onDelete={handleDelete}
										/>
									))}
								</div>
							)}

						{/* Empty state */}
						{!roadmapsLoading &&
							!roadmapsError &&
							roadmaps.length === 0 && (
								<>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<EmptyRoadmapCard />
										<div className="flex flex-col items-center justify-center rounded-xl border border-purple-500/10 bg-purple-900/5 min-h-40">
											<p className="text-xs text-gray-600 text-center px-6">
												Complete the career quiz to
												generate your first personalized
												roadmap
											</p>
										</div>
									</div>
									<div className="mt-8 flex flex-col items-center justify-center py-6 text-center">
										<div className="w-16 h-16 rounded-full bg-purple-900/30 border border-purple-500/20 flex items-center justify-center mb-4">
											<svg
												className="w-8 h-8 text-purple-500/50"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={1.5}
													d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
												/>
											</svg>
										</div>
										<p className="text-gray-500 text-sm max-w-xs">
											No roadmaps yet. Take the career
											quiz and we'll build a personalized
											roadmap just for you.
										</p>
										<Link
											to="/fetch"
											className="mt-4 text-purple-400 hover:text-purple-300 text-sm font-medium underline underline-offset-4 transition-colors"
										>
											Start the career quiz →
										</Link>
									</div>
								</>
							)}
					</div>
				)}

				{/* Expanded Roadmap View */}
				{selectedRoadmap && activeTab === "roadmaps" && (
					<div className="mt-6 bg-linear-to-br from-purple-900/20 to-transparent backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6">
						<div className="flex items-center justify-between mb-8">
							<h3 className="text-2xl font-bold text-purple-400">
								{selectedRoadmap.career}
							</h3>
							<button
								onClick={() => setSelectedRoadmap(null)}
								className="text-xs text-gray-500 hover:text-gray-300 border border-purple-500/20 rounded-full px-3 py-1 transition-colors"
							>
								✕ Close
							</button>
						</div>

						<div className="space-y-10">
							{selectedRoadmap.rawData?.roadmaps?.map(
								(roadmap, rIdx) => (
									<div
										key={rIdx}
										className="bg-black/20 border border-purple-500/20 rounded-xl p-6"
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
													roadmap.confidence_score *
														100,
												)}
												% confidence
											</span>
										</div>

										<div className="relative">
											<div className="absolute left-4 top-0 bottom-0 w-px bg-purple-500/20"></div>
											<div className="space-y-8">
												{roadmap.steps.map(
													(step, sIdx) => {
														const milestone =
															step
																.milestones?.[0];
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
																	{step
																		.resources
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
													},
												)}
											</div>
										</div>
									</div>
								),
							)}
						</div>
					</div>
				)}

				{/* Settings Tab */}

				{/* Settings Tab */}
				{activeTab === "settings" && (
					<div className="bg-linear-to-br from-purple-900/20 to-transparent backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6">
						<h2 className="text-xl font-bold text-white mb-2">
							Account Settings
						</h2>
						<p className="text-gray-500 text-sm mb-8">
							Manage your account preferences
						</p>

						<div className="space-y-4">
							<div>
								<label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">
									Username
								</label>
								<div className="flex items-center gap-3 bg-purple-900/30 border border-purple-500/20 rounded-lg px-4 py-3">
									<span className="text-gray-300 flex-1">
										{userDetails.username}
									</span>
								</div>
							</div>

							<div>
								<label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">
									Email
								</label>
								<div className="flex items-center gap-3 bg-purple-900/30 border border-purple-500/20 rounded-lg px-4 py-3">
									<span className="text-gray-300 flex-1">
										{userDetails.email}
									</span>
									<span className="text-xs text-gray-600 bg-purple-900/40 px-2 py-1 rounded">
										Coming soon
									</span>
								</div>
							</div>

							<div>
								<label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">
									Password
								</label>
								<div className="flex items-center gap-3 bg-purple-900/30 border border-purple-500/20 rounded-lg px-4 py-3">
									<span className="text-gray-400 flex-1 tracking-widest">
										••••••••
									</span>
									<span className="text-xs text-gray-600 bg-purple-900/40 px-2 py-1 rounded">
										Coming soon
									</span>
								</div>
							</div>

							<div className="mt-8 pt-6 border-t border-red-500/10">
								<p className="text-xs text-red-400/60 uppercase tracking-widest mb-3">
									Danger Zone
								</p>
								<button
									className="rounded-lg px-5 py-2.5 border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-400 transition-all text-sm cursor-pointer"
									onClick={handleDeleteAccount}
								>
									Delete Account
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</main>
	);
}
