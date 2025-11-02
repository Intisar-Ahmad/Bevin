import{ useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useUser } from "../context/user.context";
import axios from "../config/axios.js";
import Loader from "../components/Loader";
import { checkAuth } from "../utils/checkToken.utils.js";

const Home = () => {
  const navigate = useNavigate();
  const { user, setUser } = useUser();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [project, setProject] = useState([]);

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  // Fetch user profile
 useEffect(() => {
  const init = async () => {
    const isValid = await checkAuth(navigate, setUser);
    if (!isValid){
      console.log(user);
      return;
    }

    try {
      const res = await axios.get(`/projects/all`);
      setProject(res.data.projects);
    } catch (error) {
      console.error("Failed to load projects:", error);
    }
  };

  init();
}, []);

  // Create new project
  const createProject = async (data) => {
    try {
      const res = await axios.post(`/projects/create`, {
        name: data.projectName,
      });
      setProject((prevProjects) => [...prevProjects, res.data.newProject]);
      console.log(res.data.newProject);
      reset();
      setIsModalOpen(false);
    } catch (err) {
      // console.error(err);
      alert(err.response?.data?.errors || err.message);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center p-6">
      {!user ? (
        <Loader />
      ) : (
        <div className="w-full max-w-5xl bg-gray-950/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-gray-800">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold tracking-wide">Your Projects</h1>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-700 via-purple-700 to-pink-600 text-white font-semibold rounded-lg hover:scale-105 transition-transform"
            >
              + New
            </button>
          </div>

          {/* Project Grid */}
          {project.length === 0 ? (
            <p className="text-gray-500 text-center mt-10">
              No projects yet — create one to get started!
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {project.map((p) => (
                <div
                  key={p._id}
                  onClick={() =>
                    navigate(`/project/${p._id}`)
                  }
                  className="p-5 bg-gray-800/80 rounded-xl border border-gray-700 hover:bg-gray-700/70 transition-all cursor-pointer group"
                >
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-400">
                    {p.name}
                  </h3>
                  <div className=" text-sm flex space-x-1 text-gray-400">
                    <p>Collaborators:
                    {p.users?.length || 0}</p>
                   <img className="w-3" src="/user.svg" alt="user" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL — only shows when New is clicked */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-950 bg-opacity-90 rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-gray-800">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">
              Create New Project
            </h2>

            <form onSubmit={handleSubmit(createProject)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  placeholder="Enter project name"
                  {...register("projectName", {
                    required: "Project name is required",
                    minLength: {
                      value: 3,
                      message: "Name must be at least 3 characters",
                    },
                  })}
                  className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                {errors.projectName && (
                  <span className="text-red-500 text-xs">
                    {errors.projectName.message}
                  </span>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    reset();
                  }}
                  className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-700 via-purple-700 to-pink-600 hover:scale-105 transition-transform ${
                    isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isSubmitting ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Home;
