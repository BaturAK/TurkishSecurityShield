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
    this.id = id;
    this.email = email;
    this.displayName = displayName || email.split('@')[0];
    this.photoURL = photoURL;
    this.isAdmin = isAdmin;
    this.createdAt = new Date();
    this.lastLogin = new Date();
    this.status = 'active';
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
      lastLogin: this.lastLogin,
      status: this.status
    };
  }

  /**
   * Kullanıcıyı veritabanına kaydeder
   * @returns {Promise<boolean>} - Kaydetme işlemi başarılı ise true döner
   */
  async save() {
    try {
      const db = getDb();
      
      if (!db) {
        throw new Error('Veritabanı bağlantısı kurulamadı');
      }
      
      const userCollection = db.collection('users');
      
      // Kullanıcı zaten var mı kontrol et
      const existingUser = await userCollection.findOne({ id: this.id });
      
      if (existingUser) {
        // Kullanıcı var, güncelle
        await userCollection.updateOne(
          { id: this.id },
          { $set: this.toJSON() }
        );
      } else {
        // Kullanıcı yok, yeni kayıt ekle
        await userCollection.insertOne(this.toJSON());
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
      userData.id || uuidv4(),
      userData.email,
      userData.displayName,
      userData.photoURL,
      userData.isAdmin || false
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
      const db = getDb();
      
      if (!db) {
        throw new Error('Veritabanı bağlantısı kurulamadı');
      }
      
      const userCollection = db.collection('users');
      const userData = await userCollection.findOne({ email });
      
      if (!userData) {
        return null;
      }
      
      return new User(
        userData.id,
        userData.email,
        userData.displayName,
        userData.photoURL,
        userData.isAdmin
      );
    } catch (error) {
      console.error('E-posta ile kullanıcı bulunurken hata:', error);
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
      
      if (!db) {
        throw new Error('Veritabanı bağlantısı kurulamadı');
      }
      
      const userCollection = db.collection('users');
      const userData = await userCollection.findOne({ id });
      
      if (!userData) {
        return null;
      }
      
      return new User(
        userData.id,
        userData.email,
        userData.displayName,
        userData.photoURL,
        userData.isAdmin
      );
    } catch (error) {
      console.error('ID ile kullanıcı bulunurken hata:', error);
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
      
      if (!db) {
        throw new Error('Veritabanı bağlantısı kurulamadı');
      }
      
      const userCollection = db.collection('users');
      const users = await userCollection.find().toArray();
      
      return users.map(userData => new User(
        userData.id,
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
      const db = getDb();
      
      if (!db) {
        throw new Error('Veritabanı bağlantısı kurulamadı');
      }
      
      const userCollection = db.collection('users');
      const users = await userCollection.find({ isAdmin: true }).toArray();
      
      return users.map(userData => new User(
        userData.id,
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
      const db = getDb();
      
      if (!db) {
        throw new Error('Veritabanı bağlantısı kurulamadı');
      }
      
      const userCollection = db.collection('users');
      return await userCollection.countDocuments();
    } catch (error) {
      console.error('Kullanıcı sayısı hesaplanırken hata:', error);
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
      const db = getDb();
      
      if (!db) {
        throw new Error('Veritabanı bağlantısı kurulamadı');
      }
      
      const userCollection = db.collection('users');
      const users = await userCollection.find().sort({ createdAt: -1 }).limit(limit).toArray();
      
      return users.map(userData => new User(
        userData.id,
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