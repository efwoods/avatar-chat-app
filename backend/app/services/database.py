from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models.user import UserLogin
import psycopg2
from passlib.context import CryptContext

# Database connection
def get_db_connection():
    return psycopg2.connect(
        dbname="mvp_db",
        user="postgres",
        password="password",
        host="db",
        port="5432"
    )

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Initialize database
def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL
        );
    """)
    # Insert a test user (for demo purposes)
    hashed_password = pwd_context.hash("testpassword")
    cursor.execute(
        "INSERT INTO users (email, password) VALUES (%s, %s) ON CONFLICT (email) DO NOTHING;",
        ("test@example.com", hashed_password)
    )
    conn.commit()
    cursor.close()
    conn.close()