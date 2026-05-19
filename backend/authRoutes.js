// const express = require('express');
// const router = express.Router();
// const { signup, login, updateUser, deleteUser } = require('./authController');

// router.post('/signup', signup);
// router.post('/login', login);
// router.put('/update/:id', updateUser);
// router.delete('/delete/:id', deleteUser);

// router.post('/save-roadmap', async (req, res) => {
//     try {
//         const { userId, career, description, roadmaps, confidence } = req.body;

//         res.status(200).json({ success: true, message: "Saved to database" });
//     } catch(err) {
//         res.status(500).json({ success: false, error: err.message });
//     }
// });
// module.exports = router;



const express = require('express');
const router = express.Router();
const { signup, login, updateUser, deleteUser } = require('./authController');
const Roadmap = require('./models/Roadmap'); // adjust path if needed

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
            roadmaps: roadmap.roadmaps ?? [],
            confidence: roadmap.roadmaps?.[0]?.confidence_score ?? null,
        });

        await newRoadmap.save();
        res.status(200).json({ success: true, message: 'Roadmap saved successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;