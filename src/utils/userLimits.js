// src/utils/userLimits.js

/**
 * Maximum number of users allowed for a company based on type + plan.
 * Plan defaults to 'monthly' when missing/unknown.
 */
export const getMaxUsersForCompany = (companyType, plan) => {
    const type = (companyType || '').toLowerCase().trim();
    const normalizedPlan = (plan || 'monthly').toLowerCase().trim();
    const isYearly = normalizedPlan === 'yearly';

    const limits = {
        pharmacy:        { monthly: 3,  yearly: 5  },
        clinic:          { monthly: 3,  yearly: 5  },
        hospital:        { monthly: 10, yearly: 10 },
        pharmacy_school: { monthly: 10, yearly: 10 },
        other_company:   { monthly: 3,  yearly: 5  },
    };

    const typeLimits = limits[type];
    if (!typeLimits) return 0;

    return isYearly ? typeLimits.yearly : typeLimits.monthly;
};

/**
 * Returns limit state info for the UI + guard.
 */
export const checkUserLimit = ({ companyType, plan, currentUserCount }) => {
    const limit = getMaxUsersForCompany(companyType, plan);
    const current = Number(currentUserCount) || 0;
    const remaining = Math.max(limit - current, 0);
    const allowed = limit > 0 && current < limit;

    let message = '';
    if (limit === 0) {
        message = 'Your company type does not allow adding users. Please contact support.';
    } else if (!allowed) {
        message = `User limit reached: your ${plan || 'monthly'} ${companyType || 'company'} plan allows a maximum of ${limit} user(s).`;
    }

    return { allowed, limit, current, remaining, message };
};
