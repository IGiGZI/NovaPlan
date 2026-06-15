const User = require('./User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, username: user.username, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

exports.signup = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }
        const newUser = new User({ username, email, password });
        await newUser.save();
        const token = generateToken(newUser)
        res.status(201).json({ 
            message: "User registered successfully", 
            id: newUser._id, 
            username: newUser.username,
            token
        });
    } catch (err) {
        res.status(500).json({ message: "Signup Error", error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }
        res.status(200).json({ 
            message: "Login successful", 
            id: user._id, 
            username: user.username,
            token: generateToken(user)
        });
    } catch (err) {
        res.status(500).json({ message: "Login Error", error: err.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { username, email, currentPassword, newPassword } = req.body;
        const userId = req.params.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        let updateData = {};
        if (username) updateData.username = username;
        if (email) updateData.email = email;

        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ message: "Current password is required to set a new password" });
            }
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: "Current password is incorrect" });
            }
            if (newPassword.length < 6) {
                return res.status(400).json({ message: "New password must be at least 6 characters" });
            }
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(newPassword, salt);
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        console.log("updateData:", updateData);
        console.log("updatedUser:", updatedUser);

        res.status(200).json({
            message: "User updated successfully",
            id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            createdAt: updatedUser.createdAt,
            token: generateToken(updatedUser),
        });
    } catch (err) {
        res.status(500).json({ message: "Update Error", error: err.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const deletedUser = await User.findByIdAndDelete(userId);
        if (!deletedUser) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ message: "User deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Delete Error", error: err.message });
    }
};