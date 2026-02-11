import { Link } from "react-router";
import { useAuth } from "../contexts/AuthContext";

// navigation UI
function MainNav() {
	const { user, openAuthModal, handleLogout } = useAuth();

	return (
		<nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-purple-500/30">
			<div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
				
				{/* Logo */}
				<Link to="/" className="flex items-center gap-2">
					<img
						src="/logoFinal.png"
						alt="NovaPlan"
						className="h-10 w-10 object-contain"
					/>
					<span className="text-xl font-bold bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
						NovaPlan
					</span>
				</Link>

				{/* Desktop Nav */}
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
	);
}

export default MainNav;
