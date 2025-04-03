/**
 * User Model
 * Kullanıcıları temsil eden model sınıfı
 */

const { getDb } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * User model
 * Kullanıcıları temsil eden model sınıfı
 */
class User {
  /**
   * Yeni bir kullanıcı nesnesi oluşturur
   * @param {string} id - Kullanıcı ID'si (Firebase UID)
   * @param {string} email - Kullanıcı e-posta adresi
   * @param {string|null} displayName - Görünen isim
   * @param {string|null} photoURL - Profil fotoğrafı URL'i
   * @param {boolean} isAdmin - Admin yetkisi
   */
  constructor(id, email, displayName = null, photoURL = null, isAdmin = false) {
    this.id = id || uuidv4();
    this.email = email;
    this.displayName = displayName;
    this.photoURL = photoURL;
    this.isAdmin = isAdmin;
    this.createdAt = new Date();
    this.lastLoginAt = new Date();
    this.settings = {
      notifications: true,
      darkMode: false,
      language: 'tr'
    };
  }

  /**
   * Kullanıcıyı JSON formatına dönüştürür
   * @returns {object} JSON formatında kullanıcı
   */
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      displayName: this.displayName,
      photoURL: this.photoURL,
      isAdmin: this.isAdmin,
      createdAt: this.createdAt,
      lastLoginAt: this.lastLoginAt,
      settings: this.settings
    };
  }

  /**
   * Kullanıcıyı veritabanına kaydeder
   * @param {User} userData - Kaydedilecek kullanıcı verisi
   * @returns {Promise<User>} - Kaydedilen kullanıcı
   */
  static async saveUserToDb(userData) {
    try {
      const db = getDb();
      const usersCollection = db.collection('users');
      
      // Önce kullanıcıyı e-posta ile ara
      const existingUser = await usersCollection.findOne({ email: userData.email });
      
      if (existingUser) {
        // Kullanıcı zaten varsa, son giriş tarihini güncelle
        await usersCollection.updateOne(
          { email: userData.email },
          { $set: { lastLoginAt: new Date() } }
        );
        return new User(
          existingUser.id,
          existingUser.email,
          existingUser.displayName,
          existingUser.photoURL,
          existingUser.isAdmin
        );
      } else {
        // Kullanıcı yoksa yeni kayıt oluştur
        const result = await usersCollection.insertOne(userData.toJSON());
        console.log(`Yeni kullanıcı kaydedildi: ${userData.email}`);
        return userData;
      }
    } catch (error) {
      console.error('Kullanıcı kaydetme hatası:', error);
      throw error;
    }
  }

  /**
   * E-posta adresine göre kullanıcı bulur
   * @param {string} email - Aranacak e-posta adresi
   * @returns {Promise<User|null>} - Bulunan kullanıcı veya null
   */
  static async findByEmail(email) {
    try {
      const db = getDb();
      const usersCollection = db.collection('users');
      
      const userData = await usersCollection.findOne({ email });
      
      if (!userData) return null;
      
      return new User(
        userData.id,
        userData.email,
        userData.displayName,
        userData.photoURL,
        userData.isAdmin
      );
    } catch (error) {
      console.error('Kullanıcı bulma hatası:', error);
      return null;
    }
  }

  /**
   * ID'ye göre kullanıcı bulur
   * @param {string} id - Aranacak kullanıcı ID'si
   * @returns {Promise<User|null>} - Bulunan kullanıcı veya null
   */
  static async findById(id) {
    try {
      const db = getDb();
      const usersCollection = db.collection('users');
      
      const userData = await usersCollection.findOne({ id });
      
      if (!userData) return null;
      
      return new User(
        userData.id,
        userData.email,
        userData.displayName,
        userData.photoURL,
        userData.isAdmin
      );
    } catch (error) {
      console.error('Kullanıcı bulma hatası:', error);
      return null;
    }
  }

  /**
   * Tüm kullanıcıları getirir
   * @returns {Promise<User[]>} - Kullanıcı listesi
   */
  static async findAll() {
    try {
      const db = getDb();
      const usersCollection = db.collection('users');
      
      const usersData = await usersCollection.find().toArray();
      
      return usersData.map(userData => new User(
        userData.id,
        userData.email,
        userData.displayName,
        userData.photoURL,
        userData.isAdmin
      ));
    } catch (error) {
      console.error('Kullanıcıları getirme hatası:', error);
      return [];
    }
  }

  /**
   * Admin kullanıcılarını getirir
   * @returns {Promise<User[]>} - Admin kullanıcı listesi
   */
  static async findAdmins() {
    try {
      const db = getDb();
      const usersCollection = db.collection('users');
      
      const adminsData = await usersCollection.find({ isAdmin: true }).toArray();
      
      return adminsData.map(userData => new User(
        userData.id,
        userData.email,
        userData.displayName,
        userData.photoURL,
        userData.isAdmin
      ));
    } catch (error) {
      console.error('Admin kullanıcıları getirme hatası:', error);
      return [];
    }
  }
}

module.exports = User;