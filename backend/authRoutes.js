const express = require('express');
const router = express.Router();
const { signup, login, updateUser, deleteUser } = require('./authController');

router.post('/signup', signup);
router.post('/login', login);
router.put('/update/:id', updateUser);
router.delete('/delete/:id', deleteUser);

module.exports = router;