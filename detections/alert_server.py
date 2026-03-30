"""
Simple local alert receiver for weapon detection events.
Run this server and point config.alerting.webhook_url to /alerts.
"""

from datetime import datetime
from pathlib import Path
import threading
import time
import os
import sys
import subprocess

try:
  from flask import Flask, request, jsonify, render_template_string, send_from_directory, Response
except ModuleNotFoundError:
  print("[alert_server] Flask not found. Installing Flask...")
  subprocess.run(
    [sys.executable, "-m", "pip", "install", "--disable-pip-version-check", "flask>=3.0.0"],
    check=False,
  )
  from flask import Flask, request, jsonify, render_template_string, send_from_directory, Response

app = Flask(__name__)
_ALERTS = []
_MAX_ALERTS = 200
_DETECTIONS_DIR = Path("detections")
_LATEST_FRAME = None
_LATEST_FRAME_TS = None
_FRAME_LOCK = threading.Lock()

_HTML = """
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Weapon Alerts</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; background: #111; color: #eee; }
    h1 { margin-top: 0; }
    .card { background: #1e1e1e; border: 1px solid #333; border-radius: 8px; padding: 12px; margin-bottom: 10px; }
    .badge { display: inline-block; background: #b00020; color: white; padding: 3px 8px; border-radius: 999px; font-size: 12px; }
    .meta { color: #bbb; font-size: 13px; margin: 6px 0; }
    .labels { color: #ffd166; }
    .small { font-size: 12px; color: #9aa; }
    .btn { display: inline-block; background: #2a7fff; color: #fff; text-decoration: none; padding: 8px 12px; border-radius: 6px; margin: 10px 0 14px 0; }
    img { margin-top: 8px; max-width: 420px; border: 1px solid #444; border-radius: 6px; }
    video { margin-top: 8px; max-width: 540px; border: 1px solid #444; border-radius: 6px; background: #000; }
  </style>
</head>
<body>
  <h1>Weapon Alerts</h1>
  <div class="small">Auto-refresh disabled for media playback | Total alerts: {{ count }}</div>
  <a class="btn" href="/">Refresh Alerts</a>
  <a class="btn" href="/streams">Open Live Stream</a>
  {% for a in alerts %}
    <div class="card">
      <div><span class="badge">ALERT</span> ALERT DETECTED</div>
      <div class="meta">{{ a.get('timestamp', '-') }}</div>
      {% if a.get('cloudinary_video_url') %}
        <video controls preload="metadata" playsinline style="width:100%; max-width:540px;">
          <source src="{{ a.get('cloudinary_video_url') }}" type="video/mp4">
          Your browser could not play this video. <a href="{{ a.get('cloudinary_video_url') }}" target="_blank">Open video file</a>
        </video>
      {% elif a.get('alert_video_relpath') %}
        <video controls preload="metadata" playsinline style="width:100%; max-width:540px;">
          <source src="/detections/{{ a.get('alert_video_relpath') }}" type="{{ a.get('alert_video_mime', 'video/mp4') }}">
          Your browser could not play this video. <a href="/detections/{{ a.get('alert_video_relpath') }}" target="_blank">Open video file</a>
        </video>
      {% endif %}
      {% if a.get('alert_image_relpath') %}
        <img src="/detections/{{ a.get('alert_image_relpath') }}" alt="alert snapshot" />
      {% endif %}
    </div>
  {% endfor %}
</body>
</html>
"""

_STREAMS_HTML = """
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Live Streams</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; background: #111; color: #eee; }
    .btn { display: inline-block; background: #2a7fff; color: #fff; text-decoration: none; padding: 8px 12px; border-radius: 6px; margin-bottom: 14px; }
    img { max-width: 960px; width: 100%; border: 1px solid #444; border-radius: 6px; background: #000; }
  </style>
</head>
<body>
  <a class="btn" href="/">Back to Alerts</a>
  <h1>Live Stream</h1>
  <img src="/stream" alt="live stream" />
</body>
</html>
"""


@app.get("/")
def dashboard():
    alerts = list(reversed(_ALERTS[-100:]))
    return render_template_string(_HTML, alerts=alerts, count=len(_ALERTS))


@app.get("/streams")
def streams_page():
  return render_template_string(_STREAMS_HTML)


@app.get("/health")
def health():
    return jsonify({"status": "ok", "alerts": len(_ALERTS)})


@app.get("/alerts")
def list_alerts():
    return jsonify({"count": len(_ALERTS), "alerts": _ALERTS[-100:]})


@app.post("/frame")
def receive_frame():
  global _LATEST_FRAME, _LATEST_FRAME_TS
  data = request.get_data()
  if not data:
    return jsonify({"ok": False, "error": "empty frame"}), 400
  with _FRAME_LOCK:
    _LATEST_FRAME = data
    _LATEST_FRAME_TS = datetime.now().isoformat()
  return jsonify({"ok": True, "timestamp": _LATEST_FRAME_TS})


@app.get("/stream")
def stream():
  def generate():
    while True:
      frame = None
      with _FRAME_LOCK:
        frame = _LATEST_FRAME
      if frame:
        yield (
          b"--frame\r\n"
          b"Content-Type: image/jpeg\r\n\r\n" + frame + b"\r\n"
        )
      time.sleep(0.05)

  return Response(generate(), mimetype="multipart/x-mixed-replace; boundary=frame")


@app.get("/detections/<path:filename>")
def get_detection_file(filename: str):
  return send_from_directory(_DETECTIONS_DIR, filename)


@app.post("/alerts")
def receive_alert():
    payload = request.get_json(silent=True) or {}
    payload.setdefault("received_at", datetime.now().isoformat())
    event_id = payload.get("event_id")
    updated = False
    if event_id:
      for idx, existing in enumerate(_ALERTS):
        if existing.get("event_id") == event_id:
          merged = dict(existing)
          merged.update(payload)
          _ALERTS[idx] = merged
          updated = True
          break
    if not updated:
      _ALERTS.append(payload)
      if len(_ALERTS) > _MAX_ALERTS:
          del _ALERTS[: len(_ALERTS) - _MAX_ALERTS]
    return jsonify({"ok": True, "stored": len(_ALERTS), "updated": updated})


if __name__ == "__main__":
  host = os.getenv("ALERT_SERVER_HOST", "127.0.0.1")
  port = int(os.getenv("ALERT_SERVER_PORT", "5001"))
  try:
    print(f"[alert_server] starting on http://{host}:{port}")
    app.run(host=host, port=port, debug=False)
  except OSError as e:
    print(f"[alert_server] failed to start on port {port}: {e}")
    print(f"[alert_server] try: set ALERT_SERVER_PORT={port + 1} and restart")
    raise
