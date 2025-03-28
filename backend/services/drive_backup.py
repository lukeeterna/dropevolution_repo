from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.http import MediaFileUpload
import os

# Configurazione
SCOPES = ['https://www.googleapis.com/auth/drive.file']

# Ottieni il percorso da variabili d'ambiente
CLIENT_SECRET_FILE = os.getenv("CLIENT_SECRET_FILE", "gdrive_backup/client_secret_507763039316-niud8vdtvjncc3p16eop7hjkq7ufsor4.apps.googleusercontent.com.json")
TOKEN_FILE = os.getenv("TOKEN_FILE", "gdrive_backup/token.json")

def get_drive_service():
    creds = None
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    else:
        flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRET_FILE, SCOPES)
        creds = flow.run_local_server(port=0)
        with open(TOKEN_FILE, 'w') as token:
            token.write(creds.to_json())
    return build('drive', 'v3', credentials=creds)

def upload_file(filepath, filename, mimetype='application/octet-stream'):
    service = get_drive_service()
    file_metadata = {'name': filename}
    media = MediaFileUpload(filepath, mimetype=mimetype)
    file = service.files().create(body=file_metadata, media_body=media, fields='id').execute()
    return file.get('id')
