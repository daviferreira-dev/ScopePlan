import sys
sys.path.insert(0, r"C:\Users\PC Gamer\ScopePlan\backend")
from dotenv import load_dotenv
import os
load_dotenv(r"C:\Users\PC Gamer\ScopePlan\backend\.env")

print("JWT_SECRET_KEY:", os.environ.get("JWT_SECRET_KEY", "NOT SET")[:20] + "...")
print("SECRET_KEY:", os.environ.get("SECRET_KEY", "NOT SET")[:20] + "...")

# Test: create and verify a JWT token using the loaded key
from flask import Flask
from flask_jwt_extended import JWTManager, create_access_token, decode_token

app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY")
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY")
jwt = JWTManager(app)

with app.app_context():
    token = create_access_token(identity=29)
    print("Token created:", token[:50] + "...")
    try:
        decoded = decode_token(token)
        print("Token decoded OK:", decoded)
    except Exception as e:
        print("Token decode FAIL:", e)
