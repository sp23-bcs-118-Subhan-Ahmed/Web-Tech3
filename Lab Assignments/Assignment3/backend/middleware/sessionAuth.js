// Session Authentication Middleware
async function sessionAuth(req, res, next) {
  // Set user variable for EJS templates
  res.locals.user = req.session?.user || null;
  res.locals.isAdmin = false;
  
  if (req.session?.user) {
    res.locals.isAdmin = Boolean(
      req.session.user.roles?.find((r) => r === "admin")
    );
  }
  
  // Set flash function to req
  req.flash = function (type, message) {
    req.session.flash = { type, message };
  };
  
  // If flash message is set, pass it to res.locals and clear it
  if (req.session?.flash) {
    res.locals.flash = req.session.flash;
    req.session.flash = null;
  }
  
  next();
}

export default sessionAuth;

