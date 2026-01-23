import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    FaUserMd, FaLock, FaExclamationTriangle, FaSignInAlt, 
    FaSpinner, FaUserCheck, FaBuilding 
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const Login = () => {
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [backendStatus, setBackendStatus] = useState('checking');

    useEffect(() => {
        checkBackendStatus();
        
        // Check if user is already logged in
        const token = localStorage.getItem('token');
        if (token) {
            navigate('/dashboard');
        }
    }, [navigate]);

    const checkBackendStatus = async () => {
        try {
            const response = await fetch(`${API_URL}/health`);
            if (response.ok) {
                setBackendStatus('online');
            } else {
                setBackendStatus('offline');
            }
        } catch (error) {
            setBackendStatus('offline');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!formData.email.trim() || !formData.password.trim()) {
            setError('Email and password are required');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    email: formData.email.trim().toLowerCase(),
                    password: formData.password.trim() 
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || data.message || 'Login failed');
            }

            if (!data.success) {
                throw new Error(data.error || 'Login failed');
            }

            // Store authentication data
            localStorage.setItem('token', data.token);
            if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('userRole', data.user.role || '');
                localStorage.setItem('userId', data.user.id || '');
            }

            // Redirect based on role
            const role = data.user?.role;
            if (role === 'admin') {
                window.location.href = '/admin/dashboard';
            } else {
                window.location.href = '/dashboard';
            }

        } catch (err) {
            setError(err.message || 'Login failed. Please try again.');
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo and Brand */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4">
                        <FaUserMd className="text-white text-2xl" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Addis Med CDSS</h1>
                    <p className="text-gray-600">Clinical Decision Support System</p>
                </div>

                {/* Status Indicator */}
                <div className={`mb-6 flex items-center justify-center gap-2 px-4 py-2 rounded-full ${
                    backendStatus === 'online' ? 'bg-green-100 text-green-800' : 
                    backendStatus === 'offline' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                    <div className={`w-2 h-2 rounded-full ${
                        backendStatus === 'online' ? 'bg-green-500' : 
                        backendStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
                    } ${backendStatus === 'checking' ? 'animate-pulse' : ''}`}></div>
                    <span className="text-sm font-medium">
                        {backendStatus === 'online' ? 'System Online' : 
                         backendStatus === 'offline' ? 'System Offline' : 'Checking System...'}
                    </span>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
                        <p className="text-gray-600">Sign in to your account</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl">
                            <div className="flex items-start gap-3">
                                <FaExclamationTriangle className="text-red-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-red-800 font-medium text-sm">Unable to sign in</p>
                                    <p className="text-red-600 text-sm mt-1">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    placeholder="your@email.com"
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                    disabled={loading}
                                >
                                    {showPassword ? 'Hide' : 'Show'}
                                </button>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition pr-10"
                                    placeholder="Enter your password"
                                    required
                                    disabled={loading}
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                    <FaLock className="text-gray-400" />
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || backendStatus === 'offline'}
                            className={`w-full py-3 px-4 rounded-xl font-medium transition ${
                                loading || backendStatus === 'offline'
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                            }`}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <FaSpinner className="animate-spin" />
                                    Signing in...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <FaSignInAlt />
                                    Sign In
                                </span>
                            )}
                        </button>
                    </form>

                    {/* Registration Links */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <p className="text-center text-gray-600 text-sm mb-4">
                            Don't have an account?
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <Link
                                to="/register"
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition text-sm font-medium"
                            >
                                <FaUserCheck />
                                Individual
                            </Link>
                            <Link
                                to="/register-company"
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl transition text-sm font-medium"
                            >
                                <FaBuilding />
                                Organization
                            </Link>
                        </div>
                    </div>

                    {/* Help Text */}
                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-500">
                            Having trouble?{' '}
                            <button
                                onClick={checkBackendStatus}
                                className="text-blue-600 hover:text-blue-800 underline"
                            >
                                Check connection
                            </button>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">
                        © {new Date().getFullYear()} Addis Med CDSS. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;