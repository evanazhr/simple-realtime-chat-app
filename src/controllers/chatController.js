const MessageModel = require('../models/messageModel');
const UserModel = require('../models/userModel'); // Untuk memeriksa target user

class ChatController {
  static showGlobalChat(req, res) {
    MessageModel.getGlobalMessages((err, messages) => {
      if (err) {
        console.error("Error getting global messages:", err);
        messages = []; // Fallback
      }
      res.render("chat", {
        username: req.session.username,
        messages: messages,
        chattingWith: null
      });
    });
  }

  static showPrivateChat(req, res) {
    const { username } = req.session;
    const target = req.params.targetUser;

    if (target === username) {
      return res.redirect("/chat"); // Tidak bisa chat dengan diri sendiri
    }

    UserModel.findByUsername(target, (err, user) => {
      if (err) {
        console.error("Error finding target user:", err);
        return res.redirect("/chat");
      }
      if (!user) {
        return res.redirect("/chat"); // Target user tidak ditemukan
      }

      MessageModel.getPrivateMessages(username, target, (err, messages) => {
        if (err) {
          console.error("Error getting private messages:", err);
          messages = []; // Fallback
        }
        res.render("chat", {
          username: username,
          messages: messages,
          chattingWith: target
        });
      });
    });
  }
}

module.exports = ChatController;