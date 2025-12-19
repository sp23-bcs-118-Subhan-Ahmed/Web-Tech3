// Super Admin Layout Middleware
async function superAdminMiddleware(req, res, next) {
  res.locals.layout = "super-admin-layout";
  res.locals.title = "BeDentist Admin Panel";
  next();
}

export default superAdminMiddleware;

