export function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.session.user) return res.redirect('/login');
    if (req.session.user.role !== role && req.session.user.role !== 'owner') {
      return res.status(403).render('errors/403');
    }
    next();
  };
}
