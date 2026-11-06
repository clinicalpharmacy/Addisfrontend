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

// ── Full WHO 2007 LMS table (0–228 months), imported ────────────────────
// Each entry is stored as an array [L, M, S].
import { WHO_LMS } from '../data/whoLMS'; // adjust path as needed

// Helper: retrieve LMS for a given sex and age in months.
// Returns an array [L, M, S].
const getLMS = (sex, ageMonths) => {
    const table = WHO_LMS[sex]; // 'boys' or 'girls'
    const key = String(Math.round(ageMonths));
    return table[key] || table["228"]; // fallback for out‑of‑range
};

// ---------------------------------------------------------------------------
// Helper: convert a z‑score to a BMI using the LMS formula
// BMI = M * (1 + L * S * z)^(1/L)
// LMS is provided as an array [L, M, S].
// ---------------------------------------------------------------------------
const bmiFromZ = (z, lms) => {
    const [L, M, S] = lms;
    if (Math.abs(L) < 1e-10) {
        return M * Math.exp(S * z);
    }
    return M * Math.pow(1 + L * S * z, 1 / L);
};

const BMICalculator = () => {
    // ── Adult state ────────────────────────────────────────────────────────
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
                message = `ቢያንስ ${gain.toFixed(1)} kg ክብደት ይጨምሩ፣ የሰውነት ክብደት መረጃ ጠቋሚው 18.5 እንዲደርስ`;
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
                message = `ቢያንስ ${loss.toFixed(1)} kg ይቀንሱ፣ የሰውነት ክብደት መረጃ ጠቋሚው ከ25 በታች እንዲሆን።`;
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
        // Returns [L, M, S].
        const sex = childInput.sex === 'male' ? 'boys' : 'girls';
        const lms = getLMS(sex, ageMonths);
        const [L, M, S] = lms;

        // ── LMS z‑score ────────────────────────────────────────────────────
        let z;
        if (Math.abs(L) < 1e-10) {
            z = Math.log(bmi / M) / S;
        } else {
            z = (Math.pow(bmi / M, L) - 1) / (L * S);
        }

        // ── WHO interpretation (5–19 y) ────────────────────────────────────
        // Normal range: -2 SD ≤ z ≤ +1 SD
        // Overweight:   z > +1 SD
        // Obesity:      z > +2 SD
        // Thinness:     z < -2 SD
        // Severe thinness: z < -3 SD
        //
        // The weight-change target is the NEAREST boundary of the NORMAL
        // range, so the value shown is the MINIMUM weight change needed to
        // bring the child into the normal BMI-for-age category:
        //   • Overweight / Obesity  → target z = +1 (upper limit of normal)
        //   • Thinness / Severe thinness → target z = -2 (lower limit of normal)
        // This mirrors the adult logic (target BMI 25 and 18.5 respectively).
        // ──────────────────────────────────────────────────────────────────
        let category;
        let categoryColor;
        let bgColor;
        let message = null;

        if (z > 2) {
            category = 'Obesity';
            categoryColor = 'text-red-600';
            bgColor = 'bg-red-50 border-red-200';
            const targetBmi = bmiFromZ(1, lms);
            const targetWeight = targetBmi * hM * hM;
            const loss = w - targetWeight;
            if (loss > 0) {
                message = `ቢያንስ ${loss.toFixed(1)} kg ይቀንስ፣ ኖርማል BMI ለመድረስ።`;
            }
        } else if (z > 1) {
            category = 'Overweight';
            categoryColor = 'text-orange-600';
            bgColor = 'bg-orange-50 border-orange-200';
            const targetBmi = bmiFromZ(1, lms);
            const targetWeight = targetBmi * hM * hM;
            const loss = w - targetWeight;
            if (loss > 0) {
                message = `ቢያንስ ${loss.toFixed(1)} kg ይቀንስ፣ ኖርማል BMI ለመድረስ።`;
            }
        } else if (z < -3) {
            category = 'Severe thinness';
            categoryColor = 'text-amber-700';
            bgColor = 'bg-amber-50 border-amber-200';
            const targetBmi = bmiFromZ(-2, lms);
            const targetWeight = targetBmi * hM * hM;
            const gain = targetWeight - w;
            if (gain > 0) {
                message = `ቢያንስ ${gain.toFixed(1)} kg ክብደት ይጨምር፣ ኖርማል BMI ለመድረስ።`;
            }
        } else if (z < -2) {
            category = 'Thinness';
            categoryColor = 'text-amber-600';
            bgColor = 'bg-amber-50 border-amber-200';
            const targetBmi = bmiFromZ(-2, lms);
            const targetWeight = targetBmi * hM * hM;
            const gain = targetWeight - w;
            if (gain > 0) {
                message = `ቢያንስ ${gain.toFixed(1)} kg ክብደት ይጨምር፣ ኖርማል BMI ለመድረስ።`;
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

                                {/* WHO attribution right below z-score */}
                                <p className="text-sm text-gray-600 mt-1">
                                    {childInput.result.message}
                                </p>

                                {/* category */}
                                <p
                                    className={`text-lg font-bold mt-2 ${childInput.result.categoryColor}`}
                                >
                                    {childInput.result.category}
                                </p>

                                {/* weight gain / loss message — below z-score
                                    and shown only for Thinness, Severe thinness,
                                    Overweight, and Obesity */}
                                {childInput.result.weightMessage && (
                                    <p className="text-base font-bold text-gray-700 mt-3 max-w-md mx-auto">
                                        {childInput.result.weightMessage}
                                    </p>
                                )}
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
                            The weight-change message shows the{' '}
                            <strong>minimum</strong> change needed to enter the
                            normal range: overweight/obesity targets the upper
                            limit of normal (z-score = +1), while
                            thinness/severe thinness targets the lower limit
                            of normal (z-score = −2). This mirrors the adult
                            BMI approach (target BMI 25 and 18.5
                            respectively).
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
