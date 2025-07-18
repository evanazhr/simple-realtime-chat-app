const db = require('../utils/db');
const bcrypt = require('bcryptjs');

const saltRounds = 10;

class UserModel {
  static findByUsername(username, callback) {
    db.get("SELECT * FROM users WHERE username = ?", [username], callback);
  }

  static createUser(username, password, callback) {
    bcrypt.hash(password, saltRounds, (err, hash) => {
      if (err) return callback(err);
      db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hash], callback);
    });
  }

  static comparePassword(password, hash, callback) {
    bcrypt.compare(password, hash, callback);
  }

  static getAllUsers(callback) {
    db.all("SELECT username FROM users", callback); // Hanya ambil username
  }
}

module.exports = UserModel;