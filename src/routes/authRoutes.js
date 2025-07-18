const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');

router.get("/login", AuthController.showLoginPage);
router.post("/login", AuthController.loginUser);
router.get("/register", AuthController.showRegisterPage);
router.post("/register", AuthController.registerUser);
router.get("/logout", AuthController.logoutUser);

module.exports = router;