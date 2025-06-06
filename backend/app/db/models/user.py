from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    username: str
    email: EmailStr
    password: str
    created_at: str
    last_login: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
