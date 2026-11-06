"""Persistent, local-only frame storage for FRAMEFORGE storyboard v1.
Stores validated image files under backend/storage/storyboard; no base64 in project localStorage.
"""
from pathlib import Path
from uuid import uuid4

BASE_DIR = Path(__file__).resolve().parents[1] / 'storage' / 'storyboard'
MAX_IMAGE_BYTES = 10 * 1024 * 1024
FORMATS = {'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp'}


def _detect_image(data):
    if data.startswith(b'\x89PNG\r\n\x1a\n'): return 'image/png'
    if data.startswith(b'\xff\xd8\xff'): return 'image/jpeg'
    if data.startswith(b'RIFF') and data[8:12] == b'WEBP': return 'image/webp'
    raise ValueError('Use a PNG, JPEG, or WebP image.')


def save_frame(file_storage):
    if file_storage is None: raise ValueError('Image is required.')
    payload = file_storage.stream.read(MAX_IMAGE_BYTES + 1)
    if not payload or len(payload) > MAX_IMAGE_BYTES:
        raise ValueError('Image must be between 1 byte and 10 MB.')
    mime = _detect_image(payload)
    BASE_DIR.mkdir(parents=True, exist_ok=True)
    frame_id = str(uuid4())
    path = BASE_DIR / (frame_id + FORMATS[mime])
    # exclusive create protects existing frames
    with path.open('xb') as fp:
        fp.write(payload)
    return frame_id, mime


def find_frame(frame_id):
    try:
        from uuid import UUID
        if str(UUID(frame_id)) != frame_id: return None
    except (ValueError, TypeError):
        return None
    for ext in FORMATS.values():
        candidate = BASE_DIR / (frame_id + ext)
        if candidate.is_file(): return candidate
    return None
