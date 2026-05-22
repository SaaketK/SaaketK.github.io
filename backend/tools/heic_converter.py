import io
import zipfile
import tempfile
from pathlib import Path
from PIL import Image, ImageCms
from pillow_heif import register_heif_opener
from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import Response
from typing import List

register_heif_opener()

router = APIRouter()

srgb_profile = ImageCms.createProfile("sRGB")


def to_srgb(img):
    if "icc_profile" in img.info:
        src_profile = ImageCms.ImageCmsProfile(
            io.BytesIO(img.info["icc_profile"])
        )
        return ImageCms.profileToProfile(
            img, src_profile, srgb_profile, outputMode="RGB"
        )
    return img.convert("RGB")


def convert_heic_bytes(data: bytes) -> bytes:
    """Convert raw HEIC bytes → JPEG bytes."""
    img = Image.open(io.BytesIO(data))
    img = to_srgb(img)
    out = io.BytesIO()
    img.save(out, "JPEG", quality=100)
    return out.getvalue()


@router.post("/convert")
async def convert(files: List[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")

    # Validate all files up front
    for f in files:
        if not f.filename.lower().endswith((".heic", ".heif")):
            raise HTTPException(
                status_code=400,
                detail=f"'{f.filename}' is not a HEIC/HEIF file",
            )

    # Single file → return the JPEG directly
    if len(files) == 1:
        try:
            data = await files[0].read()
            jpeg_bytes = convert_heic_bytes(data)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Conversion failed: {e}")

        stem = Path(files[0].filename).stem
        return Response(
            content=jpeg_bytes,
            media_type="image/jpeg",
            headers={"Content-Disposition": f'attachment; filename="{stem}.jpg"'},
        )

    # Multiple files → return a ZIP
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in files:
            try:
                data = await f.read()
                jpeg_bytes = convert_heic_bytes(data)
                stem = Path(f.filename).stem
                zf.writestr(f"{stem}.jpg", jpeg_bytes)
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed on '{f.filename}': {e}",
                )

    return Response(
        content=zip_buffer.getvalue(),
        media_type="application/zip",
        headers={"Content-Disposition": 'attachment; filename="converted.zip"'},
    )
