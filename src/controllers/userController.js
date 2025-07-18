const UserModel = require('../models/userModel');

class UserController {
  static showUserList(req, res) {
    UserModel.getAllUsers((err, users) => {
      if (err) {
        console.error("Error getting user list:", err);
        users = []; // Fallback
      }
      res.render("users", { users, username: req.session.username });
    });
  }
}

module.exports = UserController;