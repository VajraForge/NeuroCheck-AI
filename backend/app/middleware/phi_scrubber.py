import re
import orjson
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

EMAIL_REGEX = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
SSN_REGEX = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")
PHONE_REGEX = re.compile(r"\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b")

def redact_phi(data):
    if isinstance(data, str):
        data = EMAIL_REGEX.sub("[REDACTED_EMAIL]", data)
        data = SSN_REGEX.sub("[REDACTED_SSN]", data)
        data = PHONE_REGEX.sub("[REDACTED_PHONE]", data)
        return data
    elif isinstance(data, dict):
        return {k: redact_phi(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [redact_phi(item) for item in data]
    return data

class PHIScrubbingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Pass CORS OPTIONS preflight requests immediately
        if request.method == "OPTIONS":
            return await call_next(request)

        if request.method in ["POST", "PUT", "PATCH"]:
            content_type = request.headers.get("content-type", "")
            if "application/json" in content_type:
                body = await request.body()
                if body:
                    try:
                        parsed = orjson.loads(body)
                        sanitized = redact_phi(parsed)
                        sanitized_bytes = orjson.dumps(sanitized)

                        async def receive():
                            return {
                                "type": "http.request",
                                "body": sanitized_bytes,
                                "more_body": False
                            }

                        request = Request(request.scope, receive)
                    except Exception:
                        pass

        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response
