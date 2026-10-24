/**
 * Clinical Dosage Frequency Codes based on Eskender's specifications:
 * Code 1: Once daily or QD or every 24 hour (1 dose/day)
 * Code 2: Twice daily or BID or every 12 hours (2 doses/day)
 * Code 3: Three times per day or TID or every 8 hours (3 doses/day)
 * Code 4: Four times per day or QID or every 6 hours (4 doses/day)
 */
export const FREQUENCY_CODES = [
    {
        code: '1',
        value: '1',
        short: 'QD',
        label: '1 — Once daily (QD / Every 24 hours)',
        dosesPerDay: 1,
        hoursInterval: 24,
        description: 'Once daily or QD or every 24 hour'
    },
    {
        code: '2',
        value: '2',
        short: 'BID',
        label: '2 — Twice daily (BID / Every 12 hours)',
        dosesPerDay: 2,
        hoursInterval: 12,
        description: 'Twice daily or BID or every 12 hours'
    },
    {
        code: '3',
        value: '3',
        short: 'TID',
        label: '3 — Three times per day (TID / Every 8 hours)',
        dosesPerDay: 3,
        hoursInterval: 8,
        description: 'Three times per day or TID or every 8 hours'
    },
    {
        code: '4',
        value: '4',
        short: 'QID',
        label: '4 — Four times per day (QID / Every 6 hours)',
        dosesPerDay: 4,
        hoursInterval: 6,
        description: 'Four times per day or QID or every 6 hours'
    },
    {
        code: 'stat',
        value: 'Stat',
        short: 'STAT',
        label: 'Stat — Immediately (Single dose)',
        dosesPerDay: 1,
        hoursInterval: null,
        description: 'Immediately / single dose'
    },
    {
        code: 'prn',
        value: 'PRN',
        short: 'PRN',
        label: 'PRN — As needed',
        dosesPerDay: 1,
        hoursInterval: null,
        description: 'As needed'
    },
    {
        code: 'qod',
        value: 'QOD',
        short: 'QOD',
        label: 'QOD — Every other day',
        dosesPerDay: 0.5,
        hoursInterval: 48,
        description: 'Every other day'
    },
    {
        code: 'weekly',
        value: 'Weekly',
        short: 'Weekly',
        label: 'Weekly — Once a week',
        dosesPerDay: 0.14,
        hoursInterval: 168,
        description: 'Once weekly'
    }
];

/**
 * Normalizes any frequency string, number, or abbreviation into standard code & dosesPerDay
 */
export function normalizeFrequency(input) {
    if (!input) return { code: '1', label: '1 — Once daily (QD / Every 24 hours)', dosesPerDay: 1, hoursInterval: 24 };

    const str = String(input).trim().toLowerCase();

    // Check code 1: Once daily / QD / 24 hours / daily / 1
    if (str === '1' || str === 'qd' || str.includes('once') || str.includes('daily') || str.includes('24 hour') || str.includes('24h') || str.includes('q24h')) {
        return FREQUENCY_CODES[0];
    }

    // Check code 2: Twice daily / BID / 12 hours / 2
    if (str === '2' || str === 'bid' || str.includes('twice') || str.includes('12 hour') || str.includes('12h') || str.includes('q12h')) {
        return FREQUENCY_CODES[1];
    }

    // Check code 3: Three times per day / TID / 8 hours / 3
    if (str === '3' || str === 'tid' || str.includes('three times') || str.includes('8 hour') || str.includes('8h') || str.includes('q8h')) {
        return FREQUENCY_CODES[2];
    }

    // Check code 4: Four times per day / QID / 6 hours / 4
    if (str === '4' || str === 'qid' || str.includes('four times') || str.includes('6 hour') || str.includes('6h') || str.includes('q6h')) {
        return FREQUENCY_CODES[3];
    }

    if (str.includes('stat')) return FREQUENCY_CODES[4];
    if (str.includes('prn') || str.includes('needed')) return FREQUENCY_CODES[5];
    if (str.includes('other day') || str.includes('qod')) return FREQUENCY_CODES[6];
    if (str.includes('week')) return FREQUENCY_CODES[7];

    return { code: '1', label: String(input), dosesPerDay: 1, hoursInterval: 24 };
}
