import { useState, useEffect, useRef } from "react";
import { Send, X, UsersRound, Plus, Search, Crown } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import axios from "../config/axios.js";
import Loader from "../components/Loader.jsx";
import { checkAuth } from "../utils/checkToken.utils.js";
import { useUser } from "../context/user.context.jsx";
import { initializeSocket, receiveMsg, sendMsg } from "../config/socketIO.js";
import Markdown from "markdown-to-jsx";
import Editor from "@monaco-editor/react";
import { getWebContainer } from "../config/webContainer.js";

export default function ProjectPageLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const { projectId } = useParams();
  const [adding, setAdding] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [userToRemove, setUserToRemove] = useState(null);
  const [removing, setRemoving] = useState(false);
  const { user, setUser } = useUser();
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    user: null,
  });
  const messagesEndRef = useRef(null);
  const [aiLoading, setaiLoading] = useState(false);
  const [fileTree, setFileTree] = useState({});
  const [openFiles, setOpenFiles] = useState([]); // array of {name, content}
  const [activeFile, setActiveFile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [webContainer, setWebContainer] = useState(null);
  const [IsRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState([]);
  const [showOutput, setShowOutput] = useState(true);
  const [iframeUrl, setIframeUrl] = useState(null);
  const navigate = useNavigate();
  const [serverProc, setServerProc] = useState(null);
  const [showIframe, setShowIframe] = useState(false);

  useEffect(() => {
    let socket;

    const init = async () => {
      setLoading(true);
      try {
        // authenticate user
        const validatedUser = await checkAuth(navigate, setUser);
        if (!validatedUser) {
          navigate("/login");
          return;
        }

        // fetch project
        const { data } = await axios.get(`/projects/get-project/${projectId}`);
        const fetchedProject = data.project;

        const isMember = fetchedProject.users.some(
          (u) => u._id === validatedUser._id
        );
        const isCreator = fetchedProject.creator === validatedUser._id;

        if (!isMember && !isCreator) {
          alert("You don't have access to this project.");
          navigate("/");
          return;
        }

        setProject(fetchedProject);

        const history = await axios.get(`/projects/get-messages/${projectId}`);
        setMessages(
          history.data.map((m) => ({
            id: m._id,
            sender: m.type === "ai" ? "Bevin" : m.senderId.email,
            text: m.content,
            type:
              m.senderId?._id === validatedUser._id ? "outgoing" : "incoming",
          }))
        );

        //  Initialize socket once
        socket = initializeSocket(fetchedProject._id);
        const container = await getWebContainer();
        setWebContainer(container);
        console.log("container connected");

        //  Handle incoming messages (ignore own)
        const handleIncoming = (data) => {
          console.log(data);
          if (data.sender === validatedUser.email) return;
          if (data.text?.text?.includes("@ai")) {
            setaiLoading(true);
          }
          const incoming = {
            id: Date.now(),
            sender: data.sender || "Unknown",
            text: data.text,
            type: "incoming",
          };
          if (data.sender === "Bevin") {
            console.log(data);
            try {
              // const parsed = JSON.parse(data.text);
              // console.log(parsed);

              if (data.text?.fileTree) {
                setFileTree(data.text?.fileTree);
              }
              incoming.text = data.text?.text;
            } catch (error) {
              console.log(error);
              incoming.text = "Error sending response";
            } finally {
              setaiLoading(false);
              setMessages((prev) => [...prev, incoming]);
            }
          } else {
            setMessages((prev) => [...prev, incoming]);
          }
        };

        receiveMsg("project-message", handleIncoming);

        //Cleanup listener on unmount / project switch
        return () => {
          if (socket) socket.off("project-message", handleIncoming);
        };
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.errors || "Failed to load project");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    init();

    //  If projectId changes, re-run and cleanup old listener
    return () => {
      if (socket) socket.off("project-message");
    };
  }, [projectId, navigate, setUser]);

  // kill process
  const killProcess = () => {
    if (serverProc) {
      serverProc.kill();
      setServerProc(null);
      alert("Server stopped.");
    }
  };

  // colors to code
  const getLanguageFromFile = (filename = "") => {
    const ext = filename.split(".").pop();

    // console.log(ext);
    switch (ext) {
      case "json":
        return "json";
      case "js":
      case "jsx":
        return "javascript";
      case "ts":
      case "tsx":
        return "typescript";
      case "py":
        return "python";
      case "cpp":
      case "cc":
      case "cxx":
      case "h":
      case "hpp":
        return "cpp";
      case "html":
        return "html";
      case "css":
        return "css";
      case "java":
        return "java";
      default:
        return "plaintext";
    }
  };

  // handleFileClicks
  const handleFileClick = (fileName, fileData) => {
    const content = fileData?.file?.contents || "no content";
    const alreadyOpen = openFiles.find((f) => f.name === fileName);
    if (!alreadyOpen) {
      setOpenFiles([...openFiles, { name: fileName, content }]);
    }
    setActiveFile(fileName);
  };

  // Chat state
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: { message: "" },
  });

  const onSubmit = async (data) => {
    const messageText = data.message?.trim();

    if (!user || !project?._id) {
      console.error("Missing user or project context.");
      alert("Unable to send message. Please refresh the page");
      return;
    }

    if (messageText.toLowerCase().includes("@ai")) {
      setaiLoading(true);
    }

    // 2️  Optimistic UI update — show message immediately
    const localMessage = {
      id: Date.now(),
      sender: user.email,
      text: messageText,
      type: "outgoing",
    };

    setMessages((prev) => [...prev, localMessage]);
    reset();

    try {
      // 3️ Send the message through socket
      sendMsg("project-message", {
        sender: user.email,
        text: messageText,
        projectId: project._id,
      });
    } catch (err) {
      console.error("Socket send failed:", err);
      alert("Failed to send message. refresh");
    }
  };

  // Search users
  const searchTimeout = useRef(null);

  const handleSearch = (e) => {
    const q = e.target.value.trim();
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (!q) {
      setSearchResults([]);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await axios.get(`/users/search?q=${encodeURIComponent(q)}`);
        setSearchResults(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setSearchLoading(false);
      }
    }, 200); // wait 200 ms after last keystroke
  };

  // Toggle user selection
  const toggleUser = (user) => {
    setSelectedUsers((prev) => {
      const exists = prev.find((u) => u._id === user._id);
      return exists ? prev.filter((u) => u._id !== user._id) : [...prev, user];
    });
  };

  // Add users to project
  const handleAddUsers = async () => {
    if (!selectedUsers.length) return alert("Select at least one user.");
    setAdding(true);
    try {
      const emails = selectedUsers.map((u) => u.email);
      await axios.patch(`/projects/add-users`, {
        projectId,
        userEmails: emails,
      });
      alert("Users added successfully");
      setModalOpen(false);
      setSelectedUsers([]);
      setSearchResults([]);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.errors || "Failed to add users");
    } finally {
      setAdding(false);
    }
  };

  // remove users
  const removeUser = async () => {
    if (!userToRemove) return;
    setRemoving(true);
    try {
      await axios.post("/projects/remove-user", {
        projectId,
        userId: userToRemove._id,
      });
      setProject((prev) => ({
        ...prev,
        users: prev.users.filter((u) => u._id !== userToRemove._id),
      }));
      setRemoveModalOpen(false);
      setUserToRemove(null);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.errors || "Failed to remove user");
    } finally {
      setRemoving(false);
    }
  };

  // handle ai msg UI
  function handleAIUI(message) {
    return (
      <Markdown className="break-words whitespace-pre-wrap overflow-hidden prose prose-invert max-w-full">
        {message}
      </Markdown>
    );
  }

  // scroll msgs into view
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // show loader
  if (loading) return <Loader />;

  return (
    <main className="min-h-screen max-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex overflow-hidden">
      {/* ---------- COLLABORATORS DRAWER ---------- */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-gray-950/90 backdrop-blur-xl border-r border-gray-800 p-4 transition-transform duration-300 ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Collaborators</h3>
          <button
            onClick={() => {
              setDrawerOpen(false);
              setContextMenu({ visible: false, x: 0, y: 0, user: null });
            }}
            className="p-2 rounded-md hover:bg-gray-800/60 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto h-[calc(100vh-6rem)] scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 pb-16">
          {project?.users?.length ? (
            project.users.map((collaborator, index) => (
              <div
                key={index}
                onClick={(e) => {
                  e.preventDefault();
                  if (project?.creator === user._id) {
                    const isCreator = project?.creator === collaborator._id; // <-- Replace with real user check
                    if (isCreator) return; // block others & self
                    setContextMenu({
                      visible: true,
                      x: e.pageX,
                      y: e.pageY,
                      user: collaborator,
                    });
                  }
                }}
                className="flex items-center gap-3 bg-gray-800/70 hover:bg-gray-700/80 p-3 rounded-lg transition cursor-pointer"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-purple-700 rounded-full flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {collaborator?.email}
                  </div>
                  <div className="text-xs text-gray-500">
                    {collaborator._id === project?.creator
                      ? "Creator"
                      : "Collaborator"}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No collaborators found.</p>
          )}
        </div>

        {/* ADD BUTTON */}
        {project?.creator === user._id && (
          <button
            onClick={() => setModalOpen(true)}
            className="absolute bottom-5 right-5 bg-gradient-to-br from-purple-700 to-blue-700 hover:from-purple-600 hover:to-blue-600 text-white p-3 rounded-full shadow-lg transition-transform hover:scale-110"
          >
            <Plus size={20} />
          </button>
        )}
      </div>

      {/* ---------- CONTEXT MENU ---------- */}
      {contextMenu.visible && (
        <>
          <div
            onClick={() =>
              setContextMenu({ visible: false, x: 0, y: 0, user: null })
            }
            className="fixed inset-0 z-40"
          />
          <div
            style={{
              top: contextMenu.y,
              left: contextMenu.x,
            }}
            className="fixed z-50 bg-gray-900 border border-gray-700 rounded-md shadow-lg w-40"
          >
            <button
              onClick={() => {
                setContextMenu({ visible: false, x: 0, y: 0, user: null });
                setUserToRemove(contextMenu.user);
                setRemoveModalOpen(true);
              }}
              className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-md transition"
            >
              Remove User
            </button>
          </div>
        </>
      )}

      {/* CHAT SIDEBAR */}
      <aside className="w-80 flex-shrink-0 bg-gray-950/80 backdrop-blur-xl border-r border-gray-800 flex flex-col p-4 relative z-20 ">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2 rounded-md bg-gray-800 hover:bg-gray-700 transition"
            >
              <UsersRound size={18} />
            </button>
            <h2 className="text-lg font-semibold tracking-wide">Chat</h2>
          </div>
        </div>

        <style>{`
  .no-scrollbar {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none;    /* Firefox */
  }
  .no-scrollbar::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }
`}</style>

        <div className="flex-1 overflow-y-auto max-h-screen space-y-3 no-scrollbar">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.type === "outgoing" ? "items-end" : "items-start"
              }`}
            >
              <small
                className={`flex items-center gap-1 text-xs mb-1 ${
                  msg.type === "outgoing" ? "text-blue-400" : "text-gray-400"
                }`}
              >
                {msg.sender}
                {(() => {
                  const creator = project?.users?.find(
                    (u) => u._id === project?.creator
                  );
                  return msg.sender === creator?.email ? (
                    <Crown
                      size={12}
                      className="text-yellow-400"
                      title="Project Creator"
                    />
                  ) : null;
                })()}
              </small>

              <div
                className={`p-3 rounded-lg max-w-xs break-words ${
                  msg.type === "outgoing"
                    ? "bg-blue-700/80 ml-auto rounded-br-none"
                    : "bg-gray-800/80 rounded-bl-none"
                }`}
              >
                {msg.sender === "Bevin" ? (
                  handleAIUI(msg.text)
                ) : (
                  <span className="break-words whitespace-pre-wrap">
                    {msg.text}
                  </span>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* ERROR MESSAGE ABOVE INPUT BAR */}
        {errors.message && (
          <p className="text-red-500 text-xs text-left mb-1 ml-1">
            {errors.message.message}
          </p>
        )}
        {aiLoading && (
          <p className="text-blue-500 text-xs text-left mb-1 ml-1">
            Bevin is thinking...
          </p>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex items-center gap-3 bg-gray-900/80 border border-gray-800 rounded-xl px-3 py-2 mt-1"
          autoComplete="off"
        >
          <input
            type="text"
            placeholder="Message or use @ai..."
            {...register("message", {
              required: "Message cannot be empty",
            })}
            className="flex-1 bg-transparent text-gray-200 placeholder-gray-500 focus:outline-none px-2"
          />
          <button
            type="submit"
            className="p-2 rounded-lg bg-gradient-to-r from-blue-700 via-purple-700 to-pink-600 hover:scale-105 transition-transform"
          >
            <Send size={16} />
          </button>
        </form>

        <p className="text-xs text-gray-500 mt-3 text-center">
          Use <span className="text-blue-400 font-semibold">@ai</span> to talk
          to Bevin
        </p>
      </aside>

      {/* ---------- MAIN AREA ---------- */}
      <section className="flex-1 flex bg-gray-900/40 overflow-hidden">
        <div className="absolute top-0 right-2 z-50">
          <button
            disabled={IsRunning}
            // you'll handle this
            onClick={async () => {
              setIsRunning(true);
              setOutput([]);
              if (!webContainer) {
                alert("No WebContainer instance found.");
                setIsRunning(false);
                return;
              }

              if (!activeFile) {
                alert("No active file selected.");
                setIsRunning(false);
                return;
              }

              // Sanitize filenames (flat)
              const sanitizeFileTree = (tree) => {
                const validTree = {};
                for (const [filename, data] of Object.entries(tree)) {
                  const safeName = filename
                    .replace(/[^a-zA-Z0-9._\-]/g, "_")
                    .replace(/^_+|_+$/g, "");
                  if (!safeName) continue;
                  validTree[safeName] = data;
                }
                return validTree;
              };

              const safeTree = sanitizeFileTree(fileTree);

              try {
                // Mount the files into WebContainer FS
                await webContainer.mount(safeTree);

                // Detect extension
                const ext = activeFile.split(".").pop().toLowerCase();

                // Run logic for supported files
                if (ext === "js" || ext === "mjs" || ext === "cjs") {
                  console.log("Running JS/TS file:", activeFile);

                  // If user has express setup, run `npm install` and start server
                  const hasPackageJson =
                    Object.keys(safeTree).includes("package.json");
                  const isServerFile = /server\.js|app\.js/i.test(activeFile);

                  if (hasPackageJson || isServerFile) {
                    alert("Starting Express server inside WebContainer...");

                    // install dependencies (safe)
                    const installProc = await webContainer.spawn("npm", [
                      "install",
                    ]);

                    installProc.output.pipeTo(
                      new WritableStream({
                        write(chunk) {
                          const text = chunk.toString().replace(/\x1b\[[0-9;]*m/g, "");
                          setOutput((prev) => [...prev, text]);
                        },
                      })
                    );
                    await installProc.exit;

                    // start server
                    const startProc = await webContainer.spawn("npm", [
                      "start",
                    ]);
                    setServerProc(startProc);
                    startProc.output.pipeTo(
                      new WritableStream({
                        write(chunk) {
                          const text = chunk.toString().replace(/\x1b\[[0-9;]*m/g, "");
                          setOutput((prev) => [...prev, text]);
                        },
                      })
                    );
                    webContainer.on("server-ready", (port, url) => {
                      console.log(port, url);
                      setIframeUrl(url);
                    });

                    alert("Express server running inside WebContainer.");
                  } else {
                    // just execute standalone JS file
                    const runProc = await webContainer.spawn("node", [
                      activeFile,
                    ]);
                    runProc.output.pipeTo(
                      new WritableStream({
                        write(chunk) {
                          const text = chunk.toString().replace(/\x1b\[[0-9;]*m/g, "");
                          setOutput((prev) => [...prev, text]);
                        },
                      })
                    );

                    const exitCode = await runProc.exit;
                    console.log("Process exited with code:", exitCode);
                  }
                } else {
                  // Unsupported file types
                  alert(`Only .js files are supported yet.`);
                }
              } catch (err) {
                console.error("Error running file:", err);
                alert(
                  "An error occurred while running your file. Check console."
                );
              } finally {
                setIsRunning(false);
              }
            }}
            className="flex items-center gap-2 px-4 py-1 rounded-xl font-semibold 
               bg-gradient-to-r from-purple-600 to-purple-700 
               hover:from-purple-500 hover:to-purple-600
               text-white  
               transition-all duration-300
               hover:scale-105 active:scale-95"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M5 3l14 9-14 9V3z" />
            </svg>
            <span>{IsRunning ? "Running" : "Run"}</span>
          </button>
        </div>
        {/* FILES SIDEBAR */}
        <aside className="w-64 border-r border-gray-800 bg-gray-950/60 backdrop-blur-xl p-4 flex flex-col">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              Files
            </span>
          </h3>

          <div className="flex-1 space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 pb-4 overflow-x-hidden w-[100%]">
            {/* File Tiles */}
            {Object.keys(fileTree).map((file, i) => (
              <div
                key={i + Math.floor(Math.random() * 1000)}
                className="flex items-center gap-3 bg-gray-800/70 hover:bg-gray-700/80 p-3 rounded-lg transition cursor-pointer group w-full overflow-hidden"
                onClick={() => handleFileClick(file, fileTree[file])}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center text-sm font-semibold text-white">
                  {file.split(".")[1]?.[0]?.toUpperCase() || "F"}
                </div>
                <div className="flex-1 w-[70%] overflow-hidden">
                  <p className="text-sm font-medium group-hover:text-blue-400 transition">
                    {file}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* MAIN WORKSPACE */}
        <div className="flex-1 flex flex-col bg-gray-900/60 border-l border-gray-800 rounded-tl-xl">
          {/* FILE TABS */}
          <div className="flex items-center gap-1 border-b border-gray-800 bg-gray-950/60 px-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
            {openFiles.length > 0 ? (
              openFiles.map((file) => (
                <div
                  key={file.name}
                  className={`flex items-center gap-1 px-3 py-2 text-sm cursor-pointer rounded-t-md transition
            ${
              activeFile === file.name
                ? "bg-gray-800/70 text-blue-400 border-b-2 border-blue-500"
                : "text-gray-400 hover:text-gray-200"
            }`}
                  onClick={() => setActiveFile(file.name)}
                >
                  <span>{file.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const remaining = openFiles.filter(
                        (f) => f.name !== file.name
                      );
                      setOpenFiles(remaining);
                      if (activeFile === file.name) {
                        setActiveFile(
                          remaining.length ? remaining[0].name : null
                        );
                      }
                    }}
                    className="hover:text-red-400 ml-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm italic py-2 px-3">
                No files open.
              </p>
            )}
          </div>

          {/* FILE PREVIEW AREA */}
          <div className="flex-1 bg-gray-900/80 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 text-sm text-gray-300 font-mono rounded-b-xl">
            {activeFile ? (
              <Editor
                height="100%"
                theme="vs-dark"
                language={getLanguageFromFile(activeFile)}
                value={
                  openFiles.find((f) => f.name === activeFile)?.content || ""
                }
                onChange={(newValue) => {
                  setOpenFiles((prev) =>
                    prev.map((f) =>
                      f.name === activeFile ? { ...f, content: newValue } : f
                    )
                  );

                  // keep fileTree in sync
                  setFileTree((prev) => ({
                    ...prev,
                    [activeFile]: {
                      file: {
                        contents: newValue,
                      },
                    },
                  }));
                }}
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-600 italic">
                Select a file from the sidebar to open it.
              </div>
            )}
          </div>
        </div>
        {/* ---------- OUTPUT PANEL ---------- */}
        {showOutput && (
          <div className="absolute bottom-0 left-[320px] right-0 h-48 bg-gray-950/90 border-t border-gray-800 text-gray-200 font-mono text-sm overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 p-3 z-40">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-400">Console Output</span>
              <button
                onClick={() => setShowOutput(false)}
                className="text-xs text-gray-500 hover:text-gray-300"
              >
                Hide
              </button>
            </div>
            <pre className="whitespace-pre-wrap break-words">
              {output.length ? output.join("") : "No output yet."}
            </pre>
          </div>
        )}
        {/* ---------- IFAME PREVIEW ---------- */}
        {!showIframe && (
          <button
            onClick={() => setShowIframe(true)}
            className="absolute bottom-2 right-[130px] bg-gray-800/70 px-3 py-1 text-xs rounded-md text-gray-300 hover:bg-gray-700 z-40"
          >
            Show Iframe
          </button>
        )}
        {showIframe && (
          <div className="absolute top-0 left-[320px] right-0 bottom-0 bg-gray-950/95 border-t border-gray-800 flex flex-col z-40">
            <div className="flex space-x-2 items-center bg-gray-900 border-b border-gray-800 p-2">
              <span className="text-xs text-gray-400">Express App Preview</span>
              <button
                onClick={() => setShowIframe(null)}
                className="text-xs text-gray-400 hover:text-gray-200 transition"
              >
                Hide Preview
              </button>
              <button
                onClick={killProcess}
                className="text-xs text-gray-400 hover:text-gray-200 transition"
              >
                Kill process
              </button>
            </div>
            <iframe
              src={iframeUrl}
              title="App Preview"
              className="w-full h-full bg-white rounded-none"
            />
          </div>
        )}

        {!showOutput && (
          <button
            onClick={() => setShowOutput(true)}
            className="absolute bottom-2 right-4 bg-gray-800/70 px-3 py-1 text-xs rounded-md text-gray-300 hover:bg-gray-700 z-40"
          >
            Show Console
          </button>
        )}
      </section>

      {/* ---------- ADD USER MODAL ---------- */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Collaborators</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 hover:bg-gray-800 rounded-md transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* SEARCH FIELD */}
            <div className="relative mb-4">
              <Search
                size={16}
                className="absolute left-3 top-3 text-gray-400"
              />
              <input
                type="text"
                onChange={handleSearch}
                placeholder="Search by email..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* SEARCH RESULTS */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-700/80 scrollbar-track-gray-900/40 hover:scrollbar-thumb-gray-600/80 transition-all duration-300">
              {searchLoading ? (
                <p className="text-gray-500 text-sm">Searching...</p>
              ) : searchResults.length ? (
                searchResults.map((user) => (
                  <button
                    key={user._id}
                    onClick={() => toggleUser(user)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg transition ${
                      selectedUsers.find((u) => u._id === user._id)
                        ? "bg-blue-700/60"
                        : "bg-gray-800/60 hover:bg-gray-700/80"
                    }`}
                  >
                    <span>{user.email}</span>
                    {selectedUsers.find((u) => u._id === user._id) && (
                      <span className="text-xs text-blue-300">Added</span>
                    )}
                  </button>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No users found.</p>
              )}
            </div>

            {/* SELECTED USERS */}
            {selectedUsers.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm text-gray-400 mb-2">Selected:</h4>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-700/80 scrollbar-track-gray-900/40 hover:scrollbar-thumb-gray-600/80 transition-all duration-300">
                  {selectedUsers.map((u) => (
                    <div
                      key={u._id}
                      className="bg-blue-700/40 px-2 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      {u.email}
                      <button
                        onClick={() => toggleUser(u)}
                        className="hover:text-red-400"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CONFIRM BUTTON */}
            <button
              onClick={handleAddUsers}
              disabled={adding}
              className={`mt-6 w-full py-2 rounded-lg font-medium transition-transform ${
                adding
                  ? "bg-gray-700 cursor-not-allowed opacity-70"
                  : "bg-gradient-to-r from-blue-700 to-purple-700 hover:scale-105"
              }`}
            >
              {adding ? "Adding..." : "Add to Project"}
            </button>
          </div>
        </div>
      )}
      {/* ---------- REMOVE USER MODAL ---------- */}
      {removeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-semibold mb-4 text-red-400">
              Remove Collaborator
            </h3>
            <p className="text-gray-300 mb-6 text-sm">
              Are you sure you want to remove{" "}
              <span className="font-medium text-white">
                {userToRemove?.email}
              </span>{" "}
              from this project?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRemoveModalOpen(false)}
                className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={removeUser}
                disabled={removing}
                className={`px-4 py-2 rounded-lg font-medium transition-transform ${
                  removing
                    ? "bg-gray-700 cursor-not-allowed opacity-70"
                    : "bg-gradient-to-r from-red-700 to-pink-600 hover:scale-105"
                }`}
              >
                {removing ? "Removing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
