const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./authRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);


const startPythonAI = () => {
    const pythonProcess = spawn('py', [
        '-m', 'uvicorn', 
        'app:app', 
        '--host', '127.0.0.1', 
        '--port', '8000'
    ], {

        cwd: path.join(__dirname, '../roadmap_gen_alpha_v0.4') 
    });

    pythonProcess.stdout.on('data', (data) => {
        console.log(`[Python AI]: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`[Python]: ${data}`);
    });
};

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("Connected to MongoDB");
        startPythonAI();
    })
    .catch((err) => console.log(err));


const NODE_PORT = 5000;

app.listen(NODE_PORT, () => {
    console.log(`Node.js Server running on: http://127.0.0.1:${NODE_PORT}`);
});