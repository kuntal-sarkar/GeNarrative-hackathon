"""Private, local-only TakeGrid storyboard images (owner-bound).

Frames without owner metadata predate this hardening and MUST NOT be served.
Production should migrate to private object storage + durable ownership records.
"""
import json
from pathlib import Path
from uuid import UUID, uuid4

BASE_DIR = Path(__file__).resolve().parents[1] / 'storage' / 'storyboard'
MAX_IMAGE_BYTES = 10 * 1024 * 1024
FORMATS = {'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp'}


def _valid_uuid(value):
    try:
        parsed = UUID(str(value))
        if parsed.version != 4 or str(parsed) != str(value):
            return None
        return str(parsed)
    except (TypeError, ValueError, AttributeError):
        return None


def _detect_image(data):
    if data.startswith(b'\x89PNG\r\n\x1a\n'): return 'image/png'
    if data.startswith(b'\xff\xd8\xff'): return 'image/jpeg'
    if data.startswith(b'RIFF') and len(data) >= 12 and data[8:12] == b'WEBP': return 'image/webp'
    raise ValueError('Use a PNG, JPEG, or WebP image.')


def save_frame(file_storage, owner_id):
    owner = _valid_uuid(owner_id)
    if owner is None:
        raise ValueError('Invalid image owner.')
    if file_storage is None:
        raise ValueError('Image is required.')
    payload = file_storage.stream.read(MAX_IMAGE_BYTES + 1)
    if not payload or len(payload) > MAX_IMAGE_BYTES:
        raise ValueError('Image must be between 1 byte and 10 MB.')
    mime = _detect_image(payload)
    BASE_DIR.mkdir(parents=True, exist_ok=True)
    frame_id = str(uuid4())
    image_path = BASE_DIR / (frame_id + FORMATS[mime])
    meta_path = BASE_DIR / (frame_id + '.owner.json')
    try:
        with image_path.open('xb') as handle:
            handle.write(payload)
        # An image is never served unless its owner sidecar exists.
        with meta_path.open('x', encoding='utf-8') as handle:
            json.dump({'owner_id': owner, 'mime': mime, 'version': 2}, handle)
    except Exception:
        image_path.unlink(missing_ok=True)
        meta_path.unlink(missing_ok=True)
        raise
    return frame_id, mime


def find_owned_frame(frame_id, owner_id):
    frame = _valid_uuid(frame_id)
    owner = _valid_uuid(owner_id)
    if frame is None or owner is None:
        return None
    meta_path = BASE_DIR / (frame + '.owner.json')
    try:
        metadata = json.loads(meta_path.read_text(encoding='utf-8'))
        if not isinstance(metadata, dict) or metadata.get('owner_id') != owner:
            return None
        suffix = FORMATS.get(metadata.get('mime'))
        if suffix is None:
            return None
        candidate = BASE_DIR / (frame + suffix)
        return candidate if candidate.is_file() and not candidate.is_symlink() else None
    except (OSError, ValueError, TypeError, UnicodeError):
        return None
