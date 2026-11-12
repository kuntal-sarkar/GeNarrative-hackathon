
from flask import Blueprint, jsonify, request
from google.genai import errors

from services.project_chat_service import generate_project_chat
from services.creative_memory_context import select_creative_decisions
from utils.validators import validate_prompt

project_ai_bp = Blueprint(
    "project_ai",
    __name__,
    url_prefix="/api/projects"
)


# TAKEGRID_AI_STORY_V1 — support JSON and browser multipart/form-data safely.
import io
from pathlib import Path
from google.genai import types as genai_types
from services.story_creation_service import create_story_draft, compose_story_from_conversation
from services.story_editor_service import edit_story

_ALLOWED_CHAT_TYPES = {".txt", ".md", ".pdf", ".png", ".jpg", ".jpeg", ".webp"}
_IMAGE_MIME = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp"}

def _read_chat_request():
    if request.mimetype == "multipart/form-data":
        raw = request.form.get("payload", "")
        if len(raw) > 65000:
            raise ValueError("Request metadata too large.")
        import json
        try:
            data = json.loads(raw)
        except (ValueError, TypeError):
            raise ValueError("Invalid attachment request payload.")
        uploads = request.files.getlist("files")
    else:
        data = request.get_json(silent=True)
        uploads = []
    if not isinstance(data, dict):
        raise ValueError("Request body must be an object.")
    if len(uploads) > 5:
        raise ValueError("Maximum 5 attachments per message.")
    total_size = 0
    parts = []
    names = []
    for file in uploads:
        name = Path(file.filename or "").name[:180]
        ext = Path(name).suffix.lower()
        if ext not in _ALLOWED_CHAT_TYPES:
            raise ValueError("Unsupported file type. Use PDF, TXT, MD, PNG, JPG or WebP.")
        content = file.read(10 * 1024 * 1024 + 1)
        if not content or len(content) > 10 * 1024 * 1024:
            raise ValueError("Each attachment must be 1 byte to 10 MB.")
        total_size += len(content)
        if total_size > 25 * 1024 * 1024:
            raise ValueError("Combined attachments cannot exceed 25 MB.")
        names.append(name)
        if ext in (".txt", ".md"):
            try:
                text = content.decode("utf-8-sig")
            except UnicodeDecodeError:
                raise ValueError(f"{name} is not readable UTF-8 text.")
            if len(text) > 25000:
                raise ValueError(f"{name} contains too much text (max 25,000 characters).")
            parts.append({"name": name, "kind": "text", "text": text})
        elif ext == ".pdf":
            try:
                from pypdf import PdfReader
                reader = PdfReader(io.BytesIO(content), strict=False)
                if len(reader.pages) > 30:
                    raise ValueError(f"{name}: max 30 PDF pages.")
                text = "\n".join(page.extract_text() or "" for page in reader.pages)
            except ImportError:
                raise ValueError("PDF support requires pypdf. Run pip install pypdf in the backend venv.")
            except ValueError:
                raise
            except Exception:
                raise ValueError(f"Could not read {name} as a PDF.")
            if not text.strip():
                raise ValueError(f"{name} appears scanned or contains no selectable text. Upload TXT/MD instead.")
            if len(text) > 25000:
                raise ValueError(f"{name} contains too much extracted text (max 25,000 characters).")
            parts.append({"name": name, "kind": "text", "text": text})
        else:
            # Inline binary vision data; never persist blobs inside project localStorage.
            parts.append({"name": name, "kind": "image", "mime": _IMAGE_MIME[ext], "data": content})
    return data, parts, names

@project_ai_bp.post("/<project_id>/ai/chat")
def project_chat_compat(project_id):
    try:
        data, parts, names = _read_chat_request()
        message = validate_prompt({"prompt": data.get("message")})
        context = data.get("context") or {}
        if not isinstance(context, dict):
            raise ValueError("Project context must be an object.")
        context = {**context, "target": data.get("target", "project"),
                   "sceneId": data.get("sceneId"), "language": data.get("language", "English")}
        history = data.get("history") or []
        # Existing chat continues to work; attachments are supplied to the SAME
        # model request as actual content, not merely as filenames.
        answer = generate_project_chat(message=message, project_context=context,
                                       history=history, attachments=parts)
        return jsonify({"success": True, "answer": answer, "proposedRevision": None,
                        "processedAttachments": names}), 200
    except ValueError as exc:
        return jsonify({"success": False, "error": str(exc)}), 400
    except errors.APIError as exc:
        code = getattr(exc, "code", None)
        return jsonify({"success": False, "error": "AI is busy right now. Please try again shortly." if code == 429
                        else "AI is temporarily unavailable." if code == 503
                        else "AI service request failed."}), code if code in (429, 503) else 502
    except Exception:
        return jsonify({"success": False, "error": "Unable to complete chat request."}), 500

