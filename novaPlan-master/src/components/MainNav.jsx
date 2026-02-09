import { Link } from "react-router";
import { useState } from "react";

function MainNav() {
	const [user, setUser] = useState(null); // null when logged out, { username: "..." } when logged in
	const [showAuthModal, setShowAuthModal] = useState(false);
	const [authMode, setAuthMode] = useState("login"); // "login" or "signup"
	const [formData, setFormData] = useState({ username: "", email: "", password: "" });
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	// Open modal
	const openAuthModal = (mode) => {
		setAuthMode(mode);
		setShowAuthModal(true);
		setError("");
		setFormData({ username: "", email: "", password: "" });
	};

	// Close modal
	const closeAuthModal = () => {
		setShowAuthModal(false);
		setError("");
		setFormData({ username: "", email: "", password: "" });
	};

	// Handle input change
	const handleInputChange = (e) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value
		});
	};

	// Handle login
	const handleLogin = async () => {
		setLoading(true);
		setError("");
		
		try {
			const response = await fetch("http://localhost:8000/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email: formData.email,
					password: formData.password
				})
			});

			const data = await response.json();

			if (response.ok) {
				// Store user data (you might want to store token in localStorage too)
				setUser({ username: data.username });
				localStorage.setItem("user", JSON.stringify({ username: data.username }));
				closeAuthModal();
			} else {
				setError(data.message || "Login failed");
			}
		} catch (err) {
			setError("Something went wrong. Please try again.");
      console.log("Error during login:", err)
		} finally {
			setLoading(false);
		}
	};

	// Handle signup
	const handleSignup = async () => {
		setLoading(true);
		setError("");
		
		try {
			const response = await fetch("http://localhost:8000/api/auth/signup", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					username: formData.username,
					email: formData.email,
					password: formData.password
				})
			});

			const data = await response.json();

			if (response.ok) {
				// After successful signup, log them in
				setUser({ username: data.username });
				localStorage.setItem("user", JSON.stringify({ username: data.username }));
				closeAuthModal();
			} else {
				setError(data.message || "Signup failed");
			}
		} catch (err) {
			setError("Something went wrong. Please try again.");
      console.log("Error during signup:", err)
		} finally {
			setLoading(false);
		}
	};

	// Handle logout
	const handleLogout = () => {
		setUser(null);
		localStorage.removeItem("user");
	};

	// Handle form submit
	const handleSubmit = (e) => {
		e.preventDefault();
		if (authMode === "login") {
			handleLogin();
		} else {
			handleSignup();
		}
	};

	// Check for stored user on component mount
	useState(() => {
		const storedUser = localStorage.getItem("user");
		if (storedUser) {
			setUser(JSON.parse(storedUser));
		}
	}, []);

	return (
		<>
			<nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-purple-500/30">
				<div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
					<Link to="/" className="flex items-center gap-2">
						<img
							src="/logoFinal.png"
							alt="NovaPlan"
							className="h-10 w-10 object-contain"
						/>
						<span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
							NovaPlan
						</span>
					</Link>

					<div className="hidden md:flex items-center gap-8">
						<a
							href="#about"
							className="text-gray-300 hover:text-purple-400 transition-colors"
						>
							About
						</a>
						<a
							href="#features"
							className="text-gray-300 hover:text-purple-400 transition-colors"
						>
							Features
						</a>
						<a
							href="#faq"
							className="text-gray-300 hover:text-purple-400 transition-colors"
						>
							FAQ
						</a>
						
						{/* Show different buttons based on auth state */}
						{user ? (
							<>
								<span className="text-purple-400 font-semibold">
									{user.username}
								</span>
								<button 
									onClick={handleLogout}
									className="specialBtnGradient rounded-full px-5 py-2 text-sm font-medium hover:scale-105 transition-transform"
								>
									Logout
								</button>
							</>
						) : (
							<>
								<button 
									onClick={() => openAuthModal("login")}
									className="text-gray-300 hover:text-purple-400 transition-colors font-medium"
								>
									Login
								</button>
								<button 
									onClick={() => openAuthModal("signup")}
									className="specialBtnGradient rounded-full px-5 py-2 text-sm font-medium hover:scale-105 transition-transform"
								>
									Sign Up
								</button>
							</>
						)}
					</div>

					{/* Mobile menu button */}
					<button className="md:hidden text-purple-400">
						<svg
							className="w-6 h-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M4 6h16M4 12h16M4 18h16"
							/>
						</svg>
					</button>
				</div>
			</nav>

			{/* Auth Modal */}
			{showAuthModal && (
				<div 
					className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60]"
					onClick={closeAuthModal}
				>
					<div 
						className="bg-gradient-to-br from-purple-900/90 to-black/90 backdrop-blur-md border border-purple-500/50 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl shadow-purple-500/20"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex justify-between items-center mb-6">
							<h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
								{authMode === "login" ? "Welcome Back" : "Create Account"}
							</h2>
							<button 
								onClick={closeAuthModal}
								className="text-gray-400 hover:text-purple-400 text-3xl transition-colors"
							>
								×
							</button>
						</div>

						<div className="space-y-4">
							{authMode === "signup" && (
								<div>
									<label className="block text-sm font-medium text-gray-300 mb-2">
										Username
									</label>
									<input
										type="text"
										name="username"
										value={formData.username}
										onChange={handleInputChange}
										className="w-full px-4 py-3 rounded-lg bg-black/40 border border-purple-500/30 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
										placeholder="Enter your username"
										required
									/>
								</div>
							)}

							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Email
								</label>
								<input
									type="email"
									name="email"
									value={formData.email}
									onChange={handleInputChange}
									className="w-full px-4 py-3 rounded-lg bg-black/40 border border-purple-500/30 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
									placeholder="Enter your email"
									required
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Password
								</label>
								<input
									type="password"
									name="password"
									value={formData.password}
									onChange={handleInputChange}
									className="w-full px-4 py-3 rounded-lg bg-black/40 border border-purple-500/30 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
									placeholder="Enter your password"
									required
								/>
							</div>

							{error && (
								<div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
									<p className="text-red-300 text-sm">{error}</p>
								</div>
							)}

							<button
								onClick={handleSubmit}
								disabled={loading}
								className="w-full specialBtnGradient rounded-full px-6 py-3 text-white font-semibold shadow-lg shadow-purple-500/50 disabled:opacity-60 disabled:cursor-not-allowed hover:scale-105 transition-transform"
							>
								{loading ? "Processing..." : authMode === "login" ? "Login" : "Sign Up"}
							</button>

							<div className="text-center">
								<button
									onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
									className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
								>
									{authMode === "login" 
										? "Don't have an account? Sign up" 
										: "Already have an account? Login"}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
}

export default MainNav;