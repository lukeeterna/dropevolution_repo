from fastapi import APIRouter
from backend.services.drive_backup import upload_file

backup_bp = APIRouter()

@backup_bp.post("/backup")
def trigger_backup():
    file_id = upload_file("README.md", "Backup_README.md")
    return {"status": "ok", "file_id": file_id}
