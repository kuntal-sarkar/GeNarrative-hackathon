
from flask import Blueprint, jsonify, request
from google.genai import errors

from services.gemini_service import generate_text
from utils.validators import validate_prompt

from services.project_chat_service import generate_project_chat

from services.creative_critics_service import analyze_creative_work

from services.story_editor_service import edit_story

from services.scene_breakdown_service import generate_scene_breakdown

from services.shot_generation_service import generate_shots

from services.character_bible_service import generate_character_bible

from services.continuity_checker_service import check_continuity

from flask import Blueprint, jsonify, request, Response

from services.image_generation_service import (
    generate_storyboard_image,
    ImageGenerationError,
)

ai_bp = Blueprint("ai", __name__, url_prefix="/api/ai")


@ai_bp.post("/test")
def test_ai():
    # Validate request before using Gemini quota.
    try:
        prompt = validate_prompt(request.get_json(silent=True))
    except ValueError as exc:
        return jsonify({
            "success": False,
            "error": str(exc)
        }), 400

    try:
        response = generate_text(prompt)

        return jsonify({
            "success": True,
            "response": response
        }), 200

    except errors.APIError as exc:
        # Do not expose Gemini's raw error details.
        status = getattr(exc, "code", None)

        if status == 429:
            message = "Gemini quota exceeded. Try again later."
            http_status = 429
        elif status == 503:
            message = "Gemini is temporarily unavailable."
            http_status = 503
        else:
            message = "AI service request failed."
            http_status = 502

        return jsonify({
            "success": False,
            "error": message
        }), http_status

    except Exception:
        return jsonify({
            "success": False,
            "error": "An internal server error occurred."
        }), 500



@ai_bp.post("/chat")
def project_chat():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "error": "Request body must be a JSON object."
        }), 400

    try:
        message = validate_prompt({"prompt": data.get("message")})

        response = generate_project_chat(
            message=message,
            project_context=data.get("project_context"),
            history=data.get("history"),
        )

        return jsonify({
            "success": True,
            "response": response
        }), 200

    except ValueError as exc:
        return jsonify({
            "success": False,
            "error": str(exc)
        }), 400

    except errors.APIError as exc:
        status = getattr(exc, "code", None)

        if status == 429:
            return jsonify({
                "success": False,
                "error": "Gemini quota exceeded. Try again later."
            }), 429

        if status == 503:
            return jsonify({
                "success": False,
                "error": "Gemini is temporarily unavailable."
            }), 503

        return jsonify({
            "success": False,
            "error": "AI service request failed."
        }), 502

    except Exception:
        return jsonify({
            "success": False,
            "error": "Internal server error."
        }), 500



@ai_bp.post("/critics")
def creative_critics():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "error": "Request body must be a JSON object."
        }), 400

    try:
        content = data.get("content")
        project_context = data.get("project_context")
        focus = data.get("focus", "general")

        # Validate input before calling Gemini.
        if not isinstance(content, str) or not content.strip():
            raise ValueError("Creative content is required.")

        if project_context is not None and not isinstance(
            project_context, dict
        ):
            raise ValueError("Project context must be an object.")

        if not isinstance(focus, str) or len(focus) > 100:
            raise ValueError("Invalid review focus.")

        result = analyze_creative_work(
            content=content,
            project_context=project_context,
            focus=focus,
        )

        return jsonify({
            "success": True,
            **result,
        }), 200

    except ValueError as exc:
        return jsonify({
            "success": False,
            "error": str(exc),
        }), 400

    except errors.APIError as exc:
        status = getattr(exc, "code", None)

        if status == 429:
            message = "Gemini quota exceeded. Try again later."
            http_status = 429
        elif status == 503:
            message = "Gemini is temporarily unavailable."
            http_status = 503
        else:
            message = "Creative Critics AI service failed."
            http_status = 502

        return jsonify({
            "success": False,
            "error": message,
        }), http_status

    except Exception:
        return jsonify({
            "success": False,
            "error": "Unable to generate Creative Critics feedback.",
        }), 500



@ai_bp.post("/story/edit")
def story_edit():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "error": "Request body must be a JSON object."
        }), 400

    try:
        story = data.get("story")
        mode = data.get("mode", "improve")
        instructions = data.get("instructions", "")
        project_context = data.get("project_context")

        result = edit_story(
            story=story,
            mode=mode,
            instructions=instructions,
            project_context=project_context,
        )

        return jsonify({
            "success": True,
            **result,
        }), 200

    except ValueError as exc:
        return jsonify({
            "success": False,
            "error": str(exc),
        }), 400

    except errors.APIError as exc:
        status = getattr(exc, "code", None)

        if status == 429:
            message = "Gemini Free Tier quota exceeded."
            http_status = 429
        elif status == 503:
            message = "Gemini is temporarily overloaded."
            http_status = 503
        else:
            message = "Story editing AI request failed."
            http_status = 502

        return jsonify({
            "success": False,
            "error": message,
        }), http_status

    except Exception:
        return jsonify({
            "success": False,
            "error": "Unable to generate story edit.",
        }), 500



