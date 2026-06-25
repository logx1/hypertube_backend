import requests

QB_URL = "http://qbittorrent:8080"
USERNAME = "admin"
PASSWORD = "xsawgySyT"

session = requests.Session()
session.headers.update({"Referer": QB_URL})

# 1. Log In
login_resp = session.post(
    f"{QB_URL}/api/v2/auth/login",
    data={"username": USERNAME, "password": PASSWORD}
)
print(f"Login status code: {login_resp.status_code}")
print(f"Login response text: '{login_resp.text}'")
print(f"Login response headers: {login_resp.headers}")

if login_resp.status_code not in (200, 204):
    print("Login failed. Check if the Web UI is reachable, credentials are correct, and network is accessible.")
    exit(1)

# 2. Search for torrent by name
search_term = input("Enter torrent name to search: ")
search_url = f"https://apibay.org/q.php?q={search_term}"
resp = requests.get(search_url)
try:
    results = resp.json()
except Exception as e:
    print(f"Error parsing search results: {e}")
    exit(1)

if not results or "name" not in results[0]:
    print("No results found.")
    exit(1)

# 3. Pick the first result
torrent = results[0]
info_hash = torrent.get("info_hash")
name = torrent.get("name")
if not info_hash or not name:
    print("Invalid torrent data.")
    exit(1)

magnet_link = f"magnet:?xt=urn:btih:{info_hash}&dn={name.replace(' ', '+')}"
print(f"Adding: {name}")
print(f"Magnet link: {magnet_link}")

# 4. Add torrent via API (try without savepath)
add_resp = session.post(
    f"{QB_URL}/api/v2/torrents/add",
    data={"urls": magnet_link}
)

print(f"API response: {add_resp.status_code} {add_resp.text}")

if add_resp.status_code == 200:
    try:
        resp_json = add_resp.json()
        if resp_json.get("success_count", 0) > 0:
            print("Torrent added successfully.")
        else:
            print(f"Failed to add torrent: {add_resp.text}")
    except Exception:
        print(f"Unexpected response: {add_resp.text}")
else:
    print(f"Failed to add torrent: {add_resp.text}")