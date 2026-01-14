from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/stats/{username}")
def get_chess_stats(username: str):
    url = f"https://api.chess.com/pub/player/{username}"

    headers = {
        "User-Agent": "Chessmeta/1.0 (contact: MagzyPotato)",
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