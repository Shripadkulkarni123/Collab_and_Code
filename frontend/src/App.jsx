import React, { useEffect, useState, useRef } from 'react';
import './App.css';
import io from 'socket.io-client';
import Editor from '@monaco-editor/react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { v4 as uuidv4 } from 'uuid';  // Fixed import

// Add mobile detection
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

const socket = io(import.meta.env.VITE_BACKEND_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

socket.on('connect', () => {
  console.log('Connected to server with ID:', socket.id);
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  toast.error('Failed to connect to server', {
    position: "top-right",
    autoClose: 2000,
    theme: "dark"
  });
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
  toast.warn('Disconnected from server', {
    position: "top-right",
    autoClose: 2000,
    theme: "dark"
  });
});

const App = () => {
  const [joined, setJoined] = useState(false);
  const [roomid, setRoomId] = useState("");
  const [userName, setUsername] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("");
  const [users, setUsers] = useState([]);
  const [typing, setTyping] = useState("");
  const [output, setoutput] = useState("");
  const codeRef = useRef("");
  const typingTimeoutRef = useRef(null);
  const [userInput, setuserInput] = useState("");

  useEffect(() => {
    socket.on("userJoined", (usersList) => {
      console.log("Users in room:", usersList);
      console.log("Number of users:", usersList.length);
      console.log("Current users state:", users);
      setUsers(usersList);
    });

    socket.on("codeUpdate", (newCode) => {
      if (newCode !== codeRef.current) {
        setCode(newCode);
        codeRef.current = newCode;
      }
    });

    socket.on("languageUpdate", (newLang) => {
      setLanguage(newLang);
      toast.info(`Language changed to ${newLang}`, {
        position: "top-right",
        autoClose: 2000,
        theme: "dark"
      });
    });

    socket.on("userTyping", ({ userName: typingUser }) => {
      if (typingUser !== userName) {
        setTyping(`${typingUser} is typing...`);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          setTyping("");
        }, 2000);
      }
    });

    socket.on("userLeft", (usersList) => {
      setUsers(usersList);
      toast.info("A user left the room", {
        position: "top-right",
        autoClose: 2000,
        theme: "dark"
      });
    });

    socket.on("codeResponse", (response) => {
      if (response.run) {
        let outputText = "";

        if (response.run.output) {
          outputText += response.run.output;
        }

        if (response.run.stderr) {
          outputText += `\nError: ${response.run.stderr}`;
        }

        if (response.run.error) {
          outputText += `\nExecution Error: ${response.run.error}`;
        }

        if (response.run.compile) {
          outputText += `\nCompilation Error: ${response.run.compile.output}`;
        }

        setoutput(outputText || "No output");

        if (response.run.stderr || response.run.error || response.run.compile) {
          toast.error("Code execution failed", {
            position: "top-right",
            autoClose: 2000,
            theme: "dark"
          });
        } else {
          toast.success("Code executed successfully", {
            position: "top-right",
            autoClose: 2000,
            theme: "dark"
          });
        }
      } else {
        setoutput("No output received from the server");
        toast.error("Failed to execute code", {
          position: "top-right",
          autoClose: 2000,
          theme: "dark"
        });
      }
    });

    return () => {
      socket.off("userJoined");
      socket.off("codeUpdate");
      socket.off("languageUpdate");
      socket.off("userTyping");
      socket.off("userLeft");
      socket.off("codeResponse");
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [userName]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      socket.emit("leaveRoom", { roomId: roomid, userName });
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [roomid, userName]);

  useEffect(() => {
    if (isMobile) {
      toast.warning("For better experience, please switch to desktop mode. This is a code editor application.", {
        position: "top-center",
        autoClose: false,
        theme: "dark",
        closeOnClick: false,
        draggable: false,
        closeButton: false,
        style: {
          background: "#ff9800",
          color: "white",
          fontSize: "16px",
          padding: "20px",
          textAlign: "center",
          maxWidth: "90vw",
          margin: "0 auto"
        }
      });
    }
  }, []);

  const joinRoom = () => {
    if (roomid && userName) {
      socket.emit("join", { roomId: roomid, userName });
      setJoined(true);
      toast.success("Joined room successfully!", {
        position: "top-right",
        autoClose: 2000,
        theme: "dark"
      });
    } else {
      toast.error("Please enter both room ID and username", {
        position: "top-right",
        autoClose: 2000,
        theme: "dark"
      });
    }
  };

  const leaveRoom = () => {
    socket.emit("leaveRoom", { roomId: roomid, userName });
    setJoined(false);
    setRoomId("");
    setUsername("");
    setCode("");
    setUsers([]);
    toast.warn("You left the room", {
      position: "top-right",
      autoClose: 2000,
      theme: "dark"
    });
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomid);
    toast.success("Room ID copied!", {
      position: "top-right",
      autoClose: 2000,
      theme: "dark"
    });
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    codeRef.current = newCode;
    socket.emit("codeChange", { roomId: roomid, code: newCode });
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing", { roomId: roomid, userName });
    }, 300);
  };

  const handleLanguageChange = (e) => {
    const selectedLang = e.target.value;
    setLanguage(selectedLang);
    socket.emit("languageChange", { roomId: roomid, language: selectedLang });
  };

  const runCode = () => {
    if (!code.trim()) {
      toast.error("Please enter some code to execute", {
        position: "top-right",
        autoClose: 2000,
        theme: "dark"
      });
      return;
    }

    socket.emit("compileCode", {
      code,
      roomId: roomid,
      language,
      input: userInput
    });
    toast.info("Code execution started...", {
      position: "top-right",
      autoClose: 2000,
      theme: "dark"
    });
  };

  const createRoomId = () => {
    const roomId = uuidv4(); // Correct usage here
    setRoomId(roomId);
    toast.info("New Room ID generated!", {
      position: "top-right",
      autoClose: 2000,
      theme: "dark"
    });
  };

  if (!joined) {
    return (
      <div className='join-container'>
        <h1 className="main-heading" style={{ textAlign: "left" }}>Welcome to CodeCollab</h1>
        <div className="joinform">
          <input
            type='text'
            placeholder='Room ID'
            value={roomid}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <button onClick={createRoomId}>Generate Room ID</button>
          <input
            type='text'
            placeholder='Your Name'
            value={userName}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button onClick={joinRoom}>Join Room</button>
        </div>
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className='editor'>
      <div className="sidebar">
        <div className="roominfo">
          <h2>Code Room: {roomid}</h2>
          <button onClick={copyRoomId}>Copy ID</button>
          <h3>Users in Room ({users.length})</h3>
          <ul className="users-list">
            {users.map((user, index) => (
              <li key={index} className="user-item">
                <span>{user}</span>
              </li>
            ))}
          </ul>
          <select
            className='languagesel'
            value={language}
            onChange={handleLanguageChange}
          >
            <option value="javascript">Javascript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
          {typing && (
            <div className="typing-indicator">
              <span className="typing-text">{typing}</span>
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          <button className='leaveroom' onClick={leaveRoom}>
            Leave Room
          </button>
        </div>
      </div>

      <div className="main-content">
        <div className="editor-section">
          <Editor
            height="100%"
            language={language}
            value={code}
            onChange={handleCodeChange}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              wordWrap: 'on',
              wrappingStrategy: 'advanced',
              scrollbar: {
                vertical: 'visible',
                horizontal: 'visible',
                useShadows: false,
                verticalScrollbarSize: 10,
                horizontalScrollbarSize: 10
              }
            }}
          />
        </div>

        <div className="compiler-section">
          <div className="compiler-header">
            <h3>Compiler Output</h3>
            <button className='run-btn' onClick={runCode}>Execute</button>
          </div>
          <div className="input-area">
            <textarea
              value={userInput}
              onChange={(e) => setuserInput(e.target.value)}
              placeholder="Enter input for your code here..."
            />
          </div>
          <div className="output-area">
            <pre>{output || "No output yet..."}</pre>
          </div>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};

export default App;
