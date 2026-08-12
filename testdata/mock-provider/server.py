import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/v1/models":
            self.respond(200, {"object": "list", "data": [{"id": "review-model", "object": "model"}]})
            return
        self.respond(404, {"error": {"message": "not found"}})

    def do_POST(self):
        if self.path != "/v1/chat/completions":
            self.respond(404, {"error": {"message": "not found"}})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length))
        except (ValueError, json.JSONDecodeError):
            self.respond(400, {"error": {"message": "invalid request"}})
            return

        model = payload.get("model", "review-model")
        self.respond(
            200,
            {
                "id": "review-completion",
                "object": "chat.completion",
                "model": model,
                "choices": [
                    {
                        "index": 0,
                        "message": {
                            "role": "assistant",
                            "content": "Review environment response: the secure backend analysis completed successfully.",
                        },
                        "finish_reason": "stop",
                    }
                ],
            },
        )

    def respond(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, _format, *_args):
        return


ThreadingHTTPServer(("0.0.0.0", 8080), Handler).serve_forever()
