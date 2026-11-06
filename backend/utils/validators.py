
MAX_PROMPT_LENGTH = 12000


def validate_prompt(data):
    """Validate incoming JSON request and return a clean prompt."""

    if not isinstance(data, dict):
        raise ValueError("Request body must be a JSON object.")

    prompt = data.get("prompt")

    if not isinstance(prompt, str):
        raise ValueError("Prompt must be a string.")

    prompt = prompt.strip()

    if not prompt:
        raise ValueError("Prompt cannot be empty.")

    if len(prompt) > MAX_PROMPT_LENGTH:
        raise ValueError(
            f"Prompt cannot exceed {MAX_PROMPT_LENGTH} characters."
        )

    return prompt
