import SQLite from 'react-native-sqlite-storage';

SQLite.DEBUG(true);
SQLite.enablePromise(true);

export const getDBConnection = async () => {
  try {
    const db = await SQLite.openDatabase({ name: 'momo_app.db', location: 'default' });
    await db.executeSql('PRAGMA foreign_keys = ON;');
    return db;
  } catch (error) {
    console.error('Error opening database:', error);
    throw error;
  }
};

export const createTables = async (db: SQLite.SQLiteDatabase) => {
  // USERS TABLE
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS Users (
      Phone_Number TEXT PRIMARY KEY,
      Name TEXT,
      Password TEXT NOT NULL,
      Amount REAL DEFAULT 0
    );
  `);

  // MONEY TRANSFERS TABLE
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS Money_Transfers (
      Transfer_Id TEXT PRIMARY KEY,
      Phone_Number TEXT NOT NULL,
      Recipient_Name TEXT,
      Recipient_Phone TEXT,
      Amount REAL NOT NULL,
      Transaction_Type TEXT CHECK(Transaction_Type IN ('received','sent')) NOT NULL,
      Fee REAL DEFAULT 0,
      Date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(Phone_Number) REFERENCES Users(Phone_Number) ON DELETE CASCADE
    );
  `);
  
  // MERCHANT PAYMENT TABLE
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS Merchant_Payment (
      Transfer_Id TEXT PRIMARY KEY,
      Phone_Number TEXT NOT NULL,
      Recipient_Name TEXT,
      Recipient_Code TEXT,
      Amount REAL NOT NULL,
      Fee REAL DEFAULT 0,
      Date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(Phone_Number) REFERENCES Users(Phone_Number) ON DELETE CASCADE
    );
  `);

  // BUNDLES TABLE
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS Bundles (
      Bundle_Id TEXT PRIMARY KEY,
      Phone_Number TEXT NOT NULL,
      Bundle_Type TEXT CHECK(Bundle_Type IN ('DATA','AIRTIME')) NOT NULL,
      Bundle_Amount REAL NOT NULL,
      Amount REAL NOT NULL,
      Date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(Phone_Number) REFERENCES Users(Phone_Number) ON DELETE CASCADE
    );
  `);

  // BANK TRANSFERS TABLE
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS Bank_Transfers (
      Transfer_Id TEXT PRIMARY KEY,
      Phone_Number TEXT NOT NULL,
      Amount REAL NOT NULL,
      Transaction_Type TEXT CHECK(Transaction_Type IN ('received','sent')) NOT NULL,      
      Fee REAL DEFAULT 0,
      Date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(Phone_Number) REFERENCES Users(Phone_Number) ON DELETE CASCADE
    );
  `);

  // OTHERS TABLE
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS Others (
      Other_Id TEXT PRIMARY KEY,
      Phone_Number TEXT NOT NULL,
      Name TEXT,
      Description TEXT NOT NULL,
      Amount REAL NOT NULL,
      Date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(Phone_Number) REFERENCES Users(Phone_Number) ON DELETE CASCADE
    );
  `);

  // SETTINGS TABLE
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS Settings (
      Settings_Id TEXT PRIMARY KEY,
      Phone_Number TEXT NOT NULL UNIQUE,
      Theme TEXT CHECK(Theme IN ('Light','Dark')) DEFAULT 'Light',
      General_Spending_Limit REAL DEFAULT 0,
      Money_Transfer_Limit REAL DEFAULT 0,
      Bundles_Limit REAL DEFAULT 0,
      Merchant_Limit REAL DEFAULT 0,
      Bank_Transfer_Limit REAL DEFAULT 0,
      Utilities_Limit REAL DEFAULT 0,
      Agent_Limit REAL DEFAULT 0,
      Others_Limit REAL DEFAULT 0,
      FOREIGN KEY(Phone_Number) REFERENCES Users(Phone_Number) ON DELETE CASCADE
    );
  `);

  // ALERTS TABLE
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS Alerts (
      Alert_Id TEXT PRIMARY KEY,
      Phone_Number TEXT NOT NULL,
      Message TEXT NOT NULL,
      Date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(Phone_Number) REFERENCES Users(Phone_Number) ON DELETE CASCADE
    );
  `);

  // AGENT TABLE
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS Agent_Transactions (
      Transaction_Id TEXT PRIMARY KEY,
      Phone_Number TEXT NOT NULL,
      Agent_Name TEXT NOT NULL,
      Amount REAL NOT NULL,
      Fee REAL DEFAULT 0,
      Date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(Phone_Number) REFERENCES Users(Phone_Number) ON DELETE CASCADE
    );
  `);

  // UTILITIES TABLE
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS Utilities (
      Transaction_Id TEXT PRIMARY KEY,
      Phone_Number TEXT NOT NULL,
      Name TEXT NOT NULL,
      Amount REAL NOT NULL,
      Fee REAL DEFAULT 0,
      Date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(Phone_Number) REFERENCES Users(Phone_Number) ON DELETE CASCADE
    );
  `);
};

export const initDatabase = async () => {
  try {
    const db = await getDBConnection();
    await createTables(db);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};
