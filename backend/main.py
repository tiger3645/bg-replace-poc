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

print("Loading rembg session...")
try:
    session = new_session("u2net_human_seg")
    print("rembg session loaded OK")
except Exception as e:
    print(f"ERROR loading rembg session: {e}")
    traceback.print_exc()
    session = None


@app.get("/health")
async def health():
    return {"status": "ok", "rembg_session": session is not None}


@app.post("/remove-bg")
async def remove_background(image: UploadFile = File(...)):
    print(f"Received file: name={image.filename}, content_type={image.content_type}")
    try:
        data = await image.read()
        print(f"Read {len(data)} bytes")

        if session is None:
            print("ERROR: rembg session is None, cannot process")
            raise RuntimeError("rembg session failed to load")

        print("Running rembg.remove()...")
        result = remove(data, session=session)
        print(f"rembg done, output size: {len(result)} bytes")

        return Response(content=result, media_type="image/png")
    except Exception as e:
        print(f"ERROR in /remove-bg: {e}")
        traceback.print_exc()
        raise
