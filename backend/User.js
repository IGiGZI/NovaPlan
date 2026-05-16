const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    }
});

UserSchema.pre('save', async function() {
    const user = this;

    if (!user.isModified('password')) {
        return;
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(user.password, salt);
        user.password = hash;
    } catch (err) {
        throw err;
    }
});

module.exports = mongoose.model('User', UserSchema);