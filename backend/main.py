import os
import time
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

# Load once at startup so Passenger keeps one persistent worker with the
# session already in memory. Lazy loading caused a new process to spin up
# per request, each timing out before the session finished loading.
print("Loading rembg session...")
t0 = time.time()
try:
    session = new_session("u2net_human_seg")
    print(f"rembg session loaded in {time.time() - t0:.1f}s")
except Exception as e:
    print(f"ERROR loading rembg session: {e}")
    traceback.print_exc()
    session = None


@app.get("/health")
async def health():
    model_path = os.path.expanduser("~/.u2net/u2net_human_seg.onnx")
    return {
        "status": "ok",
        "model_file_exists": os.path.exists(model_path),
        "model_size_bytes": os.path.getsize(model_path) if os.path.exists(model_path) else None,
        "rembg_session_loaded": session is not None,
    }


@app.post("/remove-bg")
async def remove_background(image: UploadFile = File(...)):
    print(f"Received file: name={image.filename}, content_type={image.content_type}")
    try:
        data = await image.read()
        print(f"Read {len(data)} bytes")

        if session is None:
            raise RuntimeError("rembg session failed to load at startup")

        print("Running rembg.remove()...")
        t0 = time.time()
        result = remove(data, session=session)
        print(f"rembg done in {time.time() - t0:.1f}s, output size: {len(result)} bytes")

        return Response(content=result, media_type="image/png")
    except Exception as e:
        print(f"ERROR in /remove-bg: {e}")
        traceback.print_exc()
        raise
