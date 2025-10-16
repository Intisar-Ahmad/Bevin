import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useUser } from "../context/user.context";
import axios from "../config/axios.js";
import Loader from "../components/Loader";

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
    const fetchProfile = async () => {
       const token = localStorage.getItem("token");
           if(!token){
            navigate("/login");
            return;
           }
      try {
          
        if (!user) {
          const res = await axios.get(`/users/profile`);
          // console.log(res.data.user)
          setUser(res.data.user);
          
        }
    

        const res = await axios.get(`/projects/all`);
        setProject(res.data.projects);
        
     
      } catch (error) {

        console.log(error);
        alert(error.response?.data?.errors || error.message);
        navigate("/login");
      }
    };

    fetchProfile();
  }, []);


  // Create new project
  const createProject = async (data) => {
    try {
      const res = await axios.post(
        `/projects/create`,
        { name: data.projectName }
      );
      setProject((prevProjects) => [...prevProjects, res.data.newProject]);
      console.log(res.data.newProject);
      reset();
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <main>
      {!user ? (
        <Loader />
      ) : (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
          <div className="bg-gray-950 bg-opacity-90 rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <h1 className="text-4xl font-extrabold text-white mb-2 text-center tracking-wide">
              Your Projects
            </h1>
            <p className="text-gray-400 text-center mb-8">
              Manage and explore your creative workspaces
            </p>

            <div className="space-y-6">
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full py-3 bg-gradient-to-r from-blue-700 via-purple-700 to-pink-600 text-white font-semibold rounded-lg hover:scale-105 transition-transform"
              >
                + New Project
              </button>

              <div className="space-y-3">
                {project.length === 0 ? (
                  <p className="text-gray-500 text-center text-sm">
                    No projects yet. Create one!
                  </p>
                ) : (
                  project.map((p) => (
                    <div
                      key={p._id}
                      onClick={() =>
                        navigate(`/project`, { state: { project: p } })
                      }
                      className="p-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg cursor-pointer transition-colors"
                    >
                      <h3 className="text-lg font-semibold text-white">
                        {p.name}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        Collaborators: {p.users?.length || 0}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {isModalOpen && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
              <div className="bg-gray-950 bg-opacity-90 rounded-2xl shadow-2xl w-full max-w-sm p-6">
                <h2 className="text-2xl font-bold text-white mb-4 text-center">
                  Create New Project
                </h2>

                <form
                  onSubmit={handleSubmit(createProject)}
                  className="space-y-5"
                >
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
                        isSubmitting
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      {isSubmitting ? "Creating..." : "Create"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
};

export default Home;
