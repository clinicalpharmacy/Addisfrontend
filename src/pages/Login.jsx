import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    FaUserMd, FaLock, FaExclamationTriangle, FaSignInAlt,
    FaSpinner, FaUserCheck, FaBuilding, FaEnvelope, FaEye, FaEyeSlash,
    FaUserShield, FaHeartbeat, FaCheckCircle, FaArrowRight, FaIdCard,
    FaInfoCircle, FaPhone, FaMapMarkerAlt, FaGlobe
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
import api from '../utils/api';
import { 
    deriveKey, 
    persistKeyToSession,
    generateUserKeyPair,
    exportPublicKey,
    wrapPrivateKey
} from '../utils/encryptionUtils';

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
    const [loginMethod, setLoginMethod] = useState('email');

    // Enhanced carousel messages with more vibrant colors
    const carouselMessages = [
        { icon: FaHeartbeat, text: "Digital Health", color: "from-blue-500 to-cyan-400", bgColor: "bg-blue-500/20" },
        { icon: FaUserShield, text: "Enhance Patient Safety", color: "from-purple-500 to-pink-400", bgColor: "bg-purple-500/20" },
        { icon: FaCheckCircle, text: "Optimize Medicines Use", color: "from-green-500 to-teal-400", bgColor: "bg-green-500/20" }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % carouselMessages.length);
        }, 3000);

        const token = localStorage.getItem('token');
        const userRole = localStorage.getItem('userRole');

        if (token) {
            if (userRole === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/dashboard');
            }
        }

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

    useEffect(() => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        setIsEmailValid(emailRegex.test(formData.email));
    }, [formData.email]);

    const isAddisMedIdValid = () => {
        if (!formData.email) return false;
        const addisMedIdRegex = /^HCC-[A-Z0-9]{6,10}-[A-Z0-9]{6,10}$/i;
        return addisMedIdRegex.test(formData.email);
    };

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

        const isHealthcareClient = /^HCC-/i.test(formData.email.trim());

        try {
            console.log(`🔐 Attempting login for: ${formData.email} (${isHealthcareClient ? 'Healthcare Client' : 'Regular User'})`);

            const data = await api.post('/auth/login', {
                email: formData.email.trim().toLowerCase(),
                password: formData.password.trim(),
                login_method: isHealthcareClient ? 'addis_med_id' : 'email'
            });

            console.log('✅ Login successful:', data);

            localStorage.setItem('token', data.token);
            if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('userRole', data.user.role || '');
                localStorage.setItem('userId', data.user.id || '');
                localStorage.setItem('userType', data.user.user_type || data.user.account_type || 'individual');

                localStorage.setItem('subscription_status', data.user.subscription_status || 'inactive');
                localStorage.setItem('subscription_end_date', data.user.subscription_end_date || '');
                localStorage.setItem('has_subscription', data.user.subscription_status === 'active' ? 'true' : 'false');

                if (data.user.healthcare_client_id) {
                    localStorage.setItem('healthcare_client_id', data.user.healthcare_client_id);
                }
            }

            if (data.encryption_salt) {
                try {
                    sessionStorage.setItem('enc_salt', data.encryption_salt);
                    const cryptoKey = await deriveKey(formData.password.trim(), data.encryption_salt);
                    await persistKeyToSession(cryptoKey);

                    if (!data.user?.public_key) {
                        try {
                            console.log("🗝️ Security Upgrade: Generating your unique digital ID (RSA Keypair)...");
                            const keyPair = await generateUserKeyPair();
                            const pubBase64 = await exportPublicKey(keyPair.publicKey);
                            const wrappedPriv = await wrapPrivateKey(keyPair.privateKey, cryptoKey);

                            await api.post('/auth/update-encryption-keys', {
                                public_key: pubBase64,
                                private_key_encrypted: wrappedPriv
                            });
                            console.log("✅ Security Setup Complete!");
                        } catch (pkiErr) {
                            console.error("❌ Failed to setup security keys:", pkiErr);
                        }
                    } else {
                        console.log("🔓 Security: Identity verified. Master key derived.");
                    }
                    
                    console.log('🔐 Encryption key derived and ready');
                } catch (encErr) {
                    console.warn('⚠️ Could not derive encryption key:', encErr.message);
                }
            }

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
                                        setError('');
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
        if (/^HCC-/i.test(email)) {
            setLoginMethod('addisMedId');
        } else {
            setLoginMethod('email');
        }
    };

    const getPasswordStrengthColor = () => {
        switch (passwordStrength) {
            case 0: return 'bg-gray-300';
            case 1: return 'bg-red-500';
            case 2: return 'bg-yellow-500';
            case 3: return 'bg-green-500';
            default: return 'bg-gray-300';
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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-start justify-center p-1 sm:p-3 relative overflow-auto">
            {/* Enhanced Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Gradient Orbs */}
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full opacity-20 animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-10 animate-ping"></div>

                {/* Floating medical icons with better visibility */}
                <FaHeartbeat className="absolute top-20 left-20 text-white/15 text-7xl animate-bounce" />
                <FaUserShield className="absolute bottom-20 right-20 text-white/15 text-7xl animate-bounce delay-700" />
                <FaUserMd className="absolute top-40 right-40 text-white/15 text-7xl animate-bounce delay-300" />
                <FaGlobe className="absolute bottom-40 left-40 text-white/10 text-6xl animate-spin-slow" />
            </div>

            <div className="w-full max-w-md mx-auto relative z-10 px-4 sm:px-6 py-2 sm:py-4">
                {/* Enhanced Logo and Brand */}
                <div className="text-center mb-6 transform hover:scale-105 transition-transform duration-300">
                    <div className="relative inline-block">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-2xl opacity-70 animate-pulse"></div>
                        <div className="relative flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-3 mx-auto shadow-2xl">
                            <FaUserMd className="text-white text-3xl animate-pulse" />
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                                <FaCheckCircle className="text-white text-xs" />
                            </div>
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-1 tracking-tight drop-shadow-lg">Addis Med</h1>
                    <p className="text-blue-200 text-sm font-medium">Healthcare Information Platform</p>
                </div>

                {/* Login Card - Enhanced contrast */}
                <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-5 sm:p-7 border border-white/20 transform transition-all duration-300 hover:shadow-3xl">
                    <div className="mb-6 text-center">
                        {/* Enhanced Login Method Toggle */}
                        <div className="flex items-center justify-center gap-2 mt-3 bg-gray-100/80 p-1.5 rounded-2xl backdrop-blur-sm">
                            <button
                                type="button"
                                onClick={() => {
                                    setLoginMethod('email');
                                    setFormData({ ...formData, email: '' });
                                    setError('');
                                }}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${loginMethod === 'email'
                                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30'
                                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200/50'
                                }`}
                            >
                                <FaUserCheck className={`${loginMethod === 'email' ? 'text-white' : 'text-blue-600'}`} />
                                Health Professionals
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setLoginMethod('addisMedId');
                                    setFormData({ ...formData, email: '' });
                                    setError('');
                                }}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${loginMethod === 'addisMedId'
                                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/30'
                                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200/50'
                                }`}
                            >
                                <FaIdCard className={`${loginMethod === 'addisMedId' ? 'text-white' : 'text-green-600'}`} />
                                Healthcare Client
                            </button>
                        </div>
                    </div>

                    {/* Enhanced Error Message */}
                    {error && (
                        <div className="mb-5 p-4 bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 rounded-r-xl animate-shake shadow-md">
                            <div className="flex items-start gap-3">
                                <FaExclamationTriangle className="text-red-500 mt-0.5 flex-shrink-0 text-base animate-pulse" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-red-800 font-bold text-sm mb-1 uppercase tracking-wider">Authentication Error</div>
                                    <div className="text-red-700 text-sm leading-relaxed">{error}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email/Addis-Med ID Field with Enhanced Styling */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                {loginMethod === 'email' ? 'Email Address' : 'Addis-Med ID'}
                            </label>
                            <div className="relative group">
                                <input
                                    type={loginMethod === 'email' ? "email" : "text"}
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    onFocus={() => setFocusedField('email')}
                                    onBlur={() => setFocusedField(null)}
                                    className={`w-full px-4 py-3.5 pl-12 border-2 rounded-xl outline-none transition-all duration-300 text-base font-medium text-gray-900 ${focusedField === 'email'
                                        ? 'border-blue-500 ring-4 ring-blue-500/20 shadow-lg shadow-blue-500/10'
                                        : loginMethod === 'email'
                                            ? isEmailValid && formData.email
                                                ? 'border-green-500'
                                                : 'border-gray-300 hover:border-gray-400'
                                            : isAddisMedIdValid() && formData.email
                                                ? 'border-green-500'
                                                : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                    placeholder={loginMethod === 'email' ? "you@example.com" : "HCC-K3M9X2-8A4F6B"}
                                    required
                                    disabled={loading}
                                />
                                {loginMethod === 'email' ? (
                                    <FaEnvelope className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors duration-300 text-lg ${focusedField === 'email' ? 'text-blue-600' : 'text-gray-400'}`} />
                                ) : (
                                    <FaIdCard className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors duration-300 text-lg ${focusedField === 'email' ? 'text-blue-600' : 'text-gray-400'}`} />
                                )}
                                {loginMethod === 'email' && isEmailValid && formData.email && (
                                    <FaCheckCircle className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-500 text-lg animate-scale-in" />
                                )}
                                {loginMethod === 'addisMedId' && isAddisMedIdValid() && formData.email && (
                                    <FaCheckCircle className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-500 text-lg animate-scale-in" />
                                )}
                            </div>
                            {loginMethod === 'addisMedId' && (
                                <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                                    <FaInfoCircle className="text-blue-500" />
                                    Format: HCC-XXXXXX-XXXXXX
                                </p>
                            )}
                        </div>

                        {/* Password Field with Enhanced Styling */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    onFocus={() => setFocusedField('password')}
                                    onBlur={() => setFocusedField(null)}
                                    className={`w-full px-4 py-3.5 pl-12 pr-14 border-2 rounded-xl outline-none transition-all duration-300 text-base font-medium text-gray-900 ${focusedField === 'password'
                                        ? 'border-blue-500 ring-4 ring-blue-500/20 shadow-lg shadow-blue-500/10'
                                        : formData.password
                                            ? 'border-green-500'
                                            : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                    placeholder="Enter your password"
                                    required
                                    disabled={loading}
                                />
                                <FaLock className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors duration-300 text-lg ${focusedField === 'password' ? 'text-blue-600' : 'text-gray-400'}`} />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors p-1 rounded-lg hover:bg-blue-50"
                                >
                                    {showPassword ? <FaEyeSlash className="text-lg" /> : <FaEye className="text-lg" />}
                                </button>
                            </div>
                        
                            {/* Enhanced Password Strength Indicator */}
                            {formData.password && (
                                <div className="mt-2 animate-slide-down">
                                    <div className="flex gap-1.5 h-1.5">
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
                                    <p className={`text-xs mt-1.5 font-semibold text-center ${passwordStrength === 1 ? 'text-red-600' :
                                        passwordStrength === 2 ? 'text-yellow-600' :
                                            passwordStrength === 3 ? 'text-green-600' :
                                                'text-gray-400'
                                        }`}>
                                        {getPasswordStrengthText()}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Enhanced Submit Button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${loading
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-xl hover:shadow-2xl shadow-purple-500/30'
                                }`}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-3">
                                        <FaSpinner className="animate-spin text-xl" />
                                        <span className="text-base font-bold">Authenticating...</span>
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-3">
                                        <FaSignInAlt className="text-xl" />
                                        <span className="text-xl font-bold">Sign In</span>
                                        <FaArrowRight className="text-xl group-hover:translate-x-1 transition-transform" />
                                    </span>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Quick Test Logins with Enhanced Styling */}
                    {process.env.NODE_ENV === 'development' && (
                        <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200 shadow-inner">
                            <p className="text-xs text-gray-600 mb-3 font-bold uppercase tracking-wider">⚡ Quick Test Logins (Dev Only)</p>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={() => testLogin('admin@pharmacare.com', 'Admin@123')}
                                    className="px-3 py-2.5 text-xs bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all transform hover:scale-105 active:scale-95 font-bold shadow-md hover:shadow-lg"
                                >
                                    👑 Admin
                                </button>
                                <button
                                    onClick={() => testLogin('test@example.com', 'password123')}
                                    className="px-3 py-2.5 text-xs bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white rounded-xl transition-all transform hover:scale-105 active:scale-95 font-bold shadow-md hover:shadow-lg"
                                >
                                    👤 User
                                </button>
                                <button
                                    onClick={() => testLogin('HCC-K3M9X2-8A4F6B', 'healthcare123')}
                                    className="px-3 py-2.5 text-xs bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-all transform hover:scale-105 active:scale-95 font-bold shadow-md hover:shadow-lg"
                                >
                                    🏥 Healthcare
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Enhanced Registration Links */}
                    <div className="mt-6 pt-5 border-t-2 border-gray-200">
                        <p className="text-center text-gray-700 font-bold text-base mb-4">
                            🚀 New to Addis Med?
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <Link
                                to="/signup?type=individual"
                                className="group flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 rounded-xl transition-all font-bold text-sm shadow-sm hover:shadow-md"
                            >
                                <FaUserCheck className="group-hover:animate-bounce text-base" />
                                Individual
                            </Link>
                            <Link
                                to="/signup?type=organization"
                                className="group flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 text-purple-700 rounded-xl transition-all font-bold text-sm shadow-sm hover:shadow-md"
                            >
                                <FaBuilding className="group-hover:animate-bounce text-base" />
                                Organization
                            </Link>
                        </div>
                    </div>

                    {/* Help Text */}
                    <div className="mt-4 text-center">
                        <Link to="/contact-support" className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-all hover:underline underline-offset-2">
                            💬 Need help? Contact Support
                        </Link>
                    </div>
                </div>

                {/* Enhanced Footer Status */}
                <div className="mt-5 flex justify-center">
                    <div className="group flex items-center gap-3 px-6 py-2.5 backdrop-blur-md bg-white/10 rounded-full border border-white/20 transition-all hover:scale-105 hover:bg-white/20">
                        <div className="relative">
                            <div className={`w-2.5 h-2.5 rounded-full ${isCheckingHealth
                                ? 'bg-blue-400 animate-ping'
                                : systemOnline
                                    ? 'bg-green-400 animate-pulse'
                                    : 'bg-red-400 animate-pulse'
                                }`}></div>
                            <div className={`absolute inset-0 w-3 h-3 rounded-full ${isCheckingHealth
                                ? 'bg-blue-400/50'
                                : systemOnline
                                    ? 'bg-green-400/50'
                                    : 'bg-red-400/50'
                                }`}></div>
                        </div>
                        <span className={`text-xs font-bold uppercase tracking-wider ${isCheckingHealth
                            ? 'text-blue-200'
                            : systemOnline
                                ? 'text-green-200'
                                : 'text-red-200'
                            }`}>
                            {isCheckingHealth ? 'Verifying...' : systemOnline ? '🟢 Online' : '🔴 Offline'}
                        </span>
                        <div className="w-px h-4 bg-white/30"></div>
                        <span className="text-xs font-bold text-white/70 group-hover:text-white transition-colors">
                            v{import.meta.env.VITE_APP_VERSION || '2.0.1'}
                        </span>
                    </div>
                </div>

                {/* Left Side - About Section - Enhanced */}
                <div className="fixed bottom-4 left-3 sm:left-6 z-20 w-auto max-w-[50%] sm:max-w-[35%]">
                    <div className="px-3 py-3 space-y-3">
                        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-3 border border-white/10 hover:bg-black/30 transition-all">
                            <div className="flex items-start gap-2.5">
                                <div className="flex-shrink-0 mt-0.5">
                                    <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                                        <FaInfoCircle className="text-white text-xs" />
                                    </div>
                                </div>
                                <div className="text-left">
                                    <p className="text-xs text-white/90 leading-relaxed font-medium">
                                        Addis Med is a digital platform that provides information and educational contents in health with a primary focus on medications.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                            
                {/* Right Side - Contact Info - Enhanced */}
                <div className="fixed bottom-4 right-3 sm:right-6 z-20 w-auto max-w-[50%]">
                    <div className="px-3 py-3 space-y-3">
                        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-3 border border-white/10 hover:bg-black/30 transition-all">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 justify-end">
                                    <span className="text-white/80 text-xs font-medium">📍 Addis Ababa, Ethiopia</span>
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                </div>
                                <div className="flex items-center gap-2 justify-end">
                                    <span className="text-white/80 text-xs font-medium">📧 pharmcare2001@yahoo.com</span>
                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-300"></div>
                                </div>
                                <div className="flex items-center gap-2 justify-end">
                                    <span className="text-white/80 text-xs font-medium">📱 +251919519512</span>
                                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse delay-700"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
                    20%, 40%, 60%, 80% { transform: translateX(6px); }
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
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 20s linear infinite;
                }
                .shadow-3xl {
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }
            `}</style>
        </div>
    );
};

export default Login;
