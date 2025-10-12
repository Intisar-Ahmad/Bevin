import React from 'react';
import {  Link,useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from '../config/axios.js'
import { useUser } from '../context/user.context.jsx';


const Login = () => {
    const navigate = useNavigate();
    const {setUser} = useUser();

    const {
        register,
        handleSubmit,
        formState: { errors,isSubmitting }
    } = useForm();

    const onSubmit = async ({email,password}) => {
        
       
         try {
           let res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/users/login`,{
                email,password
            });                                                     

            console.log(res.data);

            localStorage.setItem('token',res.data.token)
            setUser(res.data.user)
            navigate("/");

        } catch (error) {
            alert(error.message)
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
            <div className="bg-gray-950 bg-opacity-90 rounded-2xl shadow-2xl p-8 w-full max-w-md">
                <h1 className="text-4xl font-extrabold text-white mb-2 text-center tracking-wide">Bevin</h1>
                <p className="text-gray-400 text-center mb-8">AI-powered login to your future</p>
                <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
                        <input
                            type="email"
                            id="email"
                            autoComplete="email"
                            placeholder="you@bevin.ai"
                            className="mt-1 w-full px-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                            {...register('email', {
                                required: 'Email is required',
                                pattern: {
                                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                    message: 'Enter a valid email'
                                }
                            })}
                        />
                        {errors.email && (
                            <span className="text-red-500 text-xs">{errors.email.message}</span>
                        )}
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
                        <input
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            placeholder="••••••••"
                            className="mt-1 w-full px-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                            {...register('password', {
                                required: 'Password is required',
                                minLength: {
                                    value: 8,
                                    message: 'Password must be at least 8 characters'
                                }
                            })}
                        />
                        {errors.password && (
                            <span className="text-red-500 text-xs">{errors.password.message}</span>
                        )}
                    </div>
                    <button
                        type="submit"
                       className={`w-full py-2 bg-gradient-to-r from-blue-700 via-purple-700 to-pink-600 text-white font-bold rounded-lg hover:scale-105 transition-transform ${isSubmitting? 'cursor-not-allowed opacity-50':'cursor-pointer'}`}
                        disabled={isSubmitting}
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