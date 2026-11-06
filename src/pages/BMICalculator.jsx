import React, { useState } from 'react';
import {
    FaWeightHanging,
    FaRulerVertical,
    FaCalculator,
    FaInfoCircle,
    FaRedo,
    FaChild,
    FaUser
} from 'react-icons/fa';

// ---------------------------------------------------------------------------
// WHO 2007 LMS TABLE (5–19 years)
// ---------------------------------------------------------------------------
// ⚠️ IMPORTANT: The values below are a placeholder for demonstration.
// For clinical use you MUST replace this object with the full monthly LMS
// values from the WHO 2007 expanded tables (bmi-boys-z-who-2007-exp.xlsx and
// bmi-girls-z-who-2007-exp.xlsx). Those files contain one row per month
// (61–228 months) with columns: Month, L, M, S.
// ---------------------------------------------------------------------------
const WHO_LMS = {
    boys: {
        60:  { L: -1.5, M: 15.3, S: 0.08 },   // 5 y
        72:  { L: -1.55, M: 15.8, S: 0.085 }, // 6 y
        84:  { L: -1.6, M: 16.3, S: 0.09 },   // 7 y
        96:  { L: -1.65, M: 16.8, S: 0.095 }, // 8 y
        108: { L: -1.7, M: 17.3, S: 0.10 },   // 9 y
        120: { L: -1.75, M: 17.8, S: 0.105 }, // 10 y
        132: { L: -1.8, M: 18.3, S: 0.11 },   // 11 y
        144: { L: -1.85, M: 18.8, S: 0.115 }, // 12 y
        156: { L: -1.9, M: 19.4, S: 0.12 },   // 13 y
        168: { L: -1.92, M: 20.0, S: 0.125 }, // 14 y
        180: { L: -1.95, M: 20.6, S: 0.13 },  // 15 y
        192: { L: -1.97, M: 21.2, S: 0.135 }, // 16 y
        204: { L: -1.98, M: 21.8, S: 0.14 },  // 17 y
        216: { L: -1.99, M: 22.4, S: 0.145 }, // 18 y
        228: { L: -2.0, M: 23.0, S: 0.15 }    // 19 y
    },
    girls: {
        60:  { L: -1.4, M: 15.0, S: 0.09 },
        72:  { L: -1.45, M: 15.5, S: 0.095 },
        84:  { L: -1.5, M: 16.0, S: 0.10 },
        96:  { L: -1.55, M: 16.5, S: 0.105 },
        108: { L: -1.6, M: 17.0, S: 0.11 },
        120: { L: -1.65, M: 17.5, S: 0.115 },
        132: { L: -1.7, M: 18.0, S: 0.12 },
        144: { L: -1.75, M: 18.6, S: 0.125 },
        156: { L: -1.8, M: 19.2, S: 0.13 },
        168: { L: -1.85, M: 19.8, S: 0.135 },
        180: { L: -1.9, M: 20.4, S: 0.14 },
        192: { L: -1.95, M: 21.0, S: 0.145 },
        204: { L: -1.98, M: 21.6, S: 0.15 },
        216: { L: -2.0, M: 22.2, S: 0.155 },
        228: { L: -2.1, M: 22.8, S: 0.16 }
    }
};

// Helper: find the closest LMS row for a given age in months.
// (In production, use exact monthly rows or linear interpolation.)
const getLMS = (sex, ageMonths) => {
    const table = WHO_LMS[sex];
    const ages = Object.keys(table).map(Number).sort((a, b) => a - b);
    const closest = ages.reduce((prev, curr) =>
        Math.abs(curr - ageMonths) < Math.abs(prev - ageMonths) ? curr : prev
    );
    return table[closest];
};

// ---------------------------------------------------------------------------
// Helper: convert a z‑score to a BMI using the LMS formula
// BMI = M * (1 + L * S * z)^(1/L)
// ---------------------------------------------------------------------------
const bmiFromZ = (z, lms) => {
    if (Math.abs(lms.L) < 1e-10) {
        // L ≈ 0 → log-normal
        return lms.M * Math.exp(lms.S * z);
    }
    return lms.M * Math.pow(1 + lms.L * lms.S * z, 1 / lms.L);
};