@project_ai_bp.post("/<project_id>/ai/story/draft")
def project_story_draft(project_id):
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"success": False, "error": "JSON request body required."}), 400
    try:
        return jsonify(create_story_draft(data.get("context") or {}, data.get("instructions") or "")), 200
    except ValueError as exc:
        return jsonify({"success": False, "error": str(exc)}), 400
    except errors.APIError as exc:
        code = getattr(exc, "code", None)
        return jsonify({"success": False, "error": "AI is busy right now. Please try again shortly." if code == 429
                        else "AI is temporarily unavailable." if code == 503
                        else "AI story generation failed."}), code if code in (429, 503) else 502
    except Exception:
        return jsonify({"success": False, "error": "Could not generate story draft."}), 500

@project_ai_bp.post("/<project_id>/ai/story/compose")
def project_story_compose(project_id):
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"success": False, "error": "JSON request body required."}), 400
    try:
        return jsonify(compose_story_from_conversation(data.get("context") or {}, data.get("history") or [])), 200
    except ValueError as exc:
        return jsonify({"success": False, "error": str(exc)}), 400
    except errors.APIError as exc:
        code = getattr(exc, "code", None)
        return jsonify({"success": False, "error": "AI is busy right now. Please try again shortly." if code == 429
                        else "AI is temporarily unavailable." if code == 503
                        else "AI story extraction failed."}), code if code in (429, 503) else 502
    except Exception:
        return jsonify({"success": False, "error": "Could not extract story from chat."}), 500

@project_ai_bp.post("/<project_id>/ai/story/revise")
def project_story_revise(project_id):
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"success": False, "error": "JSON request body required."}), 400
    try:
        context = data.get("context") or {}
        story = context.get("story") or ""
        instructions = data.get("instructions") or ""
        mode = data.get("mode") or "improve"
        result = edit_story(story=story, mode=mode, instructions=instructions,
                            project_context=context)
        return jsonify({"success": True, "answer": result.get("summary", "Revision ready."),
                        "proposedRevision": {"target": "story", "text": result["edited_story"],
                                             "source": "revise", "summary": result.get("summary", "")}}), 200
    except ValueError as exc:
        return jsonify({"success": False, "error": str(exc)}), 400
    except errors.APIError as exc:
        code = getattr(exc, "code", None)
        return jsonify({"success": False, "error": "AI is busy right now. Please try again shortly." if code == 429
                        else "AI is temporarily unavailable." if code == 503
                        else "AI revision failed."}), code if code in (429, 503) else 502
    except Exception:
        return jsonify({"success": False, "error": "Could not revise story."}), 500


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
        # TAKEGRID_CREATIVE_MEMORY_V1: memory remains advisory context only.
        creator_memory = select_creative_decisions(data.get("creativeDecisions"))
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
                "creativeDecisions": creator_memory,
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
                "error": "AI is busy right now. Please try again shortly.",
            }), 429

        if status == 503:
            return jsonify({
                "success": False,
                "error": "AI is busy right now. Please try again shortly..",
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


# TAKEGRID_UNIFIED_CRITICS_V4 — synthesize real partial AI reviews.
@project_ai_bp.post("/<project_id>/ai/critique/synthesize")
def project_critique_synthesis(project_id):
    from services.creative_critics_service import synthesize_critic_reviews
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"success": False, "error": "JSON request body required."}), 400
    try:
        result = synthesize_critic_reviews(
            reviews=data.get("reviews"),
            language=data.get("language", "English"),
            focus=data.get("focus", ""),
            creative_decisions=select_creative_decisions(data.get("creativeDecisions")),
        )
        return jsonify({"success": True, **result}), 200
    except ValueError as exc:
        return jsonify({"success": False, "error": str(exc)}), 400
    except errors.APIError as exc:
        status = getattr(exc, "code", None)
        if status == 429:
            return jsonify({"success": False, "error": "AI is busy right now. Please try again shortly."}), 429
        if status == 503:
            return jsonify({"success": False, "error": "AI is busy right now. Please try again shortly."}), 503
        return jsonify({"success": False, "error": "Review synthesis AI request failed."}), 502
    except Exception:
        return jsonify({"success": False, "error": "Could not consolidate creative reviews."}), 500


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
                "error": "AI is busy right now. Please try again shortly.",
            }), 429

        if status == 503:
            return jsonify({
                "success": False,
                "error": "AI is temporarily unavailable.",
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
