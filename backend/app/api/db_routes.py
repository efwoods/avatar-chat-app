@app.post("/api/login")
async def login(user: UserLogin):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT password FROM users WHERE email = %s", (user.email,))
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if not result or not pwd_context.verify(user.password, result[0]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    return {"message": "Login successful"}