const BMICalculator = () => {
    // ── Adult state (unchanged) ────────────────────────────────────────────
    const [input, setInput] = useState({ weight: '', height: '', result: null });

    // ── Child state ────────────────────────────────────────────────────────
    const [childInput, setChildInput] = useState({
        weight: '',
        height: '',
        ageYears: '',
        sex: 'male',
        result: null
    });

    // ── Mode toggle ────────────────────────────────────────────────────────
    const [mode, setMode] = useState('adult');

    const num = (v) => {
        const n = parseFloat(v);
        return Number.isFinite(n) && n > 0 ? n : null;
    };

    // =====================================================================
    // ADULT BMI  (original logic – unchanged)
    // =====================================================================
    const calculateBMI = (e) => {
        e.preventDefault();
        const w = num(input.weight);
        const h = num(input.height);
        if (!w || !h) {
            setInput((s) => ({
                ...s,
                result: { error: 'Please enter valid weight and height values.' }
            }));
            return;
        }
        const hM = h / 100;
        const bmi = w / (hM * hM);

        let category = 'Obesity';
        let categoryColor = 'text-red-600';
        let bgColor = 'bg-red-50 border-red-200';
        let message = null;

        if (bmi < 18.5) {
            category = 'Underweight';
            categoryColor = 'text-amber-600';
            bgColor = 'bg-amber-50 border-amber-200';
            const targetWeight = 18.5 * hM * hM;
            const gain = targetWeight - w;
            if (gain > 0)
                message = `ቢያንስ ${gain.toFixed(1)} kg ክብደት ይጨምሩ፣ የሰውነት ክብደት መረጃ ጠቋሚው 18.5 እስኪደርስ`;
        } else if (bmi < 25) {
            category = 'Normal range';
            categoryColor = 'text-green-600';
            bgColor = 'bg-green-50 border-green-200';
        } else if (bmi < 30) {
            category = 'Overweight';
            categoryColor = 'text-orange-600';
            bgColor = 'bg-orange-50 border-orange-200';
        }

        if (bmi >= 25) {
            const targetWeight = 25 * hM * hM;
            const loss = w - targetWeight;
            if (loss > 0)
                message = `ቢያንስ ${loss.toFixed(1)} kg ይቀንሱ፣ የሰውነት ክብደት መረጃ ጠቋሚው ከ25 በታች እስኪደርስ።`;
        }

        setInput((s) => ({
            ...s,
            result: {
                value: bmi.toFixed(1),
                unit: 'kg/m²',
                category,
                categoryColor,
                bgColor,
                message
            }
        }));
    };

    // =====================================================================
    // CHILD / ADOLESCENT BMI-FOR-AGE  (WHO 2007, 5–19 years)
    // =====================================================================
    const calculateChildBMI = (e) => {
        e.preventDefault();
        const w = num(childInput.weight);
        const h = num(childInput.height);
        const ageY = num(childInput.ageYears);

        if (!w || !h || !ageY) {
            setChildInput((s) => ({
                ...s,
                result: {
                    error:
                        'Please enter valid weight, height, and age (5–19 years).'
                }
            }));
            return;
        }

        const ageMonths = Math.round(ageY * 12);
        if (ageMonths < 61 || ageMonths > 228) {
            setChildInput((s) => ({
                ...s,
                result: {
                    error:
                        'This child BMI-for-age calculator is for ages 5–19 years (61–228 months).'
                }
            }));
            return;
        }

        const hM = h / 100;
        const bmi = w / (hM * hM);

        // ── Look up LMS parameters ────────────────────────────────────────
        const sex = childInput.sex === 'male' ? 'boys' : 'girls';
        const lms = getLMS(sex, ageMonths);

        // ── LMS z‑score ────────────────────────────────────────────────────
        let z;
        if (Math.abs(lms.L) < 1e-10) {
            z = Math.log(bmi / lms.M) / lms.S;
        } else {
            z = (Math.pow(bmi / lms.M, lms.L) - 1) / (lms.L * lms.S);
        }

        // ── WHO interpretation (5–19 y) ────────────────────────────────────
        // Overweight: > +1 SD
        // Obesity: > +2 SD
        // Thinness: < −2 SD
        // Severe thinness: < −3 SD
        let category;
        let categoryColor;
        let bgColor;
        let message = null;

        if (z > 2) {
            category = 'Obesity';
            categoryColor = 'text-red-600';
            bgColor = 'bg-red-50 border-red-200';
            // Target: reach the upper limit of normal (z = +1)
            const targetBmi = bmiFromZ(1, lms);
            const targetWeight = targetBmi * hM * hM;
            const loss = w - targetWeight;
            if (loss > 0) {
                message = `Lose at least ${loss.toFixed(1)} kg to reach a BMI-for-age z-score of +1 (overweight threshold).`;
            }
        } else if (z > 1) {
            category = 'Overweight';
            categoryColor = 'text-orange-600';
            bgColor = 'bg-orange-50 border-orange-200';
            const targetBmi = bmiFromZ(1, lms);
            const targetWeight = targetBmi * hM * hM;
            const loss = w - targetWeight;
            if (loss > 0) {
                message = `Lose at least ${loss.toFixed(1)} kg to reach a BMI-for-age z-score of +1 (normal range).`;
            }
        } else if (z < -3) {
            category = 'Severe thinness';
            categoryColor = 'text-amber-700';
            bgColor = 'bg-amber-50 border-amber-200';
            // Target: reach the thinness threshold (z = −2) which is the
            // lower bound of the normal range.
            const targetBmi = bmiFromZ(-2, lms);
            const targetWeight = targetBmi * hM * hM;
            const gain = targetWeight - w;
            if (gain > 0) {
                message = `Gain at least ${gain.toFixed(1)} kg to reach a BMI-for-age z-score of −2 (thinness threshold).`;
            }
        } else if (z < -2) {
            category = 'Thinness';
            categoryColor = 'text-amber-600';
            bgColor = 'bg-amber-50 border-amber-200';
            const targetBmi = bmiFromZ(-2, lms);
            const targetWeight = targetBmi * hM * hM;
            const gain = targetWeight - w;
            if (gain > 0) {
                message = `Gain at least ${gain.toFixed(1)} kg to reach a BMI-for-age z-score of −2 (normal range).`;
            }
        } else {
            category = 'Normal range';
            categoryColor = 'text-green-600';
            bgColor = 'bg-green-50 border-green-200';
        }

        setChildInput((s) => ({
            ...s,
            result: {
                value: bmi.toFixed(1),
                zScore: z.toFixed(2),
                unit: 'kg/m²',
                category,
                categoryColor,
                bgColor,
                message: `WHO 2007 BMI-for-age z-score: ${z.toFixed(2)}`,
                weightMessage: message
            }
        }));
    };

    // ── Reset handlers ─────────────────────────────────────────────────────
    const resetAdult = () =>
        setInput({ weight: '', height: '', result: null });

    const resetChild = () =>
        setChildInput({
            weight: '',
            height: '',
            ageYears: '',
            sex: 'male',
            result: null
        });

    // ── Rendering ──────────────────────────────────────────────────────────
    return (
        <div className="p-4 md:p-6 max-w-3xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    BMI Calculator
                </h1>
                <p className="text-gray-600 mt-1">
                    የሰውነት ክብደት መረጃ ጠቋሚ
                </p>
            </div>

            {/* ── Mode toggle ──────────────────────────────────────────────── */}
            <div className="flex gap-2 mb-6">
                <button
                    type="button"
                    onClick={() => setMode('adult')}
                    className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold rounded-xl border transition ${
                        mode === 'adult'
                            ? 'bg-green-600 text-white border-green-600'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-green-300'
                    }`}
                >
                    <FaUser /> Adult (≥ 20 years)
                </button>
                <button
                    type="button"
                    onClick={() => setMode('child')}
                    className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold rounded-xl border transition ${
                        mode === 'child'
                            ? 'bg-green-600 text-white border-green-600'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-green-300'
                    }`}
                >
                    <FaChild /> Child / Adolescent (5–19 years)
                </button>
            </div>

            {/* ============================================================ */}
            {/* ADULT FORM                                                   */}
            {/* ============================================================ */}
            {mode === 'adult' && (
                <form
                    onSubmit={calculateBMI}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                <FaWeightHanging className="text-green-600" />{' '}
                                Weight (kg)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={input.weight}
                                onChange={(e) =>
                                    setInput({
                                        ...input,
                                        weight: e.target.value
                                    })
                                }
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                placeholder="e.g. 70"
                            />
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                <FaRulerVertical className="text-green-600" />{' '}
                                Height (cm)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={input.height}
                                onChange={(e) =>
                                    setInput({
                                        ...input,
                                        height: e.target.value
                                    })
                                }
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                placeholder="e.g. 170"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 mt-6">
                        <button
                            type="submit"
                            className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl transition shadow-md"
                        >
                            <FaCalculator /> Calculate BMI
                        </button>
                        <button
                            type="button"
                            onClick={resetAdult}
                            className="inline-flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                        >
                            <FaRedo /> Reset
                        </button>
                    </div>

                    {input.result && input.result.error && (
                        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                            {input.result.error}
                        </div>
                    )}

                    {input.result && input.result.value && (
                        <div
                            className={`mt-6 p-6 rounded-2xl border ${input.result.bgColor}`}
                        >
                            <div className="text-center">
                                <p className="text-sm uppercase tracking-wider text-gray-600 font-semibold mb-1">
                                    Your BMI
                                </p>
                                <p className="text-5xl font-black text-gray-900">
                                    {input.result.value}
                                    <span className="text-xl font-semibold text-gray-500 ml-2">
                                        {input.result.unit}
                                    </span>
                                </p>
                                <p
                                    className={`text-lg font-bold mt-2 ${input.result.categoryColor}`}
                                >
                                    {input.result.category}
                                </p>
                                {input.result.message && (
                                    <p className="text-base font-bold text-gray-700 mt-3 max-w-md mx-auto">
                                        {input.result.message}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </form>
            )}

            {/* ============================================================ */}
            {/* CHILD FORM                                                   */}
            {/* ============================================================ */}
            {mode === 'child' && (
                <form
                    onSubmit={calculateChildBMI}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                <FaWeightHanging className="text-green-600" />{' '}
                                Weight (kg)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={childInput.weight}
                                onChange={(e) =>
                                    setChildInput({
                                        ...childInput,
                                        weight: e.target.value
                                    })
                                }
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                placeholder="e.g. 35"
                            />
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                <FaRulerVertical className="text-green-600" />{' '}
                                Height (cm)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={childInput.height}
                                onChange={(e) =>
                                    setChildInput({
                                        ...childInput,
                                        height: e.target.value
                                    })
                                }
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                placeholder="e.g. 140"
                            />
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                <FaChild className="text-green-600" /> Age
                                (years)
                            </label>
                            <input
                                type="number"
                                step="1"
                                min="5"
                                max="19"
                                value={childInput.ageYears}
                                onChange={(e) =>
                                    setChildInput({
                                        ...childInput,
                                        ageYears: e.target.value
                                    })
                                }
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                placeholder="e.g. 10"
                            />
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                <FaUser className="text-green-600" /> Sex
                            </label>
                            <select
                                value={childInput.sex}
                                onChange={(e) =>
                                    setChildInput({
                                        ...childInput,
                                        sex: e.target.value
                                    })
                                }
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white"
                            >
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 mt-6">
                        <button
                            type="submit"
                            className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl transition shadow-md"
                        >
                            <FaCalculator /> Calculate BMI-for-age
                        </button>
                        <button
                            type="button"
                            onClick={resetChild}
                            className="inline-flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                        >
                            <FaRedo /> Reset
                        </button>
                    </div>

                    {childInput.result && childInput.result.error && (
                        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                            {childInput.result.error}
                        </div>
                    )}

                    {childInput.result && childInput.result.value && (
                        <div
                            className={`mt-6 p-6 rounded-2xl border ${childInput.result.bgColor}`}
                        >
                            <div className="text-center">
                                <p className="text-sm uppercase tracking-wider text-gray-600 font-semibold mb-1">
                                    BMI-for-age
                                </p>
                                <p className="text-5xl font-black text-gray-900">
                                    {childInput.result.value}
                                    <span className="text-xl font-semibold text-gray-500 ml-2">
                                        {childInput.result.unit}
                                    </span>
                                </p>
                                <p className="text-lg font-bold text-gray-700 mt-1">
                                    z-score: {childInput.result.zScore}
                                </p>
                                <p
                                    className={`text-lg font-bold mt-2 ${childInput.result.categoryColor}`}
                                >
                                    {childInput.result.category}
                                </p>
                                {/* ── NEW: Weight gain / loss message ── */}
                                {childInput.result.weightMessage && (
                                    <p className="text-base font-bold text-gray-700 mt-3 max-w-md mx-auto">
                                        {childInput.result.weightMessage}
                                    </p>
                                )}
                                <p className="text-sm text-gray-600 mt-2">
                                    {childInput.result.message}
                                </p>
                            </div>
                        </div>
                    )}
                </form>
            )}

            {/* ── Reference table ─────────────────────────────────────────── */}
            <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-4">
                    <FaInfoCircle className="text-green-600" />{' '}
                    {mode === 'adult'
                        ? 'Adult BMI Categories'
                        : 'WHO 2007 BMI-for-age cut-offs (5–19 years)'}
                </h3>
                {mode === 'adult' ? (
                    <div className="space-y-2">
                        {[
                            {
                                range: 'Below 18.5',
                                label: 'Underweight',
                                color: 'bg-amber-100 text-amber-800'
                            },
                            {
                                range: '18.5 – 24.9',
                                label: 'Normal',
                                color: 'bg-green-100 text-green-800'
                            },
                            {
                                range: '25.0 – 29.9',
                                label: 'Overweight',
                                color: 'bg-orange-100 text-orange-800'
                            },
                            {
                                range: '30.0 and above',
                                label: 'Obesity',
                                color: 'bg-red-100 text-red-800'
                            }
                        ].map((c) => (
                            <div
                                key={c.label}
                                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                            >
                                <span className="text-sm text-gray-600">
                                    {c.range}
                                </span>
                                <span
                                    className={`text-xs font-bold px-3 py-1 rounded-full ${c.color}`}
                                >
                                    {c.label}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {[
                            {
                                sd: '> +2 SD',
                                label: 'Obesity',
                                color: 'bg-red-100 text-red-800'
                            },
                            {
                                sd: '> +1 SD',
                                label: 'Overweight',
                                color: 'bg-orange-100 text-orange-800'
                            },
                            {
                                sd: '−2 SD to +1 SD',
                                label: 'Normal',
                                color: 'bg-green-100 text-green-800'
                            },
                            {
                                sd: '< −2 SD',
                                label: 'Thinness',
                                color: 'bg-amber-100 text-amber-800'
                            },
                            {
                                sd: '< −3 SD',
                                label: 'Severe thinness',
                                color: 'bg-amber-200 text-amber-900'
                            }
                        ].map((c) => (
                            <div
                                key={c.label}
                                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                            >
                                <span className="text-sm text-gray-600">
                                    {c.sd}
                                </span>
                                <span
                                    className={`text-xs font-bold px-3 py-1 rounded-full ${c.color}`}
                                >
                                    {c.label}
                                </span>
                            </div>
                        ))}
                        <p className="text-xs text-gray-500 pt-3 leading-relaxed">
                            WHO 2007 reference. Weight-change messages are
                            calculated by converting the relevant z‑score
                            cut-off back to a BMI via the LMS formula, then
                            converting that BMI to a weight using the child’s
                            height.
                        </p>
                    </div>
                )}
            </div>

            <p className="mt-6 text-xs text-gray-500 leading-relaxed text-center">
                <strong>Disclaimer:</strong> BMI is a screening tool, not a
                diagnostic measure. The child mode uses the WHO 2007
                BMI-for-age reference and requires accurate age and sex
                information. Weight-change messages are estimates based on
                the LMS parameters; always consult a healthcare professional
                for a complete assessment.
            </p>
        </div>
    );
};

export default BMICalculator;
