from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from database import get_db
from models.models import Message, Room, User
from pydantic import BaseModel
from typing import List
import json

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict = {}

    async def connect(self, websocket: WebSocket, room_id: int, username: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append({"ws": websocket, "username": username})

    def disconnect(self, websocket: WebSocket, room_id: int):
        if room_id in self.active_connections:
            self.active_connections[room_id] = [
                c for c in self.active_connections[room_id] if c["ws"] != websocket
            ]

    async def broadcast(self, message: dict, room_id: int):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                await connection["ws"].send_text(json.dumps(message))

manager = ConnectionManager()

class RoomCreate(BaseModel):
    name: str
    description: str = ""

@router.post("/rooms")
def create_room(room: RoomCreate, db: Session = Depends(get_db)):
    existing = db.query(Room).filter(Room.name == room.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Room already exists!")
    new_room = Room(name=room.name, description=room.description)
    db.add(new_room)
    db.commit()
    db.refresh(new_room)
    return new_room

@router.get("/rooms")
def get_rooms(db: Session = Depends(get_db)):
    return db.query(Room).all()

@router.get("/rooms/{room_id}/messages")
def get_messages(room_id: int, db: Session = Depends(get_db)):
    messages = db.query(Message).filter(
        Message.room_id == room_id
    ).order_by(Message.created_at).limit(50).all()
    return [
        {
            "id": m.id,
            "content": m.content,
            "username": m.sender.username,
            "created_at": str(m.created_at)
        } for m in messages
    ]

@router.websocket("/ws/{room_id}/{username}")
async def websocket_endpoint(
    websocket: WebSocket,
    room_id: int,
    username: str,
    db: Session = Depends(get_db)
):
    await manager.connect(websocket, room_id, username)
    user = db.query(User).filter(User.username == username).first()
    if user:
        user.is_online = True
        db.commit()

    await manager.broadcast({
        "type": "system",
        "message": f"{username} joined the chat!",
        "username": "System"
    }, room_id)

    try:
        while True:
            data = await websocket.receive_text()
            if user:
                new_message = Message(
                    content=data,
                    sender_id=user.id,
                    room_id=room_id
                )
                db.add(new_message)
                db.commit()
            await manager.broadcast({
                "type": "message",
                "message": data,
                "username": username,
                "created_at": str(user.created_at if user else "")
            }, room_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)
        if user:
            user.is_online = False
            db.commit()
        await manager.broadcast({
            "type": "system",
            "message": f"{username} left the chat!",
            "username": "System"
        }, room_id)