import React from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import axios from "../config/axios.js";
import { useUser } from "../context/user.context.jsx";

const Register = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields, isSubmitting },
  } = useForm();

   const {setUser} = useUser();

  const onSubmit = async ({ email, password }) => {
    try {
      let res = await axios.post(
        `/users/register`,
        {
          email,
          password,
        }
      );

      console.log(res.data);

      localStorage.setItem("token", res.data.token);
      
      setUser(res.data.user);
      
      navigate("/");

    } catch (error) {
    alert(error.response?.data?.errors || error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="bg-gray-950 bg-opacity-90 rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-4xl font-extrabold text-white mb-2 text-center tracking-wide">
          Bevin
        </h1>
        <p className="text-gray-400 text-center mb-8">
          Create your AI-powered account
        </p>
        <form
          className="space-y-6"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              autoComplete="email"
              placeholder="you@bevin.ai"
              className={`mt-1 w-full px-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                errors.email && touchedFields.email
                  ? "border border-red-500"
                  : ""
              }`}
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Invalid email address",
                },
              })}
            />
            {errors.email && touchedFields.email && (
              <p className="text-red-500 text-xs mt-1">
                {errors.email.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              autoComplete="new-password"
              placeholder="••••••••"
              className={`mt-1 w-full px-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                errors.password && touchedFields.password
                  ? "border border-red-500"
                  : ""
              }`}
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters",
                },
              })}
            />
            {errors.password && touchedFields.password && (
              <p className="text-red-500 text-xs mt-1">
                {errors.password.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            className={`w-full py-2 bg-gradient-to-r from-blue-700 via-purple-700 to-pink-600 text-white font-bold rounded-lg hover:scale-105 transition-transform ${
              isSubmitting ? "cursor-not-allowed opacity-50" : "cursor-pointer"
            }`}
            disabled={isSubmitting}
          >
            Register
          </button>
        </form>
        <div className="flex items-center justify-between mt-6">
          <span className="text-gray-400 text-sm">
            Already have an account?
          </span>
          <Link
            to="/login"
            className="text-blue-500 hover:underline text-sm font-medium"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
