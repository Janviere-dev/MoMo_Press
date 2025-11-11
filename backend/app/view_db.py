import sqlite3

conn = sqlite3.connect('momo_app.db')
cursor = conn.cursor()

# Get all table names
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()

if not tables:
    print("No tables found in the database.")
else:
    for table_name in tables:
        table = table_name[0]
        print(f"\n===== TABLE: {table} =====")
        cursor.execute(f"PRAGMA table_info({table});")
        columns = [col[1] for col in cursor.fetchall()]
        print("Columns:", columns)

        cursor.execute(f"SELECT * FROM {table};")
        rows = cursor.fetchall()
        if not rows:
            print("No data found.")
        else:
            for row in rows:
                print(row)

# Close the connection
conn.close()
