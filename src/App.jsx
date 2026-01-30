import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Layout Components
import Navbar from "./components/Common/Navbar";
import Sidebar from "./components/Common/Sidebar";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminDashboard from "./pages/AdminDashboard";
import CompanyDashboard from "./pages/CompanyAdminDashboard";
import PatientList from "./pages/PatientList";
import PatientDetails from "./pages/PatientDetails";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import CDSSAnalysisPage from './pages/CDSSAnalysisPage';
import LabSettingsPage from './pages/LabSettingsPage';
import CompanyPerformanceReport from './pages/CompanyPerformanceReport';
import AdminUsefulLinks from './pages/AdminUsefulLinks';
import UsefulLinks from './pages/UsefulLinks';
import MedicationAvailability from './pages/MedicationAvailability';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Subscription Pages
import SubscriptionPlans from "./pages/SubscriptionPlans";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";

// Knowledge Base Components
import MedicationInfo from "./components/KnowledgeBase/MedicationInfo";
import HomeRemedies from "./components/KnowledgeBase/HomeRemedies";
import MinorIllnesses from "./components/KnowledgeBase/MinorIllnesses";
import ExtemporaneousPrep from "./components/KnowledgeBase/ExtemporaneousPrep";

// Knowledge Base Layout
import KnowledgeBaseLayout from "./components/KnowledgeBase/KnowledgeBaseLayout";

// CDSS Components (ADMIN ONLY)
import ClinicalRulesAdmin from "./components/CDSS/ClinicalRulesAdmin";

// Use import.meta.env for Vite
const API_URL = import.meta.env.VITE_API_URL;
import api from './utils/api';
import { clearInvalidAuth, hasValidSubscription, getUserStorageKey } from './utils/authUtils';

// Loading Component
const LoadingSpinner = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-3 text-gray-600">Loading...</p>
        </div>
    </div>
);

