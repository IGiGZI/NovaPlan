const User = require('./User');
const bcrypt = require('bcryptjs');

exports.signup = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }
        const newUser = new User({ username, email, password });
        await newUser.save();
        res.status(201).json({ 
            message: "User registered successfully", 
            id: newUser._id, 
            username: newUser.username 
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
            username: user.username 
        });
    } catch (err) {
        res.status(500).json({ message: "Login Error", error: err.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { username, password } = req.body;
        const userId = req.params.id;
        let updateData = { username };
        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password, salt);
        }
        const updatedUser = await User.findByIdAndUpdate(
            userId, 
            { $set: updateData }, 
            { new: true }
        ).select('-password');
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ message: "User updated successfully", updatedUser });
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