import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from 'react-router'

function SettingsForm({ userDetails, handleDeleteAccount }) {
	const { handleUpdateProfile, loading, error } = useAuth();
	const [formData, setFormData] = useState({
		username: userDetails.username,
		email: userDetails.email === "Not provided" ? "" : userDetails.email,
		currentPassword: "",
		newPassword: "",
	});
	const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate()

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
		setSuccessMsg("");
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setSuccessMsg("");

		const payload = {};
		if (formData.username !== userDetails.username)
			payload.username = formData.username;
		if (formData.email !== userDetails.email)
			payload.email = formData.email;
		if (formData.newPassword) {
			payload.newPassword = formData.newPassword;
			payload.currentPassword = formData.currentPassword;
		}

		if (Object.keys(payload).length === 0) {
			setSuccessMsg("No changes to save.");
			return;
		}

		const result = await handleUpdateProfile(payload);
		if (result.success) {
			setSuccessMsg("Profile updated successfully!");
			setFormData((prev) => ({
				...prev,
				currentPassword: "",
				newPassword: "",
			}));
      navigate('/')
		}
	};

	return (
		<div className="bg-linear-to-br from-purple-900/20 to-transparent backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6">
			<h2 className="text-xl font-bold text-white mb-2">
				Account Settings
			</h2>
			<p className="text-gray-500 text-sm mb-8">
				Manage your account preferences
			</p>

			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">
						Username
					</label>
					<input
						type="text"
						name="username"
						value={formData.username}
						onChange={handleChange}
						className="w-full px-4 py-3 rounded-lg bg-purple-900/30 border border-purple-500/20 text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
					/>
				</div>

				<div>
					<label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">
						Email
					</label>
					<input
						type="email"
						name="email"
						value={formData.email}
						onChange={handleChange}
						className="w-full px-4 py-3 rounded-lg bg-purple-900/30 border border-purple-500/20 text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
					/>
				</div>

				<div>
					<label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">
						New Password
					</label>
					<input
						type="password"
						name="newPassword"
						value={formData.newPassword}
						onChange={handleChange}
						placeholder="Leave blank to keep current password"
						className="w-full px-4 py-3 rounded-lg bg-purple-900/30 border border-purple-500/20 text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
					/>
					<p className="text-xs text-gray-500 mt-1.5">
						Must be at least 6 characters long
					</p>
				</div>

				{formData.newPassword && (
					<div>
						<label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">
							Current Password
						</label>
						<input
							type="password"
							name="currentPassword"
							value={formData.currentPassword}
							onChange={handleChange}
							placeholder="Required to set a new password"
							className="w-full px-4 py-3 rounded-lg bg-purple-900/30 border border-purple-500/20 text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
							required
						/>
					</div>
				)}

				{error && (
					<div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
						<p className="text-red-300 text-sm">{error}</p>
					</div>
				)}

				{successMsg && (
					<div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3">
						<p className="text-green-300 text-sm">{successMsg}</p>
					</div>
				)}

				<button
					type="submit"
					disabled={loading}
					className="specialBtnGradient rounded-full px-6 py-2.5 text-white font-semibold shadow-lg shadow-purple-500/30 disabled:opacity-60 disabled:cursor-not-allowed hover:scale-105 transition-transform"
				>
					{loading ? "Saving..." : "Save Changes"}
				</button>
			</form>

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
	);
}

export default SettingsForm;
