const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const port = 8000;

const DATA_DIR = path.join(__dirname, 'data');

if (!fs.existsSync(DATA_DIR)) {
    try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (err) {
        console.error("Data creation failed", err);
    }
}

const generate_roadmaps_for_user = (payload) => {

    try {
        if (!payload) throw new Error("Invalid payload");
        return { 
            message: "Roadmap generated", 
            data: payload,
            timestamp: new Date().toISOString(),
            status: "success"
        };
    } catch (error) {
        throw error;
    }
};


app.use(cors());
app.use(express.json({ limit: '50mb' }));

const FRONTEND_DIST = path.join(__dirname, '../novaPlan-master/dist');
app.use('/assets', express.static(path.join(FRONTEND_DIST, 'assets')));
app.use('/static', express.static(path.join(__dirname, 'static')));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'data/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 }
});


app.get('/', (req, res) => {
    try {
        const filePath = path.join(FRONTEND_DIST, 'index.html');
        res.sendFile(filePath, (err) => {
            if (err) {
                res.status(404).send("HTML file not found");
            }
        });
    } catch (error) {
        res.status(500).send("Server Error");
    }
});


app.get('/health', (req, res) => {

    try {
        res.status(200).json({ 
            status: 'Ok',
            uptime: process.uptime(),
            memory: process.memoryUsage()
        });
    } catch (error) {
        res.status(503).json({ status: 'error', detail: error.message });
    }
});


app.post('/generate', (req, res) => {

    try {
        const payload = req.body;
        const out = generate_roadmaps_for_user(payload);
        res.status(200).json(out);
    } catch (error) {
        res.status(400).json({ detail: error.message });
    }
});


app.get('/download', (req, res) => {

    try {
        const filePath = path.join(__dirname, 'generated_roadmaps_output.json');
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ detail: 'Output not found' });
        }
        res.download(filePath, 'generated_roadmaps_output.json', (err) => {
            if (err && !res.headersSent) {
                res.status(500).json({ detail: "Download failed" });
            }
        });
    } catch (error) {
        res.status(500).json({ detail: error.message });
    }
});


app.post('/upload_onet', upload.single('file'), (req, res) => {

    try {
        if (!req.file) {
            return res.status(400).json({ detail: 'No file uploaded.' });
        }
        
        const targetPath = path.join(DATA_DIR, 'onet_upload.zip');
        

        fs.copyFile(req.file.path, targetPath, (err) => {
            if (err) {
                return res.status(500).json({ detail: "File processing failed" });
            }
            fs.unlink(req.file.path, () => {});
            res.status(200).json({ 
                status: 'uploaded', 
                path: targetPath,
                filename: req.file.originalname 
            });
        });
    } 
    
    catch (error) {
        res.status(500).json({ detail: error.message });
    }
});


app.use((req, res) => {
    res.status(404).json({ detail: "Route not found" });
});


app.use((err, req, res, next) => {
    res.status(500).json({ detail: "Global server error", error: err.message });
});


app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
});