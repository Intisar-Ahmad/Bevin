import React from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import axios from "../config/axios.js";

const ForgotPassword = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields },
  } = useForm();
  const [isSending, setIsSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [email, setEmail] = React.useState("");

  const onSubmit = async (data) => {
    setIsSending(true);
    setEmail(data.email);

    try {
      const res = await axios.post("/users/forgot-password", {
        email: data.email,
      });

      if (res.data?.msg) {
        setSent(true);
      }
    } catch (error) {
      alert(error.response?.data?.errors || error.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="bg-gray-950 bg-opacity-90 rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-4xl font-extrabold text-white mb-2 text-center tracking-wide">
          Bevin
        </h1>
        <p className="text-gray-400 text-center mb-8">Reset your password</p>
        {!sent ? (
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
                disabled={isSending}
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Enter a valid email address",
                  },
                })}
              />
              {errors.email && touchedFields.email && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-gradient-to-r from-blue-700 via-purple-700 to-pink-600 text-white font-bold rounded-lg hover:scale-105 transition-transform"
              disabled={isSending}
            >
              {isSending ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <svg
              className="animate-spin h-8 w-8 text-blue-500 mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
            <p className="text-white text-lg font-semibold mb-2">
              Check your inbox
            </p>
            <p className="text-gray-400 text-center text-sm">
              We've sent a password reset link to{" "}
              <span className="font-medium text-blue-400">{email}</span>. If it
              exists{" "}
            </p>
          </div>
        )}
        <div className="mt-6 text-center">
          <Link
            className="text-gray-500 hover:text-gray-300 text-xs"
            to="/login"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
