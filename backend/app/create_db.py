import sqlite3

# Create database file
conn = sqlite3.connect('momo.db')
cursor = conn.cursor()

# Read schema.sql
with open('schema.sql', 'r') as f:
    schema = f.read()

# Execute schema
cursor.executescript(schema)

conn.commit()
conn.close()

print("Database momo.db created with all tables!")