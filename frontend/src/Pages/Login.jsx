import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        // Add your login logic here
        // On successful login, navigate to dashboard or home
        // navigate('/dashboard');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
            <div className="bg-gray-950 bg-opacity-90 rounded-2xl shadow-2xl p-8 w-full max-w-md">
                <h1 className="text-4xl font-extrabold text-white mb-2 text-center tracking-wide">Bevin</h1>
                <p className="text-gray-400 text-center mb-8">AI-powered login to your future</p>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
                        <input
                            type="email"
                            id="email"
                            autoComplete="email"
                            required
                            className="mt-1 w-full px-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                            placeholder="you@bevin.ai"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
                        <input
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            required
                            className="mt-1 w-full px-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                            placeholder="••••••••"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-2 bg-gradient-to-r from-blue-700 via-purple-700 to-pink-600 text-white font-bold rounded-lg hover:scale-105 transition-transform"
                    >
                        Sign In
                    </button>
                </form>
                <div className="flex items-center justify-between mt-6">
                    <span className="text-gray-400 text-sm">Don't have an account?</span>
                    <Link
                        to="/register"
                        className="text-blue-500 hover:underline text-sm font-medium"
                    >
                        Sign Up
                    </Link>
                </div>
                <div className="mt-4 text-center">
                    <Link
                        to="/forgot-password"
                        className="text-gray-500 hover:text-gray-300 text-xs"
                    >
                        Forgot password?
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;