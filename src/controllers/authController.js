const UserModel = require('../models/userModel');

class AuthController {
  static showLoginPage(req, res) {
    res.render("auth", { register: false, error: null });
  }

  static loginUser(req, res) {
    const { username, password } = req.body;
    UserModel.findByUsername(username, (err, user) => {
      if (err) {
        console.error("Login DB error:", err);
        return res.render("auth", { register: false, error: "Terjadi kesalahan server." });
      }
      if (!user) {
        return res.render("auth", { register: false, error: "User tidak ditemukan" });
      }
      UserModel.comparePassword(password, user.password, (err, result) => {
        if (err) {
          console.error("Login password compare error:", err);
          return res.render("auth", { register: false, error: "Terjadi kesalahan saat membandingkan password." });
        }
        if (result) {
          req.session.username = username;
          // Redirect to the URL they were trying to access, or to /chat
          const redirectTo = req.session.returnTo || "/chat";
          delete req.session.returnTo; // Clean up
          res.redirect(redirectTo);
        } else {
          res.render("auth", { register: false, error: "Password salah" });
        }
      });
    });
  }

  static showRegisterPage(req, res) {
    res.render("auth", { register: true, error: null });
  }

  static registerUser(req, res) {
    const { username, password } = req.body;
    UserModel.createUser(username, password, (err) => {
      if (err) {
        if (err.message.includes("UNIQUE constraint failed")) {
          return res.render("auth", { register: true, error: "Username sudah dipakai" });
        }
        console.error("Register DB error:", err);
        return res.render("auth", { register: true, error: "Terjadi kesalahan saat registrasi." });
      }
      res.redirect("/login");
    });
  }

  static logoutUser(req, res) {
    req.session.destroy(() => res.redirect("/login"));
  }
}

module.exports = AuthController;