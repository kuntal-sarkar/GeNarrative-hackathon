"""Bounded creative decision context for the AI, with explicit supersession.

This does not try to infer semantic contradictions from arbitrary prose. Creators
resolve competing intentions explicitly; previous versions remain in storage.
"""
import json

ALLOWED_TYPES = {"intent", "accept", "reject", "modify"}


def select_creative_decisions(records, max_count=12, max_chars=4800):
    """Return newest relevant active decisions; never mutate the project records.

    New intention records can explicitly supersede previous decisions by ID.
    Older 'supersededBy' records are excluded from AI advice, but remain stored.
    All freeform text is untrusted data, never an instruction channel.
    """
    if not isinstance(records, list):
        return []

    explicit_superseded = {
        item.get("supersedes")
        for item in records
        if isinstance(item, dict)
        and item.get("type") == "intent"
        and isinstance(item.get("supersedes"), str)
        and item.get("supersedes")
        and item.get("status") != "archived"
        and not item.get("supersededBy")
    }
    selected = []
    size = 2
    # Prioritize active creator intentions even when many later critique decisions exist.
    newest = list(reversed(records))
    ordered = [r for r in newest if isinstance(r, dict) and r.get("type") == "intent"] + [
        r for r in newest if not (isinstance(r, dict) and r.get("type") == "intent")
    ]
    for item in ordered:
        if not isinstance(item, dict) or item.get("type") not in ALLOWED_TYPES:
            continue
        if item.get("status") in ("archived", "superseded") or item.get("supersededBy"):
            continue
        if item.get("id") and item["id"] in explicit_superseded:
            continue
        record = {}
        for key in ("id", "type", "reason", "suggestion", "perspective", "createdAt", "updatedAt", "supersedes"):
            value = item.get(key)
            if isinstance(value, str) and value.strip():
                record[key] = value
        if not record.get("reason") and not record.get("suggestion"):
            continue
        cost = len(json.dumps(record, ensure_ascii=False)) + 1
        if cost + size > max_chars:
            continue
        selected.append(record)
        size += cost
        if len(selected) >= max_count:
            break
    return selected
