from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests

app = FastAPI(title="Authentication Microservice")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SIS_BASE_URL = "https://automatic-certify-appointee.ngrok-free.dev"
NGROK_HEADERS = {"ngrok-skip-browser-warning": "true"}

class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/login")
async def authenticate_user(req: LoginRequest):
    # 1. Hardcoded Faculty Admin (local)
    if req.username == "teacher" and req.password == "admin123":
        return {"message": "Authenticated", "role": "teacher", "id": 1, "name": "Faculty Admin", "prn": "N/A"}

    # 2. Try SIS OAuth2 form-encoded endpoint (/api/auth/login)
    try:
        sis_response = requests.post(
            f"{SIS_BASE_URL}/api/auth/login",
            data={"username": req.username, "password": req.password},
            headers=NGROK_HEADERS,
            timeout=5
        )
        if sis_response.status_code == 200:
            token_data = sis_response.json()
            access_token = token_data.get("access_token")
            # Fetch full profile via /api/me
            me_response = requests.get(
                f"{SIS_BASE_URL}/api/me",
                headers={**NGROK_HEADERS, "Authorization": f"Bearer {access_token}"},
                timeout=5
            )
            if me_response.status_code == 200:
                me = me_response.json()
                return {
                    "message": "Authenticated",
                    "role": "student",
                    "id": me.get("id") or token_data.get("user_id", 0),
                    "name": me.get("name") or me.get("full_name") or req.username,
                    "prn": me.get("username") or req.username
                }
            return {
                "message": "Authenticated",
                "role": "student",
                "id": token_data.get("user_id", 0),
                "name": token_data.get("full_name") or token_data.get("username", req.username),
                "prn": token_data.get("username", req.username)
            }
    except Exception:
        pass

    # 3. Try legacy SIS JSON endpoint (/api/login)
    try:
        legacy_response = requests.post(
            f"{SIS_BASE_URL}/api/login",
            json={"username": req.username, "password": req.password},
            headers=NGROK_HEADERS,
            timeout=5
        )
        if legacy_response.status_code == 200:
            data = legacy_response.json()
            return {
                "message": "Authenticated",
                "role": "student",
                "id": data.get("id", 0),
                "name": data.get("name") or data.get("username", req.username),
                "prn": data.get("username") or req.username
            }
    except Exception:
        pass

    raise HTTPException(status_code=401, detail="Invalid credentials. Use your SIS registered email and password.")