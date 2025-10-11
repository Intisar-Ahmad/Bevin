import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [touched, setTouched] = useState({ email: false, password: false });
    const [error, setError] = useState({ email: '', password: '' });
    const navigate = useNavigate();

    const validateEmail = (value) => {
        if (!value) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Invalid email address';
        return '';
    };

    const validatePassword = (value) => {
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        return '';
    };

    const handleBlur = (field) => {
        setTouched({ ...touched, [field]: true });
        if (field === 'email') setError({ ...error, email: validateEmail(email) });
        if (field === 'password') setError({ ...error, password: validatePassword(password) });
    };

    const handleChange = (e) => {
        const { id, value } = e.target;
        if (id === 'email') {
            setEmail(value);
            if (touched.email) setError({ ...error, email: validateEmail(value) });
        }
        if (id === 'password') {
            setPassword(value);
            if (touched.password) setError({ ...error, password: validatePassword(value) });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const emailErr = validateEmail(email);
        const passwordErr = validatePassword(password);
        setError({ email: emailErr, password: passwordErr });
        setTouched({ email: true, password: true });
        if (!emailErr && !passwordErr) {
            // Registration logic here
            // After successful registration, navigate to login or dashboard
            navigate('/login');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
            <div className="bg-gray-950 bg-opacity-90 rounded-2xl shadow-2xl p-8 w-full max-w-md">
                <h1 className="text-4xl font-extrabold text-white mb-2 text-center tracking-wide">Bevin</h1>
                <p className="text-gray-400 text-center mb-8">Create your AI-powered account</p>
                <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
                        <input
                            type="email"
                            id="email"
                            autoComplete="email"
                            required
                            className={`mt-1 w-full px-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${error.email && touched.email ? 'border border-red-500' : ''}`}
                            placeholder="you@bevin.ai"
                            value={email}
                            onChange={handleChange}
                            onBlur={() => handleBlur('email')}
                        />
                        {error.email && touched.email && (
                            <p className="text-red-500 text-xs mt-1">{error.email}</p>
                        )}
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
                        <input
                            type="password"
                            id="password"
                            autoComplete="new-password"
                            required
                            className={`mt-1 w-full px-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${error.password && touched.password ? 'border border-red-500' : ''}`}
                            placeholder="••••••••"
                            value={password}
                            onChange={handleChange}
                            onBlur={() => handleBlur('password')}
                        />
                        {error.password && touched.password && (
                            <p className="text-red-500 text-xs mt-1">{error.password}</p>
                        )}
                    </div>
                    <button
                        type="submit"
                        className="w-full py-2 bg-gradient-to-r from-blue-700 via-purple-700 to-pink-600 text-white font-bold rounded-lg hover:scale-105 transition-transform"
                    >
                        Register
                    </button>
                </form>
                <div className="flex items-center justify-between mt-6">
                    <span className="text-gray-400 text-sm">Already have an account?</span>
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