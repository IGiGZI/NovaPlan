console.log("authRoutes.js loaded ✓");

const express = require('express');
const router = express.Router();
const { signup, login, updateUser, deleteUser } = require('./authController');
const Roadmap = require('./saveRoadmap'); // adjust path if needed

router.post('/signup', signup);
router.post('/login', login);
router.put('/update/:id', updateUser);
router.delete('/delete/:id', deleteUser);

router.post('/save-roadmap', async (req, res) => {
    try {
        const { userId, roadmap } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Not logged in' });
        }

        const newRoadmap = new Roadmap({
            userId,
            career: roadmap.chosen_career,
            confidence: roadmap.roadmaps?.[0]?.confidence_score ?? null,
            rawData: roadmap // store the entire roadmap JSON as it is
        });

        await newRoadmap.save();
        console.log("Saved successfully with id:", newRoadmap._id);
        res.status(200).json({ success: true, message: 'Roadmap saved successfully' });
    } catch (err) {
        console.log("Error saving roadmap:", err.message)
        res.status(500).json({ success: false, error: err.message });
    }
});

const jwt = require('jsonwebtoken');

router.get('/me', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'No token' });

    const token = authHeader.split(' ')[1]; // "Bearer <token>"
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        res.status(200).json({ id: decoded.id, username: decoded.username });
    } catch {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
});

module.exports = router;