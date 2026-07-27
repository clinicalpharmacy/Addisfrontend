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

                // Store healthcare client ID if applicable
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
            } else if (role === 'healthcare_client') {
                const clientId = data.user.healthcare_client_id || (data.user.email && data.user.email.startsWith('hcc-') ? data.user.email.split('@')[0].toUpperCase() : null);
                if (clientId) {
                    navigate(`/patients/${clientId}`);
                } else {
                    navigate('/dashboard');
                }
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
        <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-start justify-center p-1 sm:p-3 relative overflow-auto">
            {/* Animated Background Elements - Hidden on mobile for performance */}
            <div className="absolute inset-0 overflow-hidden hidden md:block">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-white rounded-full opacity-10 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white rounded-full opacity-10 animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-20 animate-ping"></div>

                {/* Floating medical icons */}
                <FaHeartbeat className="absolute top-20 left-20 text-white opacity-10 text-6xl animate-bounce" />
                <FaUserShield className="absolute bottom-20 right-20 text-white opacity-10 text-6xl animate-bounce delay-700" />
                <FaUserMd className="absolute top-40 right-40 text-white opacity-10 text-6xl animate-bounce delay-300" />
            </div>

            <div className="w-full max-w-xs mx-auto relative z-10 px-0 sm:px-0 py-2 sm:py-4">
                {/* Animated Logo and Brand - Compact for mobile */}
                <div className="text-center mb-4 transform hover:scale-105 transition-transform duration-300">
                    <div className="relative inline-block">
                        <div className="absolute inset-0 bg-white rounded-xl blur-xl opacity-50 animate-pulse"></div>
                        <div className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl mb-2 mx-auto shadow-2xl">
                            <FaUserMd className="text-white text-xl animate-pulse" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">Addis Med</h1>
                </div>

                {/* Login Card - Optimized for mobile */}
                <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-3 sm:p-5 border border-white/20 transform transition-all duration-300">
                    <div className="mb-5 text-center">
                        {/* Login Method Toggle - Compact for mobile */}
                        <div className="flex items-center justify-center gap-1.5 mt-3 bg-gray-100 p-1 rounded-lg">
                            <button
                                type="button"
                                onClick={() => {
                                    setLoginMethod('email');
                                    setFormData({ ...formData, email: '' });
                                    setError('');
                                }}
                                className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-lg font-bold transition-all ${loginMethod === 'email'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-800'
                                    }`}
                            >
                                Health Professional
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setLoginMethod('addisMedId');
                                    setFormData({ ...formData, email: '' });
                                    setError('');
                                }}
                                className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-lg font-bold transition-all ${loginMethod === 'addisMedId'
                                    ? 'bg-white text-green-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-800'
                                    }`}
                            >
                                Healthcare Client
                            </button>
                        </div>
                    </div>

                    {/* Error Message with Animation - Compact for mobile */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-r-xl animate-shake">
                            <div className="flex items-start gap-2">
                                <FaExclamationTriangle className="text-red-500 mt-0.5 flex-shrink-0 text-xs animate-pulse" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-red-800 font-bold text-xs mb-0.5 uppercase tracking-wider">Error</div>
                                    <div className="text-red-600 text-xs leading-relaxed">{error}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Login Form - Compact for mobile */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email/Addis-Med ID Field */}
                    <div>
                        <div className="flex justify-center">
                            <div className="relative group w-3/4">
                                <input
                                    type={loginMethod === 'email' ? "email" : "text"}
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    onFocus={() => setFocusedField('email')}
                                    onBlur={() => setFocusedField(null)}
                                    className={`w-full px-3 py-2.5 pl-9 border-2 rounded-xl outline-none transition-all duration-300 text-base font-normal text-black ${focusedField === 'email'
                                        ? 'border-blue-500 shadow-lg shadow-blue-100'
                                        : loginMethod === 'email'
                                            ? isEmailValid && formData.email
                                                ? 'border-green-500'
                                                : 'border-gray-200 hover:border-gray-300'
                                            : isAddisMedIdValid() && formData.email
                                                ? 'border-green-500'
                                                : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                    placeholder={loginMethod === 'email' ? "Email Address" : "Addis-Med ID"}
                                    required
                                    disabled={loading}
                                />
                                {loginMethod === 'email' ? (
                                    <FaEnvelope className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300 text-sm ${focusedField === 'email' ? 'text-blue-500' : 'text-gray-400'}`} />
                                ) : (
                                    <FaIdCard className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300 text-sm ${focusedField === 'email' ? 'text-blue-500' : 'text-gray-400'}`} />
                                )}
                                {loginMethod === 'email' && isEmailValid && formData.email && (
                                    <FaCheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 text-sm animate-scale-in" />
                                )}
                                {loginMethod === 'addisMedId' && isAddisMedIdValid() && formData.email && (
                                    <FaCheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 text-sm animate-scale-in" />
                                )}
                            </div>
                        </div>
                        {loginMethod === 'addisMedId' && (
                            <p className="text-[10px] text-gray-500 mt-1">
                            </p>
                        )}
                    </div>

                        {/* Password Field */}
                        <div>
                            <div className="flex justify-center">
                                <div className="relative group w-3/4">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        onFocus={() => setFocusedField('password')}
                                        onBlur={() => setFocusedField(null)}
                                        className={`w-full px-3 py-2.5 pl-9 pr-14 border-2 rounded-xl outline-none transition-all duration-300 text-base font-normal text-black ${focusedField === 'password'
                                            ? 'border-blue-500 shadow-lg shadow-blue-100'
                                            : formData.password
                                                ? 'border-green-500'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                        placeholder="Enter password"
                                        required
                                        disabled={loading}
                                    />
                                    <FaLock className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300 text-sm ${focusedField === 'password' ? 'text-blue-500' : 'text-gray-400'}`} />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                                    >
                                        {showPassword ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
                                    </button>
                                </div>
                            </div>
                        
                            {/* Password Strength Indicator */}
                            {formData.password && (
                                <div className="mt-1.5 animate-slide-down">
                                    <div className="flex gap-1 h-1">
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
                                    <p className={`text-[10px] mt-1 font-medium text-center ${passwordStrength === 1 ? 'text-red-500' :
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
                      <div className="flex justify-center">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-3/4 py-2.5 px-4 rounded-xl font-bold text-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] ${loading
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl'
                            }`}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <FaSpinner className="animate-spin text-sm" />
                                    <span className="text-sm">Processing...</span>
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <FaSignInAlt className="text-sm" />
                                    <span className="text-lg">Sign In</span>
                                </span>
                            )}
                        </button>
                    </div>
                    </form>

                    {/* Quick Test Logins (For Development Only) */}
                    {process.env.NODE_ENV === 'development' && (
                        <div className="mt-4 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                            <p className="text-xs text-gray-600 mb-2 font-medium">Quick Test (Dev Only):</p>
                            <div className="grid grid-cols-3 gap-1.5">
                                <button
                                    onClick={() => testLogin('admin@pharmacare.com', 'Admin@123')}
                                    className="px-2 py-1.5 text-[10px] bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all transform hover:scale-105 active:scale-95 font-medium"
                                >
                                    Admin
                                </button>
                                <button
                                    onClick={() => testLogin('test@example.com', 'password123')}
                                    className="px-2 py-1.5 text-[10px] bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg transition-all transform hover:scale-105 active:scale-95 font-medium"
                                >
                                    Test User
                                </button>
                                <button
                                    onClick={() => testLogin('HCC-K3M9X2-8A4F6B', 'healthcare123')}
                                    className="px-2 py-1.5 text-[10px] bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg transition-all transform hover:scale-105 active:scale-95 font-medium"
                                >
                                    Healthcare
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Registration Links - Compact for mobile */}
                    <div className="mt-5 pt-4 border-t-2 border-gray-100">
                        <p className="text-center text-gray-600 font-bold text-lg mb-3">
                            Don't have an account?
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            <Link
                                to="/signup?type=individual"
                                className="group flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 rounded-lg transition-all font-bold text-lg"
                            >
                                <FaUserCheck className="group-hover:animate-bounce text-xs" />
                                Individual
                            </Link>
                            <Link
                                to="/signup?type=organization"
                                className="group flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 text-purple-700 rounded-lg transition-all font-bold text-lg"
                            >
                                Organization
                            </Link>
                        </div>
                    </div>

                    {/* Help Text */}
                    <div className="mt-4 text-center">
                        <p className="text-[10px] text-gray-500">
                            Having trouble?{' '}
                            <Link to="/contact-support" className="text-blue-600 hover:text-blue-800 underline font-medium transition-all hover:no-underline">
                                Contact Support
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Enhanced Footer status indicator - Compact for mobile */}
                <div className="mt-4 flex justify-center">
                    <div className="group flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full shadow-xl border border-white/50 transition-all hover:shadow-2xl hover:scale-105">
                        <div className="relative">
                            <div className={`w-2.5 h-2.5 rounded-full ${isCheckingHealth
                                ? 'bg-blue-400 animate-ping'
                                : systemOnline
                                    ? 'bg-green-500 animate-pulse'
                                    : 'bg-red-500 animate-pulse'
                                }`}></div>
                            <div className={`absolute inset-0 w-2.5 h-2.5 rounded-full ${isCheckingHealth
                                ? 'bg-blue-400'
                                : systemOnline
                                    ? 'bg-green-500'
                                    : 'bg-red-500'
                                } opacity-75`}></div>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isCheckingHealth
                            ? 'text-blue-600'
                            : systemOnline
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}>
                            {isCheckingHealth ? 'Verifying...' : systemOnline ? 'Online' : 'Offline'}
                        </span>
                        <div className="w-px h-3 bg-gray-300 mx-0.5"></div>
                        <span className="text-[10px] font-bold text-gray-500 group-hover:text-gray-700 transition-colors">
                            v{import.meta.env.VITE_APP_VERSION || '2.0.1'}
                        </span>
                    </div>
                </div>

                {/* Left Side - About Section & Contact Info */}
                <div className="fixed bottom-4 left-2 sm:left-4 z-20 w-auto max-w-[35%] min-w-[100px]">
                    <div className="px-3 py-3 min-w-[150px] sm:min-w-[220px] space-y-3">
                        {/* About Section */}
                        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-white/50">
                            <div className="flex items-start gap-2">
                                <div className="flex-shrink-0 mt-0.5">
                                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                        <FaInfoCircle className="text-white text-xs" />
                                    </div>
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] text-gray-700 leading-relaxed font-medium">
                                        Addis Med is a digital platform that provides information and educational contents in health with a primary focus on medicines to health professionals, health science students and healthcare clients.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                <span className="text-xs text-white text-sm">
                                    <span className="text-white ml-1 font-mono text-[14px]">Addis Ababa, Ethiopia</span>
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                <span className="text-xs text-white text-sm">
                                    <span className="text-white ml-1 font-mono text-[14px]">pharmcare2001@yahoo.com</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                            
                {/* Right Side - Carousel Messages & Contact Info */}
                <div className="fixed bottom-4 right-2 sm:right-4 z-20 w-auto max-w-[45%] min-w-[120px]">
                    <div className="px-4 py-3 min-w-[150px] sm:min-w-[220px] space-y-6">
                        {/* Carousel Messages */}
                        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-white/50 pb-4">
                            <div className="h-8 overflow-hidden">
                                <div
                                    className="transform transition-transform duration-500 ease-in-out"
                                    style={{ transform: `translateY(-${currentSlide * 2}rem)` }}
                                >
                                    {carouselMessages.map((msg, index) => {
                                        const Icon = msg.icon;
                                        return (
                                            <div key={index} className="h-8 flex items-center justify-center gap-1.5">
                                                <Icon className="text-blue-600 text-base animate-pulse" />
                                                <p className="text-blue-700 text-sm font-bold italic">{msg.text}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="flex items-center gap-4 flex-wrap justify-end pt-1">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                <span className="text-xs text-white text-sm">
                                    <span className="text-white ml-1 font-mono text-[14px]">+251919519512</span>
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                <span className="text-xs text-white text-sm">
                                    <span className="text-white ml-1 font-mono text-[14px]">tiktok.com/@addis.med</span>
                                </span>
                            </div>
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
            `}</style>
        </div>
    );
};

export default Login;
