from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from rembg import remove, new_session

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

session = new_session("u2net_human_seg")


@app.post("/remove-bg")
async def remove_background(image: UploadFile = File(...)):
    data = await image.read()
    result = remove(data, session=session)
    return Response(content=result, media_type="image/png")
