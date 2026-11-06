
import base64
import os
from typing import Literal

import requests
from dotenv import load_dotenv

load_dotenv()

CLOUDFLARE_API_TOKEN = os.getenv("CLOUDFLARE_API_TOKEN")
CLOUDFLARE_ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID")

IMAGE_MODEL = os.getenv(
    "CLOUDFLARE_IMAGE_MODEL",
    "@cf/black-forest-labs/flux-1-schnell"
)

IMAGE_STYLES = {
    "black_white": (
        "Black and white hand-drawn cinematic storyboard, "
        "clean pencil lines, rough ink outlines, minimal shading, "
        "clear visual composition, monochrome sketch."
    ),
    "colored": (
        "Simple hand-drawn cinematic storyboard, "
        "soft colored pencil sketch, muted colors, "
        "minimal details, light shading, clean composition."
    ),
}

ALLOWED_STYLES = Literal["black_white", "colored"]

MAX_PROMPT_LENGTH = 2000
MAX_IMAGE_BYTES = 10 * 1024 * 1024


class ImageGenerationError(Exception):
    """Safe error raised when cloud image generation fails."""


def generate_storyboard_image(
    description: str,
    style: ALLOWED_STYLES = "black_white",
) -> dict:
    """
    Generate one storyboard image using Cloudflare Workers AI.

    Returns image bytes and content type.
    Does not modify or save existing project data.
    """

    if not isinstance(description, str):
        raise ValueError("Description must be a string.")

    description = description.strip()

    if not description:
        raise ValueError("Shot description is required.")

    if len(description) > MAX_PROMPT_LENGTH:
        raise ValueError(
            f"Description cannot exceed {MAX_PROMPT_LENGTH} characters."
        )

    if not isinstance(style, str) or style not in IMAGE_STYLES:
        raise ValueError(
            "Invalid image style. Use black_white or colored."
        )

    if not CLOUDFLARE_API_TOKEN or not CLOUDFLARE_ACCOUNT_ID:
        raise ImageGenerationError(
            "Cloudflare image generation is not configured."
        )

    # The user's actual shot description is always the main subject.
    prompt = (
        f"{IMAGE_STYLES[style]}\n"
        f"Storyboard scene: {description}\n"
        "Professional film storyboard panel. "
        "Focus on camera composition and visible action. "
        "No captions, no logos, no watermark, no lettering."
    )

    url = (
        "https://api.cloudflare.com/client/v4/accounts/"
        f"{CLOUDFLARE_ACCOUNT_ID}/ai/run/{IMAGE_MODEL}"
    )

    try:
        response = requests.post(
            url,
            headers={
                "Authorization": (
                    f"Bearer {CLOUDFLARE_API_TOKEN}"
                ),
                "Content-Type": "application/json",
            },
            json={
                "prompt": prompt,
                "steps": 4,
            },
            timeout=120,
        )

    except requests.Timeout as exc:
        raise ImageGenerationError(
            "Image generation timed out."
        ) from exc

    except requests.RequestException as exc:
        raise ImageGenerationError(
            "Could not connect to Cloudflare Workers AI."
        ) from exc

    if response.status_code in (401, 403):
        raise ImageGenerationError(
            "Cloudflare authentication or access failed."
        )

    if response.status_code == 429:
        raise ImageGenerationError(
            "Cloudflare rate limit reached. Try again later."
        )

    if response.status_code == 402:
        raise ImageGenerationError(
            "Image generation requires credits or billing."
        )

    if response.status_code >= 500:
        raise ImageGenerationError(
            "Cloudflare image service is temporarily unavailable."
        )

    if not response.ok:
        raise ImageGenerationError(
            "Cloudflare rejected the image generation request."
        )

    try:
        payload = response.json()

        if not isinstance(payload, dict) or not payload.get("success"):
            raise ImageGenerationError(
                "Cloudflare could not generate the image."
            )

        result = payload.get("result")

        if not isinstance(result, dict):
            raise ImageGenerationError(
                "Cloudflare returned an invalid image result."
            )

        image_base64 = result.get("image")

        if not isinstance(image_base64, str) or not image_base64:
            raise ImageGenerationError(
                "Cloudflare returned no image data."
            )

        image_bytes = base64.b64decode(
            image_base64,
            validate=True,
        )

    except (ValueError, TypeError, KeyError) as exc:
        raise ImageGenerationError(
            "Invalid image response from Cloudflare."
        ) from exc

    if not image_bytes or len(image_bytes) > MAX_IMAGE_BYTES:
        raise ImageGenerationError(
            "Generated image has an invalid size."
        )

    if image_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
        content_type = "image/png"

    elif image_bytes.startswith(b"\xff\xd8\xff"):
        content_type = "image/jpeg"

    elif (
        image_bytes.startswith(b"RIFF")
        and image_bytes[8:12] == b"WEBP"
    ):
        content_type = "image/webp"

    else:
        raise ImageGenerationError(
            "Cloudflare returned an unsupported image format."
        )

    return {
        "image_bytes": image_bytes,
        "content_type": content_type,
        "style": style,
        "model": IMAGE_MODEL,
        "requires_approval": True,
    }
