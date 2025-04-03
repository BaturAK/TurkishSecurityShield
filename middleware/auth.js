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
  
  // Kullanıcının gitmek istediği sayfayı kaydederek, giriş sonrası yönlendirme yapılabilir
  req.session.returnTo = req.originalUrl;
  
  // Mesaj ekle ve giriş sayfasına yönlendir
  req.session.flashMessages = {
    error: 'Bu sayfayı görüntülemek için giriş yapmalısınız.'
  };
  
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
  
  // Erişim reddedildi sayfasına yönlendir
  res.status(403).render('access-denied', {
    title: 'Erişim Reddedildi',
    message: 'Bu sayfayı görüntülemek için admin yetkisine sahip olmalısınız.'
  });
}

/**
 * Oturum açan kullanıcıların erişemeyeceği sayfalar için kontrol (giriş, kayıt sayfaları vb.)
 * @param {Request} req - Express request nesnesi
 * @param {Response} res - Express response nesnesi
 * @param {Function} next - Sonraki middleware
 */
function isNotAuthenticated(req, res, next) {
  if (!req.session || !req.session.user) {
    return next();
  }
  
  // Kullanıcı zaten giriş yapmış, kontrol paneline yönlendir
  res.redirect('/dashboard');
}

/**
 * Kullanıcı oturum bilgilerini tüm şablonlar için kullanılabilir hale getirir
 * @param {Request} req - Express request nesnesi
 * @param {Response} res - Express response nesnesi
 * @param {Function} next - Sonraki middleware
 */
function injectUserToViews(req, res, next) {
  // Kullanıcı bilgisi varsa res.locals'a ekle
  if (req.session && req.session.user) {
    res.locals.user = req.session.user;
  }
  
  // Flash mesajları varsa ekle
  if (req.session && req.session.flashMessages) {
    res.locals.flashMessages = req.session.flashMessages;
    delete req.session.flashMessages;
  }
  
  next();
}

module.exports = {
  isAuthenticated,
  isAdmin,
  isNotAuthenticated,
  injectUserToViews
};