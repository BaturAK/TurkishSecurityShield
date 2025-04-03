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
    this.displayName = displayName;
    this.photoURL = photoURL;
    this.isAdmin = isAdmin;
    this.createdAt = new Date();
    this.lastLoginAt = new Date();
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
      lastLoginAt: this.lastLoginAt
    };
  }

  /**
   * Kullanıcıyı veritabanına kaydeder
   * @returns {Promise<boolean>} - Kaydetme işlemi başarılı ise true döner
   */
  async save() {
    const db = getDb();
    if (!db) throw new Error('Veritabanı bağlantısı yok');

    try {
      const userCollection = db.collection('users');
      
      // Mevcut kullanıcıyı kontrol et
      const existingUser = await userCollection.findOne({ id: this.id });
      
      if (existingUser) {
        // Kullanıcı var, güncelle
        const result = await userCollection.updateOne(
          { id: this.id },
          { $set: this.toJSON() }
        );
        return result.modifiedCount > 0;
      } else {
        // Yeni kullanıcı ekle
        const result = await userCollection.insertOne(this.toJSON());
        return !!result.insertedId;
      }
    } catch (error) {
      console.error('Kullanıcı kaydederken hata:', error);
      throw error;
    }
  }

  /**
   * Kullanıcıyı veritabanına kaydeder
   * @param {User} userData - Kaydedilecek kullanıcı verisi
   * @returns {Promise<User>} - Kaydedilen kullanıcı
   */
  static async saveUserToDb(userData) {
    const db = getDb();
    if (!db) throw new Error('Veritabanı bağlantısı yok');

    try {
      const userCollection = db.collection('users');
      
      // Mevcut kullanıcıyı kontrol et
      const existingUser = await userCollection.findOne({ id: userData.id });
      
      if (existingUser) {
        // Kullanıcı var, güncelle
        await userCollection.updateOne(
          { id: userData.id },
          { $set: userData }
        );
      } else {
        // Yeni kullanıcı ekle
        await userCollection.insertOne(userData);
      }
      
      return userData;
    } catch (error) {
      console.error('Kullanıcı DB kayıt hatası:', error);
      throw error;
    }
  }

  /**
   * E-posta adresine göre kullanıcı bulur
   * @param {string} email - Aranacak e-posta adresi
   * @returns {Promise<User|null>} - Bulunan kullanıcı veya null
   */
  static async findByEmail(email) {
    const db = getDb();
    if (!db) throw new Error('Veritabanı bağlantısı yok');

    try {
      const userCollection = db.collection('users');
      const userData = await userCollection.findOne({ email });
      
      if (!userData) return null;
      
      return new User(
        userData.id,
        userData.email,
        userData.displayName,
        userData.photoURL,
        userData.isAdmin
      );
    } catch (error) {
      console.error('E-posta ile kullanıcı arama hatası:', error);
      throw error;
    }
  }

  /**
   * ID'ye göre kullanıcı bulur
   * @param {string} id - Aranacak kullanıcı ID'si
   * @returns {Promise<User|null>} - Bulunan kullanıcı veya null
   */
  static async findById(id) {
    const db = getDb();
    if (!db) throw new Error('Veritabanı bağlantısı yok');

    try {
      const userCollection = db.collection('users');
      const userData = await userCollection.findOne({ id });
      
      if (!userData) return null;
      
      return new User(
        userData.id,
        userData.email,
        userData.displayName,
        userData.photoURL,
        userData.isAdmin
      );
    } catch (error) {
      console.error('ID ile kullanıcı arama hatası:', error);
      throw error;
    }
  }

  /**
   * Tüm kullanıcıları getirir
   * @returns {Promise<User[]>} - Kullanıcı listesi
   */
  static async findAll() {
    const db = getDb();
    if (!db) throw new Error('Veritabanı bağlantısı yok');

    try {
      const userCollection = db.collection('users');
      const usersData = await userCollection.find().toArray();
      
      return usersData.map(userData => new User(
        userData.id,
        userData.email,
        userData.displayName,
        userData.photoURL,
        userData.isAdmin
      ));
    } catch (error) {
      console.error('Tüm kullanıcıları getirme hatası:', error);
      throw error;
    }
  }

  /**
   * Admin kullanıcılarını getirir
   * @returns {Promise<User[]>} - Admin kullanıcı listesi
   */
  static async findAdmins() {
    const db = getDb();
    if (!db) throw new Error('Veritabanı bağlantısı yok');

    try {
      const userCollection = db.collection('users');
      const usersData = await userCollection.find({ isAdmin: true }).toArray();
      
      return usersData.map(userData => new User(
        userData.id,
        userData.email,
        userData.displayName,
        userData.photoURL,
        userData.isAdmin
      ));
    } catch (error) {
      console.error('Admin kullanıcıları getirme hatası:', error);
      throw error;
    }
  }

  /**
   * Kullanıcı sayısını getirir
   * @returns {Promise<number>} - Kullanıcı sayısı
   */
  static async count() {
    const db = getDb();
    if (!db) throw new Error('Veritabanı bağlantısı yok');

    try {
      const userCollection = db.collection('users');
      return await userCollection.countDocuments();
    } catch (error) {
      console.error('Kullanıcı sayma hatası:', error);
      throw error;
    }
  }

  /**
   * Son kayıt olan kullanıcıları getirir
   * @param {number} limit - Maksimum kullanıcı sayısı
   * @returns {Promise<User[]>} - Kullanıcı listesi
   */
  static async findRecent(limit = 10) {
    const db = getDb();
    if (!db) throw new Error('Veritabanı bağlantısı yok');

    try {
      const userCollection = db.collection('users');
      const usersData = await userCollection
        .find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();
      
      return usersData.map(userData => new User(
        userData.id,
        userData.email,
        userData.displayName,
        userData.photoURL,
        userData.isAdmin
      ));
    } catch (error) {
      console.error('Son kullanıcıları getirme hatası:', error);
      throw error;
    }
  }
}

module.exports = User;