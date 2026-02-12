import requests
import random
import time

API_BASE_URL = "http://localhost:8000/api/leaderboard"

def submit_score(user_id):
    score = random.randint(100, 10000)
    requests.post(
        f"{API_BASE_URL}/submit",
        json={"user_id": user_id, "score": score}
    )

def get_top_players():
    response = requests.get(f"{API_BASE_URL}/top")
    print("Status:", response.status_code)
    print("Raw:", response.text)
    return response.json()

def get_user_rank(user_id):
    response = requests.get(f"{API_BASE_URL}/rank/{user_id}")
    return response.json()

if __name__ == "__main__":
    while True:
        user_id = random.randint(1, 103)  # based on your max ID
        submit_score(user_id)
        print(get_top_players())
        print(get_user_rank(user_id))
        time.sleep(random.uniform(0.5, 2))
