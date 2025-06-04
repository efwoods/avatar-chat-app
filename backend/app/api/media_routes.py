from fastapi import APIRouter, UploadFile, File, HTTPException
from app.service.database import db

router = APIRouter()

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Read the file content
        content = await file.read()
        
        # Save the file to MongoDB
        result = await db.mongo_db.media.insert_one({ 
            "filename": file.filename, 
            "content": file.content_type, 
            "data": content}) 
        
        # Return the ID of the inserted document
        return {"id": str(result.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))