function checkAuth(req, res, next) {
    if (!req.session.username) {
      req.session.returnTo = req.originalUrl; // Simpan URL yang diminta
      return res.redirect("/login");
    }
    next();
  }
  
  module.exports = checkAuth;