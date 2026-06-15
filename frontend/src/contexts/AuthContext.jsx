import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [showAuthModal, setShowAuthModal] = useState(false);
	const [authMode, setAuthMode] = useState("login");
	const [formData, setFormData] = useState({
		username: "",
		email: "",
		password: "",
	});
	const [loading, setLoading] = useState(false);
	const [authLoading, setAuthLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		const token = localStorage.getItem("token");
		if (!token) {
			setAuthLoading(false); // 👈 no token, done loading
			return;
		}

		const verifyToken = async () => {
			try {
				const response = await fetch(
					`${import.meta.env.VITE_API_URL}/api/auth/me`,
					{ headers: { Authorization: `Bearer ${token}` } },
				);
				if (response.ok) {
					const data = await response.json();
					setUser({
						username: data.username,
						id: data.id,
						email: data.email,
						createdAt: data.createdAt,
					});
				} else {
					localStorage.removeItem("token");
					setUser(null);
				}
			} catch {
				localStorage.removeItem("token");
				setUser(null);
			} finally {
				setAuthLoading(false); // 👈 done either way
			}
		};

		verifyToken();
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
			[e.target.name]: e.target.value,
		});
	};

	const handleLogin = async () => {
		setLoading(true);
		setError("");

		try {
			const response = await fetch(
				`${import.meta.env.VITE_API_URL}/api/auth/login`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						email: formData.email,
						password: formData.password,
					}),
				},
			);

			const data = await response.json();

			if (response.ok) {
				// const userData = { username: data.username, id: data.id, email: data.email };
				// setUser(userData);
				// localStorage.setItem("token", data.token);
				// localStorage.removeItem("user");

				//new
				localStorage.setItem("token", data.token);
				localStorage.removeItem("user");

				// Fetch full user data to ensure consistency with /me
				const meRes = await fetch(
					`${import.meta.env.VITE_API_URL}/api/auth/me`,
					{
						headers: { Authorization: `Bearer ${data.token}` },
					},
				);
				const meData = await meRes.json();
				setUser({
					username: meData.username,
					id: meData.id,
					email: meData.email,
					createdAt: meData.createdAt,
				});
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

	const handleSignup = async () => {
		setLoading(true);
		setError("");

		try {
			const response = await fetch(
				`${import.meta.env.VITE_API_URL}/api/auth/signup`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						username: formData.username,
						email: formData.email,
						password: formData.password,
					}),
				},
			);

			const data = await response.json();

			if (response.ok) {
				localStorage.setItem("token", data.token);
				localStorage.removeItem("user");

				// Fetch full user data to ensure consistency with /me
				const meRes = await fetch(
					`${import.meta.env.VITE_API_URL}/api/auth/me`,
					{
						headers: { Authorization: `Bearer ${data.token}` },
					},
				);
				const meData = await meRes.json();
				setUser({
					username: meData.username,
					id: meData.id,
					email: meData.email,
					createdAt: meData.createdAt,
				});

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
		localStorage.removeItem("token");
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		if (authMode === "login") {
			handleLogin();
		} else {
			handleSignup();
		}
	};

	const handleUpdateProfile = async (updateData) => {
		setLoading(true);
		setError("");

		try {
			const token = localStorage.getItem("token");
			const response = await fetch(
				`${import.meta.env.VITE_API_URL}/api/auth/update/${user.id}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify(updateData),
				},
			);

			const data = await response.json();

			if (response.ok) {
				localStorage.setItem("token", data.token);
				console.log("setUser called with:", data)
				setUser({
					username: data.username,
					id: data.id,
					email: data.email,
					createdAt: data.createdAt,
				});
				return { success: true };
			} else {
				setError(data.message || "Update failed");
				return { success: false, message: data.message };
			}
		} catch (err) {
			setError("Something went wrong. Please try again.");
			return { success: false, message: "Something went wrong." };
		} finally {
			setLoading(false);
		}
	};

	const value = {
		user,
		showAuthModal,
		authMode,
		formData,
		loading,
		error,
		authLoading,
		openAuthModal,
		closeAuthModal,
		handleInputChange,
		handleSubmit,
		handleLogout,
		setAuthMode,
		handleUpdateProfile,
	};

	return (
		<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
	);
}

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within AuthProvider");
	}
	return context;
};
