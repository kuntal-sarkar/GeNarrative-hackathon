
from flask import Blueprint, jsonify, request
from google.genai import errors

from services.project_chat_service import generate_project_chat
from utils.validators import validate_prompt

project_ai_bp = Blueprint(
    "project_ai",
    __name__,
    url_prefix="/api/projects"
)


@project_ai_bp.post("/<project_id>/ai/chat")
def project_chat_compat(project_id):
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "error": "Request body must be a JSON object."
        }), 400

    try:
        message = validate_prompt({
            "prompt": data.get("message")
        })

        context = data.get("context") or {}

        if not isinstance(context, dict):
            raise ValueError("Project context must be an object.")

        # Frontend sends project data inside "context".
        # Add its request scope without modifying existing data.
        project_context = {
            **context,
            "target": data.get("target", "project"),
            "sceneId": data.get("sceneId"),
            "language": data.get("language", "English"),
        }

        history = data.get("history") or []

        # The existing chat service handles the latest 10 messages.
        answer = generate_project_chat(
            message=message,
            project_context=project_context,
            history=history,
        )

        # Frontend ProjectAIChat.jsx expects "answer",
        # whereas the original backend endpoint returns "response".
        return jsonify({
            "success": True,
            "answer": answer,
            "proposedRevision": None,
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
                "error": "Gemini quota exceeded."
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
            "error": "Unable to complete chat request."
        }), 500


@project_ai_bp.post("/<project_id>/ai/critique")
def project_critique_compat(project_id):
    import json
    from services.creative_critics_service import analyze_creative_work

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "error": "Request body must be a JSON object."
        }), 400

    try:
        project = data.get("projectData")
        if not isinstance(project, dict):
            raise ValueError("Project data is required.")

        selection = data.get("context", "project")
        notes = data.get("notes", "")
        language = data.get("language", "English")

        if not isinstance(selection, str):
            raise ValueError("Invalid review selection.")

        if not isinstance(notes, str) or len(notes) > 100:
            raise ValueError("Review instructions must be under 100 characters.")

        if not isinstance(language, str) or len(language) > 100:
            raise ValueError("Invalid language.")

        if selection == "project":
            material = project
        else:
            scenes = project.get("scenes", [])
            if not isinstance(scenes, list):
                raise ValueError("Invalid scenes data.")

            selected_scene = next(
                (
                    scene for scene in scenes
                    if isinstance(scene, dict)
                    and str(scene.get("id")) == selection
                ),
                None
            )

            if selected_scene is None:
                raise ValueError("Selected scene was not found.")

            scene_id = selected_scene.get("id")
            shots = project.get("shots", [])

            if not isinstance(shots, list):
                raise ValueError("Invalid shots data.")

            scene_shots = [
                shot for shot in shots
                if isinstance(shot, dict)
                and str(shot.get("sceneId")) == str(scene_id)
            ]

            material = {
                "projectName": project.get("name", ""),
                "genre": project.get("genre", ""),
                "scene": selected_scene,
                "shots": scene_shots,
                "characters": project.get("characters", []),
            }

        content = json.dumps(material, ensure_ascii=False)

        if len(content) > 30000:
            raise ValueError(
                "Creative material exceeds the 30000-character limit."
            )

        if not content.strip() or content == "{}":
            raise ValueError("No creative material available for review.")

        result = analyze_creative_work(
            content=content,
            project_context={
                "projectId": project_id,
                "reviewScope": selection,
                "language": language,
                "creatorInstructions": notes,
            },
            focus=notes.strip() or "general",
        )

        critics = [
            {
                "name": item["critic"],
                "summary": item["observation"],
                "strengths": [],
                "concerns": [item["reasoning"]],
                "suggestion": item["suggestion"],
                "verdict": item["verdict"],
                "reasoning": item["reasoning"],
                "observation": item["observation"],
            }
            for item in result["critics"]
        ]

        return jsonify({
            "success": True,
            "summary": result["summary"],
            "critics": critics,
            "consensus": result["consensus"],
            "model": result["model"],
        }), 200

    except ValueError as exc:
        return jsonify({
            "success": False,
            "error": str(exc),
        }), 400

    except errors.APIError as exc:
        status = getattr(exc, "code", None)

        if status == 429:
            return jsonify({
                "success": False,
                "error": "Gemini quota exceeded.",
            }), 429

        if status == 503:
            return jsonify({
                "success": False,
                "error": "Gemini is temporarily unavailable.",
            }), 503

        return jsonify({
            "success": False,
            "error": "Creative Critics AI request failed.",
        }), 502

    except Exception:
        return jsonify({
            "success": False,
            "error": "Unable to generate creative critique.",
        }), 500


@project_ai_bp.post("/<project_id>/ai/continuity")
def project_continuity_compat(project_id):
    from services.continuity_checker_service import check_continuity

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "error": "Request body must be a JSON object."
        }), 400

    try:
        project = data.get("projectData")

        if not isinstance(project, dict):
            raise ValueError("Project data is required.")

        story = project.get("story") or ""
        scenes = project.get("scenes") or []
        characters = project.get("characters") or []

        # The frontend stores shots inside each scene.
        # Pass the original scene objects unchanged.
        if not isinstance(story, str):
            raise ValueError("Story must be a string.")

        if not isinstance(scenes, list):
            raise ValueError("Scenes must be an array.")

        if not isinstance(characters, list):
            raise ValueError("Characters must be an array.")

        if not story.strip() and not scenes:
            raise ValueError(
                "Add a story or at least one scene before checking continuity."
            )

        result = check_continuity(
            story=story,
            scenes=scenes,
            characters=characters,
        )

        return jsonify({
            "success": True,
            "summary": result["summary"],
            "issues": result["issues"],
            "total_issues": result["total_issues"],
            "confirmed_issues": result["confirmed_issues"],
            "possible_issues": result["possible_issues"],
            "observations": result["observations"],
            "model": result["model"],
            "requires_approval": True,
        }), 200

    except ValueError as exc:
        return jsonify({
            "success": False,
            "error": str(exc),
        }), 400

    except errors.APIError as exc:
        status = getattr(exc, "code", None)

        if status == 429:
            return jsonify({
                "success": False,
                "error": "Gemini quota exceeded.",
            }), 429

        if status == 503:
            return jsonify({
                "success": False,
                "error": "Gemini is temporarily unavailable.",
            }), 503

        return jsonify({
            "success": False,
            "error": "Continuity AI request failed.",
        }), 502

    except Exception:
        import traceback
        traceback.print_exc()

        return jsonify({
            "success": False,
            "error": "Unable to complete continuity analysis.",
        }), 500
