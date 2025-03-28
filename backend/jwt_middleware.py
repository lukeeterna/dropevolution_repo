# 🛠 Copilot: per favore analizza il seguente codice.
# ✅ Controlla eventuali bug logici, problemi di sicurezza e vulnerabilità.
# ✅ Suggerisci ottimizzazioni per performance e leggibilità.
# ✅ Verifica che il codice sia conforme alle best practice Python 3.
# ✅ Se opportuno, proponi funzioni più pulite, nomi di variabili migliori e gestione degli errori.
# ✅ Evidenzia parti del codice che potrebbero creare conflitti o essere migliorate.

# Middleware JWT per il backend (FastAPI)

from fastapi import Request, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

import os
SECRET_KEY = os.getenv("SECRET_KEY", "VQV8519S8srKFF6iOBAqgJgxUAbbqWUfd0psC19nSi_K-0uAl3_Do-195v4_iKeQs9Q8GXXrDMrr8cacMIqUsw")


class JWTMiddleware(HTTPBearer):
    async def __call__(self, request: Request):
        credentials: HTTPAuthorizationCredentials = await super().__call__(request)
        if credentials:
            if not credentials.scheme == "Bearer":
                raise HTTPException(status_code=403, detail="Invalid authentication scheme.")
            if not self.verify_jwt(credentials.credentials):
                raise HTTPException(status_code=403, detail="Invalid or expired token.")
        else:
            raise HTTPException(status_code=403, detail="Invalid authorization code.")

    def verify_jwt(self, jwtoken: str) -> bool:
        try:
            payload = jwt.decode(jwtoken, SECRET_KEY, algorithms=["HS256"])
            return True
        except jwt.ExpiredSignatureError:
            return False
        except jwt.InvalidTokenError:
            return False

# Esempio di utilizzo in main.py:
# from fastapi import Depends
# from jwt_middleware import JWTMiddleware
# app = FastAPI()
# app.add_middleware(JWTMiddleware)
