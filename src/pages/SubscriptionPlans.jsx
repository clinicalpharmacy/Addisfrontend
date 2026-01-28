import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaCheck, FaTimes, FaUserTie, FaBuilding, FaShieldAlt,
  FaHeadset, FaCalendarAlt, FaMoneyBillWave, FaCreditCard,
  FaBuilding as FaBuildingIcon, FaUsers,
  FaArrowRight,
  FaExclamationCircle,
  FaSpinner,
  FaLock,
  FaUserCheck
} from 'react-icons/fa';
import api from '../utils/api';

const SubscriptionPlans = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [accountType, setAccountType] = useState('individual');
  const [paymentMethod, setPaymentMethod] = useState('chapa');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);



  useEffect(() => {
    // Check if user has completed registration or is already logged in
    checkRegistrationStatus();
  }, [navigate]);

  const checkRegistrationStatus = () => {
    // 1. Check if user is already logged in (Renewal case)
    const activeUser = localStorage.getItem('user');
    if (activeUser) {
      try {
        const parsedUser = JSON.parse(activeUser);
        console.log('Active user renewing subscription:', parsedUser);
        setUser(parsedUser);
        setAccountType(parsedUser.account_type || (parsedUser.role === 'company_admin' ? 'company' : 'individual'));
        setIsRegistered(true);

        // If user is a company employee, they can't manage subscriptions
        if (parsedUser.account_type === 'company_user' || parsedUser.role === 'pharmacist' && parsedUser.company_id && parsedUser.role !== 'company_admin') {
          setError('Subscription is managed by your company administrator.');
          setTimeout(() => navigate('/dashboard'), 3000);
        }
        return;
      } catch (e) {
        console.error('Error parsing active user:', e);
      }
    }

    // 2. Check if user just registered (New registration case)
    const registeredUserData = localStorage.getItem('registered_user');

    if (registeredUserData) {
      try {
        const parsedRegisteredUser = JSON.parse(registeredUserData);
        console.log('Newly registered user:', parsedRegisteredUser);

        // Set user state
        setUser(parsedRegisteredUser);
        setAccountType(parsedRegisteredUser.account_type || 'individual');
        setIsRegistered(true);

        // If user is a company employee, they can't manage subscriptions
        if (parsedRegisteredUser.account_type === 'company_user') {
          setError('Subscription is managed by your company administrator.');
          setTimeout(() => navigate('/dashboard'), 3000);
          return;
        }

        // If user already paid, redirect to success
        if (parsedRegisteredUser.payment_status === 'paid') {
          navigate('/subscription/success');
        }
        return;
      } catch (e) {
        console.error('Error parsing registered user:', e);
      }
    }

    // If no user found at all, redirect to registration
    setError('Please complete registration first.');
    setTimeout(() => navigate('/signup'), 3000);
  };

  // Define plans based on account type
  // In SubscriptionPlans component, update the getPlans function:
  const getPlans = () => {
    if (accountType === 'individual') {
      return [
        {
          id: 'individual_monthly',
          name: 'Individual Monthly',
          price: 300,
          currency: 'ETB',
          interval: 'month',
          originalPrice: 300,
          description: 'Perfect for individual pharmacists',
          features: [
            'Full medication knowledge base',
            'Patient management system',
            'Clinical decision support',
            'Drug interaction checking',
            'Basic analytics',
            'Email support'
          ],
          recommended: false,
          icon: <FaUserTie className="text-blue-500" />
        },
        {
          id: 'individual_yearly',
          name: 'Individual Yearly',
          price: 3000,
          currency: 'ETB',
          interval: 'year',
          originalPrice: 3600,
          description: 'Best value for individuals',
          features: [
            'Everything in Monthly plan',
            'Priority support',
            'Advanced analytics',
            'Custom reports',
            'API access'
          ],
          popular: true,
          recommended: true,
          icon: <FaUserTie className="text-green-500" />
        }
      ];
    } else {
      return [
        {
          id: 'company_basic',
          name: 'Company Monthly',
          price: 3000,
          currency: 'ETB',
          interval: 'month',
          originalPrice: 3000,
          description: 'For small healthcare facilities',
          features: [
            'Everything in Individual plan',
            'Up to 5 users',
            'Centralized patient database',
            'Team management',
            'Company dashboard',
            'Multi-user access'
          ],
          recommended: false,
          icon: <FaBuilding className="text-blue-500" />
        },
        {
          id: 'company_pro',
          name: 'Company Yearly',
          price: 25000,
          currency: 'ETB',
          interval: 'year',
          originalPrice: 30000,
          description: 'For medium to large organizations',
          features: [
            'Everything in Company Basic',
            'Up to 20 users',
            'Custom user roles',
            'Advanced reporting',
            'Bulk operations',
            'Dedicated support'
          ],
          popular: true,
          recommended: true,
          icon: <FaBuilding className="text-purple-500" />
        }
      ];
    }
  };
  const plans = getPlans();

  // Handle Chapa payment for both new and existing users
  const handleChapaPayment = async () => {
    if (!selectedPlan) {
      setError('Please select a subscription plan');
      return;
    }

    const plan = plans.find(p => p.id === selectedPlan);
    if (!plan) {
      setError('Selected plan not found. Please refresh the page and try again.');
      return;
    }

    console.log('Starting Chapa payment for user:', plan);

    setLoading(true);
    setError('');
    setSuccess('');
    setIsProcessingPayment(true);

    try {
      // Try to get active user first, then registered user
      const activeUser = localStorage.getItem('user');
      const registeredUser = localStorage.getItem('registered_user');

      let userData = null;
      if (activeUser) {
        userData = JSON.parse(activeUser);
      } else if (registeredUser) {
        userData = JSON.parse(registeredUser);
      }

      if (!userData) {
        throw new Error('User data not found. Please register or login again.');
      }

      // Generate transaction reference
      const tx_ref = `PHARMA-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

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

      console.log('Chapa payment data:', chapaData);

      const data = await api.post('/chapa/create-payment', chapaData);
      console.log('Chapa payment response:', data);

      if (!data.success) {
        throw new Error(data.error || 'Payment initialization failed');
      }

      // Save transaction reference
      if (data.tx_ref) {
        localStorage.setItem('chapa_tx_ref', data.tx_ref);
      }

      // Save pending subscription info
      const pendingSubscription = {
        planId: selectedPlan,
        planName: plan.name,
        amount: plan.price,
        currency: plan.currency,
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
      console.error('Chapa payment error:', err);
      setError(err.message || 'Failed to initiate payment. Please try again.');
    } finally {
      setLoading(false);
      setIsProcessingPayment(false);
    }
  };

  const handlePayment = async () => {
    await handleChapaPayment();
  };

  if (!isRegistered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaLock className="text-blue-500 text-3xl" />
            </div>

            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Registration Required
            </h1>

            <p className="text-gray-600 mb-6">
              Please complete your registration first before selecting a subscription plan.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => navigate('/signup')}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-3 px-6 rounded-xl transition hover:from-blue-700 hover:to-purple-700"
              >
                Complete Registration
              </button>

              <button
                onClick={() => navigate('/login')}
                className="w-full bg-gray-100 text-gray-700 font-medium py-3 px-6 rounded-xl transition hover:bg-gray-200"
              >
                Already Registered? Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Registration Status */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 bg-white rounded-full px-6 py-3 shadow-sm mb-4">
            <FaUserCheck className="text-green-500" />
            <span className="font-medium text-gray-700">Registration Complete</span>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              Step 2 of 3
            </span>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Subscription Plan
          </h1>
          <p className="text-lg text-gray-600">
            Select the perfect plan for your {accountType === 'individual' ? 'individual' : 'company'} needs
          </p>
        </div>

        {/* Registration Info Banner */}
        <div className="mb-8 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-full">
                <FaUserCheck className="text-green-600 text-xl" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Registration Complete ✓</h3>
                <p className="text-gray-600">
                  Welcome {user?.name}! Now select your subscription to complete setup.
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Account Type</p>
              <p className="font-bold text-blue-600">
                {accountType === 'individual' ? 'Individual' : 'Company'}
              </p>
            </div>
          </div>
        </div>

        {/* Plan Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl ${selectedPlan === plan.id ? 'ring-2 ring-blue-500 ring-offset-2 transform scale-[1.02]' : ''
                } ${plan.popular ? 'border-2 border-blue-500' : 'border border-gray-200'}`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-center py-2">
                  <span className="font-bold">MOST POPULAR</span>
                </div>
              )}

              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      {plan.icon}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                      <p className="text-gray-600">{plan.description}</p>
                    </div>
                  </div>

                  {plan.popular && (
                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                      RECOMMENDED
                    </span>
                  )}
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-gray-900">ETB {plan.price}</span>
                    <span className="ml-2 text-gray-500">/{plan.interval}</span>
                  </div>
                  {plan.originalPrice && plan.originalPrice > plan.price && (
                    <div className="flex items-center mt-2">
                      <span className="text-gray-400 line-through mr-2">ETB {plan.originalPrice}</span>
                      <span className="text-green-600 font-semibold">
                        Save ETB {plan.originalPrice - plan.price}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mb-8">
                  <h4 className="font-semibold text-gray-900 mb-4">Features:</h4>
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <FaCheck className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${selectedPlan === plan.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {selectedPlan === plan.id ? '✓ Selected' : 'Select Plan'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Payment Method */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
                <div className="space-y-4">
                  {/* Chapa Payment - Only Option */}
                  <div className="border-2 border-blue-500 bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="w-5 h-5 rounded-full border mr-3 flex items-center justify-center border-blue-500 bg-blue-500">
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      </div>
                      <FaCreditCard className="text-blue-600 mr-2" />
                      <span className="font-medium">Chapa Payment (Recommended)</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 ml-8">
                      Pay securely online via Chapa payment gateway. After payment, wait for admin approval.
                    </p>
                    <div className="mt-3 ml-8 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                      <FaShieldAlt className="inline mr-2" />
                      Secure online payment - Account activation after admin approval
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <FaExclamationCircle className="text-yellow-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-800">Important Notice</p>
                        <p className="text-sm text-yellow-700 mt-1">
                          After successful payment, your account will be <strong>pending admin approval</strong>.
                          You will receive an email when your account is approved and ready to use.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Order Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h3>

                {selectedPlan ? (
                  <>
                    <div className="bg-gray-50 rounded-xl p-6 mb-6">
                      <div className="flex justify-between items-center mb-4 pb-4 border-b">
                        <div>
                          <h4 className="font-bold text-gray-900">
                            {plans.find(p => p.id === selectedPlan)?.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {plans.find(p => p.id === selectedPlan)?.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">
                            ETB {plans.find(p => p.id === selectedPlan)?.price}
                          </div>
                          <div className="text-sm text-gray-500">
                            per {plans.find(p => p.id === selectedPlan)?.interval}
                          </div>
                        </div>
                      </div>

                      <ul className="space-y-3">
                        <li className="flex items-start gap-2">
                          <FaUserCheck className="text-blue-600 mt-0.5" />
                          <span>
                            Registration Status: <strong className="text-green-600">Complete ✓</strong>
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <FaShieldAlt className="text-blue-600 mt-0.5" />
                          <span>
                            Payment Method: <strong>Chapa (Secure Online)</strong>
                          </span>
                        </li>
                        {accountType === 'company' && (
                          <li className="flex items-start gap-2">
                            <FaBuildingIcon className="text-green-600 mt-0.5" />
                            <span>Company subscription will be activated</span>
                          </li>
                        )}
                        <li className="flex items-start gap-2">
                          <FaExclamationCircle className="text-yellow-600 mt-0.5" />
                          <span>Admin approval required after payment</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <FaHeadset className="text-blue-600 mt-0.5" />
                          <span>Complete payment to proceed to admin approval</span>
                        </li>
                      </ul>
                    </div>

                    {/* Payment Process Info */}
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>Process:</strong> Payment → Success Page → Admin Approval → Login
                      </p>
                    </div>

                    {/* Support Info */}
                    <div className="text-center">
                      <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
                        <FaHeadset className="text-gray-400" />
                        Need help? <a href="mailto:support@pharmacare.com" className="text-blue-600 hover:underline">Contact Support</a>
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <FaMoneyBillWave className="text-gray-300 text-4xl mx-auto mb-4" />
                    <p className="text-gray-500">Select a plan to see order details</p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Button */}
            <div className="mt-8 pt-8 border-t">
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <FaTimes className="text-red-500 mr-2" />
                    <span className="text-red-700">{error}</span>
                  </div>
                </div>
              )}

              {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <FaCheck className="text-green-500 mr-2" />
                    <span className="text-green-700">{success}</span>
                  </div>
                </div>
              )}

              <button
                onClick={handlePayment}
                disabled={!selectedPlan || loading || isProcessingPayment}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-colors ${!selectedPlan || loading || isProcessingPayment
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                  }`}
              >
                {loading || isProcessingPayment ? (
                  <span className="flex items-center justify-center">
                    <FaSpinner className="animate-spin h-5 w-5 mr-3 text-white" />
                    Processing Payment...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <FaCreditCard className="mr-2" />
                    Pay with Chapa and Complete Setup
                    <FaArrowRight className="ml-2" />
                  </span>
                )}
              </button>

              <p className="text-sm text-gray-500 text-center mt-4">
                Secure payment powered by Chapa Payment Gateway
              </p>
            </div>
          </div>
        </div>

        {/* Process Steps */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="font-bold text-blue-600">1</span>
            </div>
            <h4 className="font-bold text-gray-800 mb-2">Registration</h4>
            <p className="text-sm text-gray-600">Complete your account setup</p>
            <div className="mt-3">
              <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                ✓ Complete
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="font-bold text-blue-600">2</span>
            </div>
            <h4 className="font-bold text-gray-800 mb-2">Subscription</h4>
            <p className="text-sm text-gray-600">Choose and pay for your plan</p>
            <div className="mt-3">
              <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                Current Step
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="font-bold text-gray-400">3</span>
            </div>
            <h4 className="font-bold text-gray-800 mb-2">Admin Approval</h4>
            <p className="text-sm text-gray-600">Wait for admin to approve account</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="font-bold text-gray-400">4</span>
            </div>
            <h4 className="font-bold text-gray-800 mb-2">Login & Access</h4>
            <p className="text-sm text-gray-600">Start using PharmaCare CDSS</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;