# 💬 ChatFlow - Real-Time Chat Application

A full-stack real-time chat application built with WebSockets, FastAPI, and React.

## 🚀 Features

- 🔐 User Registration & Login with JWT Authentication
- 💬 Real-time messaging with WebSockets
- 🏠 Multiple chat rooms
- 🟢 Online/Offline user status
- 📱 Clean modern UI
- 💾 Message history saved to database

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Tailwind CSS |
| Backend | FastAPI (Python) |
| Database | PostgreSQL + SQLAlchemy |
| Real-time | WebSockets |
| Auth | JWT Tokens + bcrypt |

## ⚙️ Setup Instructions

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🔐 Environment Variables

Create a `.env` file in `backend/`:
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/chatflow
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## 👨‍💻 Author
**Welcome Molefe** — Final Year Computer Science Student
