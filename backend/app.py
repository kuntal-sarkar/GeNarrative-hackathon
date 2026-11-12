
import os

from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS

from routes.ai_routes import ai_bp

from routes.project_ai_routes import project_ai_bp
from routes.global_ai_routes import global_ai_bp  # TAKEGRID_GLOBAL_AI_V1

load_dotenv()

app = Flask(__name__)

# Allow only the local Vite frontend during development.
CORS(
    app,
    resources={
        r"/api/*": {
            "origins": [
                "http://localhost:5173",
                "http://127.0.0.1:5173",
            ]
        }
    },
)

# Register AI endpoints.
app.register_blueprint(ai_bp)
app.register_blueprint(project_ai_bp)
app.register_blueprint(global_ai_bp)  # TAKEGRID_GLOBAL_AI_V1


@app.get("/")
def home():
    return jsonify({
        "success": True,
        "message": "FRAMEFORGE backend is running",
    })


@app.get("/api/health")
def health():
    return jsonify({
        "success": True,
        "status": "healthy",
        "service": "FRAMEFORGE AI Backend",
    })


if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", "5000"))

    app.run(
        host="127.0.0.1",
        port=port,
        debug=False,
    )
