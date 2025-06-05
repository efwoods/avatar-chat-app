from pydantic import BaseModel

class AvatarCreate(BaseModel):
    name: str
    description: str | None = None

class Message(BaseModel):
    avatar_id: int
    role: str  # "user" or "avatar"
    content: str