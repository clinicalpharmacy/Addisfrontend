import {
    FaBaby,
    FaBabyCarriage,
    FaChild,
    FaUser
} from 'react-icons/fa';

export const isValidDate = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date) && dateString !== '0000-00-00';
};

export const calculateAgeInDays = (dateOfBirth) => {
    if (!dateOfBirth || !isValidDate(dateOfBirth)) return '';
    try {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);

        const diffTime = today - birthDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        return diffDays.toString();
    } catch (error) {
        console.error('Error calculating age in days:', error);
        return '';
    }
};

export const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth || !isValidDate(dateOfBirth)) return '';
    try {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);

        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age.toString();
    } catch (error) {
        console.error('Error calculating age:', error);
        return '';
    }
};

export const pediatricAgeGroups = [
    { type: 'neonate', minDays: 0, maxDays: 28, label: 'Neonate (0-28 days)', icon: FaBaby },
    { type: 'infant', minDays: 29, maxDays: 365, label: 'Infant (29 days - 1 year)', icon: FaBabyCarriage },
    { type: 'child', minDays: 366, maxDays: 12 * 365, label: 'Child (1-12 years)', icon: FaChild },
    { type: 'adolescent', minDays: 13 * 365 + 1, maxDays: 18 * 365, label: 'Adolescent (13-18 years)', icon: FaUser },
    { type: 'adult', minDays: 18 * 365 + 1, maxDays: 99999, label: 'Adult (>18 years)', icon: FaUser }
];

export const determinePatientType = (ageInDays) => {
    if (!ageInDays || ageInDays === '' || isNaN(parseInt(ageInDays))) {
        return 'adult';
    }

    const days = parseInt(ageInDays);

    for (const group of pediatricAgeGroups) {
        if (days >= group.minDays && days <= group.maxDays) {
            return group.type;
        }
    }

    return 'adult';
};

export const formatAgeDisplay = (ageInDays, dateOfBirth) => {
    if (!dateOfBirth && !ageInDays) return '';

    let days = ageInDays;
    if (!days && dateOfBirth && isValidDate(dateOfBirth)) {
        days = calculateAgeInDays(dateOfBirth);
    }

    if (!days || isNaN(parseInt(days))) return '';

    const daysNum = parseInt(days);

    if (daysNum < 28) {
        return `${daysNum} days (Neonate)`;
    } else if (daysNum < 365) {
        const months = Math.floor(daysNum / 30.44);
        const remainingDays = Math.round(daysNum % 30.44);
        if (remainingDays > 0) {
            return `${months} months ${remainingDays} days (Infant)`;
        }
        return `${months} months (Infant)`;
    } else if (daysNum < 13 * 365) {
        const years = Math.floor(daysNum / 365);
        const months = Math.floor((daysNum % 365) / 30.44);
        if (months > 0) {
            return `${years} years ${months} months (Child)`;
        }
        return `${years} years (Child)`;
    } else if (daysNum < 19 * 365) {
        const years = Math.floor(daysNum / 365);
        return `${years} years (Adolescent)`;
    } else {
        const years = Math.floor(daysNum / 365);
        return `${years} years (Adult)`;
    }
};

export const calculateBMI = (weight, height) => {
    if (!weight || !height || parseFloat(height) <= 0) return '';
    const heightInMeters = parseFloat(height) / 100;
    const weightNum = parseFloat(weight);
    const bmi = weightNum / (heightInMeters * heightInMeters);
    return bmi.toFixed(1);
};

export const calculateTrimester = (weeks) => {
    if (!weeks) return '';
    const weekNum = parseInt(weeks);
    if (weekNum <= 13) return '1st Trimester';
    if (weekNum <= 27) return '2nd Trimester';
    return '3rd Trimester';
};

// Helper functions for cleaning inputs
export const cleanNumber = (value) => {
    if (value === null || value === undefined) return '';
    return value.toString().replace(/[^0-9.]/g, '');
};

export const cleanDate = (value) => {
    if (!value) return '';
    return value.split('T')[0];
};

export const cleanText = (value) => {
    if (!value) return '';
    return value.trim();
};

export const getPediatricNormalRange = (type, ageInDays) => {
    if (!ageInDays) return '';
    const days = parseInt(ageInDays);

    if (type === 'heart_rate') {
        if (days < 28) return '120-160 bpm';
        if (days < 365) return '100-140 bpm';
        if (days < 6 * 365) return '75-115 bpm';
        if (days < 12 * 365) return '70-110 bpm';
        if (days < 18 * 365) return '60-100 bpm';
        return '60-100 bpm';
    }

    if (type === 'respiratory_rate') {
        if (days < 28) return '40-60 breaths/min';
        if (days < 365) return '30-40 breaths/min';
        if (days < 6 * 365) return '20-30 breaths/min';
        if (days < 12 * 365) return '18-25 breaths/min';
        if (days < 18 * 365) return '12-20 breaths/min';
        return '12-20 breaths/min';
    }

    if (type === 'blood_pressure') {
        if (days < 28) return '65/45 mmHg';
        if (days < 365) return '80/55 mmHg';
        if (days < 6 * 365) return '95/60 mmHg';
        if (days < 12 * 365) return '105/65 mmHg';
        if (days < 18 * 365) return '110/70 mmHg';
        return '120/80 mmHg';
    }

    return '';
};
