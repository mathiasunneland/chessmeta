from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import requests, os

load_dotenv()

app = FastAPI()

FRONTEND_URL = os.environ["FRONTEND_URL"]
CONTACT_EMAIL = os.environ["CONTACT_EMAIL"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/stats/{username}")
def get_chess_stats(username: str):
    url = f"https://api.chess.com/pub/player/{username}"

    headers = {
        "User-Agent": "Chessmeta/1.0 (contact: {CONTACT_EMAIL})",
        "Accept": "application/json"
    }

    response = requests.get(url, headers=headers, timeout=10)

    if response.status_code != 200:
        return {"error": "User not found"}

    data = response.json()
    return {
        "username": data.get("username"),
        "title": data.get("title"),
    }