FROM python:3.13-alpine

WORKDIR /app
COPY server.py .
EXPOSE 8080

USER nobody
CMD ["python", "server.py"]
