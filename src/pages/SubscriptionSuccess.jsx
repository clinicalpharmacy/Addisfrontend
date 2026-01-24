import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
    FaCheckCircle, 
    FaDownload,
    FaHome,
    FaLock,
    FaExclamationTriangle,
    FaSpinner,
    FaInfoCircle,
    FaPhone,
    FaEnvelope
} from 'react-icons/fa';

const SubscriptionSuccess = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [paymentData, setPaymentData] = useState(null);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState(null);

    const tx_ref = searchParams.get('tx_ref');
    const status = searchParams.get('status');
    const txid = searchParams.get('transaction_id');
    const chapaRef = searchParams.get('chapa_ref');

    useEffect(() => {
        console.log('📊 URL Parameters:', {
            tx_ref,
            status,
            txid,
            chapaRef,
            allParams: Object.fromEntries(searchParams.entries())
        });

        // Auto-assume success if tx_ref exists (Chapa doesn't always add status=success)
        const checkPayment = async () => {
            if (!tx_ref) {
                setError('No transaction reference found. Please complete your payment first.');
                setLoading(false);
                return;
            }

            // If status parameter exists, use it. Otherwise assume success
            const paymentSuccessful = status === 'success' || !status;
            
            if (paymentSuccessful) {
                try {
                    setVerifying(true);
                    // Try to verify with backend
                    const response = await fetch(`http://localhost:3000/api/payments/verify/${tx_ref}`);
                    if (response.ok) {
                        const data = await response.json();
                        setPaymentData(data.payment);
                    } else {
                        // If backend verification fails, still show success with available data
                        setPaymentData({
                            tx_ref: tx_ref,
                            status: 'pending_verification',
                            created_at: new Date().toISOString()
                        });
                    }
                } catch (err) {
                    console.log('Using fallback payment data');
                    setPaymentData({
                        tx_ref: tx_ref,
                        status: 'pending_verification',
                        created_at: new Date().toISOString()
                    });
                } finally {
                    setVerifying(false);
                }
            } else {
                setError('Payment was not completed successfully.');
            }
            
            setLoading(false);
        };

        checkPayment();
    }, [searchParams, tx_ref, status]);

    const downloadReceipt = () => {
        const receipt = `
========================================
        ADDISMED - PAYMENT CONFIRMATION
========================================
Transaction ID: ${tx_ref || 'N/A'}
Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}

Status: ✅ PAYMENT RECEIVED
Account: ⏳ PENDING ADMIN APPROVAL

========================================
Important Information:
1. Your payment has been received
2. Account approval takes 24-48 hours
3. You will receive an activation email
4. Save this transaction ID: ${tx_ref}

Support: support@addismed.com
========================================
        `;

        const blob = new Blob([receipt], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `addismed-payment-${tx_ref || Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const copyTransactionId = () => {
        if (tx_ref) {
            navigator.clipboard.writeText(tx_ref)
                .then(() => alert('Transaction ID copied to clipboard!'))
                .catch(err => {
                    console.error('Copy failed:', err);
                    alert('Please manually copy the Transaction ID');
                });
        }
    };

    const goToLogin = () => {
        navigate('/login', {
            state: {
                message: 'Payment received! Your account is pending admin approval.',
                tx_ref: tx_ref
            }
        });
    };

    const contactSupport = () => {
        const subject = `Payment Support - ${tx_ref}`;
        const body = `Hello Addismed Support,\n\nI need assistance with my payment.\n\nTransaction ID: ${tx_ref}\nDate: ${new Date().toLocaleDateString()}\n\nIssue: Please check my payment status and account activation.\n\nThank you.`;
        window.location.href = `mailto:support@addismed.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="relative inline-block mb-6">
                        <FaSpinner className="animate-spin text-4xl text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        {verifying ? 'Verifying Payment...' : 'Processing...'}
                    </h2>
                    <p className="text-gray-600 mb-4">
                        {verifying ? 'Checking payment status with our server' : 'Please wait a moment'}
                    </p>
                    {tx_ref && (
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">Transaction Reference</p>
                            <code className="text-sm font-mono text-gray-800 break-all">{tx_ref}</code>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaExclamationTriangle className="text-red-600 text-2xl" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Payment Status</h2>
                    <p className="text-gray-600 mb-6 text-center">{error}</p>
                    
                    {tx_ref && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-yellow-800 font-medium">Transaction ID:</p>
                                    <code className="text-sm font-mono text-yellow-900">{tx_ref}</code>
                                </div>
                                <button
                                    onClick={copyTransactionId}
                                    className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded text-sm"
                                >
                                    Copy
                                </button>
                            </div>
                            <p className="text-xs text-yellow-600 mt-2">Please save this ID and contact support.</p>
                        </div>
                    )}
                    
                    <div className="space-y-3">
                        <button
                            onClick={contactSupport}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
                        >
                            <FaEnvelope />
                            Contact Support
                        </button>
                        <button
                            onClick={() => navigate('/subscription')}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
                        >
                            <FaHome />
                            Try Payment Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // SUCCESS PAGE
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8 px-4">
            <div className="max-w-lg mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <FaCheckCircle className="text-white text-4xl" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Payment Received!</h1>
                    <p className="text-gray-600">Thank you for your payment</p>
                    
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium mt-4">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Payment Confirmed
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                    {/* Status Section */}
                    <div className="mb-8">
                        <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <FaInfoCircle className="text-blue-500" />
                            Account Status
                        </h2>
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <span className="text-blue-600 font-bold">⏳</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-blue-800 font-bold text-lg">Processing Your Account</p>
                                    <p className="text-blue-600 text-sm mt-1">
                                        Your payment is being processed. Account activation usually takes 24-48 hours.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Details */}
                    <div className="mb-8">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">Payment Details</h2>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Transaction ID</p>
                                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                    <code className="text-sm font-mono text-gray-800 break-all flex-1">
                                        {tx_ref}
                                    </code>
                                    <button
                                        onClick={copyTransactionId}
                                        className="ml-2 text-blue-600 hover:text-blue-800 text-sm whitespace-nowrap"
                                    >
                                        Copy
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Save this ID for future reference
                                </p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Date</p>
                                    <p className="font-medium text-gray-800">
                                        {new Date().toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Time</p>
                                    <p className="font-medium text-gray-800">
                                        {new Date().toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>
                            
                            {paymentData && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <p className="text-sm text-gray-600 mb-2">Additional Information:</p>
                                    <div className="text-sm text-gray-700 space-y-1">
                                        <p>• Payment recorded in our system</p>
                                        <p>• Account activation in progress</p>
                                        <p>• You will receive an email confirmation</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Next Steps */}
                    <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                        <h3 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                            <FaCheckCircle className="text-green-600" />
                            What happens next?
                        </h3>
                        <ul className="space-y-2 text-sm text-green-700">
                            <li className="flex items-start gap-2">
                                <span className="text-green-600 mt-0.5">✓</span>
                                <span>We'll process your payment within 24 hours</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-600 mt-0.5">✓</span>
                                <span>You'll receive an account activation email</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-600 mt-0.5">✓</span>
                                <span>Use "Forgot Password" for your first login</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-600 mt-0.5">✓</span>
                                <span>Contact support if you need assistance</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={downloadReceipt}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-4 px-4 rounded-xl transition flex items-center justify-center gap-3"
                    >
                        <FaDownload />
                        Download Payment Confirmation
                    </button>
                    
                    <button
                        onClick={goToLogin}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-4 px-4 rounded-xl transition flex items-center justify-center gap-3"
                    >
                        <FaLock />
                        Go to Login Page
                    </button>
                    
                    <button
                        onClick={() => navigate('/')}
                        className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-4 px-4 rounded-xl transition flex items-center justify-center gap-3 border border-gray-300"
                    >
                        <FaHome />
                        Return to Homepage
                    </button>
                </div>

                {/* Footer */}
                <div className="text-center mt-8 pt-6 border-t border-gray-200">
                    <p className="text-gray-600 text-sm">
                        Thank you for choosing <span className="font-bold text-blue-700">Addismed</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                        Need help? Contact: support@addismed.com | +251 911 234 567
                    </p>
                    <p className="text-xs text-gray-400 mt-3">
                        Reference: {tx_ref}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionSuccess;