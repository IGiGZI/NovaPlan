// authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('./User'); // adjust path

const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer '))
        return res.status(401).json({ message: 'No token provided' });

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: decoded.id, username: decoded.username };
        next();
    } catch {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};

module.exports = protect;