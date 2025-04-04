/**
 * Auth Middleware
 * Kimlik doğrulama ve yetkilendirme için middleware fonksiyonları
 */

/**
 * Kullanıcının oturum açmış olup olmadığını kontrol eder
 * @param {Request} req - Express request nesnesi
 * @param {Response} res - Express response nesnesi
 * @param {Function} next - Sonraki middleware
 */
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  
  return res.redirect('/auth/login?redirect=' + encodeURIComponent(req.originalUrl));
}

/**
 * Kullanıcının admin yetkisine sahip olup olmadığını kontrol eder
 * @param {Request} req - Express request nesnesi
 * @param {Response} res - Express response nesnesi
 * @param {Function} next - Sonraki middleware
 */
function isAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.isAdmin) {
    return next();
  }
  
  return res.status(403).render('error', {
    title: 'Erişim Reddedildi',
    error: {
      status: 403,
      message: 'Bu sayfaya erişim yetkiniz yok.'
    }
  });
}

/**
 * Oturum açan kullanıcıların erişemeyeceği sayfalar için kontrol (giriş, kayıt sayfaları vb.)
 * @param {Request} req - Express request nesnesi
 * @param {Response} res - Express response nesnesi
 * @param {Function} next - Sonraki middleware
 */
function isNotAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return res.redirect('/dashboard');
  }
  
  return next();
}

/**
 * Kullanıcı oturum bilgilerini tüm şablonlar için kullanılabilir hale getirir
 * @param {Request} req - Express request nesnesi
 * @param {Response} res - Express response nesnesi
 * @param {Function} next - Sonraki middleware
 */
function injectUserToViews(req, res, next) {
  res.locals.user = req.session && req.session.user ? req.session.user : null;
  res.locals.isAuthenticated = !!(req.session && req.session.user);
  res.locals.isAdmin = !!(req.session && req.session.user && req.session.user.isAdmin);
  next();
}

module.exports = {
  isAuthenticated,
  isAdmin,
  isNotAuthenticated,
  injectUserToViews
};