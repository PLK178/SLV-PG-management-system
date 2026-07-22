import sqlite3
import os
from ..utils.security import hash_password

DB_FILE = "pg_management.db"

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create Admins table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS admins (
        email TEXT PRIMARY KEY,
        password TEXT NOT NULL
    )
    """)
    
    # Create Rooms table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        number TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL,
        rent REAL NOT NULL,
        floor TEXT NOT NULL,
        status TEXT NOT NULL
    )
    """)
    
    # Create Tenants table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tenants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT NOT NULL,
        room TEXT NOT NULL,
        joinDate TEXT NOT NULL,
        paymentStatus TEXT NOT NULL,
        password TEXT NOT NULL
    )
    """)
    
    # Create Payments table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant TEXT NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        method TEXT NOT NULL,
        status TEXT NOT NULL
    )
    """)
    
    # Create Complaints table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS complaints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant TEXT NOT NULL,
        room TEXT NOT NULL,
        issue TEXT NOT NULL,
        severity TEXT NOT NULL,
        status TEXT NOT NULL
    )
    """)
    
    # Create Outings table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS outings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant TEXT NOT NULL,
        room TEXT NOT NULL,
        departureTime TEXT NOT NULL,
        expectedReturnTime TEXT NOT NULL,
        actualReturnTime TEXT,
        purpose TEXT NOT NULL,
        status TEXT NOT NULL
    )
    """)
    
    conn.commit()
    
    # Seed default data if empty
    # Check if admins exists
    cursor.execute("SELECT COUNT(*) FROM admins")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO admins (email, password) VALUES (?, ?)", ("admin", hash_password("admin")))
    else:
        # Also ensure "admin" exists in the database
        cursor.execute("INSERT OR REPLACE INTO admins (email, password) VALUES (?, ?)", ("admin", hash_password("admin")))
        
    # Check if rooms exists
    cursor.execute("SELECT COUNT(*) FROM rooms")
    if cursor.fetchone()[0] == 0:
        rooms = [
            (1, '101', 'Single', 8500, '1st', 'Occupied'),
            (2, '102', 'Double Sharing', 6000, '1st', 'Vacant'),
            (3, '201', 'Single', 9000, '2nd', 'Occupied'),
            (4, '202', 'Triple Sharing', 4500, '2nd', 'Maintenance'),
            (5, '301', 'Double Sharing', 6500, '3rd', 'Occupied')
        ]
        cursor.executemany("INSERT OR REPLACE INTO rooms (id, number, type, rent, floor, status) VALUES (?, ?, ?, ?, ?, ?)", rooms)
        
    # Check if tenants exists
    cursor.execute("SELECT COUNT(*) FROM tenants")
    if cursor.fetchone()[0] == 0:
        tenants = [
            (1, 'Alice Smith', 'alice@example.com', '+91 9876543210', '101', '2026-01-10', 'Paid', hash_password('tenant123')),
            (2, 'Bob Johnson', 'bob@example.com', '+91 8765432109', '201', '2026-03-15', 'Pending', hash_password('tenant123')),
            (3, 'Charlie Davis', 'charlie@example.com', '+91 7654321098', '301', '2026-05-01', 'Paid', hash_password('tenant123'))
        ]
        cursor.executemany("INSERT OR REPLACE INTO tenants (id, name, email, phone, room, joinDate, paymentStatus, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", tenants)
        
    # Check if payments exists
    cursor.execute("SELECT COUNT(*) FROM payments")
    if cursor.fetchone()[0] == 0:
        payments = [
            (1, 'Alice Smith', 8500, '2026-07-05', 'UPI', 'Success'),
            (2, 'Charlie Davis', 6500, '2026-07-02', 'Net Banking', 'Success'),
            (3, 'Bob Johnson', 9000, '2026-07-01', 'Cash', 'Pending')
        ]
        cursor.executemany("INSERT OR REPLACE INTO payments (id, tenant, amount, date, method, status) VALUES (?, ?, ?, ?, ?, ?)", payments)
        
    # Check if complaints exists
    cursor.execute("SELECT COUNT(*) FROM complaints")
    if cursor.fetchone()[0] == 0:
        complaints = [
            (1, 'Bob Johnson', '201', 'AC is leaking water', 'High', 'Pending'),
            (2, 'Alice Smith', '101', 'Wifi signal is weak in the corner', 'Low', 'Resolved')
        ]
        cursor.executemany("INSERT OR REPLACE INTO complaints (id, tenant, room, issue, severity, status) VALUES (?, ?, ?, ?, ?, ?)", complaints)
        
    # Check if outings exists
    cursor.execute("SELECT COUNT(*) FROM outings")
    if cursor.fetchone()[0] == 0:
        outings = [
            (1, 'Alice Smith', '101', '2026-07-20T10:00', '2026-07-20T18:00', '2026-07-20T17:30', 'Library Study', 'Returned'),
            (2, 'Bob Johnson', '201', '2026-07-20T14:30', '2026-07-20T21:30', None, 'Dinner with friends', 'Out')
        ]
        cursor.executemany("INSERT OR REPLACE INTO outings (id, tenant, room, departureTime, expectedReturnTime, actualReturnTime, purpose, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", outings)

    # Migrate existing passwords in database to bcrypt if they are plain text
    cursor.execute("SELECT email, password FROM admins")
    for row in cursor.fetchall():
        pwd = row["password"]
        if not (pwd.startswith("$2b$") or pwd.startswith("$2a$")):
            cursor.execute("UPDATE admins SET password = ? WHERE email = ?", (hash_password(pwd), row["email"]))

    cursor.execute("SELECT id, password FROM tenants")
    for row in cursor.fetchall():
        pwd = row["password"]
        if not (pwd.startswith("$2b$") or pwd.startswith("$2a$")):
            cursor.execute("UPDATE tenants SET password = ? WHERE id = ?", (hash_password(pwd), row["id"]))
        
    conn.commit()
    conn.close()
