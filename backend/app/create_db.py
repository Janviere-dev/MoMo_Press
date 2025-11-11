import sqlite3
import uuid

# Connect to SQLite database (or create it if it doesn't exist)
conn = sqlite3.connect('momo_app.db')
cursor = conn.cursor()

# Enable foreign key support
cursor.execute("PRAGMA foreign_keys = ON;")

# USERS TABLE
cursor.execute("""
CREATE TABLE IF NOT EXISTS Users (
    User_Id TEXT PRIMARY KEY,
    Phone_Number TEXT UNIQUE NOT NULL,
    Name TEXT,
    Password TEXT NOT NULL,
    Created_At DATETIME DEFAULT CURRENT_TIMESTAMP
);
""")

# MONEY TRANSFERS TABLE
cursor.execute("""
CREATE TABLE IF NOT EXISTS Money_Transfers (
    Transfer_Id TEXT PRIMARY KEY,
    User_Id TEXT NOT NULL,
    Recipient_Name TEXT,
    Recipient_Phone TEXT,
    Amount REAL NOT NULL,
    Received TEXT NOT NULL,
    Sent TEXT NOT NULL, 
    Fee REAL DEFAULT 0,
    Message TEXT,
    Date DATETIME DEFAULT CURRENT_TIMESTAMP,
    Status TEXT CHECK(Status IN ('pending','completed','failed')) DEFAULT 'pending',
    FOREIGN KEY(User_Id) REFERENCES Users(User_Id) ON DELETE CASCADE
);
""")

# BUNDLES TABLE
cursor.execute("""
CREATE TABLE IF NOT EXISTS Bundles (
    Bundle_Id TEXT PRIMARY KEY,
    User_Id TEXT NOT NULL,
    Phone_Number TEXT NOT NULL,
    Bundle_Type TEXT NOT NULL,
    Amount REAL NOT NULL,
    Date DATETIME DEFAULT CURRENT_TIMESTAMP,
    Status TEXT CHECK(Status IN ('pending','completed','failed')) DEFAULT 'pending',
    FOREIGN KEY(User_Id) REFERENCES Users(User_Id) ON DELETE CASCADE
);
""")

# BANK TRANSFERS TABLE
cursor.execute("""
CREATE TABLE IF NOT EXISTS Bank_Transfers (
    Transfer_Id TEXT PRIMARY KEY,
    User_Id TEXT NOT NULL,
    Received TEXT NOT NULL,
    Sent TEXT NOT NULL,
    Amount REAL NOT NULL,
    Fee REAL DEFAULT 0,
    Date DATETIME DEFAULT CURRENT_TIMESTAMP,
    Status TEXT CHECK(Status IN ('pending','completed','failed')) DEFAULT 'pending',
    FOREIGN KEY(User_Id) REFERENCES Users(User_Id) ON DELETE CASCADE
);
""")

# OTHERS TABLE
cursor.execute("""
CREATE TABLE IF NOT EXISTS Others (
    Other_Id TEXT PRIMARY KEY,
    User_Id TEXT NOT NULL,
    Description TEXT NOT NULL,
    Amount REAL NOT NULL,
    Date DATETIME DEFAULT CURRENT_TIMESTAMP,
    Status TEXT CHECK(Status IN ('pending','completed','failed')) DEFAULT 'pending',
    FOREIGN KEY(User_Id) REFERENCES Users(User_Id) ON DELETE CASCADE
);
""")

# SETTINGS TABLE
cursor.execute("""
CREATE TABLE IF NOT EXISTS Settings (
    Settings_Id TEXT PRIMARY KEY,
    User_Id TEXT NOT NULL UNIQUE,
    Theme TEXT CHECK(Theme IN ('Light','Dark')) DEFAULT 'Light',
    General_Spending_Limit REAL DEFAULT 0,
    Money_Transfer_Limit REAL DEFAULT 0,
    Bundles_Limit REAL DEFAULT 0,
    Merchant_Limit REAL DEFAULT 0,
    Bank_Transfer_Limit REAL DEFAULT 0,
    Utilities_Limit REAL DEFAULT 0,
    Withdrawal_Limit REAL DEFAULT 0,
    Others_Limit REAL DEFAULT 0,
    FOREIGN KEY(User_Id) REFERENCES Users(User_Id) ON DELETE CASCADE
);
""")

# ALERTS TABLE
cursor.execute("""
CREATE TABLE IF NOT EXISTS Alerts (
    Alert_Id TEXT PRIMARY KEY,
    User_Id TEXT NOT NULL,
    Message TEXT NOT NULL,
    Date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(User_Id) REFERENCES Users(User_Id) ON DELETE CASCADE
);
""")

# RECENT CONTACTS TABLE
cursor.execute("""
CREATE TABLE IF NOT EXISTS Recent_Contacts (
    User_Id TEXT NOT NULL,
    Phone_Number TEXT NOT NULL,
    Contact_Name TEXT,
    PRIMARY KEY(User_Id, Phone_Number),
    FOREIGN KEY(User_Id) REFERENCES Users(User_Id) ON DELETE CASCADE
);
""")

# Commit changes and close connection
conn.commit()
conn.close()

print('DB "momo_app.db" created successfully with fully relational tables including Others')