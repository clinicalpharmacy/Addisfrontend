import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    FaUserMd, FaLock, FaExclamationTriangle, FaSignInAlt,
    FaSpinner, FaUserCheck, FaBuilding, FaEnvelope, FaEye, FaEyeSlash,
    FaUserShield, FaHeartbeat, FaCheckCircle, FaArrowRight, FaIdCard,
    FaInfoCircle, FaPhone, FaMapMarkerAlt, FaGlobe, FaTwitter,
    FaInstagram, FaLinkedin, FaShieldAlt, FaCloudCheck, FaDatabase
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

    const carouselMessages = [
        { icon: FaHeartbeat, text: "Digital Health Innovation", color: "from-blue-500 to-cyan-500" },
        { icon: FaUserShield, text: "Enhance Patient Safety", color: "from-purple-500 to-pink-500" },
        { icon: FaCheckCircle, text: "Optimize Medicines Use", color: "from-green-500 to-teal-500" }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % carouselMessages.length);
        }, 4000);

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
            const data = await api.post('/auth/login', {
                email: formData.email.trim().toLowerCase(),
                password: formData.password.trim(),
                login_method: isHealthcareClient ? 'addis_med_id' : 'email'
            });

            localStorage.setItem('token', data.token);
            if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('userRole', data.user.role || '');
                localStorage.setItem('userId', data.user.id || '');
                localStorage.setItem('userType', data.user_type || data.user.account_type || 'individual');
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
                            const keyPair = await generateUserKeyPair();
                            const pubBase64 = await exportPublicKey(keyPair.publicKey);
                            const wrappedPriv = await wrapPrivateKey(keyPair.privateKey, cryptoKey);

                            await api.post('/auth/update-encryption-keys', {
                                public_key: pubBase64,
                                private_key_encrypted: wrappedPriv
                            });
                        } catch (pkiErr) {
                            console.error("❌ Failed to setup security keys:", pkiErr);
                        }
                    }
                } catch (encErr) {
                    console.warn('⚠️ Could not derive encryption key:', encErr.message);
                }
            }

            const role = data.user?.role;
            const accountType = data.user?.account_type;

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

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl animate-ping"></div>
                
                {/* Floating Particles */}
                <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute bottom-1/4 right-1/4 w-3 h-3 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
                <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: '2.5s' }}></div>
                <div className="absolute bottom-1/3 left-1/3 w-3 h-3 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.8s' }}></div>
            </div>

            <div className="w-full max-w-6xl mx-auto relative z-10 grid lg:grid-cols-2 gap-8 items-center">
                {/* Left Side - Brand & Info */}
                <div className="hidden lg:block text-white space-y-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
                                <FaUserMd className="text-white text-3xl" />
                            </div>
                            <div>
                                <h1 className="text-5xl font-bold tracking-tight">Addis Med</h1>
                                <p className="text-blue-200 text-lg">Healthcare Intelligence Platform</p>
                            </div>
                        </div>
                        
                        <div className="max-w-md space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                                    <FaShieldAlt className="text-blue-400 text-lg" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">Zero-Knowledge Security</h3>
                                    <p className="text-blue-200 text-sm">End-to-end encryption ensuring your data remains private and secure</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                                    <FaCloudCheck className="text-purple-400 text-lg" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">Cloud-Native Platform</h3>
                                    <p className="text-blue-200 text-sm">Access your health information anytime, anywhere with enterprise-grade reliability</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                                    <FaDatabase className="text-green-400 text-lg" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">Integrated Health Records</h3>
                                    <p className="text-blue-200 text-sm">Seamless access to patient data, prescriptions, and treatment histories</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Carousel */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                        <div className="h-12 overflow-hidden">
                            <div
                                className="transform transition-transform duration-700 ease-in-out"
                                style={{ transform: `translateY(-${currentSlide * 3}rem)` }}
                            >
                                {carouselMessages.map((msg, index) => {
                                    const Icon = msg.icon;
                                    return (
                                        <div key={index} className="h-12 flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${msg.color} flex items-center justify-center`}>
                                                <Icon className="text-white text-lg" />
                                            </div>
                                            <p className="text-xl font-semibold text-white">{msg.text}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Trust Badges */}
                    <div className="flex items-center gap-6 text-blue-200">
                        <div className="flex items-center gap-2">
                            <FaCheckCircle className="text-green-400" />
                            <span className="text-sm">HIPAA Compliant</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <FaCheckCircle className="text-green-400" />
                            <span className="text-sm">ISO 27001 Certified</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <FaCheckCircle className="text-green-400" />
                            <span className="text-sm">GDPR Ready</span>
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Card */}
                <div className="w-full max-w-md mx-auto">
                    <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/20">
                        {/* Mobile Brand */}
                        <div className="lg:hidden text-center mb-6">
                            <div className="flex items-center justify-center gap-3 mb-2">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <FaUserMd className="text-white text-2xl" />
                                </div>
                                <h1 className="text-3xl font-bold text-gray-800">Addis Med</h1>
                            </div>
                            <div className="h-6 overflow-hidden">
                                <div
                                    className="transform transition-transform duration-500 ease-in-out"
                                    style={{ transform: `translateY(-${currentSlide * 1.5}rem)` }}
                                >
                                    {carouselMessages.map((msg, index) => {
                                        const Icon = msg.icon;
                                        return (
                                            <div key={index} className="h-6 flex items-center justify-center gap-2">
                                                <Icon className="text-blue-600 text-sm" />
                                                <p className="text-blue-700 text-sm font-medium">{msg.text}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-1">Welcome Back</h2>
                            <p className="text-gray-500 text-sm">Sign in to access your health dashboard</p>
                        </div>

                        {/* Login Method Toggle */}
                        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl mb-6">
                            <button
                                type="button"
                                onClick={() => {
                                    setLoginMethod('email');
                                    setFormData({ ...formData, email: '' });
                                    setError('');
                                }}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                                    loginMethod === 'email'
                                        ? 'bg-white text-blue-600 shadow-md'
                                        : 'text-gray-600 hover:text-gray-800'
                                }`}
                            >
                                <FaUserMd className="text-base" />
                                Professional
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setLoginMethod('addisMedId');
                                    setFormData({ ...formData, email: '' });
                                    setError('');
                                }}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                                    loginMethod === 'addisMedId'
                                        ? 'bg-white text-green-600 shadow-md'
                                        : 'text-gray-600 hover:text-gray-800'
                                }`}
                            >
                                <FaIdCard className="text-base" />
                                Healthcare Client
                            </button>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-r-xl animate-shake">
                                <div className="flex items-start gap-2">
                                    <FaExclamationTriangle className="text-red-500 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-red-600 text-sm leading-relaxed">{error}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Login Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    {loginMethod === 'email' ? 'Email Address' : 'Addis-Med ID'}
                                </label>
                                <div className="relative">
                                    <input
                                        type={loginMethod === 'email' ? "email" : "text"}
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        onFocus={() => setFocusedField('email')}
                                        onBlur={() => setFocusedField(null)}
                                        className={`w-full px-4 py-3 pl-11 border-2 rounded-xl outline-none transition-all duration-300 text-gray-800 ${
                                            focusedField === 'email'
                                                ? 'border-blue-500 shadow-lg shadow-blue-100'
                                                : loginMethod === 'email'
                                                    ? isEmailValid && formData.email
                                                        ? 'border-green-500'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                    : isAddisMedIdValid() && formData.email
                                                        ? 'border-green-500'
                                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                        placeholder={loginMethod === 'email' ? "you@example.com" : "HCC-XXXXXX-XXXXXX"}
                                        required
                                        disabled={loading}
                                    />
                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                        {loginMethod === 'email' ? (
                                            <FaEnvelope className={`transition-colors duration-300 ${
                                                focusedField === 'email' ? 'text-blue-500' : 'text-gray-400'
                                            }`} />
                                        ) : (
                                            <FaIdCard className={`transition-colors duration-300 ${
                                                focusedField === 'email' ? 'text-blue-500' : 'text-gray-400'
                                            }`} />
                                        )}
                                    </div>
                                    {loginMethod === 'email' && isEmailValid && formData.email && (
                                        <FaCheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 animate-scale-in" />
                                    )}
                                    {loginMethod === 'addisMedId' && isAddisMedIdValid() && formData.email && (
                                        <FaCheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 animate-scale-in" />
                                    )}
                                </div>
                                {loginMethod === 'addisMedId' && (
                                    <p className="text-xs text-gray-400 mt-1">Enter your HCC-XXXXXX-XXXXXX format ID</p>
                                )}
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="block text-sm font-medium text-gray-700">Password</label>
                                    <Link to="/forgot-password" className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                                        Forgot Password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        onFocus={() => setFocusedField('password')}
                                        onBlur={() => setFocusedField(null)}
                                        className={`w-full px-4 py-3 pl-11 pr-12 border-2 rounded-xl outline-none transition-all duration-300 text-gray-800 ${
                                            focusedField === 'password'
                                                ? 'border-blue-500 shadow-lg shadow-blue-100'
                                                : formData.password
                                                    ? 'border-green-500'
                                                    : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                        placeholder="Enter your password"
                                        required
                                        disabled={loading}
                                    />
                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                        <FaLock className={`transition-colors duration-300 ${
                                            focusedField === 'password' ? 'text-blue-500' : 'text-gray-400'
                                        }`} />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                                
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
                                        <p className={`text-xs mt-1 font-medium ${
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

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3.5 px-6 rounded-xl font-bold text-base transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
                                    loading
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl'
                                }`}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <FaSpinner className="animate-spin" />
                                        <span>Processing...</span>
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        <FaSignInAlt />
                                        <span>Sign In</span>
                                    </span>
                                )}
                            </button>
                        </form>

                        {/* Quick Test Logins */}
                        {process.env.NODE_ENV === 'development' && (
                            <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                                <p className="text-xs text-gray-600 mb-2 font-medium">Quick Test (Dev Only):</p>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => testLogin('admin@pharmacare.com', 'Admin@123')}
                                        className="px-3 py-2 text-xs bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all transform hover:scale-105 font-medium"
                                    >
                                        Admin
                                    </button>
                                    <button
                                        onClick={() => testLogin('test@example.com', 'password123')}
                                        className="px-3 py-2 text-xs bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg transition-all transform hover:scale-105 font-medium"
                                    >
                                        User
                                    </button>
                                    <button
                                        onClick={() => testLogin('HCC-K3M9X2-8A4F6B', 'healthcare123')}
                                        className="px-3 py-2 text-xs bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg transition-all transform hover:scale-105 font-medium"
                                    >
                                        Healthcare
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Registration Links */}
                        <div className="mt-6 pt-6 border-t-2 border-gray-100">
                            <p className="text-center text-gray-600 font-semibold mb-3">
                                New to Addis Med?
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <Link
                                    to="/signup?type=individual"
                                    className="group flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 rounded-xl transition-all font-semibold"
                                >
                                    <FaUserCheck className="group-hover:animate-bounce" />
                                    Individual
                                </Link>
                                <Link
                                    to="/signup?type=organization"
                                    className="group flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 text-purple-700 rounded-xl transition-all font-semibold"
                                >
                                    <FaBuilding className="group-hover:animate-bounce" />
                                    Organization
                                </Link>
                            </div>
                        </div>

                        {/* Help & Status */}
                        <div className="mt-4 flex items-center justify-between">
                            <Link to="/contact-support" className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                                Contact Support
                            </Link>
                            
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <div className={`w-2 h-2 rounded-full ${
                                        isCheckingHealth
                                            ? 'bg-blue-400 animate-ping'
                                            : systemOnline
                                                ? 'bg-green-500 animate-pulse'
                                                : 'bg-red-500 animate-pulse'
                                    }`}></div>
                                    <div className={`absolute inset-0 w-2 h-2 rounded-full ${
                                        isCheckingHealth
                                            ? 'bg-blue-400'
                                            : systemOnline
                                                ? 'bg-green-500'
                                                : 'bg-red-500'
                                    } opacity-75`}></div>
                                </div>
                                <span className={`text-xs font-medium ${
                                    isCheckingHealth
                                        ? 'text-blue-600'
                                        : systemOnline
                                            ? 'text-green-600'
                                            : 'text-red-600'
                                }`}>
                                    {isCheckingHealth ? 'Verifying...' : systemOnline ? 'Online' : 'Offline'}
                                </span>
                                <span className="text-xs text-gray-400">v{import.meta.env.VITE_APP_VERSION || '2.0.1'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Footer Info */}
                    <div className="lg:hidden mt-6 space-y-3">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                            <div className="flex items-start gap-2">
                                <FaInfoCircle className="text-blue-300 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-blue-100 leading-relaxed">
                                    Addis Med is a digital platform that provides education and information in health with a primary focus on medicines to health professionals, health science students and healthcare clients.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-blue-200 text-xs flex-wrap gap-2">
                            <div className="flex items-center gap-3">
                                <span>📍 Addis Ababa, Ethiopia</span>
                                <span>✉️ pharmcare2001@yahoo.com</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span>📞 +251919519512</span>
                                <span>🌐 tiktok.com/@addis.med</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop Footer */}
            <div className="hidden lg:block absolute bottom-6 left-0 right-0 px-8">
                <div className="max-w-6xl mx-auto flex items-center justify-between text-blue-200/60 text-xs flex-wrap gap-4">
                    <div className="flex items-center gap-6 flex-wrap">
                        <span>© 2026 Addis Med. All rights reserved.</span>
                        <span>📍 Addis Ababa, Ethiopia</span>
                        <span>✉️ pharmcare2001@yahoo.com</span>
                    </div>
                    <div className="flex items-center gap-6 flex-wrap">
                        <span>📞 +251919519512</span>
                        <span>🌐 tiktok.com/@addis.med</span>
                        <div className="flex items-center gap-3">
                            <FaTwitter className="hover:text-white transition-colors cursor-pointer" />
                            <FaInstagram className="hover:text-white transition-colors cursor-pointer" />
                            <FaLinkedin className="hover:text-white transition-colors cursor-pointer" />
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
