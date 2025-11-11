PRAGMA foreign_keys = ON;

-- Users table
CREATE TABLE IF NOT EXISTS Users (
    User_Id TEXT PRIMARY KEY,
    Phone_Number TEXT UNIQUE,
    Name TEXT,
    Password TEXT,
    Created_At DATETIME
);

-- Money Transfers
CREATE TABLE IF NOT EXISTS Money_Transfers (
    Transfer_Id TEXT PRIMARY KEY,
    User_Id TEXT,
    Recipient_Name TEXT,
    Recipient_Phone TEXT,
    Amount NUMERIC,
    Fee NUMERIC,
    Message TEXT,
    Date DATETIME,
    Status TEXT CHECK(Status IN ('pending','completed','failed')),
    FOREIGN KEY(User_Id) REFERENCES Users(User_Id)
);

-- Bundles
CREATE TABLE IF NOT EXISTS Bundles (
    Bundle_Id TEXT PRIMARY KEY,
    User_Id TEXT,
    Phone_Number TEXT,
    Bundle_Type TEXT,
    Amount NUMERIC,
    Date DATETIME,
    Status TEXT,
    FOREIGN KEY(User_Id) REFERENCES Users(User_Id)
);

-- Bank Transfers
CREATE TABLE IF NOT EXISTS Bank_Transfers (
    Transfer_Id TEXT PRIMARY KEY,
    User_Id TEXT,
    Bank_Name TEXT,
    Account_Number TEXT,
    Account_Name TEXT,
    Amount NUMERIC,
    Fee NUMERIC,
    Date DATETIME,
    Status TEXT,
    FOREIGN KEY(User_Id) REFERENCES Users(User_Id)
);

-- Alerts
CREATE TABLE IF NOT EXISTS Alerts (
    Alert_Id TEXT PRIMARY KEY,
    User_Id TEXT,
    Message TEXT,
    Date DATETIME,
    FOREIGN KEY(User_Id) REFERENCES Users(User_Id)
);

-- Settings
CREATE TABLE IF NOT EXISTS Settings (
    Settings_Id TEXT PRIMARY KEY,
    User_Id TEXT,
    Theme TEXT CHECK(Theme IN ('Light','Dark')),
    General_Spending_Limit NUMERIC,
    Money_Transfer_Limit NUMERIC,
    Bundles_Limit NUMERIC,
    Merchant_Limit NUMERIC,
    Bank_Transfer_Limit NUMERIC,
    Utilities_Limit NUMERIC,
    Withdrawal_Limit NUMERIC,
    Others_Limit NUMERIC,
    FOREIGN KEY(User_Id) REFERENCES Users(User_Id)
);

-- Recent Contacts
CREATE TABLE IF NOT EXISTS Recent_Contacts (
    Phone_Number TEXT PRIMARY KEY,
    Contact TEXT
);