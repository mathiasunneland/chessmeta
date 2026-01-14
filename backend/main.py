from fastapi import FastAPI
import requests

app = FastAPI()

@app.get("/stats/{username}")
def get_chess_stats(username: str):
    url = f"https://api.chess.com/pub/player/{username}"
    response = requests.get(url)

    if response.status_code != 200:
        return {"error": "User not found"}

    data = response.json()
    return {
        "username": data.get("username"),
        "title": data.get("title"),
    }