import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

export default function Chat() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [onlineUsers, setOnlineUsers] = useState([])
  const [newRoomName, setNewRoomName] = useState('')
  const wsRef = useRef(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (!user) navigate('/login')
    fetchRooms()
    fetchUsers()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (selectedRoom) {
      connectWebSocket(selectedRoom.id)
      fetchMessages(selectedRoom.id)
    }
    return () => {
      if (wsRef.current) wsRef.current.close()
    }
  }, [selectedRoom])

  const fetchRooms = async () => {
    const res = await axios.get('http://localhost:8000/api/chat/rooms')
    setRooms(res.data)
    if (res.data.length > 0) setSelectedRoom(res.data[0])
  }

  const fetchMessages = async (roomId) => {
    const res = await axios.get(`http://localhost:8000/api/chat/rooms/${roomId}/messages`)
    setMessages(res.data)
  }

  const fetchUsers = async () => {
    const res = await axios.get('http://localhost:8000/api/auth/users')
    setOnlineUsers(res.data)
  }

  const connectWebSocket = (roomId) => {
    if (wsRef.current) wsRef.current.close()
    const ws = new WebSocket(`ws://localhost:8000/api/chat/ws/${roomId}/${user.username}`)
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setMessages(prev => [...prev, data])
    }
    wsRef.current = ws
  }

  const sendMessage = () => {
    if (!newMessage.trim() || !wsRef.current) return
    wsRef.current.send(newMessage)
    setNewMessage('')
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') sendMessage()
  }

  const createRoom = async () => {
    if (!newRoomName.trim()) return
    await axios.post('http://localhost:8000/api/chat/rooms', {
      name: newRoomName,
      description: ''
    })
    setNewRoomName('')
    fetchRooms()
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-indigo-900 text-white flex flex-col">
        <div className="p-4 border-b border-indigo-700">
          <h1 className="text-xl font-bold">💬 ChatFlow</h1>
          <p className="text-indigo-300 text-sm mt-1">@{user?.username}</p>
        </div>

        {/* Rooms */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-indigo-300 text-xs font-semibold uppercase mb-3">Rooms</h3>
          {rooms.map(room => (
            <button
              key={room.id}
              onClick={() => setSelectedRoom(room)}
              className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition ${
                selectedRoom?.id === room.id ? 'bg-indigo-600' : 'hover:bg-indigo-800'
              }`}
            >
              # {room.name}
            </button>
          ))}

          {/* Create Room */}
          <div className="mt-4">
            <input
              type="text"
              value={newRoomName}
              onChange={e => setNewRoomName(e.target.value)}
              placeholder="New room name"
              className="w-full bg-indigo-800 text-white placeholder-indigo-400 rounded-lg px-3 py-2 text-sm focus:outline-none"
            />
            <button
              onClick={createRoom}
              className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg text-sm font-medium transition"
            >
              + Create Room
            </button>
          </div>

          {/* Online Users */}
          <h3 className="text-indigo-300 text-xs font-semibold uppercase mt-6 mb-3">Users</h3>
          {onlineUsers.map(u => (
            <div key={u.id} className="flex items-center gap-2 px-3 py-1 text-sm">
              <div className={`w-2 h-2 rounded-full ${u.is_online ? 'bg-green-400' : 'bg-gray-500'}`}></div>
              {u.username}
            </div>
          ))}
        </div>

        <button
          onClick={handleLogout}
          className="p-4 text-indigo-300 hover:text-white text-sm border-t border-indigo-700 transition"
        >
          🚪 Logout
        </button>
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white px-6 py-4 shadow flex items-center">
          <h2 className="text-xl font-bold text-gray-800">
            # {selectedRoom?.name || 'Select a room'}
          </h2>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.username === user?.username ? 'justify-end' : 'justify-start'}`}>
              {msg.type === 'system' ? (
                <div className="text-center text-gray-400 text-sm w-full">
                  {msg.message}
                </div>
              ) : (
                <div className={`max-w-xs lg:max-w-md ${msg.username === user?.username ? 'items-end' : 'items-start'} flex flex-col`}>
                  <span className="text-xs text-gray-500 mb-1">{msg.username}</span>
                  <div className={`px-4 py-2 rounded-2xl text-sm ${
                    msg.username === user?.username
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-white text-gray-800 shadow rounded-bl-none'
                  }`}>
                    {msg.message || msg.content}
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white p-4 shadow flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Message #${selectedRoom?.name || '...'}`}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={sendMessage}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            Send 🚀
          </button>
        </div>
      </div>
    </div>
  )
}