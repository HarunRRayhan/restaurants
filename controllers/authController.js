const passport = require("passport");

exports.login = passport.authenticate("local", {
  failureRedirect: "/login",
  failureFlash: "Failed Login!",
  successRedirect: "/",
  successFlash: "You now loggedin!"
});

exports.logout = (req, res) => {
  req.logout();
  req.flash("success", "You are now logged out! 👏");
  res.redirect("/");
};

exports.isLoggedIn = (req, res, next) => {
  // 1. If user is authenticated
  if (req.isAuthenticated()) {
    next();
    return;
  }
  req.flash("error", "Oops! You must be loggedin to do that!");
  res.redirect("/login");
};
