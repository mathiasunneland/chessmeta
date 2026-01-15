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
    profile_url = f"https://api.chess.com/pub/player/{username}"
    stats_url = f"https://api.chess.com/pub/player/{username}/stats"

    headers = {
        "User-Agent": "Chessmeta/1.0 (contact: {CONTACT_EMAIL})",
        "Accept": "application/json"
    }

    profile_response = requests.get(profile_url, headers=headers, timeout=10)
    stats_response = requests.get(stats_url, headers=headers, timeout=10)

    if profile_response.status_code != 200 or stats_response.status_code != 200:
        return {"error": "User not found"}

    profile_data = profile_response.json()
    stats_data = stats_response.json()
    return {
        "username": profile_data.get("username"),
        "title": profile_data.get("title"),
        "bullet_rating_current": stats_data.get("chess_bullet", {}).get("last", {}).get("rating"),
        "bullet_rating_highest": stats_data.get("chess_bullet", {}).get("best", {}).get("rating"),
        "blitz_rating_current": stats_data.get("chess_blitz", {}).get("last", {}).get("rating"),
        "blitz_rating_highest": stats_data.get("chess_blitz", {}).get("best", {}).get("rating"),
        "rapid_rating_current": stats_data.get("chess_rapid", {}).get("last", {}).get("rating"),
        "rapid_rating_highest": stats_data.get("chess_rapid", {}).get("best", {}).get("rating"),
    }