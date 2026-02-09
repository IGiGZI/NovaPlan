import { icons, FontAwesomeIcon } from "../assets";
import { Link } from "react-router";
import MainNav from "./MainNav";

function Landing() {
	return (
		<main className="min-h-screen">
			{/* Navbar */}
			<MainNav/>

			{/* Hero Section */}
			<div className="landingView text-center pt-32 pb-40 px-10 relative overflow-hidden">
				{/* Animated background elements */}
				<div className="absolute inset-0 -z-10">
					<div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
					<div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
				</div>

				<img
					src="/logoFinal.png"
					alt="NovaPlan"
					className="m-auto -mb-11 h-[600px] drop-shadow-2xl"
				/>
				<h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
					Navigate Your Career Journey
				</h1>
				<p className="text-xl mb-14 text-gray-300 max-w-2xl mx-auto">
					Navigate your career through a galaxy of opportunities. Let
					us guide you to your next destination.
				</p>

				<Link to="/fetch">
					<button className="specialBtnGradient rounded-full px-8 py-4 text-lg font-semibold hover:scale-105 transition-transform shadow-lg shadow-purple-500/50">
						Start Your Journey
					</button>
				</Link>
			</div>

			{/* About Section */}
			<div
				id="about"
				className="aboutText mx-10 md:mx-60 mb-40 scroll-mt-20"
			>
				<h1 className="text-purple-400 text-4xl text-center mb-8 font-bold">
					About NovaPlan
				</h1>
				<p className="text-center text-xl text-gray-300 leading-relaxed">
					We believe every career journey is unique. Nova Plan
					combines cutting-edge AI technology with personalized
					guidance to help you navigate the vast universe of career
					opportunities and reach your full potential.
				</p>
			</div>

			{/* Features Section */}
			<div
				id="features"
				className="aboutBoxes mx-10 md:mx-40 mb-40 scroll-mt-20"
			>
				<h2 className="text-purple-400 text-4xl text-center mb-12 font-bold">
					Why Choose NovaPlan
				</h2>
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 items-start">
					<div className="box w-full border border-purple-500/50 rounded-2xl p-6 text-center md:text-left hover:border-purple-400 transition-all hover:shadow-lg hover:shadow-purple-500/20 bg-gradient-to-br from-purple-900/20 to-transparent">
						<FontAwesomeIcon
							icon={icons.faRocket}
							className="mb-3 bg-purple-600 rounded-full p-5 text-2xl"
						/>
						<h2 className="text-xl font-bold mb-3">
							Personalized Pathways
						</h2>
						<p className="text-gray-400">
							Custom career roadmaps tailored to your unique
							skills and aspirations
						</p>
					</div>
					<div className="box w-full border border-purple-500/50 rounded-2xl p-6 text-center md:text-left hover:border-purple-400 transition-all hover:shadow-lg hover:shadow-purple-500/20 bg-gradient-to-br from-purple-900/20 to-transparent">
						<FontAwesomeIcon
							icon={icons.faBullseye}
							className="mb-3 bg-purple-600 rounded-full p-5 text-2xl"
						/>
						<h2 className="text-xl font-bold mb-3">
							Goal-Oriented
						</h2>
						<p className="text-gray-400">
							Set milestones and track your progress through the
							cosmos of opportunities
						</p>
					</div>
					<div className="box w-full border border-purple-500/50 rounded-2xl p-6 text-center md:text-left hover:border-purple-400 transition-all hover:shadow-lg hover:shadow-purple-500/20 bg-gradient-to-br from-purple-900/20 to-transparent">
						<FontAwesomeIcon
							icon={icons.faWandMagicSparkles}
							className="mb-3 bg-purple-600 rounded-full p-5 text-2xl"
						/>
						<h2 className="text-xl font-bold mb-3">
							AI-Powered Insights
						</h2>
						<p className="text-gray-400">
							Advanced algorithms analyze your profile to suggest
							optimal careers
						</p>
					</div>
					<div className="box w-full border border-purple-500/50 rounded-2xl p-6 text-center md:text-left hover:border-purple-400 transition-all hover:shadow-lg hover:shadow-purple-500/20 bg-gradient-to-br from-purple-900/20 to-transparent">
						<FontAwesomeIcon
							icon={icons.faFaceSmile}
							className="mb-3 bg-purple-600 rounded-full p-5 text-2xl"
						/>
						<h2 className="text-xl font-bold mb-3">
							Community Driven
						</h2>
						<p className="text-gray-400">
							Connect with mentors and peers navigating similar
							career galaxies
						</p>
					</div>
				</div>
			</div>

			{/* FAQ Section */}
			<div id="faq" className="scroll-mt-20">
				<div className="FAQsText mx-10 md:mx-60 mb-12">
					<h1 className="text-purple-400 text-4xl text-center mb-8 font-bold">
						Frequently Asked Questions
					</h1>
					<p className="text-center text-xl text-gray-300">
						Everything you need to know about navigating your career
						with Nova Plan
					</p>
				</div>

				<div className="FAQs flex flex-col gap-6 mx-10 md:mx-60 mb-40">
					<div className="box w-full border border-purple-500/50 rounded-2xl p-6 text-center md:text-left hover:border-purple-400 transition-all bg-gradient-to-br from-purple-900/10 to-transparent">
						<h2 className="text-xl font-bold mb-3">
							What is novaPlan?
						</h2>
						<p className="text-gray-400">
							Nova Plan is an AI-powered career guidance platform
							that creates personalized roadmaps to help you
							achieve your professional goals. We analyze your
							skills, interests, and aspirations to chart the
							optimal path through your career journey.
						</p>
					</div>
					<div className="box w-full border border-purple-500/50 rounded-2xl p-6 text-center md:text-left hover:border-purple-400 transition-all bg-gradient-to-br from-purple-900/10 to-transparent">
						<h2 className="text-xl font-bold mb-3">
							How does the personalized roadmaps work?
						</h2>
						<p className="text-gray-400">
							After you complete our detailed questionnaire about
							your skills, hobbies, education, and career goals,
							our AI algorithms analyze this information to create
							a customized step-by-step roadmap. This includes
							skill development milestones, recommended resources,
							and timeline suggestions.
						</p>
					</div>
					<div className="box w-full border border-purple-500/50 rounded-2xl p-6 text-center md:text-left hover:border-purple-400 transition-all bg-gradient-to-br from-purple-900/10 to-transparent">
						<h2 className="text-xl font-bold mb-3">
							Is novaPlan free to use?
						</h2>
						<p className="text-gray-400">
							We offer a free tier that includes basic roadmap
							generation and career insights. Premium features,
							including detailed analytics, mentor connections,
							and advanced AI recommendations, are available
							through our subscription plans.
						</p>
					</div>
					<div className="box w-full border border-purple-500/50 rounded-2xl p-6 text-center md:text-left hover:border-purple-400 transition-all bg-gradient-to-br from-purple-900/10 to-transparent">
						<h2 className="text-xl font-bold mb-3">
							How often should i update my roadmap?
						</h2>
						<p className="text-gray-400">
							We recommend reviewing and updating your roadmap
							every 3-6 months, or whenever you achieve a major
							milestone or your career goals shift. Our platform
							makes it easy to adjust your trajectory as you grow.
						</p>
					</div>
					<div className="box w-full border border-purple-500/50 rounded-2xl p-6 text-center md:text-left hover:border-purple-400 transition-all bg-gradient-to-br from-purple-900/10 to-transparent">
						<h2 className="text-xl font-bold mb-3">
							Can i connect with mentors through novaPlan?
						</h2>
						<p className="text-gray-400">
							Yes! Premium members gain access to our mentor
							network, where you can connect with experienced
							professionals in your field. These mentors can
							provide guidance, review your roadmap, and offer
							industry insights.
						</p>
					</div>
					<div className="box w-full border border-purple-500/50 rounded-2xl p-6 text-center md:text-left hover:border-purple-400 transition-all bg-gradient-to-br from-purple-900/10 to-transparent">
						<h2 className="text-xl font-bold mb-3">
							What makes novaPlan different?
						</h2>
						<p className="text-gray-400">
							Nova Plan uniquely combines AI-driven
							personalization with a beautiful, intuitive
							interface inspired by space exploration. We focus on
							creating actionable, milestone-based roadmaps rather
							than generic advice, making your career journey both
							inspiring and practical.
						</p>
					</div>
				</div>
			</div>

			{/* Footer */}
			<footer className="footer text-gray-400 py-8 text-center border-t border-purple-500/30 mx-10 md:mx-60 mb-10">
				<p className="mb-3">
					Embark on your career journey with Nova Plan
				</p>
				<p>&copy; 2024 NovaPlan. All rights reserved.</p>
			</footer>
		</main>
	);
}

export default Landing;
