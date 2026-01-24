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

// Helper function to clear invalid auth
const clearInvalidAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('account_type');
    localStorage.removeItem('token_expiry');
    localStorage.removeItem('has_subscription');
    localStorage.removeItem('subscription_status');
    localStorage.removeItem('user_patients'); // Clear cached patient data
};

// UPDATED: Simplified subscription check - Only check if explicitly required
const hasValidSubscription = (user) => {
    if (!user) return false;
    
    // Admin doesn't need subscription
    if (user.role === 'admin') return true;
    
    // Check subscription status from localStorage or user object
    const subscriptionStatus = localStorage.getItem('subscription_status');
    const hasSubscription = localStorage.getItem('has_subscription');
    
    console.log('Subscription check:', {
        userRole: user.role,
        subscriptionStatus,
        hasSubscription,
        user: user.email
    });
    
    // Return true if subscription is active
    const isActive = subscriptionStatus === 'active' || hasSubscription === 'true';
    console.log('Is subscription active?', isActive);
    return isActive;
};

// NEW: Function to get user-specific storage key
const getUserStorageKey = (key, user) => {
    if (!user || !user.email) return key;
    const userEmail = user.email.replace(/[^a-zA-Z0-9]/g, '_');
    return `${key}_${userEmail}`;
};

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
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            {showNavbar && <Navbar onMenuClick={() => setSidebarOpen(true)} />}
            
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && showSidebar && (
                <div 
                    className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            
            <div className="flex min-h-screen">
                {/* Sidebar */}
                {showSidebar && (
                    <>
                        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-300 ease-in-out ${
                            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                        } md:relative md:translate-x-0 border-r border-gray-200`}>
                            <Sidebar onClose={() => setSidebarOpen(false)} />
                        </div>
                    </>
                )}
                
                {/* Main Content Area */}
                <div className={`flex-1 ${showSidebar ? 'md:ml-64' : ''}`}>
                    <main className="p-4 md:p-6 min-h-screen">
                        <div className="max-w-7xl mx-auto">
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
            switch(user.role) {
                case 'admin':
                    // Admin users go to admin dashboard
                    console.log('RootRedirector: Admin user detected, redirecting to /admin/dashboard');
                    return <Navigate to="/admin/dashboard" replace />;
                case 'company_admin':
                    // Company admin users go to company dashboard
                    console.log('RootRedirector: Company admin detected, redirecting to /company/dashboard');
                    return <Navigate to="/company/dashboard" replace />;
                case 'pharmacist':
                    // Pharmacist users go to regular dashboard
                    console.log('RootRedirector: Pharmacist detected, redirecting to /dashboard');
                    return <Navigate to="/dashboard" replace />;
                default:
                    // All other roles go to regular dashboard
                    console.log('RootRedirector: Default user detected, redirecting to /dashboard');
                    return <Navigate to="/dashboard" replace />;
            }
        } catch (error) {
            console.error('Error parsing user data:', error);
            return <Navigate to="/login" replace />;
        }
    }
    
    // Not authenticated, go to signup
    console.log('RootRedirector: No auth, redirecting to /signup');
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

            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            
            console.log('ProtectedRoute: Checking auth for user:', parsedUser.email, 'Role:', parsedUser.role, 'Path:', location.pathname);
            
            // Check if token is expired
            const tokenExpiry = localStorage.getItem('token_expiry');
            if (tokenExpiry && Date.now() > parseInt(tokenExpiry)) {
                console.log('ProtectedRoute: Token expired');
                clearInvalidAuth();
                setLoading(false);
                return;
            }

            // Check if user is approved (except admin)
            if (!parsedUser.approved && parsedUser.role !== 'admin') {
                // User not approved, show error message
                console.log('ProtectedRoute: User not approved:', parsedUser.email);
                setLoading(false);
                return;
            }

            // FIXED: ONLY check subscription if explicitly required
            // Dashboard and other routes will handle subscription within their own components
            if (requireSubscription) {
                const hasSubscription = hasValidSubscription(parsedUser);
                console.log('ProtectedRoute subscription check:', {
                    route: location.pathname,
                    user: parsedUser.email,
                    hasSubscription: hasSubscription,
                    requireSubscription: requireSubscription
                });
                
                if (!hasSubscription) {
                    // Store that subscription is needed for this route
                    localStorage.setItem('subscription_required_for', location.pathname);
                    setLoading(false);
                    return;
                }
            }

            // CRITICAL FIX: Try to verify token with backend, but don't fail if network error
            try {
                const response = await fetch(`${API_URL}/auth/me`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                console.log('ProtectedRoute: /auth/me response status:', response.status);
                
                if (response.ok) {
                    setIsAuthenticated(true);
                } else {
                    // If /auth/me fails, try to parse the response for debugging
                    const text = await response.text();
                    console.error('ProtectedRoute: /auth/me failed:', response.status, text);
                    
                    // For admin users, we might still allow access even if /auth/me fails
                    // This prevents the redirect loop
                    if (parsedUser.role === 'admin') {
                        console.log('ProtectedRoute: Admin user, allowing access despite /auth/me failure');
                        setIsAuthenticated(true);
                    } else {
                        clearInvalidAuth();
                    }
                }
            } catch (error) {
                // If network error, use localStorage data (offline mode)
                console.log('ProtectedRoute: Network error, using localStorage data for authentication');
                console.log('Error details:', error.message);
                
                // CRITICAL: Allow access even if network fails to prevent redirect loops
                setIsAuthenticated(true);
            }
            
        } catch (error) {
            console.error('Auth check error:', error);
            clearInvalidAuth();
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!isAuthenticated) {
        console.log('ProtectedRoute: Not authenticated, redirecting to login');
        
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
            console.log('Subscription required for route:', subscriptionRequiredFor);
            
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
        console.log('ProtectedRoute: Checking admin access for user role:', user?.role);
        // Only admin users can access
        if (user?.role !== 'admin') {
            console.log('ProtectedRoute: User is not admin, redirecting based on role:', user?.role);
            // Redirect non-admin users based on their role
            if (user?.role === 'company_admin') {
                return <Navigate to="/company/dashboard" replace />;
            } else {
                return <Navigate to="/dashboard" replace />;
            }
        }
    }

    if (companyAdminOnly) {
        console.log('ProtectedRoute: Checking company admin access for user role:', user?.role);
        // Only company admin users can access
        if (user?.role !== 'company_admin') {
            console.log('ProtectedRoute: User is not company admin, redirecting based on role:', user?.role);
            // Redirect non-company-admin users based on their role
            if (user?.role === 'admin') {
                return <Navigate to="/admin/dashboard" replace />;
            } else {
                return <Navigate to="/dashboard" replace />;
            }
        }
    }

    console.log('ProtectedRoute: User authenticated, role:', user?.role, 'Path:', location.pathname);

    // For admin dashboard, don't show the main layout
    if (adminOnly && user?.role === 'admin') {
        console.log('ProtectedRoute: Rendering admin layout');
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
            const userData = localStorage.getItem('user');
            if (userData) {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
                
                // CRITICAL FIX: Don't redirect admin users from here!
                // If admin somehow reaches /dashboard, just show a message
                if (parsedUser.role === 'admin') {
                    console.log('Dashboard: Admin user on /dashboard - showing admin message');
                    // Don't redirect, just load data normally
                }
                
                // Load user-specific patients (only for non-admin users)
                await loadUserPatients(parsedUser);
                
                // Check subscription but don't redirect - just show a banner
                if (parsedUser.role !== 'admin') {
                    const hasSub = hasValidSubscription(parsedUser);
                    console.log('Dashboard subscription check:', {
                        user: parsedUser.email,
                        role: parsedUser.role,
                        hasSubscription: hasSub
                    });
                    
                    if (!hasSub) {
                        setShowSubscriptionBanner(true);
                    }
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
            const token = localStorage.getItem('token');
            if (!token) return;
            
            // Fetch user's own patients from backend
            const response = await fetch(`${API_URL}/patients/my-patients`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('Loaded user patients:', data);
                
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
                }
            } else {
                // Fallback to localStorage if API fails
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
        } catch (error) {
            console.error('Error loading patients:', error);
            // Fallback to localStorage
            const storageKey = getUserStorageKey('user_patients', user);
            const storedPatients = localStorage.getItem(storageKey);
            if (storedPatients) {
                const patients = JSON.parse(storedPatients);
                setUserPatients(patients);
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
                {!hasValidSubscription(user) && user?.role !== 'admin' && (
                    <button
                        onClick={handleGetSubscription}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition shadow-md"
                    >
                        Get Subscription
                    </button>
                )}
            </div>
            
            {/* Subscription Banner */}
            {showSubscriptionBanner && (
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
                                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                    user.approved 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {user.approved ? '✓ Approved' : '⏳ Pending Approval'}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Subscription Status</p>
                                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                    hasValidSubscription(user)
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {hasValidSubscription(user) ? '✓ Active' : '⚠️ Not Active'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Patient Stats Card */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-800">Your Patients</h3>
                            <button
                                onClick={handleCreateNewPatient}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded-lg transition text-sm"
                            >
                                + New Patient
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{patientStats.total}</div>
                                <div className="text-sm text-gray-600">Total</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{patientStats.active}</div>
                                <div className="text-sm text-gray-600">Active</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">{patientStats.today}</div>
                                <div className="text-sm text-gray-600">Today</div>
                            </div>
                        </div>
                        <button
                            onClick={handleViewAllPatients}
                            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition text-sm"
                        >
                            View All Patients
                        </button>
                    </div>

                    {/* Recent Patients Card */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
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
                                            <div className={`px-2 py-1 rounded text-xs font-medium ${
                                                patient.is_active || patient.status === 'active' 
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

                    {/* Quick Actions Card */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
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

                    {/* System Status Card */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
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
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    hasValidSubscription(user)
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-gray-100 text-gray-800'
                                }`}>
                                    {hasValidSubscription(user) ? 'Premium' : 'Free'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Status</span>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    hasValidSubscription(user)
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {hasValidSubscription(user) ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <div className="pt-4">
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
        // Test API connection on app start - without problematic headers
        fetch(`${API_URL}/health`)
            .then(res => res.json())
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
                        <ProtectedRoute requireSubscription={false}>
                            <Home />
                        </ProtectedRoute>
                    } 
                />
                
                {/* Patient Routes - NO subscription requirement */}
                <Route 
                    path="/patients" 
                    element={
                        <ProtectedRoute requireSubscription={false}>
                            <PatientList />
                        </ProtectedRoute>
                    } 
                />
                
                <Route 
                    path="/patients/new" 
                    element={
                        <ProtectedRoute requireSubscription={false}>
                            <PatientDetails />
                        </ProtectedRoute>
                    } 
                />
                
                <Route 
                    path="/patients/:patientCode" 
                    element={
                        <ProtectedRoute requireSubscription={false}>
                            <PatientDetails />
                        </ProtectedRoute>
                    } 
                />
                
                {/* Knowledge Base Routes - NO subscription requirement */}
                <Route 
                    path="/knowledge" 
                    element={
                        <ProtectedRoute requireSubscription={false}>
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
                
                {/* Other Routes - NO subscription requirement */}
                <Route 
                    path="/reports" 
                    element={
                        <ProtectedRoute requireSubscription={false}>
                            <Reports />
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
        </Router>
    );
}

export default App;