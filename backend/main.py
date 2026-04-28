import os
import traceback
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from rembg import remove, new_session

print("Starting app...")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://bg-change-poc.emcipriani.com",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Session is created on first request so the app starts up immediately.
_session = None


def get_session():
    global _session
    if _session is None:
        model_dir = os.path.expanduser("~/.u2net")
        model_path = os.path.join(model_dir, "u2net_human_seg.onnx")
        print(f"Model cache dir: {model_dir}")
        print(f"Model file exists: {os.path.exists(model_path)}")
        if os.path.exists(model_path):
            print(f"Model file size: {os.path.getsize(model_path)} bytes")
        print("Loading rembg session...")
        _session = new_session("u2net_human_seg")
        print("rembg session loaded OK")
    return _session


@app.get("/health")
async def health():
    model_path = os.path.expanduser("~/.u2net/u2net_human_seg.onnx")
    return {
        "status": "ok",
        "model_file_exists": os.path.exists(model_path),
        "model_size_bytes": os.path.getsize(model_path) if os.path.exists(model_path) else None,
        "rembg_session_loaded": _session is not None,
    }


@app.post("/remove-bg")
async def remove_background(image: UploadFile = File(...)):
    print(f"Received file: name={image.filename}, content_type={image.content_type}")
    try:
        data = await image.read()
        print(f"Read {len(data)} bytes")

        session = get_session()

        print("Running rembg.remove()...")
        result = remove(data, session=session)
        print(f"rembg done, output size: {len(result)} bytes")

        return Response(content=result, media_type="image/png")
    except Exception as e:
        print(f"ERROR in /remove-bg: {e}")
        traceback.print_exc()
        raise
