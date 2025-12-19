// Check Session Auth - Protected Routes Middleware
async function checkSessionAuth(req, res, next) {
  if (!req.session?.user) {
    req.flash && req.flash("danger", "Please login to access this page");
    return res.redirect("/login");
  }
  next();
}

export default checkSessionAuth;

