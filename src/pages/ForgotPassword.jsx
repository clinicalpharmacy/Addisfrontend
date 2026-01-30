import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope, FaArrowLeft, FaCheckCircle, FaExclamationTriangle, FaSpinner, FaKey, FaShieldAlt } from 'react-icons/fa';
import api from '../utils/api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [resetToken, setResetToken] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await api.post('/auth/forgot-password', { email });
            if (result.success) {
                setSuccess(true);
                if (result.reset_token) {
                    setResetToken(result.reset_token);
                }
            }
        } catch (err) {
            setError(err.error || err.message || 'Failed to process request. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 transform transition-all">
                    <div className="mb-8 text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-3xl shadow-lg mb-4 transform hover:rotate-12 transition-transform">
                            <FaShieldAlt className="text-white text-3xl" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Recover Access</h2>
                        <p className="text-gray-500 mt-2 font-medium">Verify your identity to reset your password</p>
                    </div>

                    {success ? (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="p-6 bg-green-50 rounded-2xl border border-green-100 flex flex-col items-center">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                    <FaCheckCircle className="text-green-600 text-2xl" />
                                </div>
                                <p className="text-green-800 font-bold text-lg text-center">Identity Found!</p>
                                <p className="text-green-600 text-sm mt-1 text-center font-medium">
                                    A secure reset token has been generated for your account.
                                </p>
                            </div>

                            {resetToken && (
                                <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <FaKey className="text-blue-600" />
                                        <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">Reset Credentials</p>
                                    </div>
                                    <p className="text-sm text-blue-700 mb-4 font-medium leading-relaxed">
                                        Your unique reset token is ready. Click the button below to set your new password.
                                    </p>
                                    <Link
                                        to={`/reset-password?token=${resetToken}`}
                                        className="block w-full text-center py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                                    >
                                        Proceed to Password Reset
                                    </Link>
                                    <div className="mt-4 text-center">
                                        <code className="text-[10px] font-mono text-blue-400 break-all select-all p-1 bg-white/50 rounded">{resetToken}</code>
                                    </div>
                                </div>
                            )}

                            <Link
                                to="/login"
                                className="flex items-center justify-center gap-2 text-gray-500 hover:text-gray-800 font-bold transition text-sm"
                            >
                                <FaArrowLeft />
                                Back to Login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-shake">
                                    <FaExclamationTriangle className="text-red-500 mt-1 flex-shrink-0" />
                                    <p className="text-red-600 text-sm font-semibold">{error}</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700 ml-1">
                                    Registered Email Address
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <FaEnvelope className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:bg-white focus:border-blue-500 outline-none transition-all duration-300 font-medium"
                                        placeholder="Enter your email"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-4 rounded-2xl font-bold text-white transition-all duration-300 shadow-xl ${loading
                                        ? 'bg-gray-400 cursor-not-allowed scale-95'
                                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-2xl hover:-translate-y-1 active:scale-95'
                                    }`}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <FaSpinner className="animate-spin" />
                                        Verifying Identity...
                                    </span>
                                ) : (
                                    'Generate Reset Token'
                                )}
                            </button>

                            <Link
                                to="/login"
                                className="flex items-center justify-center gap-2 text-gray-500 hover:text-gray-800 font-bold transition text-sm pt-2"
                            >
                                <FaArrowLeft />
                                Return to Login
                            </Link>
                        </form>
                    )}
                </div>

                <p className="text-center mt-8 text-gray-400 text-xs font-medium">
                    Addis Med CDSS Identity Protection Service
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;
