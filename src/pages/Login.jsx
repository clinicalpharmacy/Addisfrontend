import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    FaUserMd, FaLock, FaExclamationTriangle, FaSignInAlt,
    FaSpinner, FaUserCheck, FaBuilding, FaEnvelope, FaEye, FaEyeSlash,
    FaUserShield, FaHeartbeat, FaCheckCircle, FaArrowRight, FaIdCard,
    FaInfoCircle
} from 'react-icons/fa';

// IMPORTANT: Update this URL to your actual backend URL
// If using Vercel, it might be: https://pharmacare-backend.vercel.app
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
    const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'addisMedId'

    // Carousel messages for dynamic background
    const carouselMessages = [
        { icon: FaHeartbeat, text: "Digital Health", color: "from-blue-600 to-cyan-600" },
        { icon: FaUserShield, text: "Enhance Patient Safety", color: "from-purple-600 to-pink-600" },
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

                // Store  ID if applicable
                if (data.user.healthcare_client_id) {
                    localStorage.setItem('healthcare_client_id', data.user.healthcare_client_id);
                }
            }

            // 🔐 ZERO-KNOWLEDGE ENCRYPTION
            // Derive the AES-256 key from password + salt (key never sent to server)
            if (data.encryption_salt) {
                try {
                    sessionStorage.setItem('enc_salt', data.encryption_salt);
                    const cryptoKey = await deriveKey(formData.password.trim(), data.encryption_salt);
                    
                    // 🔐 Persist it to session (survives refreshes)
                    await persistKeyToSession(cryptoKey);

                    // 🛡️ PKI: Sync or Restore Public/Private keys
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
                        // 🔄 AUTO-RESTORE: If keys exist in DB but not in current browser, 
                        // they can now be unwrapped on-demand because we have the cryptoKey (derived from password).
                        // We store the encrypted private key in user object for later use by PatientUnlocker.
                        console.log("🔓 Security: Identity verified. Master key derived.");
                    }
                    
                    console.log('🔐 Encryption key derived and ready');
                } catch (encErr) {
                    console.warn('⚠️ Could not derive encryption key:', encErr.message);
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-start justify-center p-1 sm:p-3 relative overflow-auto">
            {/* Animated Background Elements - Modern minimal */}
            <div className="absolute inset-0 overflow-hidden hidden md:block">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-100/30 to-purple-100/30 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-100/30 to-pink-100/30 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-200/20 to-purple-200/20 rounded-full blur-2xl animate-pulse"></div>

                {/* Floating geometric shapes */}
                <div className="absolute top-20 left-20 w-12 h-12 border-2 border-blue-200/30 rounded-xl rotate-12 animate-float"></div>
                <div className="absolute bottom-20 right-20 w-16 h-16 border-2 border-purple-200/30 rounded-full animate-float-delayed"></div>
                <div className="absolute top-40 right-40 w-10 h-10 border-2 border-indigo-200/30 rounded-lg -rotate-6 animate-float-slow"></div>
            </div>

            <div className="w-full max-w-md mx-auto relative z-10 px-4 sm:px-6 py-2 sm:py-4">
                {/* Modern Logo and Brand */}
                <div className="text-center mb-6 transform hover:scale-105 transition-all duration-500">
                    <div className="relative inline-block">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-2xl opacity-20 animate-pulse"></div>
                        <div className="relative flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-3 mx-auto shadow-xl shadow-blue-500/20">
                            <FaUserMd className="text-white text-2xl" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                        Addis Med
                    </h1>
                    <p className="text-sm text-gray-500 font-medium mt-1 tracking-wide">Healthcare Intelligence Platform</p>
                </div>

                {/* Modern Login Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-500/10 p-4 sm:p-6 border border-white/50 transition-all duration-300 hover:shadow-blue-500/20">
                    {/* Login Method Toggle - Modern pill design */}
                    <div className="mb-6">
                        <div className="flex items-center justify-center gap-1.5 bg-gray-100/80 p-1 rounded-2xl backdrop-blur-sm border border-gray-200/50">
                            <button
                                type="button"
                                onClick={() => {
                                    setLoginMethod('email');
                                    setFormData({ ...formData, email: '' });
                                    setError('');
                                }}
                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                                    loginMethod === 'email'
                                        ? 'bg-white text-blue-600 shadow-lg shadow-blue-500/20 ring-2 ring-blue-500/50'
                                        : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                                }`}
                            >
                                <FaUserCheck className="text-xs" />
                                Health Professional
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setLoginMethod('addisMedId');
                                    setFormData({ ...formData, email: '' });
                                    setError('');
                                }}
                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                                    loginMethod === 'addisMedId'
                                        ? 'bg-white text-green-600 shadow-lg shadow-green-500/20 ring-2 ring-green-500/50'
                                        : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                                }`}
                            >
                                <FaIdCard className="text-xs" />
                                Healthcare Client
                            </button>
                        </div>
                    </div>

                    {/* Error Message - Modern alert */}
                    {error && (
                        <div className="mb-5 p-4 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-2xl animate-shake">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                                        <FaExclamationTriangle className="text-red-500 text-xs" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-red-800 font-semibold text-xs uppercase tracking-wider">Action Required</div>
                                    <div className="text-red-600 text-sm leading-relaxed mt-0.5">{error}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email/Addis-Med ID Field */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 tracking-wide uppercase">
                                {loginMethod === 'email' ? 'Email Address' : 'Addis-Med ID'}
                            </label>
                            <div className="relative group">
                                <input
                                    type={loginMethod === 'email' ? "email" : "text"}
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    onFocus={() => setFocusedField('email')}
                                    onBlur={() => setFocusedField(null)}
                                    className={`w-full px-4 py-3 pl-11 bg-gray-50/50 border-2 rounded-2xl outline-none transition-all duration-300 text-sm text-gray-800 placeholder-gray-400 ${
                                        focusedField === 'email'
                                            ? 'border-blue-500 shadow-lg shadow-blue-500/10 bg-white'
                                            : loginMethod === 'email'
                                                ? isEmailValid && formData.email
                                                    ? 'border-green-500 bg-white'
                                                    : 'border-gray-200 hover:border-gray-300 bg-white/50'
                                                : isAddisMedIdValid() && formData.email
                                                    ? 'border-green-500 bg-white'
                                                    : 'border-gray-200 hover:border-gray-300 bg-white/50'
                                    }`}
                                    placeholder={loginMethod === 'email' ? "you@example.com" : "HCC-K3M9X2-8A4F6B"}
                                    required
                                    disabled={loading}
                                />
                                {loginMethod === 'email' ? (
                                    <FaEnvelope className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors duration-300 text-sm ${
                                        focusedField === 'email' ? 'text-blue-500' : 'text-gray-400'
                                    }`} />
                                ) : (
                                    <FaIdCard className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors duration-300 text-sm ${
                                        focusedField === 'email' ? 'text-blue-500' : 'text-gray-400'
                                    }`} />
                                )}
                                {(loginMethod === 'email' && isEmailValid && formData.email) || 
                                 (loginMethod === 'addisMedId' && isAddisMedIdValid() && formData.email) ? (
                                    <FaCheckCircle className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-500 text-sm animate-scale-in" />
                                ) : null}
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="block text-xs font-semibold text-gray-600 tracking-wide uppercase">
                                    Password
                                </label>
                                <Link to="/forgot-password" className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
                                    Forgot?
                                </Link>
                            </div>
                            <div className="relative group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    onFocus={() => setFocusedField('password')}
                                    onBlur={() => setFocusedField(null)}
                                    className={`w-full px-4 py-3 pl-11 pr-12 bg-gray-50/50 border-2 rounded-2xl outline-none transition-all duration-300 text-sm text-gray-800 placeholder-gray-400 ${
                                        focusedField === 'password'
                                            ? 'border-blue-500 shadow-lg shadow-blue-500/10 bg-white'
                                            : formData.password
                                                ? 'border-green-500 bg-white'
                                                : 'border-gray-200 hover:border-gray-300 bg-white/50'
                                    }`}
                                    placeholder="••••••••"
                                    required
                                    disabled={loading}
                                />
                                <FaLock className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors duration-300 text-sm ${
                                    focusedField === 'password' ? 'text-blue-500' : 'text-gray-400'
                                }`} />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                                >
                                    {showPassword ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
                                </button>
                            </div>
                            
                            {/* Password Strength Indicator */}
                            {formData.password && (
                                <div className="mt-2 animate-slide-down">
                                    <div className="flex gap-1 h-1.5">
                                        {[1, 2, 3].map((level) => (
                                            <div
                                                key={level}
                                                className={`flex-1 h-full rounded-full transition-all duration-500 ${
                                                    level <= passwordStrength
                                                        ? getPasswordStrengthColor()
                                                        : 'bg-gray-200'
                                                }`}
                                            ></div>
                                        ))}
                                    </div>
                                    <p className={`text-[10px] mt-1 font-medium text-center ${
                                        passwordStrength === 1 ? 'text-red-500' :
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
                        <div className="pt-1">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
                                    loading
                                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40'
                                }`}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <FaSpinner className="animate-spin" />
                                        <span>Signing in...</span>
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        <FaSignInAlt className="text-sm" />
                                        <span>Sign In</span>
                                    </span>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Quick Test Logins (For Development Only) */}
                    {process.env.NODE_ENV === 'development' && (
                        <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-2xl border border-gray-200/50">
                            <p className="text-xs text-gray-500 mb-3 font-semibold tracking-wider uppercase">⚡ Quick Access (Dev)</p>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={() => testLogin('admin@pharmacare.com', 'Admin@123')}
                                    className="px-3 py-2 text-xs font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20"
                                >
                                    Admin
                                </button>
                                <button
                                    onClick={() => testLogin('test@example.com', 'password123')}
                                    className="px-3 py-2 text-xs font-semibold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-green-500/20"
                                >
                                    User
                                </button>
                                <button
                                    onClick={() => testLogin('HCC-K3M9X2-8A4F6B', 'healthcare123')}
                                    className="px-3 py-2 text-xs font-semibold bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/20"
                                >
                                    Healthcare
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Registration Links */}
                    <div className="mt-6 pt-5 border-t border-gray-200/50">
                        <p className="text-center text-sm text-gray-600 font-medium mb-3">
                            New to Addis Med?
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <Link
                                to="/signup?type=individual"
                                className="group flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100/50 hover:from-blue-100 hover:to-blue-200 text-blue-700 rounded-2xl transition-all font-semibold text-sm border border-blue-200/50 hover:border-blue-300"
                            >
                                <FaUserCheck className="text-xs group-hover:animate-bounce" />
                                Individual
                            </Link>
                            <Link
                                to="/signup?type=organization"
                                className="group flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-50 to-purple-100/50 hover:from-purple-100 hover:to-purple-200 text-purple-700 rounded-2xl transition-all font-semibold text-sm border border-purple-200/50 hover:border-purple-300"
                            >
                                <FaBuilding className="text-xs group-hover:animate-bounce" />
                                Organization
                            </Link>
                        </div>
                    </div>

                    {/* Help Text */}
                    <div className="mt-4 text-center">
                        <p className="text-xs text-gray-400">
                            Need help?{' '}
                            <Link to="/contact-support" className="text-blue-600 hover:text-blue-700 font-medium transition-colors hover:underline">
                                Contact Support
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Status Indicator */}
                <div className="mt-4 flex justify-end pr-8">
                    <div className="group flex items-center gap-2.5 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full border border-gray-200/50 shadow-sm transition-all hover:shadow-md">
                        <div className="relative">
                            <div className={`w-2 h-2 rounded-full ${
                                isCheckingHealth
                                    ? 'bg-blue-400 animate-ping'
                                    : systemOnline
                                        ? 'bg-green-500 animate-pulse'
                                        : 'bg-red-500 animate-pulse'
                            }`}></div>
                            <div className={`absolute inset-0 w-2.5 h-2.5 rounded-full ${
                                isCheckingHealth
                                    ? 'bg-blue-400'
                                    : systemOnline
                                        ? 'bg-green-500'
                                        : 'bg-red-500'
                            } opacity-75`}></div>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                            isCheckingHealth
                                ? 'text-blue-600'
                                : systemOnline
                                    ? 'text-green-600'
                                    : 'text-red-600'
                        }`}>
                            {isCheckingHealth ? 'Verifying...' : systemOnline ? 'Online' : 'Offline'}
                        </span>
                        <div className="w-px h-4 bg-gray-300 mx-0.5"></div>
                        <span className="text-[10px] font-bold text-gray-500 group-hover:text-gray-700 transition-colors">
                            v{import.meta.env.VITE_APP_VERSION || '2.0.1'}
                        </span>
                    </div>
                </div>

                {/* Left Side - About Section */}
                <div className="fixed bottom-4 left-2 sm:left-4 z-20 w-auto max-w-[45%] sm:max-w-[35%] min-w-[80px] sm:min-w-[100px]">
                    <div className="space-y-2 sm:space-y-3">
                        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-2.5 sm:p-3.5 shadow-xl border border-white/50 hover:shadow-2xl transition-shadow">
                            <div className="flex items-start gap-2 sm:gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                    <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                        <FaInfoCircle className="text-white text-[10px] sm:text-sm" />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[9px] sm:text-xs text-gray-700 leading-relaxed font-medium">
                                        Addis Med is a digital platform that provides information and educational contents in health with a primary focus on medications.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap bg-white/60 backdrop-blur-md rounded-xl p-1.5 sm:p-2.5 shadow-lg border border-white/50">
                            <span className="text-[9px] sm:text-xs text-gray-600 font-medium">📍 Addis Ababa, Ethiopia</span>
                            <span className="w-px h-4 bg-gray-300"></span>
                            <span className="text-[9px] sm:text-xs text-gray-600 font-medium">📧 pharmcare2001@yahoo.com</span>
                        </div>
                    </div>
                </div>
                            
                {/* Right Side - Carousel & Contact */}
                <div className="fixed bottom-4 right-2 sm:right-4 z-20 w-auto max-w-[45%] min-w-[120px]">
                    <div className="space-y-2 sm:space-y-3">
                        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-2.5 sm:p-3.5 shadow-xl border border-white/50 hover:shadow-2xl transition-shadow">
                            <div className="h-6 sm:h-8 overflow-hidden">
                                <div
                                    className="transform transition-transform duration-500 ease-in-out"
                                    style={{ transform: `translateY(-${currentSlide * 2}rem)` }}
                                >
                                    {carouselMessages.map((msg, index) => {
                                        const Icon = msg.icon;
                                        return (
                                            <div key={index} className="h-8 flex items-center justify-center gap-2">
                                                <Icon className="text-blue-600 text-sm sm:text-base animate-pulse" />
                                                <p className="text-gray-800 text-xs sm:text-sm font-bold">{msg.text}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end bg-white/60 backdrop-blur-md rounded-xl p-1.5 sm:p-2.5 shadow-lg border border-white/50">
                            <span className="text-[9px] sm:text-xs text-gray-600 font-medium">📞 +251919519512</span>
                            <span className="w-px h-4 bg-gray-300"></span>
                            <span className="text-[9px] sm:text-xs text-gray-600 font-medium">📱 @addis.med</span>
                        </div>
                    </div>
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
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(12deg); }
                    50% { transform: translateY(-20px) rotate(12deg); }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                .animate-float-delayed {
                    animation: float 8s ease-in-out infinite 1s;
                }
                .animate-float-slow {
                    animation: float 10s ease-in-out infinite 2s;
                }
            `}</style>
        </div>
    );
};

export default Login;
