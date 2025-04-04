/**
 * User Model
 * Kullanıcıları temsil eden model sınıfı
 */

const { v4: uuidv4 } = require('uuid');
const database = require('../config/database');

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
    this.displayName = displayName || email.split('@')[0];
    this.photoURL = photoURL;
    this.isAdmin = isAdmin;
    this.createdAt = new Date();
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
      createdAt: this.createdAt
    };
  }

  /**
   * Kullanıcıyı veritabanına kaydeder
   * @returns {Promise<boolean>} - Kaydetme işlemi başarılı ise true döner
   */
  async save() {
    try {
      const db = database.getDb();
      if (!db) return false;

      const users = db.collection('users');
      
      const userData = {
        _id: this.id,
        email: this.email,
        displayName: this.displayName,
        photoURL: this.photoURL,
        isAdmin: this.isAdmin,
        createdAt: this.createdAt
      };

      // Kullanıcının daha önce kaydedilip kaydedilmediğini kontrol et
      const existingUser = await users.findOne({ _id: this.id });
      
      if (existingUser) {
        // Kullanıcı zaten var, güncelle
        await users.updateOne({ _id: this.id }, { $set: userData });
      } else {
        // Yeni kullanıcı ekle
        await users.insertOne(userData);
      }
      
      return true;
    } catch (error) {
      console.error('Kullanıcı kaydedilirken hata:', error);
      return false;
    }
  }
  
  /**
   * Kullanıcıyı veritabanına kaydeder
   * @param {User} userData - Kaydedilecek kullanıcı verisi
   * @returns {Promise<User>} - Kaydedilen kullanıcı
   */
  static async saveUserToDb(userData) {
    const user = new User(
      userData.id,
      userData.email,
      userData.displayName,
      userData.photoURL,
      userData.isAdmin
    );
    
    await user.save();
    return user;
  }

  /**
   * E-posta adresine göre kullanıcı bulur
   * @param {string} email - Aranacak e-posta adresi
   * @returns {Promise<User|null>} - Bulunan kullanıcı veya null
   */
  static async findByEmail(email) {
    try {
      const db = database.getDb();
      if (!db) return null;

      const users = db.collection('users');
      const userData = await users.findOne({ email });
      
      if (!userData) return null;
      
      return new User(
        userData._id,
        userData.email,
        userData.displayName,
        userData.photoURL,
        userData.isAdmin
      );
    } catch (error) {
      console.error('E-posta ile kullanıcı aranırken hata:', error);
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
      const db = database.getDb();
      if (!db) return null;

      const users = db.collection('users');
      const userData = await users.findOne({ _id: id });
      
      if (!userData) return null;
      
      return new User(
        userData._id,
        userData.email,
        userData.displayName,
        userData.photoURL,
        userData.isAdmin
      );
    } catch (error) {
      console.error('ID ile kullanıcı aranırken hata:', error);
      return null;
    }
  }

  /**
   * Tüm kullanıcıları getirir
   * @returns {Promise<User[]>} - Kullanıcı listesi
   */
  static async findAll() {
    try {
      const db = database.getDb();
      if (!db) return [];

      const users = db.collection('users');
      const userDataList = await users.find().toArray();
      
      return userDataList.map(userData => new User(
        userData._id,
        userData.email,
        userData.displayName,
        userData.photoURL,
        userData.isAdmin
      ));
    } catch (error) {
      console.error('Tüm kullanıcılar getirilirken hata:', error);
      return [];
    }
  }

  /**
   * Admin kullanıcılarını getirir
   * @returns {Promise<User[]>} - Admin kullanıcı listesi
   */
  static async findAdmins() {
    try {
      const db = database.getDb();
      if (!db) return [];

      const users = db.collection('users');
      const userDataList = await users.find({ isAdmin: true }).toArray();
      
      return userDataList.map(userData => new User(
        userData._id,
        userData.email,
        userData.displayName,
        userData.photoURL,
        userData.isAdmin
      ));
    } catch (error) {
      console.error('Admin kullanıcılar getirilirken hata:', error);
      return [];
    }
  }

  /**
   * Kullanıcı sayısını getirir
   * @returns {Promise<number>} - Kullanıcı sayısı
   */
  static async count() {
    try {
      const db = database.getDb();
      if (!db) return 0;

      const users = db.collection('users');
      return await users.countDocuments();
    } catch (error) {
      console.error('Kullanıcı sayısı getirilirken hata:', error);
      return 0;
    }
  }

  /**
   * Son kayıt olan kullanıcıları getirir
   * @param {number} limit - Maksimum kullanıcı sayısı
   * @returns {Promise<User[]>} - Kullanıcı listesi
   */
  static async findRecent(limit = 10) {
    try {
      const db = database.getDb();
      if (!db) return [];

      const users = db.collection('users');
      const userDataList = await users.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();
      
      return userDataList.map(userData => new User(
        userData._id,
        userData.email,
        userData.displayName,
        userData.photoURL,
        userData.isAdmin
      ));
    } catch (error) {
      console.error('Son kullanıcılar getirilirken hata:', error);
      return [];
    }
  }
}

module.exports = User;