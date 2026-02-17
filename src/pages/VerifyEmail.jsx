import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaSpinner, FaEnvelope } from 'react-icons/fa';
import api from '../utils/api';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('');
    const [alreadyVerified, setAlreadyVerified] = useState(false);

    useEffect(() => {
        const verifyEmail = async () => {
            const token = searchParams.get('token');

            if (!token) {
                setStatus('error');
                setMessage('Invalid verification link. No token provided.');
                return;
            }

            try {
                const data = await api.post('/auth/verify-email', { token });

                if (data.success) {
                    setStatus('success');
                    setMessage(data.message || 'Email verified successfully!');
                    setAlreadyVerified(data.already_verified || false);

                    // Redirect to login after 3 seconds
                    setTimeout(() => {
                        navigate('/login');
                    }, 3000);
                } else {
                    setStatus('error');
                    setMessage(data.error || 'Verification failed');
                }
            } catch (error) {
                setStatus('error');
                setMessage(error.error || error.message || 'Verification failed. Please try again.');
            }
        };

        verifyEmail();
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-3xl shadow-2xl p-8">
                    <div className="text-center">
                        {status === 'verifying' && (
                            <>
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
                                    <FaSpinner className="text-blue-600 text-4xl animate-spin" />
                                </div>
                                <h1 className="text-2xl font-bold text-gray-800 mb-3">
                                    Verifying Your Email
                                </h1>
                                <p className="text-gray-600">
                                    Please wait while we verify your email address...
                                </p>
                            </>
                        )}

                        {status === 'success' && (
                            <>
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                                    <FaCheckCircle className="text-green-600 text-4xl" />
                                </div>
                                <h1 className="text-2xl font-bold text-gray-800 mb-3">
                                    {alreadyVerified ? 'Already Verified!' : 'Email Verified!'}
                                </h1>
                                <p className="text-gray-600 mb-6">
                                    {message}
                                </p>
                                {!alreadyVerified && (
                                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
                                        <p className="text-blue-800 text-sm">
                                            {message.includes('pending') ? (
                                                <><strong>Next Step:</strong> Your account is pending admin approval. You'll receive an email notification once approved.</>
                                            ) : (
                                                <><strong>Success!</strong> You can now log in to your account.</>
                                            )}
                                        </p>
                                    </div>
                                )}
                                <p className="text-gray-500 text-sm mb-4">
                                    Redirecting to login page in 3 seconds...
                                </p>
                                <Link
                                    to="/login"
                                    className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-8 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg"
                                >
                                    Go to Login Now
                                </Link>
                            </>
                        )}

                        {status === 'error' && (
                            <>
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
                                    <FaTimesCircle className="text-red-600 text-4xl" />
                                </div>
                                <h1 className="text-2xl font-bold text-gray-800 mb-3">
                                    Verification Failed
                                </h1>
                                <p className="text-red-600 mb-6">
                                    {message}
                                </p>
                                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6">
                                    <div className="flex items-start gap-3">
                                        <FaEnvelope className="text-yellow-600 mt-1 flex-shrink-0" />
                                        <div className="text-left">
                                            <p className="text-yellow-800 font-semibold mb-1">
                                                Need a new verification link?
                                            </p>
                                            <p className="text-yellow-700 text-sm">
                                                Go to the login page and click "Resend Verification Email" if you need a new link.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <Link
                                        to="/login"
                                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-8 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg"
                                    >
                                        Go to Login
                                    </Link>
                                    <Link
                                        to="/signup"
                                        className="bg-gray-200 text-gray-800 font-semibold py-3 px-8 rounded-xl hover:bg-gray-300 transition-all duration-300"
                                    >
                                        Back to Signup
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
