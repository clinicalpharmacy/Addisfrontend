export const clearInvalidAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('account_type');
    localStorage.removeItem('token_expiry');
    localStorage.removeItem('has_subscription');
    localStorage.removeItem('subscription_status');
    localStorage.removeItem('user_patients'); // Clear cached patient data
};

export const hasValidSubscription = (user) => {
    if (!user) return false;

    // Admin doesn't need subscription
    if (user.role === 'admin') return true;

    // Prioritize values from user object if they exist
    const subscriptionStatus = user.subscription_status || localStorage.getItem('subscription_status');
    const hasSubscription = user.has_subscription !== undefined ? String(user.has_subscription) : localStorage.getItem('has_subscription');
    const subscriptionEndDate = user.subscription_end_date || localStorage.getItem('subscription_end_date');

    const isActive = subscriptionStatus === 'active' || hasSubscription === 'true';

    if (!isActive) return false;

    // Check expiration if we have an end date
    if (subscriptionEndDate) {
        const expiryDate = new Date(subscriptionEndDate);
        const now = new Date();
        if (now > expiryDate) {
            return false;
        }
    }

    return true;
};

export const getUserStorageKey = (key, user) => {
    if (!user || !user.email) return key;
    const userEmail = user.email.replace(/[^a-zA-Z0-9]/g, '_');
    return `${key}_${userEmail}`;
};
