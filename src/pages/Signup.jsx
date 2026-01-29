import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    FaUserMd, FaLock, FaEnvelope, FaUser, FaPhone,
    FaBuilding, FaMapMarker, FaFileInvoiceDollar,
    FaArrowRight, FaCheck, FaCreditCard, FaShieldAlt,
    FaUserTie, FaUsers, FaStore, FaBriefcase, FaIdCard,
    FaExclamationTriangle, FaInfoCircle, FaEye, FaEyeSlash,
    FaCalendarAlt, FaChartLine, FaDatabase, FaCapsules,
    FaUserFriends, FaHeadset, FaBell, FaCog,
    FaMoneyBillWave, FaSyncAlt, FaStar, FaRocket,
    FaRegClock, FaHandshake, FaGlobe, FaServer,
    FaExternalLinkAlt, FaSpinner
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL;
import api from '../utils/api';

// Define subscription plans with updated pricing
const SUBSCRIPTION_PLANS = [
    {
        id: 'individual_monthly',
        name: 'Individual Monthly',
        price: 300,
        currency: 'ETB',
        interval: 'month',
        description: 'For healthcare professionals & students',
        user_limit: 1,
        icon: FaUserMd,
        color: 'from-blue-500 to-blue-600',
        badge: 'Popular',
        features: [
            'Full medication knowledge base',
            'Patient management system',
            'Clinical decision support',
            'Drug interaction checking',
            'Basic analytics',
            'Email support'
        ],
        limitations: ['Single user only'],
        account_type: 'individual'
    },
    {
        id: 'individual_yearly',
        name: 'Individual Yearly',
        price: 3000,
        currency: 'ETB',
        interval: 'year',
        description: 'Best value for individuals',
        user_limit: 1,
        icon: FaStar,
        color: 'from-purple-500 to-purple-600',
        badge: 'Best Value',
        originalPrice: 3600,
        discount: 'Save 600 ETB',
        features: [
            'Everything in Monthly plan',
            'Priority support',
            'Advanced analytics',
            'Custom reports',
            'API access',
            'Early access to new features'
        ],
        popular: true,
        account_type: 'individual'
    },
    {
        id: 'company_basic',
        name: 'Company Monthly',
        price: 3000,
        currency: 'ETB',
        interval: 'month',
        description: 'For small healthcare facilities',
        user_limit: 5,
        icon: FaBuilding,
        color: 'from-green-500 to-green-600',
        badge: 'Team',
        features: [
            'Everything in Individual plan',
            'Up to 5 users',
            'Centralized patient database',
            'Team management',
            'Company dashboard',
            'Multi-user access',
            'Basic training included'
        ],
        limitations: ['Limited to 5 users'],
        account_type: 'company'
    },
    {
        id: 'company_pro',
        name: 'Company Yearly',
        price: 25000,
        currency: 'ETB',
        interval: 'year',
        description: 'For medium to large organizations',
        user_limit: 20,
        icon: FaRocket,
        color: 'from-orange-500 to-orange-600',
        badge: 'Enterprise',
        originalPrice: 30000,
        discount: 'Save 5000 ETB',
        features: [
            'Everything in Company Basic',
            'Up to 20 users',
            'Custom user roles',
            'Advanced reporting',
            'Bulk operations',
            'Dedicated support',
            'API integration',
            'Custom workflows'
        ],
        popular: true,
        account_type: 'company'
    }
];

