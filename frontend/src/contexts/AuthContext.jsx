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
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.ok) {
                const data = await response.json();
                setUser({ username: data.username, id: data.id, email: data.email, createdAt: data.createdAt });
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
				const userData = { username: data.username, id: data.id, email: data.email };
				setUser(userData);
				localStorage.setItem("token", data.token);
				localStorage.removeItem("user");
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
				const userData = { username: data.username, id: data.id, email: data.email };
				setUser(userData);
				localStorage.setItem("token", data.token);
				localStorage.removeItem("user")
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
