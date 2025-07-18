const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const checkAuth = require('../utils/authMiddleware'); // Import middleware

router.get("/users", checkAuth, UserController.showUserList);

module.exports = router;