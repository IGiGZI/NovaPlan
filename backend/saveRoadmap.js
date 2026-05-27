const mongoose = require('mongoose');

const RoadmapSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    career: {
        type: String,
        required: true
    },
    confidence: {
        type: Number,
        default: 0
    },
    rawData: {                              // ← stores the entire JSON as-is
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Roadmap', RoadmapSchema);