const express = require('express');
const router = express.Router();
const ChatController = require('../controllers/chatController');
const checkAuth = require('../utils/authMiddleware'); // Import middleware

router.get("/", (req, res) => res.redirect("/chat")); // Redirect root
router.get("/chat", checkAuth, ChatController.showGlobalChat);
router.get("/chat/:targetUser", checkAuth, ChatController.showPrivateChat);

module.exports = router;