import jwt
from datetime import datetime, timedelta
import os

# Inserisci qui la tua secret key
SECRET_KEY = "VQV8519S8srKFF6iOBAqgJgxUAbbqWUfd0psC19nSi_K-0uAl3_Do-195v4_iKeQs9Q8GXXrDMrr8cacMIqUsw"

# Payload del token
payload = {
    "sub": "testuser",
    "exp": datetime.utcnow() + timedelta(hours=1)
}

# Generazione del token
token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

# Converte il token in stringa se necessario (compatibilità versioni PyJWT)
if isinstance(token, bytes):
    token = token.decode('utf-8')

# Stampa il token generato
print("Il tuo token JWT è:")
print(token)

# Salva il token in un file txt nella root principale del progetto
root_path = os.path.dirname(os.path.abspath(__file__))
file_path = os.path.join(root_path, "generated_token.txt")
with open(file_path, "w") as file:
    file.write(token)

print(f"Token salvato in {file_path}")
