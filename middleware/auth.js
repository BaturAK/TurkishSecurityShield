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
    // Kullanıcı oturum açmış, devam et
    return next();
  }
  
  // İstenilen URL'i kaydet, giriş yaptıktan sonra yönlendirmek için
  req.session.returnTo = req.originalUrl;
  
  // Kullanıcı oturum açmamış, giriş sayfasına yönlendir
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
    // Kullanıcı admin yetkisine sahip, devam et
    return next();
  }
  
  // Kullanıcı admin yetkisine sahip değil, hata sayfasına yönlendir
  res.status(403).render('error', {
    title: 'Erişim Reddedildi',
    error: {
      status: 403,
      message: 'Bu sayfaya erişim yetkiniz bulunmamaktadır.'
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
    // Kullanıcı zaten oturum açmış, dashboard'a yönlendir
    return res.redirect('/dashboard');
  }
  
  // Kullanıcı oturum açmamış, devam et
  next();
}

/**
 * Kullanıcı oturum bilgilerini tüm şablonlar için kullanılabilir hale getirir
 * @param {Request} req - Express request nesnesi
 * @param {Response} res - Express response nesnesi
 * @param {Function} next - Sonraki middleware
 */
function injectUserToViews(req, res, next) {
  // Kullanıcı bilgisini locals'a ekleyerek tüm şablonlarda kullanılabilir hale getir
  res.locals.user = req.session.user || null;
  next();
}

module.exports = {
  isAuthenticated,
  isAdmin,
  isNotAuthenticated,
  injectUserToViews
};