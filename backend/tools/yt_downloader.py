import os
import re
import tempfile
import yt_dlp
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

router = APIRouter()


def is_valid_youtube_url(url: str) -> bool:
    pattern = (
        r"(https?://)?(www\.)?"
        r"(youtube\.com/watch\?v=|youtu\.be/|youtube\.com/shorts/)"
        r"[\w\-]+"
    )
    return bool(re.search(pattern, url))


def download(url: str, fmt: str, output_dir: str) -> str:
    """Download a YouTube URL as mp3 or mp4. Returns the output file path."""
    common_opts = {
        "outtmpl": os.path.join(output_dir, "%(title)s.%(ext)s"),
        "noplaylist": True,
        "quiet": True,
        "progress": False,
    }

    if fmt == "mp3":
        ydl_opts = {
            **common_opts,
            "format": "bestaudio/best",
            "postprocessors": [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "192",
            }],
        }
    else:
        ydl_opts = {
            **common_opts,
            "format": "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best",
            "merge_output_format": "mp4",
        }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])

    files = os.listdir(output_dir)
    if not files:
        raise RuntimeError("Download completed but no output file found.")
    return os.path.join(output_dir, files[0])


class DownloadRequest(BaseModel):
    url: str
    format: str  # "mp3" or "mp4"


@router.post("/download")
def yt_download(req: DownloadRequest):
    if req.format not in ("mp3", "mp4"):
        raise HTTPException(status_code=400, detail="Format must be 'mp3' or 'mp4'")

    if not is_valid_youtube_url(req.url):
        raise HTTPException(status_code=400, detail="Invalid YouTube URL")

    tmp_dir = tempfile.mkdtemp()

    try:
        file_path = download(req.url, req.format, tmp_dir)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    media_type = "audio/mpeg" if req.format == "mp3" else "video/mp4"
    filename = os.path.basename(file_path)

    return FileResponse(path=file_path, media_type=media_type, filename=filename)
