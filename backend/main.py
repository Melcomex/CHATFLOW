import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
from models.models import Base
from routes import auth, chat

Base.metadata.create_all(bind=engine)

app = FastAPI(title="ChatFlow API", version="1.0.0")

origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])

@app.get("/")
def root():
    return {"message": "ChatFlow API is running! 💬"}