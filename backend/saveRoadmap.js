const mongoose = require('mongoose');

const RoadmapSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    career: { type: String, required: true },
    description: String,
    roadmaps: { type: Array, default: [] },
    confidence: Number,
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Roadmap', RoadmapSchema);


//===============


// const mongoose = require('mongoose');

// const RoadmapSchema = new mongoose.Schema({
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },

//   career: {
//     type: String,
//     required: true
//   },

//   description: {
//     type: String,
//     default: ''
//   },

//   steps: [{
//     title: String,
//     completed: Boolean
//   }],

//   confidence: {
//     type: Number,
//     default: 0
//   },

//   createdAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// module.exports = mongoose.model('Roadmap', RoadmapSchema);