@ai_bp.post("/scenes/breakdown")
def scene_breakdown():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "error": "Request body must be a JSON object."
        }), 400

    try:
        story = data.get("story")
        project_context = data.get("project_context")

        result = generate_scene_breakdown(
            story=story,
            project_context=project_context,
        )

        return jsonify({
            "success": True,
            **result,
        }), 200

    except ValueError as exc:
        return jsonify({
            "success": False,
            "error": str(exc),
        }), 400

    except errors.APIError as exc:
        status = getattr(exc, "code", None)

        if status == 429:
            message = "Gemini Free Tier quota exceeded."
            http_status = 429
        elif status == 503:
            message = "Gemini is temporarily unavailable."
            http_status = 503
        else:
            message = "Scene Breakdown AI request failed."
            http_status = 502

        return jsonify({
            "success": False,
            "error": message,
        }), http_status

    except Exception:
        import traceback
        traceback.print_exc()

    return jsonify({
        "success": False,
        "error": "Unable to generate scene breakdown."
    }), 500



@ai_bp.post("/shots/generate")
def shot_generation():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "error": "Request body must be a JSON object."
        }), 400

    try:
        scene = data.get("scene")
        project_context = data.get("project_context")
        max_shots = data.get("max_shots", 6)

        result = generate_shots(
            scene=scene,
            project_context=project_context,
            max_shots=max_shots,
        )

        return jsonify({
            "success": True,
            **result,
        }), 200

    except ValueError as exc:
        return jsonify({
            "success": False,
            "error": str(exc),
        }), 400

    except errors.APIError as exc:
        status = getattr(exc, "code", None)

        if status == 429:
            message = "Gemini Free Tier quota exceeded. Try again later."
            http_status = 429
        elif status == 503:
            message = "Gemini is temporarily unavailable."
            http_status = 503
        else:
            message = "Shot Generation AI request failed."
            http_status = 502

        return jsonify({
            "success": False,
            "error": message,
        }), http_status

    except Exception:
        return jsonify({
            "success": False,
            "error": "Unable to generate shot suggestions.",
        }), 500



@ai_bp.post("/characters/generate")
def character_generation():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "error": "Request body must be a JSON object."
        }), 400

    try:
        story = data.get("story")
        project_context = data.get("project_context")

        result = generate_character_bible(
            story=story,
            project_context=project_context,
        )

        return jsonify({
            "success": True,
            **result,
        }), 200

    except ValueError as exc:
        return jsonify({
            "success": False,
            "error": str(exc),
        }), 400

    except errors.APIError as exc:
        status = getattr(exc, "code", None)

        if status == 429:
            message = "Gemini Free Tier quota exceeded. Try again later."
            http_status = 429
        elif status == 503:
            message = "Gemini is temporarily unavailable."
            http_status = 503
        else:
            message = "Character Bible AI request failed."
            http_status = 502

        return jsonify({
            "success": False,
            "error": message,
        }), http_status

    except Exception:
        return jsonify({
            "success": False,
            "error": "Unable to generate character profiles.",
        }), 500



@ai_bp.post("/continuity/check")
def continuity_check():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "error": "Request body must be a JSON object."
        }), 400

    try:
        result = check_continuity(
            story=data.get("story", ""),
            scenes=data.get("scenes"),
            characters=data.get("characters"),
        )

        return jsonify({
            "success": True,
            **result,
        }), 200

    except ValueError as exc:
        return jsonify({
            "success": False,
            "error": str(exc),
        }), 400

    except errors.APIError as exc:
        status = getattr(exc, "code", None)

        if status == 429:
            message = "Gemini Free Tier quota exceeded. Try again later."
            http_status = 429
        elif status == 503:
            message = "Gemini is temporarily unavailable."
            http_status = 503
        else:
            message = "Continuity Checker AI request failed."
            http_status = 502

        return jsonify({
            "success": False,
            "error": message,
        }), http_status

    except Exception:
        return jsonify({
            "success": False,
            "error": "Unable to complete continuity analysis.",
        }), 500



@ai_bp.post("/storyboard/image")
def storyboard_image():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "error": "Request body must be a JSON object."
        }), 400

    try:
        description = data.get("description")
        style = data.get("style", "black_white")
        quality = data.get("quality", "standard")

        result = generate_storyboard_image(
            description=description,
            style=style,
            quality=quality,
        )

        response = Response(
            result["image_bytes"],
            status=200,
            mimetype=result["content_type"],
        )

        # Avoid caching generated images.
        response.headers["Cache-Control"] = "no-store"
        response.headers["X-Content-Type-Options"] = "nosniff"

        return response

    except ValueError as exc:
        return jsonify({
            "success": False,
            "error": str(exc),
        }), 400

    except ImageGenerationError as exc:
        # Return a safe error message, never credentials.
        return jsonify({
            "success": False,
            "error": str(exc),
        }), 502

    except Exception:
        return jsonify({
            "success": False,
            "error": "Unable to generate storyboard image.",
        }), 500

# FRAMEFORGE_STORYBOARD_V1_ROUTES
# Local development storage. Add authentication, quotas, and durable object storage before production deployment.
from services.storyboard_frame_store import save_frame as ff_save_frame, find_frame as ff_find_frame
from flask import send_file as ff_send_file

@ai_bp.post('/storyboard/frames')
def ff_upload_storyboard_frame():
    try:
        frame_id, _mime = ff_save_frame(request.files.get('image'))
        return jsonify({'success': True, 'frameId': frame_id}), 201
    except ValueError as exc:
        return jsonify({'success': False, 'error': str(exc)}), 400
    except OSError:
        return jsonify({'success': False, 'error': 'Could not store storyboard frame.'}), 500

@ai_bp.get('/storyboard/frames/<frame_id>')
def ff_get_storyboard_frame(frame_id):
    path = ff_find_frame(frame_id)
    if path is None:
        return jsonify({'success': False, 'error': 'Storyboard frame not found.'}), 404
    response = ff_send_file(path, conditional=False, max_age=0)
    response.headers['Cache-Control'] = 'no-store'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    return response
