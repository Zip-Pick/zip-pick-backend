from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from serve_data import router as serve_router
from commute_time_odsay import router as odsay_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(serve_router)
app.include_router(odsay_router)

@app.get("/")
def read_root():
    return {"message": "ZIP-PICK FastAPI is running"}
