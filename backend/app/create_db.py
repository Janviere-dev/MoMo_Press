import sqlite3
from pathlib import Path

DB_PATH = Path("momo_press.db")

# Delete old DB if it exists
if DB_PATH.exists():
    DB_PATH.unlink()

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()
cur.execute("PRAGMA foreign_keys = ON;")

# USERS
cur.execute("""
CREATE TABLE IF NOT EXISTS Users (
    User_Id TEXT PRIMARY KEY,
    Phone_Number TEXT UNIQUE,
    Password TEXT
);
""")

# TRANSACTIONS
cur.execute("""
CREATE TABLE IF NOT EXISTS Transactions (
    Transaction_Id TEXT PRIMARY KEY,
    User_Id TEXT,
    Amount REAL,
    Message TEXT,
    Contact TEXT,
    Transaction_Type TEXT CHECK(Transaction_Type IN ('Debit','Credit')),
    Category_Id TEXT,
    Date DATETIME,
    Description TEXT,
    FOREIGN KEY(User_Id) REFERENCES Users(User_Id)
);
""")

# RECENT CONTACTS
cur.execute("""
CREATE TABLE IF NOT EXISTS Recent_Contacts (
    Contact_Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Contact TEXT
);
""")

# CATEGORIES
cur.execute("""
CREATE TABLE IF NOT EXISTS Categories (
    Category_Id TEXT PRIMARY KEY,
    Category_Type TEXT CHECK(Category_Type IN (
        'Money_Transfer', 'MTN_Bundle', 'Merchant', 'Bank_Transfer',
        'Utilities', 'Agent', 'Others'
    ))
);
""")

# SETTINGS
cur.execute("""
CREATE TABLE IF NOT EXISTS Settings (
    Settings_Id INTEGER PRIMARY KEY AUTOINCREMENT,
    User_Id TEXT,
    Theme TEXT CHECK(Theme IN ('Dark','White')),
    General_Spending REAL DEFAULT 0,
    General_Limit REAL DEFAULT 0,
    FOREIGN KEY(User_Id) REFERENCES Users(User_Id)
);
""")

# ALERTS
cur.execute("""
CREATE TABLE IF NOT EXISTS Alerts (
    Alert_Id INTEGER PRIMARY KEY AUTOINCREMENT,
    User_Id TEXT,
    Message TEXT,
    Date DATETIME,
    FOREIGN KEY(User_Id) REFERENCES Users(User_Id)
);
""")

# ANALYTICS
cur.execute("""
CREATE TABLE IF NOT EXISTS Analytics (
    Analytics_Id INTEGER PRIMARY KEY AUTOINCREMENT,
    User_Id TEXT,
    Date DATETIME,
    Avg_Monthly_Spending REAL,
    Avg_Monthly_Received REAL,
    FOREIGN KEY(User_Id) REFERENCES Users(User_Id)
);
""")

# Insert a bit of seed data
cur.execute("INSERT INTO Users VALUES ('USR001', '+254700000001', 'pass123')")
cur.execute("INSERT INTO Categories VALUES ('CAT001', 'Money_Transfer')")
cur.execute("INSERT INTO Transactions VALUES ('TXN001', 'USR001', 1500.0, 'Paid Rent', '+254700000002', 'Debit', 'CAT001', datetime('now'), 'Rent Payment')")

conn.commit()
conn.close()
print('✅ Database created successfully at', DB_PATH.resolve())
