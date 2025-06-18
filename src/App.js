import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, MessageCircle, Reply, Trash2, Check, X } from 'lucide-react';

const ChatApp = () => {
  const [socket, setSocket] = useState(null);
  const [room, setRoom] = useState('');
  const [currentRoom, setCurrentRoom] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [userCount, setUserCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  const rooms = ['Christnic_anonymous'];

  useEffect(() => {
    // Initialize Socket.IO connection
    const newSocket = window.io ? window.io('https://chrisnic-1.onrender.com') : null;
    
    if (newSocket) {
      setSocket(newSocket);
      setIsConnected(true);

      // Socket event listeners
      newSocket.on('message', (data) => {
        setMessages(prev => [...prev, data]);
      });

      newSocket.on('chatHistory', (history) => {
        setMessages(history);
      });

      newSocket.on('roomUsers', (data) => {
        setUserCount(data.count);
      });

      newSocket.on('chatCleared', () => {
        setMessages([]);
      });

      return () => {
        newSocket.disconnect();
      };
    } else {
      console.error('Socket.IO not loaded. Make sure to include the Socket.IO client library.');
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const joinRoom = (roomName) => {
    if (socket && roomName) {
      if (currentRoom) {
        socket.emit('leaveRoom', { room: currentRoom });
      }
      socket.emit('joinRoom', { room: roomName });
      setCurrentRoom(roomName);
      setRoom(roomName);
      setMessages([]);
      setReplyTo(null);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (socket && message.trim() && currentRoom) {
      socket.emit('chatMessage', {
        room: currentRoom,
        message: message.trim(),
        replyTo: replyTo?._id || null
      });
      setMessage('');
      setReplyTo(null);
      messageInputRef.current?.focus();
    }
  };

  const handleReply = (msg) => {
    setReplyTo(msg);
    messageInputRef.current?.focus();
  };

  const clearReply = () => {
    setReplyTo(null);
  };

  const clearChat = () => {
    if (socket && currentRoom) {
      socket.emit('clearChat', currentRoom);
      setShowClearConfirm(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getSocketDisplayName = (socketId) => {
    if (socketId === 'system') return 'System';
    return `User ${socketId.slice(-4)}`;
  };

  if (!socket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Socket.IO...</p>
          <p className="text-sm text-gray-500 mt-2">Make sure Socket.IO client is loaded</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="bg-white rounded-t-2xl shadow-lg p-6 border-b border-gray-200">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <MessageCircle className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Modern Chat</h1>
                <p className="text-gray-600 text-sm">
                  {currentRoom ? `Connected to ${currentRoom}` : 'Select a room to start chatting'}
                </p>
              </div>
            </div>
            
            {currentRoom && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-lg">
                  <Users className="h-4 w-4 text-green-600" />
                  <span className="text-green-700 font-medium">{userCount}</span>
                </div>
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className=" hidden p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Clear chat"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-b-2xl overflow-hidden">
          <div className="flex h-96 md:h-[600px]">
            {/* Sidebar */}
            <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
              <h3 className="font-semibold text-gray-800 mb-4">Chat Rooms</h3>
              <div className="space-y-2">
                {rooms.map((roomName) => (
                  <button
                    key={roomName}
                    onClick={() => joinRoom(roomName)}
                    className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                      currentRoom === roomName
                        ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        currentRoom === roomName ? 'bg-indigo-500' : 'bg-gray-400'
                      }`}></div>
                      <span className="font-medium">{roomName}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {currentRoom ? (
                <>
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, index) => (
                      <div key={index} className="group">
                        {msg.replyTo && (
                          <div className="ml-4 mb-2 p-2 bg-gray-50 rounded-lg border-l-4 border-gray-300">
                            <div className="text-xs text-gray-500 mb-1">
                              Replying to {getSocketDisplayName(msg.replyTo.socketId)}
                            </div>
                            <div className="text-sm text-gray-600 truncate">
                              {msg.replyTo.message}
                            </div>
                          </div>
                        )}
                        
                        <div className={`flex items-start space-x-3 ${
                          msg.socketId === socket.id ? 'flex-row-reverse space-x-reverse' : ''
                        }`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            msg.socketId === 'system' 
                              ? 'bg-yellow-100 text-yellow-700'
                              : msg.socketId === socket.id
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {msg.socketId === 'system' ? 'S' : msg.socketId.slice(-2).toUpperCase()}
                          </div>
                          
                          <div className={`flex-1 max-w-xs md:max-w-md ${
                            msg.socketId === socket.id ? 'flex flex-col items-end' : ''
                          }`}>
                            <div className={`p-3 rounded-2xl ${
                              msg.socketId === 'system'
                                ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                                : msg.socketId === socket.id
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              <div className="text-sm font-medium mb-1">
                                {getSocketDisplayName(msg.socketId)}
                              </div>
                              <div className="break-words">{msg.message}</div>
                            </div>
                            
                            <div className={`flex items-center mt-1 space-x-2 ${
                              msg.socketId === socket.id ? 'flex-row-reverse space-x-reverse' : ''
                            }`}>
                              <span className="text-xs text-gray-500">
                                {formatTime(msg.timestamp)}
                              </span>
                              
                              {msg.socketId !== 'system' && (
                                <button
                                  onClick={() => handleReply(msg)}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-indigo-600 transition-all"
                                  title="Reply"
                                >
                                  <Reply className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Reply Preview */}
                  {replyTo && (
                    <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                      <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                        <div className="flex-1">
                          <div className="text-xs text-gray-500 mb-1">
                            Replying to {getSocketDisplayName(replyTo.socketId)}
                          </div>
                          <div className="text-sm text-gray-700 truncate">
                            {replyTo.message}
                          </div>
                        </div>
                        <button
                          onClick={clearReply}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors ml-2"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex space-x-3">
                      <input
                        ref={messageInputRef}
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            sendMessage(e);
                          }
                        }}
                        placeholder={replyTo ? "Reply to message..." : "Type your message..."}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        maxLength={500}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!message.trim()}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
                      >
                        <Send className="h-4 w-4" />
                        <span className="hidden sm:inline">Send</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">Select a room to start chatting</p>
                    <p className="text-gray-400 text-sm mt-2">Choose from the available rooms on the left</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Clear Chat Confirmation Modal */}
        {showClearConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Clear Chat History</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to clear all messages in this room? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={clearChat}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Clear Chat
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Connection Status */}
        <div className="mt-4 text-center">
          <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs ${
            isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatApp;