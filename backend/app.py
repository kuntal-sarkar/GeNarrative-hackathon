from routes.user_global_chat_routes import user_global_chat_bp

import os

from dotenv import load_dotenv
from routes.password_recovery_routes import password_recovery_bp
from flask import Flask, jsonify
from flask_cors import CORS

from routes.ai_routes import ai_bp

from routes.project_ai_routes import project_ai_bp
from routes.project_db_routes import project_db_bp
from routes.user_project_routes import user_projects_bp
from routes.global_ai_routes import global_ai_bp  # TAKEGRID_GLOBAL_AI_V1

load_dotenv()

app = Flask(__name__)

# TAKEGRID_AI_AUTH_GUARD_V1
from utils.ai_security import protect_ai_request
app.before_request(protect_ai_request)

# TAKEGRID_AI_RATE_LIMIT_V1
from utils.ai_rate_limit import limit_ai_request
app.before_request(limit_ai_request)


# Allow only the local Vite frontend during development.
CORS(
    app,
    resources={
        r"/api/*": {
            "origins": [
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "https://takegrid-ai.pages.dev",
            ]
        }
    },
)

# Register AI endpoints.
app.register_blueprint(ai_bp)
app.register_blueprint(project_ai_bp)
#app.register_blueprint(project_db_bp)
app.register_blueprint(user_projects_bp)
app.register_blueprint(user_global_chat_bp)
app.register_blueprint(password_recovery_bp)  # TAKEGRID_PASSWORD_RECOVERY_V1
app.register_blueprint(global_ai_bp)  # TAKEGRID_GLOBAL_AI_V1


@app.get("/")
def home():
    return jsonify({
        "success": True,
        "message": "TAKEGRID backend is running",
    })


@app.get("/api/health")
def health():
    return jsonify({
        "success": True,
        "status": "healthy",
        "service": "TAKEGRID AI Backend",
    })


if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", "5000"))

    app.run(
        host="127.0.0.1",
        port=port,
        debug=False,
    )


