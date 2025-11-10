import sqlite3

# Connect to your database
conn = sqlite3.connect("momo_press.db")
cursor = conn.cursor()

# List all tables in the database
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()

print("Tables in DB:", tables)

# Close the connection
conn.close()