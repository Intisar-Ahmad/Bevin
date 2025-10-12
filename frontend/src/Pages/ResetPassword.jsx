import React from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate, Link } from 'react-router-dom';

const ResetPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    const {
        register,
        handleSubmit,
        formState: { errors, touchedFields }
    } = useForm();

    const [success, setSuccess] = React.useState(false);
    const [error, setError] = React.useState('');

    const onSubmit = async (data) => {
        setError('');
        if (!token) {
            setError('Invalid or missing token.');
            return;
        }
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password: data.newPassword }),
            });
            // const result = await res.json();
            if (res.ok) {
                setSuccess(true);
                setTimeout(() => navigate('/'), 5000);
            } else {
                const result = await res.json();
                setError(result.message || 'Failed to reset password.');
            }
        } catch {
            setError('Network error. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
            <div className="bg-gray-950 bg-opacity-90 rounded-2xl shadow-2xl p-8 w-full max-w-md">
                <h1 className="text-3xl font-extrabold text-white mb-2 text-center tracking-wide">Reset Password</h1>
                <p className="text-gray-400 text-center mb-8">Enter your new password below</p>
                {success ? (
                    <div className="text-center">
                        <p className="text-green-400 font-semibold mb-4">Password reset successfully!</p>
                        <p className="text-gray-300 mb-4">Redirecting to home page in 5 seconds...</p>
                        <Link
                            className="py-2 px-4 bg-blue-700 text-white rounded-lg font-bold hover:scale-105 transition-transform inline-block"
                            to="/"
                        >
                            Go to Home
                        </Link>
                    </div>
                ) : (
                    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300">New Password</label>
                            <input
                                type="password"
                                id="newPassword"
                                autoComplete="new-password"
                                placeholder="••••••••"
                                className={`mt-1 w-full px-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${errors.newPassword && touchedFields.newPassword ? 'border border-red-500' : ''}`}
                                {...register('newPassword', {
                                    required: 'New password is required',
                                    minLength: {
                                        value: 8,
                                        message: 'Password must be at least 8 characters'
                                    }
                                })}
                            />
                            {errors.newPassword && touchedFields.newPassword && (
                                <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>
                            )}
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">Confirm Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                autoComplete="new-password"
                                placeholder="••••••••"
                                className={`mt-1 w-full px-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${errors.confirmPassword && touchedFields.confirmPassword ? 'border border-red-500' : ''}`}
                                {...register('confirmPassword', {
                                    required: 'Please confirm your password',
                                    validate: (value, { newPassword }) =>
                                        value === newPassword || 'Passwords do not match',
                                    minLength: {
                                        value: 8,
                                        message: 'Password must be at least 8 characters'
                                    }
                                })}
                            />
                            {errors.confirmPassword && touchedFields.confirmPassword && (
                                <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
                            )}
                        </div>
                        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                        <button
                            type="submit"
                            className="w-full py-2 bg-gradient-to-r from-blue-700 via-purple-700 to-pink-600 text-white font-bold rounded-lg hover:scale-105 transition-transform"
                        >
                            Reset Password
                        </button>
                        <div className="text-center mt-4">
                            <Link to="/" className="text-blue-400 hover:underline">Back to Home</Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;