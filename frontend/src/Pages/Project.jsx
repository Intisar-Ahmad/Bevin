import { useState, useEffect, useRef } from "react";
import { Send, X, UsersRound, Plus, Search } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import axios from "../config/axios.js";
import Loader from "../components/Loader.jsx";
import { checkAuth } from "../utils/checkToken.utils.js";
import { useUser } from "../context/user.context.jsx";


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
  const {user,setUser} = useUser();
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    user: null,
  });

  const navigate = useNavigate();

 useEffect(() => {
  const init = async () => {
    // get the validated user directly from checkAuth
    const validatedUser = await checkAuth(navigate, setUser);
    if (!validatedUser) return; // not authenticated

    // now fetch project and check membership using validatedUser
    try {
      const res = await axios.get(`/projects/get-project/${projectId}`);
      const fetchedProject = res.data.project;

      const isMember = fetchedProject.users.some(
        (u) => u._id === validatedUser._id
      );
      const isCreator = fetchedProject.creator === validatedUser._id;

      // console.log(isMember, isCreator, fetchedProject, validatedUser);

      if (!isMember && !isCreator) {
        // don't be aggressive — remove token and redirect
        localStorage.removeItem("token");
        setUser(null);
        alert("You don't have access to this project.");
        navigate("/");
        return;
      }

      setProject(fetchedProject);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.errors || "Failed to load project");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  init();
}, [projectId,user]); // run when projectId changes




  // Chat state
  const [messages, setMessages] = useState([]);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: { message: "" },
  });

  const onSubmit = (data) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: user.email,
        text: data.message,
        type: "outgoing",
      },
    ]);
    reset();
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
    }, 400); // wait 400 ms after last keystroke
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

  if (loading) return <Loader />;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex overflow-hidden">
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
                onContextMenu={(e) => {
                  e.preventDefault();
                  if(project?.creator === user._id){
                      const isCreator =
                    project?.creator === collaborator._id; // <-- Replace with real user check
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
                  <div className="text-sm font-medium">{collaborator?.email}</div>
                  <div className="text-xs text-gray-500">
                    {collaborator._id === project?.creator ? "Creator" : "Collaborator"}
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

      {/* OVERLAY */}
      {drawerOpen && (
        <button
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-40 bg-black/50"
          aria-hidden="true"
        />
      )}

      {/* CHAT SIDEBAR */}
      <aside className="w-80 flex-shrink-0 bg-gray-950/80 backdrop-blur-xl border-r border-gray-800 flex flex-col p-4 relative z-20">
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

        <div className="flex-1 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.type === "outgoing" ? "items-end" : "items-start"
              }`}
            >
              <small
                className={`text-xs mb-1 ${
                  msg.type === "outgoing" ? "text-blue-400" : "text-gray-400"
                }`}
              >
                {msg.sender}
              </small>
              <div
                className={`p-3 rounded-lg max-w-xs break-words ${
                  msg.type === "outgoing"
                    ? "bg-blue-700/80 ml-auto rounded-br-none"
                    : "bg-gray-800/80 rounded-bl-none"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* ERROR MESSAGE ABOVE INPUT BAR */}
        {errors.message && (
          <p className="text-red-500 text-xs text-left mb-1 ml-1">
            {errors.message.message}
          </p>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex items-center gap-3 bg-gray-900/80 border border-gray-800 rounded-xl px-3 py-2 mt-1"
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

      {/* MAIN AREA */}
      <section className="flex-1 bg-gray-900/40 flex items-center justify-center">
        <span className="text-gray-500">
          Code generation area (blank for now)
        </span>
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
            <div className="space-y-2 max-h-52 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
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
                <div className="flex flex-wrap gap-2">
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
