import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    FaUserMd, FaLock, FaExclamationTriangle, FaSignInAlt,
    FaSpinner, FaUserCheck, FaBuilding, FaEnvelope, FaEye, FaEyeSlash,
    FaShieldAlt, FaHeartbeat, FaCheckCircle, FaArrowRight, FaIdCard
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
    const [focusedField, setFocusedField] = useState(null);
    const [isEmailValid, setIsEmailValid] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'addisMedId'

    // Carousel messages for dynamic background
    const carouselMessages = [
        { icon: FaHeartbeat, text: "Digital Health", color: "from-blue-600 to-cyan-600" },
        { icon: FaShieldAlt, text: "Enhance Patient Safety", color: "from-purple-600 to-pink-600" },
        { icon: FaCheckCircle, text: "Optimize Medicines Use", color: "from-green-600 to-teal-600" }
    ];

    useEffect(() => {
        // Rotate carousel messages
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % carouselMessages.length);
        }, 3000);

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

        return () => clearInterval(interval);
    }, [navigate]);

    // Email validation
    useEffect(() => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        setIsEmailValid(emailRegex.test(formData.email));
    }, [formData.email]);

    // Addis-Med ID validation (basic format check)
    const isAddisMedIdValid = () => {
        if (!formData.email) return false;
        // Check for HCC-XXXXXX-XXXXXX format (looser validation to accommodate timestamp lengths)
        const addisMedIdRegex = /^HCC-[A-Z0-9]{6,10}-[A-Z0-9]{6,10}$/i;
        return addisMedIdRegex.test(formData.email);
    };

    // Password strength indicator (simple version)
    useEffect(() => {
        if (formData.password.length === 0) {
            setPasswordStrength(0);
        } else if (formData.password.length < 6) {
            setPasswordStrength(1);
        } else if (formData.password.length < 10) {
            setPasswordStrength(2);
        } else {
            setPasswordStrength(3);
        }
    }, [formData.password]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!formData.email.trim() || !formData.password.trim()) {
            setError('Email/Addis-Med ID and password are required');
            setLoading(false);
            return;
        }

        // Determine if this is a healthcare client login (using HCC ID format)
        const isHealthcareClient = /^HCC-/i.test(formData.email.trim());

        try {
            console.log(`🔐 Attempting login for: ${formData.email} (${isHealthcareClient ? 'Healthcare Client' : 'Regular User'})`);

            // Using centralized api utility
            const data = await api.post('/auth/login', {
                email: formData.email.trim().toLowerCase(),
                password: formData.password.trim(),
                login_method: isHealthcareClient ? 'addis_med_id' : 'email'
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

                // Store healthcare client ID if applicable
                if (data.user.healthcare_client_id) {
                    localStorage.setItem('healthcare_client_id', data.user.healthcare_client_id);
                }
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

            // Special handling for email verification AND/OR approval
            if (err.email_verification_required && err.approval_required) {
                setError(
                    <div className="flex flex-col gap-3">
                        <p className="font-bold text-red-700">Action Required:</p>
                        <ul className="list-disc ml-5 text-sm space-y-1">
                            <li>Verify your email address</li>
                            <li>Wait for admin approval</li>
                        </ul>
                        <button
                            onClick={async () => {
                                try {
                                    setLoading(true);
                                    const res = await api.post('/auth/resend-verification', { email: formData.email });
                                    if (res.success) {
                                        alert('Verification email sent! Please check your inbox.');
                                    } else {
                                        alert(res.error || 'Failed to resend verification email');
                                    }
                                } catch (e) {
                                    alert(e.error || e.message || 'Failed to resend verification email');
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            className="bg-blue-600 text-white text-xs font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition w-fit mt-2"
                        >
                            Resend Verification Email
                        </button>
                    </div>
                );
            } else if (err.email_verification_required) {
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
            } else if (err.approval_required) {
                setError(
                    <div className="flex flex-col gap-2">
                        <p className="font-bold">Account Pending Approval</p>
                        <p className="text-sm">{err.error || 'Your account is waiting for administrator approval.'}</p>
                    </div>
                );
            } else {
                setError(err.error || err.message || 'Login failed. Please check your credentials and try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const testLogin = (email, password) => {
        setFormData({ email, password });
        // Auto-detect login method based on email format
        if (/^HCC-/i.test(email)) {
            setLoginMethod('addisMedId');
        } else {
            setLoginMethod('email');
        }
    };

    const getPasswordStrengthColor = () => {
        switch (passwordStrength) {
            case 0: return 'bg-gray-200';
            case 1: return 'bg-red-500';
            case 2: return 'bg-yellow-500';
            case 3: return 'bg-green-500';
            default: return 'bg-gray-200';
        }
    };

    const getPasswordStrengthText = () => {
        switch (passwordStrength) {
            case 0: return '';
            case 1: return 'Weak';
            case 2: return 'Medium';
            case 3: return 'Strong';
            default: return '';
        }
    };

    const CurrentIcon = carouselMessages[currentSlide].icon;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center p-3 sm:p-4 relative overflow-hidden">
            {/* Animated Background Elements - Hidden on mobile for performance */}
            <div className="absolute inset-0 overflow-hidden hidden md:block">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-white rounded-full opacity-10 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white rounded-full opacity-10 animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-20 animate-ping"></div>

                {/* Floating medical icons */}
                <FaHeartbeat className="absolute top-20 left-20 text-white opacity-10 text-6xl animate-bounce" />
                <FaShieldAlt className="absolute bottom-20 right-20 text-white opacity-10 text-6xl animate-bounce delay-700" />
                <FaUserMd className="absolute top-40 right-40 text-white opacity-10 text-6xl animate-bounce delay-300" />
            </div>

            {/* Mobile Optimized Background Elements - Subtle version */}
            <div className="absolute inset-0 overflow-hidden md:hidden">
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-white rounded-full opacity-5"></div>
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-white rounded-full opacity-5"></div>
            </div>

            {/* Left Center - Addis Med Brand with Moving Texts - Hidden on mobile/tablet */}
            <div className="absolute left-4 md:left-8 top-1/2 transform -translate-y-1/2 z-20 hidden lg:block">
                <div className="flex flex-col items-start">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="absolute inset-0 bg-white rounded-xl blur-xl opacity-50 animate-pulse"></div>
                            <div className="relative flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-2xl">
                                <FaUserMd className="text-white text-2xl md:text-3xl animate-pulse" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Addis Med</h1>
                        </div>
                    </div>

                    {/* Moving Texts Carousel */}
                    <div className="mt-4 ml-2 h-12 md:h-14 overflow-hidden">
                        <div
                            className="transform transition-transform duration-500 ease-in-out"
                            style={{ transform: `translateY(-${currentSlide * 3}rem)` }}
                        >
                            {carouselMessages.map((msg, index) => {
                                const Icon = msg.icon;
                                return (
                                    <div key={index} className="h-12 md:h-14 flex items-center gap-3">
                                        <Icon className="text-white/90 text-lg md:text-xl" />
                                        <p className="text-white/90 text-lg md:text-xl font-light">{msg.text}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile/Tablet Top Center - Compact Addis Med Brand */}
            <div className="absolute top-3 left-0 right-0 z-20 lg:hidden flex justify-center">
                <div className="flex flex-col items-center bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <div className="absolute inset-0 bg-white rounded-lg blur-md opacity-50"></div>
                            <div className="relative flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg shadow-lg">
                                <FaUserMd className="text-white text-sm" />
                            </div>
                        </div>
                        <h1 className="text-base font-bold text-white">Addis Med</h1>
                    </div>

                    {/* Mobile Carousel - Single line */}
                    <div className="mt-1 h-4 overflow-hidden">
                        <div
                            className="transform transition-transform duration-500 ease-in-out"
                            style={{ transform: `translateY(-${currentSlide * 1}rem)` }}
                        >
                            {carouselMessages.map((msg, index) => {
                                const Icon = msg.icon;
                                return (
                                    <div key={index} className="h-4 flex items-center justify-center gap-1">
                                        <Icon className="text-white/80 text-xs" />
                                        <p className="text-white/80 text-xs font-light truncate max-w-[150px]">{msg.text}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Center - Login Card (Less Wide) */}
            <div className="w-full max-w-md relative z-10 px-2 sm:px-0 mt-12 lg:mt-0">
                {/* Login Card */}
                <div className="bg-white/95 backdrop-blur-lg rounded-xl md:rounded-2xl lg:rounded-3xl shadow-2xl p-4 sm:p-5 md:p-6 lg:p-8 border border-white/20 transform transition-all duration-300 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]">
                    <div className="mb-4 sm:mb-5 md:mb-6 lg:mb-8 text-center">
                        <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg sm:rounded-xl md:rounded-2xl mb-2 sm:mb-3 md:mb-4 shadow-lg">
                            <FaSignInAlt className="text-white text-lg sm:text-xl md:text-2xl" />
                        </div>
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
                            Welcome
                        </h2>
                        <p className="text-xs sm:text-sm md:text-base text-gray-600 px-2">Sign in to continue your journey</p>

                        {/* Login Method Toggle */}
                        <div className="flex items-center justify-center gap-1 sm:gap-2 mt-3 sm:mt-4 bg-gray-100 p-1 rounded-lg sm:rounded-xl">
                            <button
                                type="button"
                                onClick={() => {
                                    setLoginMethod('email');
                                    setFormData({ ...formData, email: '' });
                                    setError('');
                                }}
                                className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${loginMethod === 'email'
                                    ? 'bg-white text-blue-600 shadow-md'
                                    : 'text-gray-600 hover:text-gray-800'
                                    }`}
                            >
                                <FaEnvelope className="text-xs sm:text-sm" />
                                <span className="hidden xs:inline">Email</span>
                                <span className="xs:hidden">@</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setLoginMethod('addisMedId');
                                    setFormData({ ...formData, email: '' });
                                    setError('');
                                }}
                                className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${loginMethod === 'addisMedId'
                                    ? 'bg-white text-green-600 shadow-md'
                                    : 'text-gray-600 hover:text-gray-800'
                                    }`}
                            >
                                <FaIdCard className="text-xs sm:text-sm" />
                                <span className="hidden xs:inline">Addis-Med ID</span>
                                <span className="xs:hidden">ID</span>
                            </button>
                        </div>
                    </div>

                    {/* Error Message with Animation */}
                    {error && (
                        <div className="mb-4 sm:mb-5 md:mb-6 p-3 sm:p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl animate-shake">
                            <div className="flex items-start gap-2 sm:gap-3">
                                <FaExclamationTriangle className="text-red-500 mt-0.5 flex-shrink-0 text-sm sm:text-base animate-pulse" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-red-800 font-bold text-xs sm:text-sm mb-0.5 uppercase tracking-wider">Error</div>
                                    <div className="text-red-600 text-xs sm:text-sm leading-relaxed break-words">{error}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 md:space-y-6">
                        {/* Email/Addis-Med ID Field */}
                        <div>
                            <label className={`block text-xs sm:text-sm font-medium mb-1 sm:mb-2 transition-colors duration-300 ${focusedField === 'email' ? 'text-blue-600' : 'text-gray-700'}`}>
                                {loginMethod === 'email' ? 'Email Address' : 'Addis-Med ID'}
                            </label>
                            <div className="relative group">
                                <input
                                    type={loginMethod === 'email' ? "email" : "text"}
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    onFocus={() => setFocusedField('email')}
                                    onBlur={() => setFocusedField(null)}
                                    className={`w-full px-3 sm:px-4 py-3 sm:py-4 pl-8 sm:pl-10 md:pl-12 text-sm sm:text-base border-2 rounded-lg sm:rounded-xl outline-none transition-all duration-300 ${focusedField === 'email'
                                        ? 'border-blue-500 shadow-lg shadow-blue-100'
                                        : loginMethod === 'email'
                                            ? isEmailValid && formData.email
                                                ? 'border-green-500'
                                                : 'border-gray-200 hover:border-gray-300'
                                            : isAddisMedIdValid() && formData.email
                                                ? 'border-green-500'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    placeholder={loginMethod === 'email' ? "your@email.com" : "HCC-XXXXXX-XXXXXX"}
                                    required
                                    disabled={loading}
                                />
                                {loginMethod === 'email' ? (
                                    <FaEnvelope className={`absolute left-2.5 sm:left-4 top-1/2 transform -translate-y-1/2 text-sm sm:text-base transition-colors duration-300 ${focusedField === 'email' ? 'text-blue-500' : 'text-gray-400'
                                        }`} />
                                ) : (
                                    <FaIdCard className={`absolute left-2.5 sm:left-4 top-1/2 transform -translate-y-1/2 text-sm sm:text-base transition-colors duration-300 ${focusedField === 'email' ? 'text-blue-500' : 'text-gray-400'
                                        }`} />
                                )}
                                {loginMethod === 'email' && isEmailValid && formData.email && (
                                    <FaCheckCircle className="absolute right-2.5 sm:right-4 top-1/2 transform -translate-y-1/2 text-green-500 text-sm sm:text-base animate-scale-in" />
                                )}
                                {loginMethod === 'addisMedId' && isAddisMedIdValid() && formData.email && (
                                    <FaCheckCircle className="absolute right-2.5 sm:right-4 top-1/2 transform -translate-y-1/2 text-green-500 text-sm sm:text-base animate-scale-in" />
                                )}
                            </div>
                            {loginMethod === 'addisMedId' && (
                                <p className="text-2xs sm:text-xs text-gray-500 mt-1 sm:mt-2">
                                    Format: HCC-XXXXXX-XXXXXX
                                </p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div>
                            <div className="flex items-center justify-between mb-1 sm:mb-2">
                                <label className={`block text-xs sm:text-sm font-medium transition-colors duration-300 ${focusedField === 'password' ? 'text-blue-600' : 'text-gray-700'}`}>
                                    Password
                                </label>
                                <Link
                                    to="/forgot-password"
                                    className="text-2xs sm:text-xs text-blue-600 hover:text-blue-800 font-medium transition-all hover:underline flex items-center gap-1 group"
                                >
                                    <span className="hidden xs:inline">Forgot Password?</span>
                                    <span className="xs:hidden">Forgot?</span>
                                    <FaArrowRight className="text-2xs opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                </Link>
                            </div>
                            <div className="relative group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    onFocus={() => setFocusedField('password')}
                                    onBlur={() => setFocusedField(null)}
                                    className={`w-full px-3 sm:px-4 py-3 sm:py-4 pl-8 sm:pl-10 md:pl-12 pr-8 sm:pr-12 text-sm sm:text-base border-2 rounded-lg sm:rounded-xl outline-none transition-all duration-300 ${focusedField === 'password'
                                        ? 'border-blue-500 shadow-lg shadow-blue-100'
                                        : formData.password
                                            ? 'border-green-500'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    placeholder="Enter password"
                                    required
                                    disabled={loading}
                                />
                                <FaLock className={`absolute left-2.5 sm:left-4 top-1/2 transform -translate-y-1/2 text-sm sm:text-base transition-colors duration-300 ${focusedField === 'password' ? 'text-blue-500' : 'text-gray-400'
                                    }`} />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-2.5 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                                >
                                    {showPassword ? <FaEyeSlash className="text-sm sm:text-base" /> : <FaEye className="text-sm sm:text-base" />}
                                </button>
                            </div>

                            {/* Password Strength Indicator */}
                            {formData.password && (
                                <div className="mt-1 sm:mt-2 animate-slide-down">
                                    <div className="flex gap-1 h-0.5 sm:h-1">
                                        {[1, 2, 3].map((level) => (
                                            <div
                                                key={level}
                                                className={`flex-1 h-full rounded-full transition-all duration-500 ${level <= passwordStrength
                                                    ? getPasswordStrengthColor()
                                                    : 'bg-gray-200'
                                                    }`}
                                            ></div>
                                        ))}
                                    </div>
                                    <p className={`text-2xs sm:text-xs mt-1 font-medium ${passwordStrength === 1 ? 'text-red-500' :
                                        passwordStrength === 2 ? 'text-yellow-500' :
                                            passwordStrength === 3 ? 'text-green-500' :
                                                'text-gray-400'
                                        }`}>
                                        {getPasswordStrengthText()}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 sm:py-4 px-4 rounded-lg sm:rounded-xl font-medium text-sm sm:text-base md:text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] ${loading
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                                }`}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <FaSpinner className="animate-spin text-sm sm:text-base" />
                                    <span className="text-sm sm:text-base">Processing...</span>
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <FaSignInAlt className="text-sm sm:text-base" />
                                    <span className="text-sm sm:text-base">Sign In</span>
                                    <FaArrowRight className="text-2xs sm:text-sm animate-pulse" />
                                </span>
                            )}
                        </button>
                    </form>

                    {/* Quick Test Logins (For Development Only) */}
                    {process.env.NODE_ENV === 'development' && (
                        <div className="mt-4 sm:mt-5 md:mt-6 p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg sm:rounded-xl border border-gray-200">
                            <p className="text-2xs sm:text-xs text-gray-600 mb-2 sm:mb-3 font-medium">Quick Test:</p>
                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                <button
                                    onClick={() => testLogin('admin@pharmacare.com', 'Admin@123')}
                                    className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-2xs sm:text-xs bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all transform hover:scale-105 shadow-md"
                                >
                                    Admin
                                </button>
                                <button
                                    onClick={() => testLogin('test@example.com', 'password123')}
                                    className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-2xs sm:text-xs bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg transition-all transform hover:scale-105 shadow-md"
                                >
                                    Test
                                </button>
                                <button
                                    onClick={() => testLogin('HCC-K3M9X2-8A4F6B', 'healthcare123')}
                                    className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-2xs sm:text-xs bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg transition-all transform hover:scale-105 shadow-md"
                                >
                                    Client
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Registration Links */}
                    <div className="mt-5 sm:mt-6 md:mt-8 pt-4 sm:pt-5 md:pt-6 border-t-2 border-gray-100">
                        <p className="text-center text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4">
                            Don't have an account?
                        </p>
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                            <Link
                                to="/signup?type=individual"
                                className="group flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-3 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 rounded-lg sm:rounded-xl transition-all transform hover:scale-105 text-2xs sm:text-xs md:text-sm font-medium border border-blue-200"
                            >
                                <FaUserCheck className="group-hover:animate-bounce text-xs sm:text-sm" />
                                <span>Individual</span>
                            </Link>
                            <Link
                                to="/signup?type=organization"
                                className="group flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-3 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 text-purple-700 rounded-lg sm:rounded-xl transition-all transform hover:scale-105 text-2xs sm:text-xs md:text-sm font-medium border border-purple-200"
                            >
                                <FaBuilding className="group-hover:animate-bounce text-xs sm:text-sm" />
                                <span>Organization</span>
                            </Link>
                        </div>
                    </div>

                    {/* Help Text */}
                    <div className="mt-4 sm:mt-5 md:mt-6 text-center">
                        <p className="text-2xs sm:text-xs text-gray-500">
                            Having trouble?{' '}
                            <Link to="/contact-support" className="text-blue-600 hover:text-blue-800 underline font-medium transition-all hover:no-underline">
                                Contact Support
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer status indicator - Mobile Optimized */}
                <div className="mt-4 sm:mt-5 md:mt-6 lg:mt-8 flex justify-center">
                    <div className="group flex items-center gap-2 sm:gap-3 px-3 sm:px-4 md:px-5 lg:px-6 py-2 sm:py-2.5 md:py-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-white/50 transition-all hover:shadow-xl">
                        <div className="relative">
                            <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-full ${isCheckingHealth
                                ? 'bg-blue-400 animate-ping'
                                : systemOnline
                                    ? 'bg-green-500 animate-pulse'
                                    : 'bg-red-500 animate-pulse'
                                }`}></div>
                            <div className={`absolute inset-0 w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-full ${isCheckingHealth
                                ? 'bg-blue-400'
                                : systemOnline
                                    ? 'bg-green-500'
                                    : 'bg-red-500'
                                } opacity-75`}></div>
                        </div>
                        <span className={`text-2xs sm:text-xs font-bold uppercase tracking-wider ${isCheckingHealth
                            ? 'text-blue-600'
                            : systemOnline
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}>
                            {isCheckingHealth ? 'Checking...' : systemOnline ? 'Online' : 'Offline'}
                        </span>
                        <div className="w-px h-3 sm:h-4 bg-gray-300 mx-0.5 sm:mx-1"></div>
                        <span className="text-2xs sm:text-xs font-bold text-gray-500 group-hover:text-gray-700 transition-colors">
                            v{import.meta.env.VITE_APP_VERSION || '2.0.1'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Bottom Right Section - Registration Links and System Status - Hidden on mobile (moved inside card) */}
            <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 z-20 hidden lg:flex flex-col items-end gap-3">
                {/* Registration Links */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 w-72">
                    <p className="text-center text-gray-600 text-sm mb-3 font-medium">
                        Don't have an account?
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        <Link
                            to="/signup?type=individual"
                            className="group flex items-center justify-center gap-1 px-3 py-2 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 rounded-lg transition-all transform hover:scale-105 text-xs font-medium border border-blue-200"
                        >
                            <FaUserCheck className="group-hover:animate-bounce text-xs" />
                            Individual
                        </Link>
                        <Link
                            to="/signup?type=organization"
                            className="group flex items-center justify-center gap-1 px-3 py-2 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 text-purple-700 rounded-lg transition-all transform hover:scale-105 text-xs font-medium border border-purple-200"
                        >
                            <FaBuilding className="group-hover:animate-bounce text-xs" />
                            Organization
                        </Link>
                    </div>
                    
                    {/* Help Text */}
                    <div className="mt-3 text-center">
                        <p className="text-xs text-gray-500">
                            Having trouble?{' '}
                            <Link to="/contact-support" className="text-blue-600 hover:text-blue-800 underline font-medium transition-all hover:no-underline">
                                Contact Support
                            </Link>
                        </p>
                    </div>
                </div>

                {/* System Status */}
                <div className="group flex items-center gap-3 px-6 py-3 bg-white/90 backdrop-blur-sm rounded-full shadow-xl border border-white/50 transition-all hover:shadow-2xl hover:scale-105">
                    <div className="relative">
                        <div className={`w-3 h-3 rounded-full ${isCheckingHealth
                            ? 'bg-blue-400 animate-ping'
                            : systemOnline
                                ? 'bg-green-500 animate-pulse'
                                : 'bg-red-500 animate-pulse'
                            }`}></div>
                        <div className={`absolute inset-0 w-3 h-3 rounded-full ${isCheckingHealth
                            ? 'bg-blue-400'
                            : systemOnline
                                ? 'bg-green-500'
                                : 'bg-red-500'
                            } opacity-75`}></div>
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${isCheckingHealth
                        ? 'text-blue-600'
                        : systemOnline
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                        {isCheckingHealth ? 'Verifying System...' : systemOnline ? 'System Online' : 'System Offline'}
                    </span>
                    <div className="w-px h-4 bg-gray-300 mx-1"></div>
                    <span className="text-xs font-bold text-gray-500 group-hover:text-gray-700 transition-colors">
                        v{import.meta.env.VITE_APP_VERSION || '2.0.1'}
                    </span>
                </div>
            </div>

            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px); }
                }
                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
                @keyframes scale-in {
                    0% { transform: scale(0) translateY(-50%); }
                    50% { transform: scale(1.2) translateY(-50%); }
                    100% { transform: scale(1) translateY(-50%); }
                }
                .animate-scale-in {
                    animation: scale-in 0.3s ease-out;
                }
                @keyframes slide-down {
                    0% { opacity: 0; transform: translateY(-10px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                .animate-slide-down {
                    animation: slide-down 0.3s ease-out;
                }
                
                /* Extra small text class for very small screens */
                .text-2xs {
                    font-size: 0.625rem;
                    line-height: 0.75rem;
                }
                
                /* Hide on extra small screens but show on small and up */
                @media (min-width: 480px) {
                    .xs\\:inline {
                        display: inline;
                    }
                    .xs\\:hidden {
                        display: none;
                    }
                }
                
                @media (max-width: 479px) {
                    .xs\\:inline {
                        display: none;
                    }
                    .xs\\:hidden {
                        display: inline;
                    }
                }
            `}</style>
        </div>
    );
};

export default Login;
