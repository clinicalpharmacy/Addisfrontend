import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaCheck, FaTimes, FaUserTie, FaBuilding, FaUserShield,
  FaHeadset, FaCalendarAlt, FaMoneyBillWave, FaCreditCard,
  FaUsers, FaArrowRight, FaExclamationCircle, FaSpinner,
  FaLock, FaUserCheck, FaCheckCircle, FaTimesCircle, FaClock, FaSync
} from 'react-icons/fa';
import api from '../utils/api';

// Helper: Dynamic pricing based on country
const getDynamicPricing = (plan, country) => {
    if (!plan) return { currency: 'ETB', amount: 0, showVat: false, baseAmount: 0, vatAmount: 0 };
    const isEthiopia = !country || (country.toLowerCase().includes('ethiopia') && !country.toLowerCase().includes('outside'));
    
    // Calculate base and VAT from the total Ethiopian price (which includes 15% VAT)
    const baseETB = Math.round(plan.price / 1.15);
    const vatETB = plan.price - baseETB;

    if (isEthiopia) {
        return {
            currency: 'ETB',
            amount: plan.price,
            originalAmount: plan.originalPrice,
            showVat: true,
            baseAmount: baseETB,
            vatAmount: vatETB
        };
    } else {
        // Outside Ethiopia: Multiply by 3, keep in ETB, and show VAT breakdown
        const multiplier = 3;
        
        const totalETB = plan.price * multiplier;
        const totalBaseETB = baseETB * multiplier;
        const totalVatETB = vatETB * multiplier;

        return {
            currency: 'ETB',
            amount: totalETB,
            originalAmount: plan.originalPrice ? plan.originalPrice * multiplier : null,
            showVat: true,
            baseAmount: totalBaseETB,
            vatAmount: totalVatETB
        };
    }
};

