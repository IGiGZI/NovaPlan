// oookaaay? for disabling the fast refresh warning i guess...
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

// the brain logic for authentication states and functions
export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [showAuthModal, setShowAuthModal] = useState(false);
	const [authMode, setAuthMode] = useState("login");
	const [formData, setFormData] = useState({ username: "", email: "", password: "" });
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	// Check for stored user on mount
	useEffect(() => {
		const storedUser = localStorage.getItem("user");
		if (storedUser) {
			setUser(JSON.parse(storedUser));
		}
	}, []);

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
				setUser({ username: data.username });
				localStorage.setItem("user", JSON.stringify({ username: data.username }));
				closeAuthModal();
			} else {
				setError(data.message || "Login failed");
			}
		} catch (err) {
			setError("Something went wrong. Please try again.");
			console.log("Error during login:", err);
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
				setUser({ username: data.username });
				localStorage.setItem("user", JSON.stringify({ username: data.username }));
				closeAuthModal();
			} else {
				setError(data.message || "Signup failed");
			}
		} catch (err) {
			setError("Something went wrong. Please try again.");
			console.log("Error during signup:", err);
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

	// everything the rest of the app needs from this context
	const value = {
		user,
		showAuthModal,
		authMode,
		formData,
		loading,
		error,
		openAuthModal,
		closeAuthModal,
		handleInputChange,
		handleSubmit,
		handleLogout,
		setAuthMode
	};

	return (
		<AuthContext.Provider value={value}>
			{children}
		</AuthContext.Provider>
	);
}

// exporting the useAuth hook for accessing the context in other components (for example MainNav.jsx)
export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within AuthProvider");
	}
	return context;
};