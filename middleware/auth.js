/**
 * Auth Middleware
 * Kimlik doğrulama ve yetkilendirme işlemlerini gerçekleştirir
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
  
  // Gelinen URL'i session'a kaydet (giriş sonrası yönlendirme için)
  req.session.returnTo = req.originalUrl;
  
  // Giriş sayfasına yönlendir
  res.redirect('/auth/login');
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
  
  // Yetkisiz erişim durumunda 403 hatası gönder
  res.status(403).render('error', { 
    title: 'Erişim Engellendi',
    message: 'Bu sayfaya erişmek için admin yetkisine sahip olmanız gerekmektedir.',
    user: req.session?.user,
    isLoggedIn: !!req.session?.user
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
  
  next();
}

/**
 * Kullanıcı oturum bilgilerini tüm şablonlar için kullanılabilir hale getirir
 * @param {Request} req - Express request nesnesi
 * @param {Response} res - Express response nesnesi
 * @param {Function} next - Sonraki middleware
 */
function injectUserToViews(req, res, next) {
  res.locals.user = req.session?.user || null;
  res.locals.isLoggedIn = !!req.session?.user;
  res.locals.isAdmin = !!(req.session?.user?.isAdmin);
  next();
}

module.exports = {
  isAuthenticated,
  isAdmin,
  isNotAuthenticated,
  injectUserToViews
};