const SubscriptionPlans = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [facilityType, setFacilityType] = useState('pharmacy');
  const [paymentMethod, setPaymentMethod] = useState('chapa');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [user, setUser] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [accountType, setAccountType] = useState('individual');
  const [country, setCountry] = useState('Ethiopia');
  const [refreshingStatus, setRefreshingStatus] = useState(false);

  useEffect(() => {
    if (user?.country) {
      setCountry(user.country);
    } else {
      const detectCountry = async () => {
        try {
          const response = await fetch('https://ipapi.co/json/');
          if (response.ok) {
            const data = await response.json();
            if (data.country_name) setCountry(data.country_name);
          }
        } catch (err) {
          console.error('Country detection failed');
        }
      };
      detectCountry();
    }
  }, [user]);

  useEffect(() => {
    // Check if user has completed registration or is already logged in
    checkRegistrationStatus();
  }, [navigate]);

  const checkRegistrationStatus = async () => {
    // 1. Check if user is already logged in (Renewal / Manage Subscription case)
    const token = localStorage.getItem('token');
    const activeUser = localStorage.getItem('user');

    if (activeUser || token) {
      try {
        let parsedUser = activeUser ? JSON.parse(activeUser) : null;

        // Fetch fresh profile from backend if user has auth token
        if (token) {
          try {
            setRefreshingStatus(true);
            const res = await api.get('/auth/me');
            if (res?.success && res.user) {
              parsedUser = res.user;
              localStorage.setItem('user', JSON.stringify(res.user));
              if (res.user.subscription_status) {
                localStorage.setItem('subscription_status', res.user.subscription_status);
              }
              if (res.user.subscription_end_date) {
                localStorage.setItem('subscription_end_date', res.user.subscription_end_date);
              }
            }
          } catch (fetchErr) {
            console.warn('Could not refresh /auth/me in SubscriptionPlans:', fetchErr);
          } finally {
            setRefreshingStatus(false);
          }
        }

        if (parsedUser) {
          setUser(parsedUser);
          setIsExistingUser(true);
          const detectedAccountType = parsedUser.account_type || (parsedUser.role === 'company_admin' ? 'company' : 'individual');
          setAccountType(detectedAccountType);
          setIsRegistered(true);

          // Infer facility type
          if (detectedAccountType === 'individual' || (!parsedUser.company_id && parsedUser.role !== 'company_admin')) {
            setFacilityType('individual');
          } else if (parsedUser.facility_type) {
            setFacilityType(parsedUser.facility_type);
          } else if (parsedUser.company?.company_type) {
            setFacilityType(parsedUser.company.company_type);
          } else if (parsedUser.subscription_plan) {
            const prefix = parsedUser.subscription_plan.replace(/_(monthly|yearly)$/, '');
            if (prefix) setFacilityType(prefix);
          }

          // Pre-select current plan if exists
          if (parsedUser.subscription_plan) {
            setSelectedPlan(parsedUser.subscription_plan);
          }
          return;
        }
      } catch (e) {
        console.error('Failed to parse active user:', e);
      }
    }

    // 2. Check if user just registered (New registration case)
    const registeredUserData = localStorage.getItem('registered_user');
    if (registeredUserData) {
      try {
        const parsedRegisteredUser = JSON.parse(registeredUserData);
        setUser(parsedRegisteredUser);
        setIsExistingUser(false);
        const registeredAccountType = parsedRegisteredUser.account_type || 'individual';
        setAccountType(registeredAccountType);
        setIsRegistered(true);

        if (registeredAccountType === 'individual') {
          setFacilityType('individual');
        } else if (parsedRegisteredUser.facility_type) {
          setFacilityType(parsedRegisteredUser.facility_type);
        }

        // If user already paid, redirect to success
        if (parsedRegisteredUser.payment_status === 'paid') {
          navigate('/subscription/success');
          return;
        }
        return;
      } catch (e) {
        console.error('Failed to parse registered user:', e);
      }
    }

    // If no user found at all, redirect to registration
    setError('Please complete registration or login first.');
    setTimeout(() => navigate('/signup'), 3000);
  };

  // Helper: Calculate days remaining
  const calculateDaysRemaining = (expiryDate) => {
    if (!expiryDate) return null;
    const expiry = new Date(expiryDate);
    if (isNaN(expiry.getTime())) return null;
    const today = new Date();
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysRemaining = calculateDaysRemaining(user?.subscription_end_date);
  const isSubActive = (user?.subscription_status === 'active' || localStorage.getItem('subscription_status') === 'active') &&
    (daysRemaining === null || daysRemaining > 0);
  const isSubExpired = (user?.subscription_status === 'expired') || (daysRemaining !== null && daysRemaining <= 0);

  // All plans — all prices include 15% VAT
  const ALL_PLANS = [
    // Individual — 300/month, 3000/year (base) + 15% VAT
    {
      id: 'individual_monthly',
      name: 'Individual Monthly',
      price: 345, // 300 + 15% VAT
      currency: 'ETB',
      interval: 'month',
      originalPrice: 345,
      description: 'For individual pharmacists, health professionals & students',
      features: [
        'Full Medication Information',
        'Home Remedies & Clinical Alerts',
        'Medication Availability Checks',
        'Clinical Decision Support',
        'Single user account'
      ],
      recommended: false,
      icon: <FaUserTie className="text-green-500" />
    },
    {
      id: 'individual_yearly',
      name: 'Individual Yearly',
      price: 3450, // 3000 + 15% VAT
      currency: 'ETB',
      interval: 'year',
      originalPrice: 4140, // 3600 + 15% VAT
      description: 'Best value for individuals with 2 months free',
      features: [
        'Everything in Monthly plan',
        'Priority support',
        'Minor illness management',
        'Compounding resources',
        'Early access to new features'
      ],
      popular: true,
      recommended: true,
      icon: <FaUserTie className="text-green-500" />
    },
    // Pharmacy / Drug Store — 900/month, 9,000/year (base) + 15% VAT
    {
      id: 'pharmacy_monthly',
      name: 'Pharmacy / Drug Store Monthly',
      price: 1035, // 900 + 15% VAT
      currency: 'ETB',
      interval: 'month',
      originalPrice: 1035,
      description: 'For pharmacies and drug stores',
      features: [
        'Full medication knowledge base',
        'Patient management system',
        'Clinical decision support',
        'Drug interaction checking',
        'Medication availability checks',
        'Up to 3 users'
      ],
      recommended: false,
      icon: <FaBuilding className="text-green-500" />
    },
    {
      id: 'pharmacy_yearly',
      name: 'Pharmacy / Drug Store Yearly',
      price: 10350, // 9000 + 15% VAT
      currency: 'ETB',
      interval: 'year',
      originalPrice: 12420,
      description: 'Best value for pharmacies and drug stores',
      features: [
        'Everything in Monthly plan',
        'Priority support',
        'Advanced analytics',
        'Custom reports',
        'Up to 5 users'
      ],
      popular: true,
      recommended: true,
      icon: <FaBuilding className="text-green-600" />
    },
    // Clinic / Specialty Center — 900/month, 9,000/year
    {
      id: 'clinic_monthly',
      name: 'Clinic / Specialty Center Monthly',
      price: 1035, // 900 + 15% VAT
      currency: 'ETB',
      interval: 'month',
      originalPrice: 1035,
      description: 'For clinics and specialty centers',
      features: [
        'Full medication knowledge base',
        'Patient management system',
        'Clinical decision support',
        'Drug interaction checking',
        'Medication availability checks',
        'Up to 3 users'
      ],
      recommended: false,
      icon: <FaBuilding className="text-teal-500" />
    },
    {
      id: 'clinic_yearly',
      name: 'Clinic / Specialty Center Yearly',
      price: 10350, // 9000 + 15% VAT
      currency: 'ETB',
      interval: 'year',
      originalPrice: 12420,
      description: 'Best value for clinics and specialty centers',
      features: [
        'Everything in Monthly plan',
        'Priority support',
        'Advanced analytics',
        'Custom reports',
        'Up to 5 users'
      ],
      popular: true,
      recommended: true,
      icon: <FaBuilding className="text-teal-600" />
    },
    // Health Center — 900/month, 9,000/year
    {
      id: 'health_center_monthly',
      name: 'Health Center Monthly',
      price: 1035, // 900 + 15% VAT
      currency: 'ETB',
      interval: 'month',
      originalPrice: 1035,
      description: 'For health centers',
      features: [
        'Full medication knowledge base',
        'Patient management system',
        'Clinical decision support',
        'Drug interaction checking',
        'Medication availability checks',
        'Up to 3 users'
      ],
      recommended: false,
      icon: <FaBuilding className="text-green-500" />
    },
    {
      id: 'health_center_yearly',
      name: 'Health Center Yearly',
      price: 10350, // 9000 + 15% VAT
      currency: 'ETB',
      interval: 'year',
      originalPrice: 12420,
      description: 'Best value for health centers',
      features: [
        'Everything in Monthly plan',
        'Priority support',
        'Advanced analytics',
        'Custom reports',
        'Up to 5 users'
      ],
      popular: true,
      recommended: true,
      icon: <FaBuilding className="text-green-600" />
    },
    // Hospital — 3,000/month, 25,000/year
    {
      id: 'hospital_monthly',
      name: 'Hospital Monthly',
      price: 3450, // 3000 + 15% VAT
      currency: 'ETB',
      interval: 'month',
      originalPrice: 3450,
      description: 'For hospitals and comprehensive medical facilities',
      features: [
        'Full medication knowledge base',
        'Patient management system',
        'Clinical decision support',
        'Drug interaction checking',
        'Team management',
        'Up to 10 users'
      ],
      recommended: false,
      icon: <FaBuilding className="text-green-500" />
    },
    {
      id: 'hospital_yearly',
      name: 'Hospital Yearly',
      price: 28750, // 25000 + 15% VAT
      currency: 'ETB',
      interval: 'year',
      originalPrice: 41400,
      description: 'Best value for hospitals',
      features: [
        'Everything in Monthly plan',
        'Dedicated support',
        'Advanced reporting',
        'Bulk operations',
        'Up to 10 users'
      ],
      popular: true,
      recommended: true,
      icon: <FaBuilding className="text-green-600" />
    },
    // Pharmacy School — 3,000/month, 25,000/year
    {
      id: 'pharmacy_school_monthly',
      name: 'Pharmacy School Monthly',
      price: 3450, // 3000 + 15% VAT
      currency: 'ETB',
      interval: 'month',
      originalPrice: 3450,
      description: 'For pharmacy schools and academic institutions',
      features: [
        'Full medication knowledge base',
        'Clinical decision support',
        'Minor illness management',
        'Compounding resources',
        'Team & student management',
        'Up to 10 users'
      ],
      recommended: false,
      icon: <FaBuilding className="text-orange-500" />
    },
    {
      id: 'pharmacy_school_yearly',
      name: 'Pharmacy School Yearly',
      price: 28750, // 25000 + 15% VAT
      currency: 'ETB',
      interval: 'year',
      originalPrice: 41400,
      description: 'Best value for pharmacy schools',
      features: [
        'Everything in Monthly plan',
        'Dedicated support',
        'Advanced reporting',
        'Early access to new features',
        'Up to 10 users'
      ],
      popular: true,
      recommended: true,
      icon: <FaBuilding className="text-orange-600" />
    },
    // Other Company — 900/month, 9,000/year
    {
      id: 'other_company_monthly',
      name: 'Other Company Monthly',
      price: 1035, // 900 + 15% VAT
      currency: 'ETB',
      interval: 'month',
      originalPrice: 1035,
      description: 'For pharmaceutical companies, distributors, and health organizations',
      features: [
        'Full medication knowledge base',
        'Patient management system',
        'Clinical decision support',
        'Drug interaction checking',
        'Medication availability checks',
        'Up to 3 users'
      ],
      recommended: false,
      icon: <FaBuilding className="text-purple-500" />
    },
    {
      id: 'other_company_yearly',
      name: 'Other Company Yearly',
      price: 10350, // 9000 + 15% VAT
      currency: 'ETB',
      interval: 'year',
      originalPrice: 12420,
      description: 'Best value for other healthcare companies',
      features: [
        'Everything in Monthly plan',
        'Priority support',
        'Advanced analytics',
        'Custom reports',
        'Up to 5 users'
      ],
      popular: true,
      recommended: true,
      icon: <FaBuilding className="text-purple-600" />
    }
  ];

  // Filter by selected facility type
  const getPlans = () => {
    return ALL_PLANS.filter(p => p.id === `${facilityType}_monthly` || p.id === `${facilityType}_yearly`);
  };
  const plans = getPlans();

  // Handle Chapa payment for renewal or new registration
  const handleChapaPayment = async () => {
    if (!selectedPlan) {
      setError('Please select a subscription plan');
      return;
    }

    const plan = ALL_PLANS.find(p => p.id === selectedPlan);
    if (!plan) {
      setError('Selected plan not found. Please refresh the page and try again.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setIsProcessingPayment(true);

    try {
      const activeUser = localStorage.getItem('user');
      const registeredUser = localStorage.getItem('registered_user');

      let userData = null;
      if (activeUser) {
        userData = JSON.parse(activeUser);
      } else if (registeredUser) {
        userData = JSON.parse(registeredUser);
      }

      if (!userData) {
        throw new Error('User data not found. Please log in again.');
      }

      // Create Chapa payment request
      const chapaData = {
        planId: selectedPlan,
        userEmail: userData.email,
        userName: userData.full_name || userData.name || userData.email,
        userPhone: userData.phone || '+251900000000',
        userId: userData.id || userData._id || userData.userId,
        account_type: userData.account_type || (userData.role === 'company_admin' ? 'company' : 'individual'),
        frontendUrl: window.location.origin
      };

      const data = await api.post('/chapa/create-payment', chapaData);

      if (!data.success) {
        throw new Error(data.error || 'Payment initialization failed');
      }

      // Save transaction reference
      if (data.tx_ref) {
        localStorage.setItem('chapa_tx_ref', data.tx_ref);
      }

      const dynamicPricing = getDynamicPricing(plan, country);

      // Save pending subscription info
      const pendingSubscription = {
        planId: selectedPlan,
        planName: plan.name,
        amount: dynamicPricing.amount,
        currency: dynamicPricing.currency,
        userEmail: userData.email,
        tx_ref: data.tx_ref
      };

      localStorage.setItem('pending_subscription', JSON.stringify(pendingSubscription));

      // Redirect to Chapa payment page
      if (data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        throw new Error('No payment URL received from server');
      }

    } catch (err) {
      setError(err.message || 'Failed to initiate payment. Please try again.');
    } finally {
      setLoading(false);
      setIsProcessingPayment(false);
    }
  };

  const handlePayment = async () => {
    await handleChapaPayment();
  };

  const scrollToPlans = () => {
    const el = document.getElementById('plan-selection-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // If user is not logged in and didn't just register, prompt login/signup
  if (!isRegistered && !localStorage.getItem('token') && !localStorage.getItem('user')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaLock className="text-green-500 text-3xl" />
            </div>

            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Registration or Login Required
            </h1>

            <p className="text-gray-600 mb-6">
              Please login or complete registration first before managing your subscription.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-gradient-to-r from-green-600 to-green-600 text-white font-medium py-3 px-6 rounded-xl transition hover:from-green-700 hover:to-green-700 shadow-md"
              >
                Login to Manage Subscription
              </button>

              <button
                onClick={() => navigate('/signup')}
                className="w-full bg-gray-100 text-gray-700 font-medium py-3 px-6 rounded-xl transition hover:bg-gray-200"
              >
                New User? Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-blue-50/20 py-6 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* ── CURRENT SUBSCRIPTION STATUS CARD (For existing / logged-in users) ── */}
        {isExistingUser && (
          <div className="mb-8 bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-fadeIn">
            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs uppercase font-extrabold tracking-wider text-gray-400">
                      Account Subscription
                    </span>
                    {refreshingStatus && (
                      <span className="text-[11px] text-green-600 flex items-center gap-1 font-semibold">
                        <FaSpinner className="animate-spin text-xs" /> Syncing status...
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-gray-900 flex items-center gap-3">
                    {user?.full_name || user?.name || user?.institution || user?.email}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {user?.institution ? `${user.institution} • ` : ''}
                    {user?.account_type === 'company' || user?.role === 'company_admin' ? 'Company Account' : 'Individual Account'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {isSubActive ? (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-sm shadow-sm">
                      <FaCheckCircle className="text-emerald-500 text-base" />
                      <span>Active Subscription</span>
                    </div>
                  ) : isSubExpired ? (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 font-bold text-sm shadow-sm">
                      <FaTimesCircle className="text-rose-500 text-base" />
                      <span>Subscription Expired</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 font-bold text-sm shadow-sm">
                      <FaExclamationCircle className="text-amber-500 text-base" />
                      <span>Subscription Inactive</span>
                    </div>
                  )}

                  <button
                    onClick={scrollToPlans}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-sm shadow-md transition transform hover:-translate-y-0.5"
                  >
                    <FaCreditCard className="text-sm" />
                    {isSubActive ? 'Renew / Extend Early' : 'Renew Subscription Now'}
                  </button>
                </div>
              </div>

              {/* Status Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
                {/* 1. Remaining Days */}
                <div className={`p-4 rounded-2xl border transition ${
                  isSubActive
                    ? 'bg-emerald-50/50 border-emerald-100'
                    : isSubExpired
                    ? 'bg-rose-50/50 border-rose-100'
                    : 'bg-amber-50/50 border-amber-100'
                }`}>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <FaClock className="text-xs opacity-60" /> Remaining Time
                  </p>
                  <p className={`text-2xl md:text-3xl font-black ${
                    isSubActive ? 'text-emerald-700' : isSubExpired ? 'text-rose-600' : 'text-amber-600'
                  }`}>
                    {daysRemaining !== null ? (
                      daysRemaining > 0 ? `${daysRemaining} Days` : 'Expired (0 Days)'
                    ) : (
                      isSubActive ? 'Active' : 'No Active Plan'
                    )}
                  </p>
                  {daysRemaining !== null && daysRemaining > 0 && (
                    <div className="mt-2 h-1.5 w-full bg-emerald-200/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(5, (daysRemaining / 365) * 100))}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* 2. Current Plan */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Current Plan</p>
                  <p className="text-lg font-extrabold text-gray-900 truncate">
                    {user?.subscription_plan
                      ? user.subscription_plan.replace(/_/g, ' ').toUpperCase()
                      : (isSubActive ? 'Custom Active' : 'None')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {user?.subscription_plan?.includes('yearly') ? 'Billed annually' : 'Billed monthly'}
                  </p>
                </div>

                {/* 3. Expiration Date */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <FaCalendarAlt className="text-xs opacity-60" /> Valid Until
                  </p>
                  <p className="text-lg font-extrabold text-gray-900 truncate">
                    {user?.subscription_end_date && !isNaN(new Date(user.subscription_end_date).getTime())
                      ? new Date(user.subscription_end_date).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })
                      : 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {isSubExpired
                      ? 'Expired — renewal needed'
                      : isSubActive
                      ? 'Access fully active'
                      : 'Please choose a plan'}
                  </p>
                </div>

                {/* 4. Renewal Action */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-200 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-bold text-green-900 uppercase tracking-wider mb-1">Direct Renewal</p>
                    <p className="text-xs text-gray-700 leading-snug">
                      {isSubActive
                        ? 'Extend your current plan early without losing any remaining days.'
                        : 'Reactivate your subscription instantly with Chapa — no signup required.'}
                    </p>
                  </div>
                  <button
                    onClick={scrollToPlans}
                    className="mt-3 text-xs font-extrabold text-green-700 hover:text-green-900 underline flex items-center gap-1 self-start"
                  >
                    Select Plan to Renew <FaArrowRight className="text-[10px]" />
                  </button>
                </div>
              </div>

              {/* Notice for Inactive or Expired users */}
              {!isSubActive && (
                <div className="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                  <FaExclamationCircle className="text-amber-500 text-lg mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-bold text-amber-900 text-sm">
                      Subscription Expired or Inactive — Immediate Renewal Available
                    </h4>
                    <p className="text-xs text-amber-800 mt-0.5">
                      Your subscription has ended. Choose your plan below and proceed directly to payment.
                      You <strong>do not need to sign up again</strong> — your account, patient records, and history remain intact.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── HEADER ── */}
        <div id="plan-selection-section" className="text-center mb-8 md:mb-12">
          {!isExistingUser && (
            <div className="inline-flex items-center gap-2 md:gap-3 bg-white rounded-full px-4 md:px-6 py-2 md:py-3 shadow-sm mb-4">
              <FaUserCheck className="text-green-500 text-sm md:text-base" />
              <span className="font-medium text-gray-700 text-xs md:text-sm">Registration Complete</span>
              <span className="text-[10px] md:text-xs bg-green-100 text-green-800 px-2 py-0.5 md:py-1 rounded-full">
                Step 2 of 3
              </span>
            </div>
          )}

          <h1 className="text-2xl md:text-4xl font-black text-gray-900 mb-2 md:mb-3">
            {isExistingUser ? 'Renew or Upgrade Your Subscription' : 'Choose Your Subscription Plan'}
          </h1>
          <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
            {isExistingUser
              ? 'Select your facility type and plan to renew. Your subscription will be extended immediately upon payment.'
              : 'Select your facility type and billing interval to activate full access.'}
          </p>

          {/* Facility Type Selector */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {[
              { id: 'individual', label: 'Individual' },
              { id: 'pharmacy', label: 'Pharmacy / Drug Store' },
              { id: 'clinic', label: 'Clinic / Specialty Center' },
              { id: 'health_center', label: 'Health Center' },
              { id: 'hospital', label: 'Hospital' },
              { id: 'pharmacy_school', label: 'Pharmacy School' },
              { id: 'other_company', label: 'Other Company' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => { setFacilityType(f.id); setSelectedPlan(''); }}
                className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold transition-all ${
                  facilityType === f.id
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md transform scale-105'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-green-400 hover:bg-green-50/50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── PLAN SELECTION CARDS ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-3xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl cursor-pointer ${
                selectedPlan === plan.id
                  ? 'ring-4 ring-green-500 ring-offset-2 transform scale-[1.02] border-2 border-green-500'
                  : 'border border-gray-100'
              } ${plan.popular ? 'border-2 border-green-500' : ''}`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-center py-2 text-xs font-black tracking-widest uppercase">
                  ⭐ MOST POPULAR & BEST VALUE
                </div>
              )}

              <div className="p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-green-50 rounded-2xl text-2xl">
                      {plan.icon}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xl md:text-2xl font-black text-gray-900">{plan.name}</h3>
                      <p className="text-xs md:text-sm text-gray-500">{plan.description}</p>
                    </div>
                  </div>

                  {plan.popular && (
                    <span className="bg-green-100 text-green-800 text-[10px] md:text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      RECOMMENDED
                    </span>
                  )}
                </div>

                <div className="mb-6 p-4 rounded-2xl bg-gray-50/80 border border-gray-100">
                  {(() => {
                    const pricing = getDynamicPricing(plan, country);
                    return (
                      <>
                        {pricing.showVat && (
                          <div className="text-xs text-gray-500 font-medium mb-1">
                            Base: {pricing.currency} {pricing.baseAmount.toLocaleString()} + {pricing.vatAmount.toLocaleString()} (15% VAT)
                          </div>
                        )}
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl md:text-4xl font-black text-gray-900">
                            {pricing.currency} {pricing.amount.toLocaleString()}
                          </span>
                          <span className="text-sm font-semibold text-gray-500">/{plan.interval}</span>
                        </div>
                        {pricing.originalAmount && pricing.originalAmount > pricing.amount && (
                          <div className="flex items-center mt-2">
                            <span className="text-xs text-gray-400 line-through mr-2">
                              {pricing.currency} {pricing.originalAmount.toLocaleString()}
                            </span>
                            <span className="text-xs text-green-700 font-bold bg-green-100 px-2 py-0.5 rounded-full">
                              Save {pricing.currency} {(pricing.originalAmount - pricing.amount).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                <div className="mb-8">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-4">Included Features:</h4>
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <FaCheck className="text-green-500 mt-1 mr-3 flex-shrink-0 text-sm" />
                        <span className="text-sm text-gray-700 font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  className={`w-full py-3.5 px-4 rounded-2xl font-bold transition-all text-sm md:text-base ${
                    selectedPlan === plan.id
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-600/30'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlan(plan.id);
                  }}
                >
                  {selectedPlan === plan.id ? '✓ Plan Selected' : 'Choose This Plan'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ── ORDER SUMMARY & PAYMENT ── */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden mb-8">
          <div className="p-6 md:p-8">
            <h2 className="text-2xl font-black text-gray-900 mb-6">
              {isExistingUser ? 'Renewal Order Summary' : 'Order Summary'}
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Payment Method */}
              <div>
                <h3 className="text-base font-extrabold text-gray-900 mb-4 uppercase tracking-wider">Payment Method</h3>
                <div className="space-y-4">
                  {/* Chapa Payment */}
                  <div className="border-2 border-green-500 bg-green-50/50 rounded-2xl p-5">
                    <div className="flex items-center">
                      <div className="w-5 h-5 rounded-full border mr-3 flex items-center justify-center border-green-500 bg-green-500">
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      </div>
                      <FaCreditCard className="text-green-600 text-lg mr-2" />
                      <span className="font-bold text-gray-900">Chapa Payment Gateway (Online)</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-2 ml-8 leading-relaxed">
                      Pay securely with Telebirr, CBE Birr, Awash, or debit cards via Chapa.
                    </p>
                    <div className="mt-3 ml-8 p-3 bg-white/80 border border-green-200 rounded-xl text-xs font-semibold text-green-800 flex items-center gap-2">
                      <FaUserShield className="text-green-600 text-sm shrink-0" />
                      <span>Instant processing & secure encryption</span>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <FaExclamationCircle className="text-blue-500 text-base mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold text-blue-900 text-xs">Renewal Information</p>
                        <p className="text-xs text-blue-800 mt-1 leading-relaxed">
                          {isExistingUser
                            ? 'Your account is already active. Upon completing payment on Chapa, your subscription validity is immediately extended without needing to sign up again.'
                            : 'After payment, your subscription will be activated so you can start using all clinical pharmacy features immediately.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Order Details */}
              <div>
                <h3 className="text-base font-extrabold text-gray-900 mb-4 uppercase tracking-wider">Order Details</h3>

                {selectedPlan ? (
                  <>
                    <div className="bg-gray-50 rounded-2xl p-6 mb-6 border border-gray-100">
                      <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-200">
                        <div>
                          <h4 className="font-black text-gray-900 text-lg">
                            {ALL_PLANS.find(p => p.id === selectedPlan)?.name}
                          </h4>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {ALL_PLANS.find(p => p.id === selectedPlan)?.description}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-2xl font-black text-green-700">
                            ETB {ALL_PLANS.find(p => p.id === selectedPlan)?.price.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500 font-semibold">
                            per {ALL_PLANS.find(p => p.id === selectedPlan)?.interval} (incl. 15% VAT)
                          </div>
                        </div>
                      </div>

                      <ul className="space-y-3 text-xs md:text-sm text-gray-700">
                        <li className="flex items-center gap-2">
                          <FaUserCheck className="text-green-600" />
                          <span>
                            Account: <strong>{user?.email || 'Logged in user'}</strong>
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <FaCreditCard className="text-green-600" />
                          <span>Payment Method: <strong>Chapa Gateway</strong></span>
                        </li>
                        {isExistingUser && (
                          <li className="flex items-center gap-2">
                            <FaSync className="text-blue-600" />
                            <span>Mode: <strong className="text-blue-700">Subscription Renewal / Extension</strong></span>
                          </li>
                        )}
                        {accountType === 'company' && (
                          <li className="flex items-center gap-2">
                            <FaBuilding className="text-green-600" />
                            <span>Type: <strong>Company Subscription Plan</strong></span>
                          </li>
                        )}
                      </ul>
                    </div>

                    <div className="text-center">
                      <p className="text-xs text-gray-500 flex items-center justify-center gap-2">
                        <FaHeadset className="text-gray-400" />
                        Questions about your subscription? <a href="mailto:support@addis-med.com" className="text-green-600 font-bold hover:underline">Contact Support</a>
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <FaMoneyBillWave className="text-gray-300 text-4xl mx-auto mb-3" />
                    <p className="text-sm font-bold text-gray-500">Please choose a plan above to see details</p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Button */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
                  <FaTimes className="text-red-500 shrink-0" />
                  <span className="text-red-700 text-sm font-semibold">{error}</span>
                </div>
              )}

              {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3">
                  <FaCheck className="text-green-500 shrink-0" />
                  <span className="text-green-700 text-sm font-semibold">{success}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handlePayment}
                disabled={!selectedPlan || loading || isProcessingPayment}
                className={`w-full py-4 px-6 rounded-2xl font-black text-base md:text-lg transition-all shadow-lg ${
                  !selectedPlan || loading || isProcessingPayment
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white hover:from-green-700 hover:to-teal-700 shadow-green-600/30 transform hover:-translate-y-0.5'
                }`}
              >
                {loading || isProcessingPayment ? (
                  <span className="flex items-center justify-center gap-2">
                    <FaSpinner className="animate-spin text-lg" />
                    <span>Processing Payment with Chapa...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <FaCreditCard />
                    <span>
                      {isExistingUser ? 'Renew Subscription with Chapa' : 'Pay with Chapa and Activate Account'}
                    </span>
                    <FaArrowRight className="text-sm ml-1" />
                  </span>
                )}
              </button>

              <p className="text-xs text-gray-400 text-center mt-3 font-medium">
                🔒 Secure encrypted payment processed directly via Chapa Gateway
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SubscriptionPlans;
