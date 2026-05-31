console.log("authRoutes.js loaded ✓");

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { signup, login, updateUser, deleteUser } = require('./authController');
const Roadmap = require('./saveRoadmap');
const protect = require('./authMiddleware'); // ← import middleware

router.post('/signup', signup);
router.post('/login', login);
router.put('/update/:id', updateUser);
router.delete('/delete/:id', deleteUser);

// ✅ Save roadmap — userId comes from the verified token, NOT req.body
router.post('/save-roadmap', protect, async (req, res) => {
    try {
        const { roadmap } = req.body;
        const userId = req.user.id;
        const career = roadmap.chosen_career;

        // ✅ Duplicate check
        const existing = await Roadmap.findOne({ userId, career });
        if (existing) {
            return res.status(409).json({ success: false, message: 'Roadmap for this career is already saved.' });
        }

        const newRoadmap = new Roadmap({
            userId,
            career,
            confidence: roadmap.roadmaps?.[0]?.confidence_score ?? null,
            rawData: roadmap
        });

        await newRoadmap.save();
        console.log("Saved successfully with id:", newRoadmap._id);
        res.status(200).json({ success: true, message: 'Roadmap saved successfully' });
    } catch (err) {
        console.log("Error saving roadmap:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});


router.delete('/roadmap/:id', protect, async (req, res) => {
    try {
        const roadmap = await Roadmap.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!roadmap) {
            return res.status(404).json({ success: false, message: 'Roadmap not found.' });
        }
        res.status(200).json({ success: true, message: 'Roadmap deleted.' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});


// ✅ Get all roadmaps for the logged-in user
router.get('/my-roadmaps', protect, async (req, res) => {
    try {
        const roadmaps = await Roadmap.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, roadmaps });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/me', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'No token' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        res.status(200).json({ id: decoded.id, username: decoded.username });
    } catch {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
});

module.exports = router;