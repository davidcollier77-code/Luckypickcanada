import urllib.request
import json
import os

def get_comments():
    try:
        url = "http://localhost:8080/pr-comments"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        return f"API Error: {e}"

print(get_comments())
