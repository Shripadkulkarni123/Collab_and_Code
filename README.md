# CodeCollab - Real-Time Collaborative Code Editor

A powerful real-time collaborative code editor that enables multiple users to code together simultaneously, featuring live code execution, syntax highlighting, and instant updates.

## 🚀 Key Features

### Real-time Collaboration
- Multiple users can code simultaneously in the same room
- Live code synchronization across all connected users
- Real-time typing indicators showing who's currently typing
- User presence tracking showing who's in the room

### Code Execution
- Execute code in multiple programming languages
- Real-time output display
- Support for user input during code execution
- Error handling and display
- Supported languages:
  - JavaScript (Node.js 18.15.0)
  - Python (3.10.0)
  - Java (15.0.2)
  - C++ (10.2.0)

### Modern UI/UX
- Monaco Editor integration (same editor as VS Code)
- Dark theme with syntax highlighting
- Responsive layout with sidebar and main editor
- Toast notifications for user actions
- Real-time typing indicators with animations

## 🛠️ Technical Stack

### Frontend
- **React.js** - UI framework
- **Socket.IO Client** - Real-time communication
- **Monaco Editor** - Code editor component
- **React-Toastify** - Notification system
- **CSS3** - Styling and animations

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web server framework
- **Socket.IO** - WebSocket implementation
- **Axios** - HTTP client for API calls
- **Piston API** - Code execution service

## 🔧 Technical Implementation Details

### Real-time Communication
```javascript
// Socket.IO event handling for real-time updates
socket.on('codeChange', ({ roomId, code }) => {
  if (rooms.has(roomId)) {
    rooms.get(roomId).code = code;
    io.to(roomId).emit('codeUpdate', code);
  }
});
```

### Code Execution System
```javascript
// Integration with Piston API for code execution
const response = await axios.post("https://emkc.org/api/v2/piston/execute", {
  language: langConfig.language,
  version: langConfig.version,
  files: [{ content: code }],
  stdin: input
});
```

### Room Management
- Unique room IDs using UUID
- Room-based isolation for different coding sessions
- User tracking within rooms
- Code and language state persistence per room

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   # Backend setup
   cd backend
   npm install

   # Frontend setup
   cd ../frontend
   npm install
   ```

3. Start the servers:
   ```bash
   # Start backend (from backend directory)
   npm start

   # Start frontend (from frontend directory)
   npm run dev
   ```

4. Open `http://localhost:5173` in your browser

## 💡 Key Technical Challenges Solved

1. **Real-time Code Synchronization**
   - Implemented conflict resolution for concurrent edits
   - Optimized update frequency to prevent performance issues
   - Handled edge cases in code synchronization

2. **Code Execution Security**
   - Sandboxed code execution through Piston API
   - Input validation and sanitization
   - Error handling and graceful degradation

3. **User Experience**
   - Smooth real-time updates without UI freezing
   - Responsive typing indicators
   - Intuitive room management system

## 🔒 Security Features

- Room-based isolation for different coding sessions
- Secure code execution through Piston API
- Input validation and sanitization
- Error handling and graceful degradation
- No sensitive data storage

## 🎯 Future Enhancements

1. **Technical Improvements**
   - WebRTC integration for peer-to-peer communication
   - Code formatting and linting
   - Git integration for version control
   - Custom themes and editor settings

2. **Feature Additions**
   - File upload/download support
   - Chat functionality
   - Code sharing capabilities
   - User authentication system

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License.

## 👥 Author

- Your Name - Shripad Kulkarni

## 🙏 Acknowledgments

- Monaco Editor team for the powerful code editor
- Piston API team for the code execution service
- Socket.IO team for the real-time communication framework 