// Main Layout Wrapper
const MainLayout = ({ children, showSidebar = true, showNavbar = true }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (

        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Navbar */}
            {showNavbar && <Navbar onMenuClick={() => setSidebarOpen(true)} />}

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && showSidebar && (
                <div
                    className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <div className="flex flex-1">
                {/* Sidebar */}
                {showSidebar && (
                    <>
                        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                            } md:relative md:translate-x-0 border-r border-gray-200`}>
                            <Sidebar onClose={() => setSidebarOpen(false)} />
                        </div>
                    </>
                )}

                {/* Main Content Area */}
                <div className="flex-1">
                    <main className="p-4 md:p-6 min-h-screen">
                        <div className="w-full">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

// Root Redirector Component - FIXED: Proper role-based redirects
const RootRedirector = () => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = localStorage.getItem('token');
            const userData = localStorage.getItem('user');

            if (!token || !userData) {
                setLoading(false);
                return;
            }

            // Check if token is expired
            const tokenExpiry = localStorage.getItem('token_expiry');
            if (tokenExpiry && Date.now() > parseInt(tokenExpiry)) {
                clearInvalidAuth();
                setLoading(false);
                return;
            }

            // Wait a moment to ensure component renders before redirect
            setTimeout(() => {
                setLoading(false);
            }, 100);

        } catch (error) {
            console.error('Auth check error:', error);
            clearInvalidAuth();
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    // Check what dashboard to redirect to
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
        try {
            const user = JSON.parse(userData);

            // FIXED: Check user role and redirect accordingly
            switch (user.role) {
                case 'admin':
                    return <Navigate to="/admin/dashboard" replace />;
                case 'company_admin':
                    return <Navigate to="/company/dashboard" replace />;
                case 'pharmacist':
                    return <Navigate to="/dashboard" replace />;
                default:
                    return <Navigate to="/dashboard" replace />;
            }
        } catch (error) {
            console.error('Error parsing user data:', error);
            return <Navigate to="/login" replace />;
        }
    }

    // Not authenticated, go to signup
    return <Navigate to="/signup" replace />;
};

// Public Route Component - Allows access without authentication
const PublicRoute = ({ children }) => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Quick check without API call
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (token && userData) {
            // Check if token is expired
            const tokenExpiry = localStorage.getItem('token_expiry');
            if (tokenExpiry && Date.now() > parseInt(tokenExpiry)) {
                clearInvalidAuth();
            }
        }

        setLoading(false);
    }, []);

    if (loading) {
        return <LoadingSpinner />;
    }

    return children;
};

// Protected Route Component - UPDATED: Removed automatic subscription redirect
const ProtectedRoute = ({ children, adminOnly = false, companyAdminOnly = false, requireSubscription = false, showLayout = true }) => {
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const location = useLocation();

    useEffect(() => {
        checkAuth();
    }, [location]);

    const checkAuth = async () => {
        try {
            const token = localStorage.getItem('token');
            const userData = localStorage.getItem('user');

            if (!token || !userData) {
                clearInvalidAuth();
                setLoading(false);
                return;
            }

            // Verify token and fetch FRESH user data from backend
            let freshUser = null;
            try {
                const data = await api.get('/auth/me');
                if (data.success && data.user) {
                    freshUser = data.user;
                    // Update storage with fresh data (latest subscription status, etc.)
                    localStorage.setItem('user', JSON.stringify(freshUser));
                    localStorage.setItem('subscription_status', freshUser.subscription_status || 'inactive');
                    if (freshUser.subscription_end_date) {
                        localStorage.setItem('subscription_end_date', freshUser.subscription_end_date);
                    }
                    setUser(freshUser);
                    setIsAuthenticated(true);
                } else {
                    console.warn('ProtectedRoute: /auth/me returned no user');
                    // Fallback to local data if we have it and it's a temp network error
                    freshUser = JSON.parse(userData);
                    setUser(freshUser);
                }
            } catch (error) {
                console.log('ProtectedRoute: Backend check failed, using cached data');
                freshUser = JSON.parse(userData);
                setUser(freshUser);
                setIsAuthenticated(true);
            }

            if (!freshUser) {
                clearInvalidAuth();
                setLoading(false);
                return;
            }

            // Check if user is approved (except admin)
            if (!freshUser.approved && freshUser.role !== 'admin') {
                setLoading(false);
                return;
            }

            // ONLY check subscription if explicitly required
            if (requireSubscription) {
                const hasSubscription = hasValidSubscription(freshUser);
                if (!hasSubscription) {
                    localStorage.setItem('subscription_required_for', location.pathname);
                    setLoading(false);
                    return;
                }
            }

        } catch (error) {
            console.error('Auth check error in ProtectedRoute:', error);
            // Don't clear auth immediately on network errors, only on 401/403 which api.get handles
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!isAuthenticated) {
        // If user exists but not approved, show error and redirect to login
        if (user && !user.approved && user.role !== 'admin') {
            return <Navigate to="/login" state={{
                message: 'Your account is pending admin approval. Please wait for approval.'
            }} replace />;
        }

        // FIXED: Check if subscription is required for this specific route
        if (user && requireSubscription && !hasValidSubscription(user)) {
            // Store current route to return after subscription
            const subscriptionRequiredFor = localStorage.getItem('subscription_required_for') || location.pathname;

            return <Navigate to="/subscription/plans" state={{
                returnTo: subscriptionRequiredFor,
                message: 'Subscription required to access this feature'
            }} replace />;
        }

        // Otherwise, redirect to login
        return <Navigate to="/login" state={{
            redirectTo: location.pathname,
            message: 'Please login to access this page'
        }} replace />;
    }

    // FIXED: Check role-based access with clearer logic
    if (adminOnly) {
        // Only admin users can access
        if (user?.role !== 'admin') {
            // Redirect non-admin users based on their role
            if (user?.role === 'company_admin') {
                return <Navigate to="/company/dashboard" replace />;
            } else {
                return <Navigate to="/dashboard" replace />;
            }
        }
    }

    if (companyAdminOnly) {
        // Only company admin users can access
        if (user?.role !== 'company_admin') {
            // Redirect non-company-admin users based on their role
            if (user?.role === 'admin') {
                return <Navigate to="/admin/dashboard" replace />;
            } else {
                return <Navigate to="/dashboard" replace />;
            }
        }
    }

    // For admin dashboard, don't show the main layout
    if (adminOnly && user?.role === 'admin') {
        return <AdminLayout>{children}</AdminLayout>;
    }

    // For company admin dashboard
    if (companyAdminOnly && user?.role === 'company_admin') {
        return <MainLayout>{children}</MainLayout>;
    }

    // For admin routes (including CDSS), use AdminLayout
    if (user?.role === 'admin' && location.pathname.startsWith('/admin/')) {
        return <AdminLayout>{children}</AdminLayout>;
    }

    // For regular users, show the main layout if specified
    if (showLayout) {
        return <MainLayout>{children}</MainLayout>;
    }

    return children;
};

// Simple Layout (for login/signup)
const SimpleLayout = ({ children }) => (
    <div className="min-h-screen bg-gray-50">
        {children}
    </div>
);

// Subscription Layout
const SubscriptionLayout = ({ children }) => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        {children}
    </div>
);

// Admin Layout - Updated to match your AdminDashboard
const AdminLayout = ({ children }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
            {children}
        </div>
    );
};

// Dashboard Component - FIXED: Don't auto-redirect admin users
const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showSubscriptionBanner, setShowSubscriptionBanner] = useState(false);
    const [userPatients, setUserPatients] = useState([]);
    const [patientStats, setPatientStats] = useState({
        total: 0,
        today: 0,
        active: 0
    });
    const navigate = useNavigate();

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            // 1. Initial load from localStorage for speed
            const userData = localStorage.getItem('user');
            if (userData) {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);

                // Check if we need to show banner initially
                if (parsedUser.role !== 'admin' && !hasValidSubscription(parsedUser)) {
                    setShowSubscriptionBanner(true);
                }
            }

            // 2. Fetch fresh data from backend to ensure status is current
            if (localStorage.getItem('token')) {
                const authData = await api.get('/auth/me');
                if (authData.success && authData.user) {
                    const freshUser = authData.user;
                    setUser(freshUser);
                    localStorage.setItem('user', JSON.stringify(freshUser));

                    // Update individual flags too
                    localStorage.setItem('subscription_status', freshUser.subscription_status || 'inactive');
                    localStorage.setItem('subscription_end_date', freshUser.subscription_end_date || '');
                    localStorage.setItem('has_subscription', freshUser.subscription_status === 'active' ? 'true' : 'false');

                    // Re-calculate banner
                    if (freshUser.role !== 'admin') {
                        setShowSubscriptionBanner(!hasValidSubscription(freshUser));
                    }

                    // Reload patients with fresh data
                    if (freshUser.role === 'admin' || hasValidSubscription(freshUser)) {
                        await loadUserPatients(freshUser);
                    }
                    return; // Exit early as we've handled everything
                }
            }

            // Fallback: If no network or no fresh data, use what we have
            const currentCachedUser = JSON.parse(localStorage.getItem('user'));
            if (currentCachedUser) {
                if (currentCachedUser.role === 'admin' || hasValidSubscription(currentCachedUser)) {
                    await loadUserPatients(currentCachedUser);
                }
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadUserPatients = async (currentUser) => {
        try {
            // Fetch user's own patients from backend
            const data = await api.get('/patients/my-patients');

            if (data.success && data.patients) {
                // Store in user-specific localStorage
                const storageKey = getUserStorageKey('user_patients', currentUser);
                localStorage.setItem(storageKey, JSON.stringify(data.patients));

                setUserPatients(data.patients);

                // Calculate stats
                const today = new Date().toISOString().split('T')[0];
                const todayPatients = data.patients.filter(p =>
                    p.created_at && new Date(p.created_at).toISOString().split('T')[0] === today
                ).length;

                setPatientStats({
                    total: data.patients.length,
                    today: todayPatients,
                    active: data.patients.filter(p => p.status === 'active' || p.is_active).length
                });
            } else {
                throw new Error('Failed to load patients');
            }
        } catch (error) {
            console.error('Error loading patients, falling back to storage:', error);
            // Fallback to localStorage
            const storageKey = getUserStorageKey('user_patients', currentUser);
            const storedPatients = localStorage.getItem(storageKey);
            if (storedPatients) {
                const patients = JSON.parse(storedPatients);
                setUserPatients(patients);
                setPatientStats({
                    total: patients.length,
                    today: 0,
                    active: patients.filter(p => p.status === 'active' || p.is_active).length
                });
            }
        }
    };

    const handleGetSubscription = () => {
        navigate('/subscription/plans', {
            state: {
                returnTo: '/dashboard',
                user: user,
                message: 'Choose a subscription plan to unlock all features'
            }
        });
    };

    const handleDismissBanner = () => {
        setShowSubscriptionBanner(false);
    };

    const handleCreateNewPatient = () => {
        navigate('/patients/new', {
            state: {
                user: user,
                returnTo: '/dashboard'
            }
        });
    };

    const handleViewAllPatients = () => {
        navigate('/patients');
    };

    const handleViewPatient = (patientId) => {
        navigate(`/patients/${patientId}`);
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    // If user is admin, show a special message instead of regular dashboard
    if (user?.role === 'admin') {
        return (
            <div className="p-6">
                <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                    <div className="mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">Welcome, System Administrator</h2>
                        <p className="text-gray-600 mt-2">
                            You are logged in as an administrator. Please use the admin dashboard for system management.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                        <button
                            onClick={() => navigate('/admin/dashboard')}
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition shadow-md"
                        >
                            Go to Admin Dashboard
                        </button>
                        <button
                            onClick={() => {
                                localStorage.clear();
                                window.location.href = '/login';
                            }}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-lg transition"
                        >
                            Logout
                        </button>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <p className="text-sm text-gray-500">
                            Admin users have access to system management, user approvals, and CDSS configuration.
                            Regular dashboard features are available to standard users.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Dashboard</h1>
                    <p className="text-gray-600 mt-1">
                        Welcome back, {user?.full_name || user?.email || 'User'}!
                    </p>
                </div>
                {!hasValidSubscription(user) && user?.role !== 'admin' && user?.account_type !== 'company_user' && (
                    <button
                        onClick={handleGetSubscription}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition shadow-md"
                    >
                        Get Subscription
                    </button>
                )}
            </div>

            {/* Subscription Banner */}
            {showSubscriptionBanner && user?.account_type !== 'company_user' && (
                <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg animate-fadeIn">
                    <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3">
                            <div className="bg-yellow-100 p-2 rounded-lg">
                                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-yellow-800">Upgrade Your Account</h3>
                                <p className="text-yellow-700 text-sm mt-1">
                                    Get access to all features including Patient Management, Knowledge Base, and Clinical Decision Support
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleGetSubscription}
                                className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-medium py-2 px-4 rounded-lg transition text-sm"
                            >
                                View Plans
                            </button>
                            <button
                                onClick={handleDismissBanner}
                                className="text-yellow-700 hover:text-yellow-800 text-sm font-medium"
                            >
                                Maybe Later
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {user && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* User Info Card */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Account Information</h3>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-600">Email</p>
                                <p className="font-medium">{user.email}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Role</p>
                                <p className="font-medium capitalize">{user.role?.replace('_', ' ')}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">User ID</p>
                                <p className="font-mono text-sm text-gray-700">{user.id || user._id || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Approval Status</p>
                                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${user.approved
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {user.approved ? '✓ Approved' : '⏳ Pending Approval'}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Subscription Status</p>
                                <div className="flex items-center gap-2">
                                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${hasValidSubscription(user)
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800 font-bold'
                                        }`}>
                                        {hasValidSubscription(user)
                                            ? '✓ Active'
                                            : (user.subscription_end_date && !isNaN(new Date(user.subscription_end_date)) && new Date(user.subscription_end_date) < new Date()
                                                ? '❌ Subscription Expired'
                                                : (user.account_type === 'company_user' ? '❌ Inactive (Contact Admin)' : '❌ Inactive'))
                                        }
                                    </div>
                                    {user?.account_type !== 'company_user' && (
                                        <button
                                            onClick={handleGetSubscription}
                                            className="text-blue-600 hover:text-blue-800 text-sm font-semibold underline transition"
                                        >
                                            Renew Now
                                        </button>
                                    )}
                                </div>
                                {user.subscription_end_date && (
                                    <div className={`mt-2 p-3 rounded-lg border ${new Date(user.subscription_end_date) < new Date()
                                        ? 'bg-red-50 border-red-100'
                                        : 'bg-gray-50 border-gray-100'
                                        }`}>
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="text-xs text-gray-500 uppercase font-semibold">Time Remaining</p>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${new Date(user.subscription_end_date) < new Date()
                                                ? 'bg-red-500 text-white'
                                                : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {(() => {
                                                    const diff = new Date(user.subscription_end_date) - new Date();
                                                    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                                                    return days > 0 ? `${days} days` : 'Expired';
                                                })()}
                                            </span>
                                        </div>
                                        <p className={`text-sm ${new Date(user.subscription_end_date) < new Date() ? 'text-red-700 font-medium' : 'text-gray-700'}`}>
                                            Valid until: {new Date(user.subscription_end_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Patient Stats Card - LOCKED if no subscription */}
                    <div className={`bg-white rounded-xl shadow-lg p-6 relative ${!hasValidSubscription(user) && user.role !== 'admin' ? 'opacity-75 grayscale' : ''}`}>
                        {!hasValidSubscription(user) && user.role !== 'admin' && (
                            <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] z-10 rounded-xl flex items-center justify-center">
                                <div className="bg-white/90 p-4 rounded-lg shadow-xl border border-blue-100 text-center mx-4">
                                    <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 text-blue-600">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <h4 className="font-bold text-gray-800 text-sm">Feature Locked</h4>
                                    <p className="text-xs text-gray-600 mb-2">Subscribe to manage patients</p>
                                    <button
                                        onClick={handleGetSubscription}
                                        className="text-xs font-bold text-blue-600 hover:underline"
                                    >
                                        Unlock Now
                                    </button>
                                </div>
                            </div>
                        )}
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Patients</h3>
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                            {userPatients.length > 0 ? (
                                userPatients.slice(0, 5).map((patient, index) => (
                                    <div
                                        key={index}
                                        onClick={() => handleViewPatient(patient.id || patient._id)}
                                        className="p-3 bg-gray-50 hover:bg-blue-50 rounded-lg cursor-pointer transition border border-gray-100"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-medium text-gray-800">
                                                    {patient.full_name || patient.name || `Patient ${patient.patientCode || index + 1}`}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {patient.patient_code || patient.patientCode || 'No Code'}
                                                </p>
                                            </div>
                                            <div className={`px-2 py-1 rounded text-xs font-medium ${patient.is_active || patient.status === 'active'
                                                ? 'bg-green-100 text-green-800'
                                                : patient.status === 'pending'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {patient.is_active ? 'active' : patient.status || 'unknown'}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-gray-500">No patients yet</p>
                                    <button
                                        onClick={handleCreateNewPatient}
                                        className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                                    >
                                        Create your first patient
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions Card - LOCKED if no subscription */}
                    <div className={`bg-white rounded-xl shadow-lg p-6 relative ${!hasValidSubscription(user) && user.role !== 'admin' ? 'opacity-75 grayscale' : ''}`}>
                        {!hasValidSubscription(user) && user.role !== 'admin' && (
                            <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] z-10 rounded-xl flex items-center justify-center">
                                <div className="bg-white/90 p-4 rounded-lg shadow-xl border border-blue-100 text-center mx-4">
                                    <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 text-blue-600">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <h4 className="font-bold text-gray-800 text-sm">Feature Locked</h4>
                                    <p className="text-xs text-gray-600 mb-2">Subscribe to access quick actions</p>
                                    <button
                                        onClick={handleGetSubscription}
                                        className="text-xs font-bold text-blue-600 hover:underline"
                                    >
                                        Unlock Now
                                    </button>
                                </div>
                            </div>
                        )}
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>
                        <div className="space-y-3">
                            <button
                                onClick={() => navigate('/patients')}
                                className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                            >
                                <p className="font-medium text-blue-800">Manage Patients</p>
                                <p className="text-sm text-blue-600">View and manage your patient records</p>
                            </button>
                            <button
                                onClick={() => navigate('/knowledge')}
                                className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition"
                            >
                                <p className="font-medium text-green-800">Knowledge Base</p>
                                <p className="text-sm text-green-600">Access medical references</p>
                            </button>
                            <button
                                onClick={() => navigate('/settings')}
                                className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition"
                            >
                                <p className="font-medium text-purple-800">Settings</p>
                                <p className="text-sm text-purple-600">Account preferences</p>
                            </button>
                        </div>
                    </div>

                    {/* System Status Card - LOCKED if no subscription */}
                    <div className={`bg-white rounded-xl shadow-lg p-6 relative ${!hasValidSubscription(user) && user.role !== 'admin' ? 'opacity-75 grayscale' : ''}`}>
                        {!hasValidSubscription(user) && user.role !== 'admin' && (
                            <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] z-10 rounded-xl flex items-center justify-center">
                                <div className="bg-white/90 p-4 rounded-lg shadow-xl border border-blue-100 text-center mx-4">
                                    <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 text-blue-600">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <h4 className="font-bold text-gray-800 text-sm">Feature Locked</h4>
                                    <p className="text-xs text-gray-600 mb-2">Subscribe to view system status</p>
                                    <button
                                        onClick={handleGetSubscription}
                                        className="text-xs font-bold text-blue-600 hover:underline"
                                    >
                                        Unlock Now
                                    </button>
                                </div>
                            </div>
                        )}
                        <h3 className="text-lg font-bold text-gray-800 mb-4">System Status</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Database</span>
                                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                    Connected ✓
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">API Service</span>
                                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                    Active ✓
                                </span>
                            </div>
                            <div className="pt-4 border-t">
                                <p className="text-sm text-gray-600">Last Login</p>
                                <p className="font-medium">
                                    {new Date().toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Subscription Info Card */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Subscription</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Current Plan</span>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${hasValidSubscription(user)
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {hasValidSubscription(user) ? 'Premium' : 'Free'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Status</span>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${hasValidSubscription(user)
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {hasValidSubscription(user)
                                        ? 'Active'
                                        : (user.subscription_end_date && !isNaN(new Date(user.subscription_end_date)) && new Date(user.subscription_end_date) < new Date()
                                            ? 'Expired'
                                            : 'Inactive')
                                    }
                                </span>
                            </div>
                            <div className="pt-4">
                                {user?.account_type === 'company_user' ? (
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                        <p className="text-sm text-blue-700 font-medium text-center">
                                            Subscription managed by {user?.company_name || 'your company'}
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleGetSubscription}
                                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-lg transition shadow-md"
                                        >
                                            {hasValidSubscription(user) ? 'Manage Subscription' : 'Upgrade Now'}
                                        </button>
                                        {!hasValidSubscription(user) && (
                                            <p className="text-sm text-gray-600 mt-2 text-center">
                                                Unlock all features with a subscription
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

function App() {
    useEffect(() => {
        // Test API connection on app start
        api.get('/health')
            .then(data => console.log('API Health:', data))
            .catch(err => console.error('API Health check failed:', err));
    }, []);

    return (
        <Router>
            <Routes>
                {/* Root route */}
                <Route path="/" element={<RootRedirector />} />

                {/* Public Routes */}
                <Route
                    path="/login"
                    element={
                        <PublicRoute>
                            <SimpleLayout>
                                <Login />
                            </SimpleLayout>
                        </PublicRoute>
                    }
                />

                <Route
                    path="/signup"
                    element={
                        <PublicRoute>
                            <SimpleLayout>
                                <Signup />
                            </SimpleLayout>
                        </PublicRoute>
                    }
                />

                <Route
                    path="/forgot-password"
                    element={
                        <PublicRoute>
                            <SimpleLayout>
                                <ForgotPassword />
                            </SimpleLayout>
                        </PublicRoute>
                    }
                />

                <Route
                    path="/reset-password"
                    element={
                        <PublicRoute>
                            <SimpleLayout>
                                <ResetPassword />
                            </SimpleLayout>
                        </PublicRoute>
                    }
                />

                {/* Subscription Routes - PUBLIC ACCESS */}
                <Route
                    path="/subscription/plans"
                    element={
                        <PublicRoute>
                            <SubscriptionLayout>
                                <SubscriptionPlans />
                            </SubscriptionLayout>
                        </PublicRoute>
                    }
                />

                <Route
                    path="/subscription/success"
                    element={
                        <PublicRoute>
                            <SimpleLayout>
                                <SubscriptionSuccess />
                            </SimpleLayout>
                        </PublicRoute>
                    }
                />

                {/* Dashboard Routes - FIXED: Admin users cannot access regular dashboard */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute
                            adminOnly={false}
                            companyAdminOnly={false}
                            requireSubscription={false}
                        >
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                {/* Company Dashboard Route */}
                <Route
                    path="/company/dashboard"
                    element={
                        <ProtectedRoute companyAdminOnly={true} requireSubscription={false}>
                            <CompanyDashboard />
                        </ProtectedRoute>
                    }
                />

                {/* FIXED: Admin Dashboard Route - Only accessible by admin users */}
                <Route
                    path="/admin/dashboard"
                    element={
                        <ProtectedRoute adminOnly={true}>
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin/labs"
                    element={
                        <ProtectedRoute adminOnly={true}>
                            <LabSettingsPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin/useful-links"
                    element={
                        <ProtectedRoute adminOnly={true}>
                            <AdminUsefulLinks />
                        </ProtectedRoute>
                    }
                />

                {/* Admin CDSS Routes - ONLY for admin users */}
                <Route
                    path="/admin/cdss/rules"
                    element={
                        <ProtectedRoute adminOnly={true}>
                            <ClinicalRulesAdmin />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin/cdss/builder"
                    element={
                        <ProtectedRoute adminOnly={true}>
                            <AdminLayout>
                                <div className="p-6">
                                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Rule Builder - Coming Soon</h2>
                                    <p>This feature is under development.</p>
                                </div>
                            </AdminLayout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin/cdss/alerts"
                    element={
                        <ProtectedRoute adminOnly={true}>
                            <AdminLayout>
                                <div className="p-6">
                                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Alerts Dashboard - Coming Soon</h2>
                                    <p>This feature is under development.</p>
                                </div>
                            </AdminLayout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin/cdss/tools"
                    element={
                        <ProtectedRoute adminOnly={true}>
                            <AdminLayout>
                                <div className="p-6">
                                    <h2 className="text-2xl font-bold text-gray-800 mb-4">CDSS Tools - Coming Soon</h2>
                                    <p>This feature is under development.</p>
                                </div>
                            </AdminLayout>
                        </ProtectedRoute>
                    }
                />

                {/* Protected Routes for regular users - NO subscription requirement */}
                <Route
                    path="/home"
                    element={
                        <ProtectedRoute requireSubscription={true}>
                            <Home />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/cdss-analysis"
                    element={
                        <ProtectedRoute requireSubscription={true}>
                            <CDSSAnalysisPage />
                        </ProtectedRoute>
                    }
                />

                {/* Patient Routes - NO subscription requirement */}
                <Route
                    path="/patients"
                    element={
                        <ProtectedRoute requireSubscription={true}>
                            <PatientList />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/patients/new"
                    element={
                        <ProtectedRoute requireSubscription={true}>
                            <PatientDetails />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/patients/:patientCode"
                    element={
                        <ProtectedRoute requireSubscription={true}>
                            <PatientDetails />
                        </ProtectedRoute>
                    }
                />

                {/* Knowledge Base Routes - NO subscription requirement */}
                <Route
                    path="/knowledge"
                    element={
                        <ProtectedRoute requireSubscription={true}>
                            <KnowledgeBaseLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<Navigate to="medications" replace />} />
                    <Route path="medications" element={<MedicationInfo />} />
                    <Route path="remedies" element={<HomeRemedies />} />
                    <Route path="illnesses" element={<MinorIllnesses />} />
                    <Route path="compounding" element={<ExtemporaneousPrep />} />
                </Route>

                {/* Company Performance Report - Company Admin Only */}
                <Route
                    path="/company-performance"
                    element={
                        <ProtectedRoute requireSubscription={true} companyAdminOnly={true}>
                            <CompanyPerformanceReport />
                        </ProtectedRoute>
                    }
                />

                {/* Other Routes - NO subscription requirement */}
                <Route
                    path="/reports"
                    element={
                        <ProtectedRoute requireSubscription={true}>
                            <Reports />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/useful-links"
                    element={
                        <ProtectedRoute requireSubscription={true}>
                            <UsefulLinks />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/medication-availability"
                    element={
                        <ProtectedRoute requireSubscription={true}>
                            <MedicationAvailability />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/settings"
                    element={
                        <ProtectedRoute requireSubscription={false}>
                            <Settings />
                        </ProtectedRoute>
                    }
                />

                {/* Catch-all route */}
                <Route
                    path="*"
                    element={
                        <PublicRoute>
                            <Navigate to="/" replace />
                        </PublicRoute>
                    }
                />
            </Routes>
        </Router >
    );
}

export default App;