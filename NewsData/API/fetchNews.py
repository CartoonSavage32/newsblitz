from flask import Flask, jsonify, request, redirect
from flask_cors import CORS
import json
import os
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
import io
from datetime import datetime
import pickle
from dotenv import load_dotenv

# Load environment variables from parent directory
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

app = Flask(__name__)
CORS(app)

# os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

# If modifying these scopes, delete the token.pickle file
SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]

# Cache for performance
cache = {"data": None, "last_fetch": None}

# Get credentials from env
CLIENT_CONFIG = {
    "web": {
        "client_id": os.getenv("GOOGLE_CLIENT_ID"),
        "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "redirect_uris": ["http://localhost:5000/oauth2callback"],
    }
}


def get_credentials():
    """Get valid credentials with refresh token"""
    creds = None

    # Try to use refresh token from environment
    refresh_token = os.getenv("GOOGLE_REFRESH_TOKEN")
    if refresh_token:
        creds = Credentials(
            None,  # No access token
            refresh_token=refresh_token,
            token_uri=CLIENT_CONFIG["web"]["token_uri"],
            client_id=CLIENT_CONFIG["web"]["client_id"],
            client_secret=CLIENT_CONFIG["web"]["client_secret"],
            scopes=SCOPES,
        )

    # If credentials exist but are expired, refresh them
    if creds and creds.expired and creds.refresh_token:
        try:
            creds.refresh(Request())
        except Exception as e:
            print(f"Error refreshing token: {e}")
            creds = None

    # If no valid credentials, need to get new ones
    if not creds:
        flow = Flow.from_client_config(
            CLIENT_CONFIG,
            scopes=SCOPES,
            redirect_uri="http://localhost:5000/oauth2callback",
        )
        auth_url, _ = flow.authorization_url(access_type="offline", prompt="consent")
        print(f"Please visit this URL to authorize: {auth_url}")
        return None

    return creds


def load_data():
    """Load news data from Google Drive"""
    try:
        creds = get_credentials()
        if not creds:
            raise Exception("No valid credentials")

        service = build("drive", "v3", credentials=creds)

        # Get folder ID from environment
        folder_id = os.environ.get("GOOGLE_DRIVE_FOLDER_ID")

        # Search for news_summarised.json in the folder
        query = f"'{folder_id}' in parents and name = 'news_summarised.json'"
        results = service.files().list(q=query, fields="files(id, name)").execute()
        files = results.get("files", [])

        if not files:
            raise FileNotFoundError("news_summarised.json not found in Drive")

        file_id = files[0]["id"]

        # Download file
        request = service.files().get_media(fileId=file_id)
        fh = io.BytesIO()
        downloader = MediaIoBaseDownload(fh, request)

        done = False
        while not done:
            status, done = downloader.next_chunk()

        # Read and parse JSON
        fh.seek(0)
        news_data = json.loads(fh.read().decode())

        # Update cache
        cache["data"] = news_data
        cache["last_fetch"] = datetime.now()

        return news_data

    except Exception as e:
        print(f"Failed to load from Drive: {e}")
        # Fallback to local file
        return load_local_data()


def load_local_data():
    """Fallback to local file"""
    try:
        local_path = os.path.join(
            os.path.dirname(__file__), "..", "Data/news_summarised.json"
        )
        with open(local_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Failed to load local file: {e}")
        raise


@app.route("/auth")
def auth():
    """Start OAuth flow"""
    if not os.getenv("GOOGLE_CLIENT_ID") or not os.getenv("GOOGLE_CLIENT_SECRET"):
        return (
            jsonify(
                {
                    "error": "Missing Google OAuth credentials. Please check environment variables."
                }
            ),
            500,
        )

    flow = Flow.from_client_config(
        CLIENT_CONFIG,
        scopes=SCOPES,
        redirect_uri="http://localhost:5000/oauth2callback",
    )
    auth_url, _ = flow.authorization_url(
        access_type="offline", prompt="consent"  # Forces refresh token
    )
    return redirect(auth_url)


@app.route("/oauth2callback")
def oauth2callback():
    """Handle OAuth 2.0 callback"""
    try:
        flow = Flow.from_client_config(
            CLIENT_CONFIG,
            scopes=SCOPES,
            redirect_uri="http://localhost:5000/oauth2callback",
        )

        # Get authorization code from callback
        flow.fetch_token(authorization_response=request.url)

        # Get credentials including refresh token
        creds = flow.credentials

        # Save credentials for future use
        with open("token.pickle", "wb") as token:
            pickle.dump(creds, token)

        return "Authentication successful! You can close this window."

    except Exception as e:
        return f"Authentication failed: {str(e)}"


@app.route("/get_refresh_token")
def get_refresh_token():
    """Get refresh token to store in .env"""
    if os.path.exists("token.pickle"):
        with open("token.pickle", "rb") as token:
            creds = pickle.load(token)
            if creds and creds.refresh_token:
                return jsonify(
                    {
                        "refresh_token": creds.refresh_token,
                        "instructions": "Add this to your .env as GOOGLE_REFRESH_TOKEN",
                    }
                )
    return jsonify({"error": "No refresh token found. Please authenticate first."}), 404


@app.route("/getAllNews", methods=["GET"])
def get_all_news():
    try:
        news_data = load_data()
        return jsonify(news_data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 404


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint"""
    return (
        jsonify(
            {
                "status": "healthy",
                "cache_status": "active" if cache["data"] else "empty",
                "last_fetch": str(cache["last_fetch"]) if cache["last_fetch"] else None,
                "google_credentials": {
                    "client_id_present": bool(os.getenv("GOOGLE_CLIENT_ID")),
                    "client_secret_present": bool(os.getenv("GOOGLE_CLIENT_SECRET")),
                    "folder_id_present": bool(os.getenv("GOOGLE_DRIVE_FOLDER_ID")),
                    "token_present": os.path.exists("token.pickle"),
                },
            }
        ),
        200,
    )


if __name__ == "__main__":
    app.run(debug=True)