const Signup = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        full_name: '',
        phone: '',
        country: 'Ethiopia',
        region: '',
        tin_number: '',
        account_type: '',
        role: 'pharmacist',
        woreda: '',
        company_name: '',
        company_email: '', // Replaced registration number
        company_address: '',
        company_size: '1-10',
        company_type: 'pharmacy',
        admin_email: '',
        admin_password: '',
        admin_confirm_password: '',
        admin_full_name: '',
        admin_phone: '',
        user_capacity: 5
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showAdminPassword, setShowAdminPassword] = useState(false);
    const [showAdminConfirmPassword, setShowAdminConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedPlan, setSelectedPlan] = useState('');
    const [step, setStep] = useState(1);
    const [passwordStrength, setPasswordStrength] = useState('');
    const [adminPasswordStrength, setAdminPasswordStrength] = useState('');
    const [planError, setPlanError] = useState('');
    const [registrationComplete, setRegistrationComplete] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [registeredUser, setRegisteredUser] = useState(null);
    const [chapaPaymentUrl, setChapaPaymentUrl] = useState('');
    const [chapaTxRef, setChapaTxRef] = useState('');
    const [selectedPlanDetails, setSelectedPlanDetails] = useState(null);

    useEffect(() => {
        // Clear form data on component mount
        setFormData({
            email: '',
            password: '',
            confirmPassword: '',
            full_name: '',
            phone: '',
            country: 'Ethiopia',
            region: '',
            tin_number: '',
            account_type: '',
            role: 'pharmacist',
            woreda: '',
            company_name: '',
            company_email: '',
            company_address: '',
            company_size: '1-10',
            company_type: 'pharmacy',
            admin_email: '',
            admin_password: '',
            admin_confirm_password: '',
            admin_full_name: '',
            admin_phone: '',
            user_capacity: 5
        });
    }, []);

    const checkPasswordStrength = (password) => {
        if (!password) return '';
        if (password.length < 6) return 'weak';
        if (password.length < 8) return 'fair';
        if (password.length < 10) return 'good';
        return 'strong';
    };

    const handlePasswordChange = (value) => {
        setFormData({ ...formData, password: value });
        setPasswordStrength(checkPasswordStrength(value));
    };

    const handleAdminPasswordChange = (value) => {
        setFormData({ ...formData, admin_password: value });
        setAdminPasswordStrength(checkPasswordStrength(value));
    };

    const handlePlanSelect = (plan) => {
        setSelectedPlan(plan.id);
        setSelectedPlanDetails(plan);
        setFormData(prev => ({
            ...prev,
            account_type: plan.account_type,
            role: plan.account_type === 'individual' ? 'pharmacist' : 'company_admin'
        }));
        setStep(2);
    };

    const handleRegistrationSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        const trimmedPassword = formData.password ? formData.password.trim() : '';
        const trimmedConfirmPassword = formData.confirmPassword ? formData.confirmPassword.trim() : '';
        const trimmedAdminPassword = formData.account_type === 'company' ?
            (formData.admin_password ? formData.admin_password.trim() : '') : '';
        const trimmedAdminConfirmPassword = formData.account_type === 'company' ?
            (formData.admin_confirm_password ? formData.admin_confirm_password.trim() : '') : '';

        // Validation
        if (trimmedPassword !== trimmedConfirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (formData.account_type === 'company' && trimmedAdminPassword !== trimmedAdminConfirmPassword) {
            setError('Admin passwords do not match');
            setLoading(false);
            return;
        }

        try {
            let endpoint = '';
            let requestData = {};

            if (formData.account_type === 'individual') {
                endpoint = '/auth/register';
                requestData = {
                    email: formData.email.trim(),
                    password: trimmedPassword,
                    full_name: formData.full_name.trim(),
                    phone: formData.phone.trim(),
                    // REMOVED: institution field
                    country: formData.country,
                    region: formData.region,
                    woreda: formData.woreda.trim(),
                    tin_number: formData.tin_number.trim(),
                    license_number: formData.license_number?.trim() || '',
                    role: formData.role, // Use selected role
                    account_type: 'individual',
                    selected_plan: selectedPlan
                };
            } else {
                endpoint = '/auth/register-company';
                requestData = {
                    company_name: formData.company_name.trim(),
                    company_email: formData.company_email.trim(),
                    company_address: formData.company_address.trim(),
                    company_size: formData.company_size,
                    company_type: formData.company_type,
                    tin_number: formData.tin_number.trim(),
                    country: formData.country,
                    region: formData.region,
                    woreda: formData.woreda?.trim() || '',
                    user_capacity: parseInt(formData.user_capacity),
                    admin_email: formData.admin_email.trim(),
                    admin_password: trimmedAdminPassword,
                    admin_full_name: formData.admin_full_name.trim(),
                    admin_phone: formData.admin_phone.trim(),
                    admin_license_number: formData.admin_license_number?.trim() || '',
                    selected_plan: selectedPlan
                };
            }

            console.log('📤 Sending registration request:', { endpoint, requestData });

            const data = await api.post(endpoint, requestData);

            console.log('📥 Registration response:', data);

            if (!data.success) {
                throw new Error(data.error || 'Registration failed');
            }

            // Extract user ID
            let userId = null;
            let userEmail = '';
            let userName = '';

            if (data.user && data.user.id) {
                userId = data.user.id;
                userEmail = data.user.email || data.user_email || '';
                userName = data.user.full_name || data.user.name || data.user_name || '';
            } else if (data.id) {
                userId = data.id;
                userEmail = data.email || data.user_email || '';
                userName = data.full_name || data.name || data.user_name || '';
            } else if (data.userId) {
                userId = data.userId;
                userEmail = data.email || data.user_email || '';
                userName = data.full_name || data.name || data.user_name || '';
            } else if (data.user_id) {
                userId = data.user_id;
                userEmail = data.email || data.user_email || '';
                userName = data.full_name || data.name || data.user_name || '';
            }

            // Fallback: Use email from form
            if (!userEmail) {
                userEmail = formData.account_type === 'individual' ? formData.email.trim() : formData.admin_email.trim();
                userName = formData.account_type === 'individual' ? formData.full_name.trim() : formData.admin_full_name.trim();
            }

            // Store user data
            const userData = {
                email: userEmail,
                name: userName,
                phone: formData.account_type === 'individual' ? formData.phone.trim() : formData.admin_phone.trim(),
                account_type: formData.account_type,
                status: 'pending_payment',
                userId: userId,
                id: userId,
                user_id: userId,
                company_id: data.company?.id || data.user?.company_id,
                company_name: data.company?.company_name || formData.company_name?.trim(),
                selected_plan: selectedPlan,
                selected_plan_details: selectedPlanDetails,
                backendResponse: {
                    success: data.success,
                    message: data.message,
                    user: data.user,
                    company: data.company
                },
                registered_at: new Date().toISOString(),
                form_email: formData.account_type === 'individual' ? formData.email.trim() : formData.admin_email.trim(),
                form_name: formData.account_type === 'individual' ? formData.full_name.trim() : formData.admin_full_name.trim()
            };

            console.log('💾 Storing user data in localStorage:', userData);

            localStorage.setItem('registered_user', JSON.stringify(userData));
            localStorage.setItem('last_registration', new Date().toISOString());

            const paymentUserData = {
                email: userEmail,
                name: userName,
                userId: userId,
                phone: formData.account_type === 'individual' ? formData.phone.trim() : formData.admin_phone.trim(),
                account_type: formData.account_type,
                selected_plan: selectedPlan,
                selected_plan_details: selectedPlanDetails
            };
            localStorage.setItem('payment_user_data', JSON.stringify(paymentUserData));

            setRegisteredUser(userData);
            setRegistrationComplete(true);

            setStep(3);
            setSuccess(`✅ Registration successful! Please proceed to payment.`);

        } catch (err) {
            console.error('❌ Registration error:', err);
            // Extracts error from backend response { success: false, error: "..." } which becomes 'err' here due to interceptor
            const errorMessage = err.error || err.message || (typeof err === 'string' ? err : 'An error occurred during registration');
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleChapaPayment = async () => {
        setPaymentLoading(true);

        try {
            const userDataStr = localStorage.getItem('registered_user');
            if (!userDataStr) {
                setPlanError('User data not found');
                setPaymentLoading(false);
                return;
            }

            const userData = JSON.parse(userDataStr);

            if (!userData.phone) {
                setPlanError('Phone number is required for payment');
                setPaymentLoading(false);
                return;
            }

            const paymentRequest = {
                planId: selectedPlan,
                userEmail: userData.email,
                userName: userData.name || userData.full_name || 'User',
                userPhone: userData.phone,
                userId: userData.userId || userData.id,
                account_type: userData.account_type || 'individual',
                frontendUrl: window.location.origin
            };

            console.log('📤 Sending payment request:', paymentRequest);

            const data = await api.post('/chapa/create-payment', paymentRequest);

            console.log('📥 Payment response:', data);

            if (!data.success) {
                throw new Error(data.error || 'Payment failed');
            }

            if (data.payment_url) {
                const paymentInfo = {
                    tx_ref: data.tx_ref,
                    planId: selectedPlan,
                    planName: data.plan_name,
                    amount: data.amount,
                    currency: data.currency,
                    userEmail: userData.email,
                    userPhone: data.user_phone || userData.phone,
                    status: 'pending',
                    payment_url: data.payment_url
                };

                localStorage.setItem('pending_subscription', JSON.stringify(paymentInfo));
                setChapaTxRef(data.tx_ref);
                setChapaPaymentUrl(data.payment_url);

                window.location.href = data.payment_url;
            }

        } catch (err) {
            console.error('Payment error:', err);
            setPlanError(err.message);
            setPaymentLoading(false);
        }
    };

    const goBack = () => {
        if (step === 3) {
            setStep(2);
            setError('');
            setSuccess('');
            setPlanError('');
        } else if (step === 2) {
            setStep(1);
            setError('');
            setSelectedPlan('');
            setSelectedPlanDetails(null);
        } else if (step === 4) {
            setStep(3);
        }
    };

    const goToLogin = () => {
        navigate('/login');
    };

    // Step 1: Plan Selection FIRST
    if (step === 1) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
                <div className="w-full max-w-7xl">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10">
                        <div className="text-center mb-8 md:mb-10">
                            <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl mb-4 md:mb-6 shadow-lg">
                                <FaUserMd className="text-white text-3xl md:text-4xl" />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 md:mb-3">Choose Your Subscription Plan</h1>
                            <p className="text-gray-600 md:text-lg max-w-2xl mx-auto px-4">
                                Select the perfect plan for your needs. Registration will follow.
                            </p>
                        </div>

                        {/* Individual Plans Section */}
                        <div className="mb-12">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                                    <FaUserTie className="text-blue-600" />
                                    Individual Plans
                                </h2>
                                <span className="text-sm text-gray-500 bg-blue-50 px-3 py-1 rounded-full">
                                    For healthcare professionals
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {SUBSCRIPTION_PLANS.filter(plan => plan.account_type === 'individual').map((plan) => {
                                    const PlanIcon = plan.icon;
                                    return (
                                        <div
                                            key={plan.id}
                                            className={`border-3 rounded-2xl p-6 md:p-8 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${selectedPlan === plan.id
                                                ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-2xl'
                                                : 'border-gray-200 hover:border-blue-300 hover:shadow-xl bg-white'
                                                }`}
                                            onClick={() => handlePlanSelect(plan)}
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-3 bg-blue-100 rounded-xl">
                                                        <PlanIcon className="text-blue-600 text-xl" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold text-gray-800">{plan.name}</h3>
                                                        <p className="text-gray-600 text-sm">{plan.description}</p>
                                                    </div>
                                                </div>
                                                {plan.badge && (
                                                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                                        {plan.badge}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="mb-4">
                                                <div className="text-2xl font-bold text-gray-800 mb-1">
                                                    {plan.price} <span className="text-base font-normal text-gray-600">{plan.currency}</span>
                                                </div>
                                                <div className="text-gray-600">
                                                    per {plan.interval}
                                                    {plan.originalPrice && (
                                                        <div className="mt-1">
                                                            <span className="text-base line-through text-gray-500 mr-2">
                                                                {plan.originalPrice} {plan.currency}
                                                            </span>
                                                            <span className="text-base font-bold text-green-600">
                                                                {plan.discount}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <ul className="space-y-2 mb-6">
                                                {plan.features.slice(0, 4).map((feature, index) => (
                                                    <li key={index} className="flex items-start gap-2">
                                                        <FaCheck className="text-green-500 mt-1 flex-shrink-0" />
                                                        <span className="text-gray-700 text-sm">{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>

                                            <button
                                                className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 ${selectedPlan === plan.id
                                                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg'
                                                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {selectedPlan === plan.id ? 'Selected ✓' : 'Select This Plan'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Company Plans Section */}
                        <div className="mb-12">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                                    <FaBuilding className="text-green-600" />
                                    Company Plans
                                </h2>
                                <span className="text-sm text-gray-500 bg-green-50 px-3 py-1 rounded-full">
                                    For healthcare organizations
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {SUBSCRIPTION_PLANS.filter(plan => plan.account_type === 'company').map((plan) => {
                                    const PlanIcon = plan.icon;
                                    return (
                                        <div
                                            key={plan.id}
                                            className={`border-3 rounded-2xl p-6 md:p-8 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${selectedPlan === plan.id
                                                ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 shadow-2xl'
                                                : 'border-gray-200 hover:border-green-300 hover:shadow-xl bg-white'
                                                }`}
                                            onClick={() => handlePlanSelect(plan)}
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-3 bg-green-100 rounded-xl">
                                                        <PlanIcon className="text-green-600 text-xl" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold text-gray-800">{plan.name}</h3>
                                                        <p className="text-gray-600 text-sm">{plan.description}</p>
                                                    </div>
                                                </div>
                                                {plan.badge && (
                                                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-100 text-green-800">
                                                        {plan.badge}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="mb-4">
                                                <div className="text-2xl font-bold text-gray-800 mb-1">
                                                    {plan.price} <span className="text-base font-normal text-gray-600">{plan.currency}</span>
                                                </div>
                                                <div className="text-gray-600">
                                                    per {plan.interval}
                                                    {plan.originalPrice && (
                                                        <div className="mt-1">
                                                            <span className="text-base line-through text-gray-500 mr-2">
                                                                {plan.originalPrice} {plan.currency}
                                                            </span>
                                                            <span className="text-base font-bold text-green-600">
                                                                {plan.discount}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <ul className="space-y-2 mb-6">
                                                {plan.features.slice(0, 4).map((feature, index) => (
                                                    <li key={index} className="flex items-start gap-2">
                                                        <FaCheck className="text-green-500 mt-1 flex-shrink-0" />
                                                        <span className="text-gray-700 text-sm">{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>

                                            <button
                                                className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 ${selectedPlan === plan.id
                                                    ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg'
                                                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {selectedPlan === plan.id ? 'Selected ✓' : 'Select This Plan'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Navigation */}
                        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                            <Link
                                to="/login"
                                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 md:py-4 px-4 md:px-6 rounded-xl transition-all duration-300 text-center shadow-md hover:shadow-lg"
                            >
                                <span className="flex items-center justify-center gap-2">
                                    Already have an account? <span className="font-semibold">Sign in</span>
                                </span>
                            </Link>
                            <button
                                onClick={() => {
                                    if (!selectedPlan) {
                                        setError('Please select a subscription plan');
                                        return;
                                    }
                                    setStep(2);
                                }}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 md:py-4 px-4 md:px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 md:gap-3 shadow-lg hover:shadow-xl"
                                disabled={!selectedPlan}
                            >
                                <span>Continue to Registration</span>
                                <FaArrowRight />
                            </button>
                        </div>

                        {error && (
                            <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <FaExclamationTriangle className="text-red-500" />
                                    <p className="text-red-600">{error}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Step 2: Registration Form
    if (step === 2) {
        const isIndividual = selectedPlanDetails?.account_type === 'individual';

        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
                <div className="w-full max-w-4xl">
                    {/* Progress Bar */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                                    1
                                </div>
                                <span className="font-semibold text-green-600">Plan Selected</span>
                            </div>
                            <div className="flex-1 h-2 mx-4 bg-gray-200 rounded-full">
                                <div className="h-full w-1/3 bg-green-500 rounded-full"></div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                                    2
                                </div>
                                <span className="font-semibold text-blue-600">Registration</span>
                            </div>
                            <div className="flex-1 h-2 mx-4 bg-gray-200 rounded-full">
                                <div className="h-full w-1/3 bg-green-500 rounded-full"></div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gray-200 text-gray-400 rounded-full flex items-center justify-center font-bold">
                                    3
                                </div>
                                <span className="text-gray-500">Payment</span>
                            </div>
                        </div>
                        <p className="text-center text-gray-500 text-sm">
                            Step 2 of 3: Complete your registration for {selectedPlanDetails?.name}
                        </p>
                    </div>

                    {/* Selected Plan Info */}
                    {selectedPlanDetails && (
                        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-lg">
                                        {selectedPlanDetails.icon &&
                                            React.createElement(selectedPlanDetails.icon, {
                                                className: `text-xl ${selectedPlanDetails.color.includes('blue') ? 'text-blue-600' :
                                                    selectedPlanDetails.color.includes('green') ? 'text-green-600' :
                                                        selectedPlanDetails.color.includes('purple') ? 'text-purple-600' :
                                                            'text-orange-600'}`
                                            })
                                        }
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">{selectedPlanDetails.name}</h3>
                                        <p className="text-sm text-gray-600">
                                            {selectedPlanDetails.price} {selectedPlanDetails.currency} per {selectedPlanDetails.interval}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setStep(1)}
                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    Change Plan
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-3xl shadow-2xl p-8">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4">
                                {isIndividual ? (
                                    <FaUserTie className="text-white text-2xl" />
                                ) : (
                                    <FaBuilding className="text-white text-2xl" />
                                )}
                            </div>
                            <h1 className="text-2xl font-bold text-gray-800 mb-2">
                                {isIndividual ? 'Individual Registration' : 'Company Registration'}
                            </h1>
                            <p className="text-gray-600">
                                Please fill in all required information to create your {isIndividual ? 'individual' : 'company'} account
                            </p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <FaExclamationTriangle className="text-red-500" />
                                    <div>
                                        <p className="text-red-700 font-bold">Error</p>
                                        <p className="text-red-600">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {success && (
                            <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <FaCheck className="text-green-500" />
                                    <div>
                                        <p className="text-green-700 font-bold">Success</p>
                                        <p className="text-green-600">{success}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleRegistrationSubmit} className="space-y-6">
                            {isIndividual ? (
                                // Individual Registration Form - WITHOUT INSTITUTION
                                <>
                                    <div className="mb-6">
                                        <label className="block text-gray-700 font-medium mb-2">
                                            <FaUserMd className="inline mr-2" />
                                            Select Your Profession *
                                        </label>
                                        <select
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        >
                                            <option value="pharmacist">Pharmacist</option>
                                            <option value="physician">Physician</option>
                                            <option value="nurse">Nurse</option>
                                            <option value="other_health_professional">Other Health Professional</option>
                                            <option value="pharmacy_student">Pharmacy Student</option>
                                            <option value= "other_health_science_student">Other Health Science Student</option>
                                            <option value="health_care_client">Health Care Client</option>
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-2">
                                                <FaUser className="inline mr-2" />
                                                Full Name *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                                placeholder="Enter your full name"
                                                value={formData.full_name}
                                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-2">
                                                <FaEnvelope className="inline mr-2" />
                                                Email Address *
                                            </label>
                                            <input
                                                type="email"
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                                placeholder="Enter your email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-2">
                                                <FaPhone className="inline mr-2" />
                                                Phone Number *
                                            </label>
                                            <input
                                                type="tel"
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                                placeholder="Enter your phone number"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-2">
                                                <FaFileInvoiceDollar className="inline mr-2" />
                                                TIN Number (Optional)
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                                placeholder="Enter TIN number (optional)"
                                                value={formData.tin_number}
                                                onChange={(e) => setFormData({ ...formData, tin_number: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-2">
                                                <FaGlobe className="inline mr-2" />
                                                Country *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                                value={formData.country}
                                                readOnly
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-2">
                                                <FaMapMarker className="inline mr-2" />
                                                Region/State *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                                placeholder="Enter your region"
                                                value={formData.region}
                                                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-2">
                                                <FaMapMarker className="inline mr-2" />
                                                Woreda/Zone (Optional)
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                                placeholder="Enter your woreda"
                                                value={formData.woreda}
                                                onChange={(e) => setFormData({ ...formData, woreda: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-2">
                                                <FaLock className="inline mr-2" />
                                                Password *
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    required
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition pr-12"
                                                    placeholder="Create a password"
                                                    value={formData.password}
                                                    onChange={(e) => handlePasswordChange(e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                                </button>
                                            </div>
                                            {passwordStrength && (
                                                <p className="mt-2 text-sm">
                                                    Password strength:
                                                    <span className={`ml-2 font-bold ${passwordStrength === 'weak' ? 'text-red-500' :
                                                        passwordStrength === 'fair' ? 'text-yellow-500' :
                                                            passwordStrength === 'good' ? 'text-blue-500' :
                                                                'text-green-500'
                                                        }`}>
                                                        {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
                                                    </span>
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-2">
                                                <FaLock className="inline mr-2" />
                                                Confirm Password *
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    required
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition pr-12"
                                                    placeholder="Confirm your password"
                                                    value={formData.confirmPassword}
                                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                >
                                                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                                </button>
                                            </div>
                                            {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                                <p className="mt-2 text-sm text-red-500">Passwords do not match</p>
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                // Company Registration Form (unchanged)
                                <>
                                    <div className="bg-blue-50 p-6 rounded-xl mb-6">
                                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                            <FaBuilding /> Company Information
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-gray-700 font-medium mb-2">
                                                    Company Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                                    placeholder="Enter company name"
                                                    value={formData.company_name}
                                                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-gray-700 font-medium mb-2">
                                                    <FaEnvelope className="inline mr-2" />
                                                    Company Email *
                                                </label>
                                                <input
                                                    type="email"
                                                    required
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                                    placeholder="Enter company email"
                                                    value={formData.company_email}
                                                    onChange={(e) => setFormData({ ...formData, company_email: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-gray-700 font-medium mb-2">
                                                <FaMapMarker className="inline mr-2" />
                                                Company Address *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                                placeholder="Enter company address"
                                                value={formData.company_address}
                                                onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-gray-700 font-medium mb-2">
                                                    <FaBriefcase className="inline mr-2" />
                                                    Company Type
                                                </label>
                                                <select
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                                    value={formData.company_type}
                                                    onChange={(e) => setFormData({ ...formData, company_type: e.target.value })}
                                                >
                                                    <option value="pharmacy">Pharmacy</option>
                                                    <option value="hospital">Hospital</option>
                                                    <option value="clinic">Clinic</option>
                                                    <option value="pharmaceutical">Pharmaceutical Company</option>
                                                    <option value="health_center">Health Center</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-gray-700 font-medium mb-2">
                                                    <FaFileInvoiceDollar className="inline mr-2" />
                                                    TIN Number *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                                    placeholder="Enter company TIN number"
                                                    value={formData.tin_number}
                                                    onChange={(e) => setFormData({ ...formData, tin_number: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-gray-700 font-medium mb-2">
                                                    <FaGlobe className="inline mr-2" />
                                                    Country *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                                    value={formData.country}
                                                    readOnly
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-gray-700 font-medium mb-2">
                                                    <FaMapMarker className="inline mr-2" />
                                                    Region/State *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                                    placeholder="Enter region"
                                                    value={formData.region}
                                                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-yellow-50 p-6 rounded-xl mb-6">
                                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                            <FaUserTie /> Admin Account Information
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-gray-700 font-medium mb-2">
                                                    <FaUser className="inline mr-2" />
                                                    Admin Full Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                                    placeholder="Enter admin full name"
                                                    value={formData.admin_full_name}
                                                    onChange={(e) => setFormData({ ...formData, admin_full_name: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-gray-700 font-medium mb-2">
                                                    <FaEnvelope className="inline mr-2" />
                                                    Admin Email *
                                                </label>
                                                <input
                                                    type="email"
                                                    required
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                                    placeholder="Enter admin email"
                                                    value={formData.admin_email}
                                                    onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                            <div>
                                                <label className="block text-gray-700 font-medium mb-2">
                                                    <FaPhone className="inline mr-2" />
                                                    Admin Phone *
                                                </label>
                                                <input
                                                    type="tel"
                                                    required
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                                    placeholder="Enter admin phone number"
                                                    value={formData.admin_phone}
                                                    onChange={(e) => setFormData({ ...formData, admin_phone: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                            <div>
                                                <label className="block text-gray-700 font-medium mb-2">
                                                    <FaLock className="inline mr-2" />
                                                    Admin Password *
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={showAdminPassword ? "text" : "password"}
                                                        required
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition pr-12"
                                                        placeholder="Create admin password"
                                                        value={formData.admin_password}
                                                        onChange={(e) => handleAdminPasswordChange(e.target.value)}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                                                        onClick={() => setShowAdminPassword(!showAdminPassword)}
                                                    >
                                                        {showAdminPassword ? <FaEyeSlash /> : <FaEye />}
                                                    </button>
                                                </div>
                                                {adminPasswordStrength && (
                                                    <p className="mt-2 text-sm">
                                                        Password strength:
                                                        <span className={`ml-2 font-bold ${adminPasswordStrength === 'weak' ? 'text-red-500' :
                                                            adminPasswordStrength === 'fair' ? 'text-yellow-500' :
                                                                adminPasswordStrength === 'good' ? 'text-blue-500' :
                                                                    'text-green-500'
                                                            }`}>
                                                            {adminPasswordStrength.charAt(0).toUpperCase() + adminPasswordStrength.slice(1)}
                                                        </span>
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-gray-700 font-medium mb-2">
                                                    <FaLock className="inline mr-2" />
                                                    Confirm Admin Password *
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={showAdminConfirmPassword ? "text" : "password"}
                                                        required
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition pr-12"
                                                        placeholder="Confirm admin password"
                                                        value={formData.admin_confirm_password}
                                                        onChange={(e) => setFormData({ ...formData, admin_confirm_password: e.target.value })}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                                                        onClick={() => setShowAdminConfirmPassword(!showAdminConfirmPassword)}
                                                    >
                                                        {showAdminConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                                    </button>
                                                </div>
                                                {formData.admin_password && formData.admin_confirm_password && formData.admin_password !== formData.admin_confirm_password && (
                                                    <p className="mt-2 text-sm text-red-500">Passwords do not match</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="flex flex-col md:flex-row gap-4 pt-6 border-t">
                                <button
                                    type="button"
                                    onClick={goBack}
                                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-xl transition"
                                >
                                    ← Back to Plan Selection
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <FaSpinner className="animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            Continue to Payment
                                            <FaArrowRight />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div >
        );
    }

    // Step 3: Payment (unchanged)
    if (step === 3) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
                <div className="w-full max-w-7xl">
                    {/* Progress Bar */}
                    <div className="mb-8 md:mb-10">
                        <div className="flex items-center justify-between mb-3 md:mb-4">
                            <div className="flex items-center gap-2 md:gap-3">
                                <div className="w-8 h-8 md:w-10 md:h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-bold shadow-lg text-xs md:text-sm">
                                    <FaCheck className="text-xs md:text-sm" />
                                </div>
                                <div className="hidden md:block">
                                    <span className="font-semibold text-green-600 text-sm md:text-base">Plan Selected</span>
                                    <p className="text-xs text-gray-500">{selectedPlanDetails?.name}</p>
                                </div>
                            </div>
                            <div className="flex-1 h-2 mx-2 md:mx-6 bg-gray-200 rounded-full">
                                <div className="h-full w-1/2 bg-green-500 rounded-full"></div>
                            </div>
                            <div className="flex items-center gap-2 md:gap-3">
                                <div className="w-8 h-8 md:w-10 md:h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-bold shadow-lg text-xs md:text-sm">
                                    <FaCheck className="text-xs md:text-sm" />
                                </div>
                                <div className="hidden md:block">
                                    <span className="font-semibold text-green-600 text-sm md:text-base">Registration</span>
                                    <p className="text-xs text-gray-500">Completed</p>
                                </div>
                            </div>
                            <div className="flex-1 h-2 mx-2 md:mx-6 bg-gray-200 rounded-full">
                                <div className="h-full w-1/2 bg-green-500 rounded-full"></div>
                            </div>
                            <div className="flex items-center gap-2 md:gap-3">
                                <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold shadow-lg text-xs md:text-sm">
                                    3
                                </div>
                                <div className="hidden md:block">
                                    <span className="font-semibold text-blue-600 text-sm md:text-base">Payment</span>
                                    <p className="text-xs text-gray-500">Complete payment</p>
                                </div>
                            </div>
                        </div>
                        <p className="text-center text-gray-500 text-sm md:text-base mt-2">
                            Step 3 of 4: Complete payment for your subscription
                        </p>
                    </div>

                    <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 lg:p-10">
                        <div className="text-center mb-8 md:mb-10">
                            <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl mb-4 md:mb-6 shadow-lg">
                                <FaCreditCard className="text-white text-2xl md:text-3xl lg:text-4xl" />
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 md:mb-3">Complete Your Payment</h1>
                            <p className="text-gray-600 md:text-lg max-w-2xl mx-auto px-2">
                                Complete payment to activate your subscription
                            </p>
                        </div>

                        {/* Selected Plan Summary */}
                        {selectedPlanDetails && (
                            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-200">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white rounded-xl">
                                            {selectedPlanDetails.icon &&
                                                React.createElement(selectedPlanDetails.icon, {
                                                    className: `text-2xl ${selectedPlanDetails.color.includes('blue') ? 'text-blue-600' :
                                                        selectedPlanDetails.color.includes('green') ? 'text-green-600' :
                                                            selectedPlanDetails.color.includes('purple') ? 'text-purple-600' :
                                                                'text-orange-600'}`
                                                })
                                            }
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800">{selectedPlanDetails.name}</h3>
                                            <p className="text-gray-600">{selectedPlanDetails.description}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-gray-800">
                                            {selectedPlanDetails.price} {selectedPlanDetails.currency}
                                        </div>
                                        <div className="text-gray-600">
                                            per {selectedPlanDetails.interval}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Payment Instructions */}
                        <div className="mb-8 p-6 bg-blue-50 border-2 border-blue-200 rounded-2xl">
                            <div className="flex items-center gap-4">
                                <FaCreditCard className="text-blue-500 text-xl flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-blue-700 font-bold text-lg">Secure Payment via Chapa</p>
                                    <p className="text-blue-600 mt-2">
                                        Click the button below to proceed to Chapa's secure payment page to complete your subscription.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                            <button
                                onClick={goBack}
                                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 md:py-4 px-4 md:px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 md:gap-3 shadow-md hover:shadow-lg"
                            >
                                <span>← Back to Registration</span>
                            </button>

                            <button
                                onClick={handleChapaPayment}
                                disabled={paymentLoading}
                                className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-medium py-3 md:py-4 px-4 md:px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 md:gap-3 shadow-lg hover:shadow-xl disabled:opacity-50"
                            >
                                {paymentLoading ? (
                                    <>
                                        <FaSpinner className="animate-spin mr-2" />
                                        Initializing Payment...
                                    </>
                                ) : (
                                    <>
                                        Pay {selectedPlanDetails?.price} {selectedPlanDetails?.currency} via Chapa
                                        <FaCreditCard />
                                    </>
                                )}
                            </button>
                        </div>

                        {planError && (
                            <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <FaExclamationTriangle className="text-red-500" />
                                    <div>
                                        <p className="text-red-700 font-bold">Payment Error</p>
                                        <p className="text-red-600">{planError}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Step 4: Success & Admin Approval Status (unchanged)
    if (step === 4) {
        const userData = JSON.parse(localStorage.getItem('registered_user') || '{}');
        const paymentData = JSON.parse(localStorage.getItem('user_payment') || '{}');

        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
                <div className="w-full max-w-4xl">
                    <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 lg:p-10">
                        <div className="text-center mb-8 md:mb-10">
                            <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl mb-4 md:mb-6 shadow-lg">
                                <FaCheck className="text-white text-2xl md:text-3xl lg:text-4xl" />
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 md:mb-3">Registration Complete!</h1>
                            <p className="text-gray-600 md:text-lg max-w-2xl mx-auto px-2">
                                Your account is now pending admin approval
                            </p>
                        </div>

                        {/* Success Summary */}
                        <div className="mb-8 md:mb-10 p-6 md:p-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200">
                            <div className="flex items-center gap-4 md:gap-6 mb-6">
                                <div className="w-12 h-12 md:w-16 md:h-16 bg-green-100 rounded-full flex items-center justify-center">
                                    <FaUser className="text-green-600 text-xl md:text-2xl" />
                                </div>
                                <div>
                                    <h3 className="text-xl md:text-2xl font-bold text-gray-800">Account Summary</h3>
                                    <p className="text-gray-600">Your registration details</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                <div className="p-4 bg-white rounded-xl border border-green-100">
                                    <p className="text-gray-500 text-sm mb-1">Account Type</p>
                                    <p className="font-bold text-gray-800">{userData.account_type === 'individual' ? 'Individual Account' : 'Company Account'}</p>
                                </div>
                                <div className="p-4 bg-white rounded-xl border border-green-100">
                                    <p className="text-gray-500 text-sm mb-1">Email</p>
                                    <p className="font-bold text-gray-800">{userData.email}</p>
                                </div>
                                <div className="p-4 bg-white rounded-xl border border-green-100">
                                    <p className="text-gray-500 text-sm mb-1">Name</p>
                                    <p className="font-bold text-gray-800">{userData.name}</p>
                                </div>
                                <div className="p-4 bg-white rounded-xl border border-green-100">
                                    <p className="text-gray-500 text-sm mb-1">Status</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                                        <span className="font-bold text-yellow-600">Pending Admin Approval</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Subscription Details */}
                        <div className="mb-8 md:mb-10 p-6 md:p-8 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-200">
                            <div className="flex items-center gap-4 md:gap-6 mb-6">
                                <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                    <FaCreditCard className="text-blue-600 text-xl md:text-2xl" />
                                </div>
                                <div>
                                    <h3 className="text-xl md:text-2xl font-bold text-gray-800">Subscription Details</h3>
                                    <p className="text-gray-600">Your payment and plan information</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                <div className="p-4 bg-white rounded-xl border border-blue-100">
                                    <p className="text-gray-500 text-sm mb-1">Plan</p>
                                    <p className="font-bold text-gray-800">{selectedPlanDetails?.name || 'N/A'}</p>
                                </div>
                                <div className="p-4 bg-white rounded-xl border border-blue-100">
                                    <p className="text-gray-500 text-sm mb-1">Amount Paid</p>
                                    <p className="font-bold text-gray-800">{selectedPlanDetails?.price} {selectedPlanDetails?.currency}</p>
                                </div>
                                <div className="p-4 bg-white rounded-xl border border-blue-100">
                                    <p className="text-gray-500 text-sm mb-1">Transaction Ref</p>
                                    <p className="font-bold text-gray-800 text-sm">{chapaTxRef || paymentData.tx_ref || 'N/A'}</p>
                                </div>
                                <div className="p-4 bg-white rounded-xl border border-blue-100">
                                    <p className="text-gray-500 text-sm mb-1">Payment Status</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="font-bold text-green-600">Paid via Chapa</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Next Steps */}
                        <div className="mb-8 md:mb-10 p-6 md:p-8 bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl border-2 border-purple-200">
                            <div className="flex items-center gap-4 md:gap-6 mb-6">
                                <div className="w-12 h-12 md:w-16 md:h-16 bg-purple-100 rounded-full flex items-center justify-center">
                                    <FaRegClock className="text-purple-600 text-xl md:text-2xl" />
                                </div>
                                <div>
                                    <h3 className="text-xl md:text-2xl font-bold text-gray-800">What Happens Next?</h3>
                                    <p className="text-gray-600">Your account activation process</p>
                                </div>
                            </div>

                            <div className="space-y-4 md:space-y-6">
                                <div className="flex items-start gap-4 p-4 bg-white rounded-xl">
                                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-yellow-600 font-bold">1</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 mb-1">Admin Review</h4>
                                        <p className="text-gray-600 text-sm md:text-base">
                                            Our admin team will review your registration details within 24-48 hours.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 bg-white rounded-xl">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-blue-600 font-bold">2</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 mb-1">Approval Notification</h4>
                                        <p className="text-gray-600 text-sm md:text-base">
                                            You will receive an email notification when your account is approved.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 bg-white rounded-xl">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-green-600 font-bold">3</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 mb-1">Account Activation</h4>
                                        <p className="text-gray-600 text-sm md:text-base">
                                            Once approved, you can login and start using PharmaCare CDSS.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Important Notes */}
                        <div className="mb-8 md:mb-10 p-6 md:p-8 bg-yellow-50 rounded-2xl border-2 border-yellow-200">
                            <div className="flex items-start gap-4">
                                <FaInfoCircle className="text-yellow-500 text-xl md:text-2xl flex-shrink-0 mt-1" />
                                <div>
                                    <h4 className="font-bold text-gray-800 mb-2">Important Notes:</h4>
                                    <ul className="space-y-2 text-gray-600">
                                        <li className="flex items-start gap-2">
                                            <span className="text-yellow-500">•</span>
                                            <span>You cannot login until your account is approved by an admin.</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-yellow-500">•</span>
                                            <span>Keep your login credentials (email and password) safe.</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-yellow-500">•</span>
                                            <span>If you don't receive an approval email within 48 hours, check your spam folder or contact support.</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-yellow-500">•</span>
                                            <span>Your payment has been recorded via Chapa. Keep your transaction reference for any inquiries.</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Final Action Buttons */}
                        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                            <button
                                onClick={() => navigate('/')}
                                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 md:py-4 px-4 md:px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 md:gap-3 shadow-md hover:shadow-lg text-sm md:text-base"
                            >
                                <span>← Back to Home</span>
                            </button>
                            <button
                                onClick={goToLogin}
                                className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-medium py-3 md:py-4 px-4 md:px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 md:gap-3 shadow-lg hover:shadow-xl text-center text-sm md:text-base"
                            >
                                <span>Go to Login Page</span>
                                <FaArrowRight />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default Signup;
