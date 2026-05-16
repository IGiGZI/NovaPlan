import { useAuth } from "../contexts/AuthContext";
// the modal for login/signup UI
function AuthModal() {
	const {
		showAuthModal,
		authMode,
		formData,
		loading,
		error,
		closeAuthModal,
		handleInputChange,
		handleSubmit,
		setAuthMode
	} = useAuth();

	if (!showAuthModal) return null;

	return (
		<div 
			className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-60"
			onClick={closeAuthModal}
		>
			<div 
				className="bg-linear-to-br from-purple-900/90 to-black/90 backdrop-blur-md border border-purple-500/50 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl shadow-purple-500/20"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex justify-between items-center mb-6">
					<h2 className="text-3xl font-bold bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
						{authMode === "login" ? "Welcome Back" : "Create Account"}
					</h2>
					<button 
						onClick={closeAuthModal}
						className="text-gray-400 hover:text-purple-400 text-3xl transition-colors"
					>
						×
					</button>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
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
						type="submit"
						disabled={loading}
						className="w-full specialBtnGradient rounded-full px-6 py-3 text-white font-semibold shadow-lg shadow-purple-500/50 disabled:opacity-60 disabled:cursor-not-allowed hover:scale-105 transition-transform"
					>
						{loading ? "Processing..." : authMode === "login" ? "Login" : "Sign Up"}
					</button>

					<div className="text-center">
						<button
							type="button"
							onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
							className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
						>
							{authMode === "login" 
								? "Don't have an account? Sign up" 
								: "Already have an account? Login"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

export default AuthModal;