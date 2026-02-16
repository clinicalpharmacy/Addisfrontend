import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    FaUserMd, FaLock, FaExclamationTriangle, FaSignInAlt,
    FaSpinner, FaUserCheck, FaBuilding
} from 'react-icons/fa';

// IMPORTANT: Update this URL to your actual backend URL
// If using Vercel, it might be: https://pharmacare-backend.vercel.app
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
import api from '../utils/api';

const Login = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [systemOnline, setSystemOnline] = useState(null);
    const [isCheckingHealth, setIsCheckingHealth] = useState(true);

    useEffect(() => {
        // Check if user is already logged in
        const token = localStorage.getItem('token');
        const userRole = localStorage.getItem('userRole');

        if (token) {
            // Redirect based on role
            if (userRole === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/dashboard');
            }
        }

        // Check Backend Health
        const checkHealth = async () => {
            try {
                setIsCheckingHealth(true);
                const health = await api.get('/health');
                setSystemOnline(health.success && health.status === 'healthy');
            } catch (err) {
                console.error('System Health Check Failed:', err);
                setSystemOnline(false);
            } finally {
                setIsCheckingHealth(false);
            }
        };

        checkHealth();
    }, [navigate]);

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
            console.log('🔐 Attempting login for:', formData.email);

            // Using centralized api utility
            const data = await api.post('/auth/login', {
                email: formData.email.trim().toLowerCase(),
                password: formData.password.trim()
            });

            console.log('✅ Login successful:', data);

            // Store authentication data
            localStorage.setItem('token', data.token);
            if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('userRole', data.user.role || '');
                localStorage.setItem('userId', data.user.id || '');
                localStorage.setItem('userType', data.user_type || data.user.account_type || 'individual');

                // Store subscription info
                localStorage.setItem('subscription_status', data.user.subscription_status || 'inactive');
                localStorage.setItem('subscription_end_date', data.user.subscription_end_date || '');
                localStorage.setItem('has_subscription', data.user.subscription_status === 'active' ? 'true' : 'false');
            }

            // Redirect based on role
            const role = data.user?.role;
            const accountType = data.user?.account_type;

            console.log('🔄 Redirecting user:', { role, accountType });

            if (role === 'admin') {
                navigate('/admin/dashboard');
            } else if (accountType === 'company_user' || data.user_type === 'company_user') {
                navigate('/company/dashboard');
            } else {
                navigate('/dashboard');
            }

        } catch (err) {
            console.error('❌ Login error:', err);

            // Special handling for email verification
            if (err.email_verification_required) {
                setError(
                    <div className="flex flex-col gap-3">
                        <p>{err.error || 'Please verify your email address before logging in.'}</p>
                        <button
                            onClick={async () => {
                                try {
                                    setLoading(true);
                                    const res = await api.post('/auth/resend-verification', { email: formData.email });
                                    if (res.success) {
                                        setError(''); // Clear error on success
                                        alert('Verification email sent! Please check your inbox.');
                                    } else {
                                        setError(res.error || 'Failed to resend verification email');
                                    }
                                } catch (e) {
                                    setError(e.error || e.message || 'Failed to resend verification email');
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            className="bg-blue-600 text-white text-xs font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition w-fit"
                        >
                            Resend Verification Email
                        </button>
                    </div>
                );
            } else {
                setError(err.error || err.message || 'Login failed. Please check your credentials and try again.');
            }
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
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Addis Med</h1>
                    <p className="text-gray-600 italic">Enhance Patient Safety & Optimize Medicines Use</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome Back</h2>
                        <p className="text-gray-500 text-sm">Sign in to your account</p>
                    </div>

                    {/* System Status Banner */}
                    {!isCheckingHealth && (
                        <div className={`mb-6 p-4 rounded-xl border-l-4 flex items-center justify-between shadow-sm transition-all duration-500 ${systemOnline
                                ? 'bg-green-50 border-green-500 text-green-800'
                                : 'bg-red-50 border-red-500 text-red-800'
                            }`}>
                            <div className="flex items-center gap-3">
                                {systemOnline ? (
                                    <FaUserCheck className="text-green-600" />
                                ) : (
                                    <FaExclamationTriangle className="text-red-600 animate-pulse" />
                                )}
                                <div>
                                    <p className="font-black text-xs uppercase tracking-[0.15em]">
                                        {systemOnline ? 'SYSTEM ONLINE' : 'SYSTEM OFFLINE'}
                                    </p>
                                    <p className="text-[10px] opacity-80 font-medium">
                                        {systemOnline ? 'Secure connection established' : 'Server is unreachable at this moment'}
                                    </p>
                                </div>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${systemOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)] animate-pulse'}`}></div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl">
                            <div className="flex items-start gap-3">
                                <FaExclamationTriangle className="text-red-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-red-800 font-medium text-sm">Unable to proceed</p>
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
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                                <div className="flex items-center gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="text-sm text-gray-500 hover:text-blue-600 transition"
                                        disabled={loading}
                                    >
                                        {showPassword ? 'Hide' : 'Show'}
                                    </button>
                                    <Link
                                        to="/forgot-password"
                                        className="text-sm text-blue-600 hover:text-blue-800 font-medium transition"
                                    >
                                        Forgot Password?
                                    </Link>
                                </div>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                            disabled={loading}
                            className={`w-full py-3 px-4 rounded-xl font-medium transition ${loading
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                                }`}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <FaSpinner className="animate-spin" />
                                    Processing...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <FaSignInAlt />
                                    Sign In
                                </span>
                            )}
                        </button>
                    </form>

                    {/* Quick Test Logins (For Development Only) */}
                    {process.env.NODE_ENV === 'development' && (
                        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                            <p className="text-sm text-gray-600 mb-2">Quick Test (Dev Only):</p>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => testLogin('admin@pharmacare.com', 'Admin@123')}
                                    className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded"
                                >
                                    Admin
                                </button>
                                <button
                                    onClick={() => testLogin('test@example.com', 'password123')}
                                    className="px-3 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded"
                                >
                                    Test User
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Registration Links */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <p className="text-center text-gray-600 text-sm mb-4">
                            Don't have an account?
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <Link
                                to="/signup?type=individual"
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition text-sm font-medium"
                            >
                                <FaUserCheck />
                                Individual
                            </Link>
                            <Link
                                to="/signup?type=organization"
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
                            <Link to="/forgot-password" title="Forgot Password" className="text-blue-600 hover:text-blue-800 underline">
                                Reset your password
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                        © {new Date().getFullYear()} AddisMed • Clinical Intelligence Center
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
