import imghdr
from datetime import datetime
from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import Response

router = APIRouter()

SUPPORTED_TYPES = {
    "image/png":  ("png",  "image/png"),
    "image/jpeg": ("jpg",  "image/jpeg"),
    "image/gif":  ("gif",  "image/gif"),
    "image/webp": ("webp", "image/webp"),
    "image/bmp":  ("bmp",  "image/bmp"),
}


@router.post("/upload")
async def clipboard_upload(file: UploadFile = File(...)):
    if file.content_type not in SUPPORTED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported type '{file.content_type}'. Supported: {list(SUPPORTED_TYPES)}",
        )

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file received")

    ext, media_type = SUPPORTED_TYPES[file.content_type]
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"clipboard_{timestamp}.{ext}"

    return Response(
        content=data,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
