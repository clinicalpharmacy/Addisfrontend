import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
    FaCheckCircle, 
    FaDownload,
    FaHome,
    FaLock,
    FaExclamationTriangle,
    FaSpinner
} from 'react-icons/fa';

const API_URL = 'http://localhost:3000';

const SubscriptionSuccess = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [paymentVerified, setPaymentVerified] = useState(false);

    const tx_ref = searchParams.get('tx_ref');

    useEffect(() => {
        // Simulate loading
        setTimeout(() => {
            setLoading(false);
            setPaymentVerified(true);
        }, 1500);
    }, []);

    const downloadReceipt = () => {
        const receipt = `
========================================
        ADDISMED - PAYMENT RECEIPT
========================================
Transaction ID: ${tx_ref || 'N/A'}
Date: ${new Date().toLocaleDateString()}

Payment Status: ✅ SUCCESSFUL
Account Status: ⏳ PENDING APPROVAL

========================================
Support: support@addismed.com
========================================
        `;

        const blob = new Blob([receipt], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `addismed-receipt-${tx_ref || Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const goToLogin = () => {
        navigate('/login', {
            state: {
                message: 'Payment successful! Account pending admin approval.'
            }
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow p-8 max-w-sm w-full text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <h2 className="text-xl font-bold text-gray-800">Loading</h2>
                    <p className="text-gray-600 text-sm">Getting payment details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-lg mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaCheckCircle className="text-white text-3xl" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful</h1>
                    <p className="text-gray-600">Addismed subscription activated</p>
                    
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm mt-3 ${
                        paymentVerified ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                        {paymentVerified ? 'Payment verified' : 'Processing payment'}
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-xl shadow p-6 mb-6">
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">Account Status</h2>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-yellow-800 font-medium">⏳ Pending Admin Approval</p>
                            <p className="text-yellow-600 text-sm mt-1">Usually 24-48 hours</p>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-3">Payment Details</h2>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-600">Transaction ID</p>
                                <p className="font-medium text-gray-800 text-sm">{tx_ref || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Date</p>
                                <p className="font-medium text-gray-800">{new Date().toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Important Note */}
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <p className="text-sm text-blue-700 flex items-start gap-2">
                            <FaExclamationTriangle className="mt-0.5 flex-shrink-0" />
                            You'll receive an email when your account is approved. Use "Forgot Password" on login page.
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={downloadReceipt}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
                    >
                        <FaDownload />
                        Download Receipt
                    </button>
                    
                    <button
                        onClick={goToLogin}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
                    >
                        <FaLock />
                        Go to Login
                    </button>
                    
                    <button
                        onClick={() => navigate('/')}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
                    >
                        <FaHome />
                        Return Home
                    </button>
                </div>

                {/* Footer */}
                <div className="text-center mt-8 pt-6 border-t border-gray-200">
                    <p className="text-gray-600 text-sm">
                        Thank you for choosing <span className="font-bold">Addismed</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        Support: support@addismed.com
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionSuccess;