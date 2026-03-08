/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [showAuthModal, setShowAuthModal] = useState(false);
	const [authMode, setAuthMode] = useState("login");
	const [formData, setFormData] = useState({ username: "", email: "", password: "" });
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		const storedUser = localStorage.getItem("user");
		if (storedUser) {
			setUser(JSON.parse(storedUser));
		}
	}, []);

	const openAuthModal = (mode) => {
		setAuthMode(mode);
		setShowAuthModal(true);
		setError("");
		setFormData({ username: "", email: "", password: "" });
	};

	const closeAuthModal = () => {
		setShowAuthModal(false);
		setError("");
		setFormData({ username: "", email: "", password: "" });
	};

	const handleInputChange = (e) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value
		});
	};

	// --- تعديل دالة Login لاستقبال الـ ID ---
	const handleLogin = async () => {
		setLoading(true);
		setError("");
		
		try {
			const response = await fetch("http://localhost:5000/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email: formData.email,
					password: formData.password
				})
			});

			const data = await response.json();

			if (response.ok) {
				// هنا أضفنا الـ id اللي جاي من الباك إند
				const userData = { username: data.username, id: data.id }; 
				setUser(userData);
				localStorage.setItem("user", JSON.stringify(userData));
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

	// --- تعديل دالة Signup لاستقبال الـ ID ---
	const handleSignup = async () => {
		setLoading(true);
		setError("");
		
		try {
			const response = await fetch("http://localhost:5000/api/auth/signup", {
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
				// نفس الشيء هنا، نخزن البيانات مع الـ ID
				const userData = { username: data.username, id: data.id };
				setUser(userData);
				localStorage.setItem("user", JSON.stringify(userData));
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

	const handleLogout = () => {
		setUser(null);
		localStorage.removeItem("user");
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		if (authMode === "login") {
			handleLogin();
		} else {
			handleSignup();
		}
	};

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

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within AuthProvider");
	}
	return context;
};