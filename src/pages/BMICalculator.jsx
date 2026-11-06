
import React, { useState } from 'react';
import {
    FaWeightHanging,
    FaRulerVertical,
    FaCalculator,
    FaInfoCircle,
    FaRedo,
    FaCalendarAlt,
    FaVenusMars
} from 'react-icons/fa';

import bmiForAge from '../data/who2007/bmiForAge.json';

const BMICalculator = () => {
    const [input, setInput] = useState({
        weight: '',
        height: '',
        age: '',
        sex: '',
        result: null
    });

    const num = (v) => {
        const n = parseFloat(v);
        return Number.isFinite(n) && n > 0 ? n : null;
    };

    // Retrieve and interpolate WHO LMS reference parameters.
    const getLMS = (data, sex, ageMonths) => {
        const rows = data
            .filter(r => r.sex === sex)
            .sort((a, b) => a.x - b.x);

        if (
            !rows.length ||
            ageMonths < rows[0].x ||
            ageMonths > rows[rows.length - 1].x
        ) {
            return null;
        }

        const exact = rows.find(
            r => Math.abs(r.x - ageMonths) < 0.000001
        );

        if (exact) return exact;

        for (let i = 0; i < rows.length - 1; i++) {
            const lower = rows[i];
            const upper = rows[i + 1];

            if (lower.x <= ageMonths && upper.x >= ageMonths) {
                const ratio =
                    (ageMonths - lower.x) / (upper.x - lower.x);

                return {
                    L: lower.L + ratio * (upper.L - lower.L),
                    M: lower.M + ratio * (upper.M - lower.M),
                    S: lower.S + ratio * (upper.S - lower.S)
                };
            }
        }

        return null;
    };

    // WHO LMS z-score calculation.
    const calculateZScore = (bmi, lms) => {
        if (!lms || lms.M <= 0 || lms.S <= 0) return null;

        const { L, M, S } = lms;

        const z = Math.abs(L) < 0.000001
            ? Math.log(bmi / M) / S
            : (Math.pow(bmi / M, L) - 1) / (L * S);

        return Number.isFinite(z) ? z : null;
    };

    const getCategoryStyle = (category) => {
        if (category === 'Obesity') {
            return {
                categoryColor: 'text-red-600',
                bgColor: 'bg-red-50 border-red-200'
            };
        }

        if (category === 'Overweight') {
            return {
                categoryColor: 'text-orange-600',
                bgColor: 'bg-orange-50 border-orange-200'
            };
        }

        if (
            category === 'Underweight' ||
            category === 'Thinness' ||
            category === 'Severe thinness'
        ) {
            return {
                categoryColor: 'text-amber-600',
                bgColor: 'bg-amber-50 border-amber-200'
            };
        }

        return {
            categoryColor: 'text-green-600',
            bgColor: 'bg-green-50 border-green-200'
        };
    };

    const calculateBMI = (e) => {
        e.preventDefault();

        const w = num(input.weight);
        const h = num(input.height);
        const age = num(input.age);

        if (!w || !h || !age) {
            setInput(s => ({
                ...s,
                result: {
                    error: 'Please enter valid age, weight and height values.'
                }
            }));
            return;
        }

        if (h < 30 || h > 250) {
            setInput(s => ({
                ...s,
                result: { error: 'Please enter a valid height.' }
            }));
            return;
        }

        if (age < 5 || (age < 20 && !input.sex)) {
            setInput(s => ({
                ...s,
                result: {
                    error: age < 5
                        ? 'This calculator supports children aged 5 years and above.'
                        : 'Please select sex.'
                }
            }));
            return;
        }

        const hM = h / 100;
        const bmi = w / (hM * hM);

        let category;
        let zScore = null;
        let reference;
        let indicator;
        let message = null;

        // ADULT BMI: Existing classification retained.
        if (age >= 20) {

            if (bmi < 18.5) {
                category = 'Underweight';

                const targetWeight = 18.5 * hM * hM;
                const gain = targetWeight - w;

                if (gain > 0) {
                    message = `ቢያንስ ${gain.toFixed(1)} kg ክብደት ይጨምሩ፣ የሰውነት ክብደት መረጃ ጠቋሚው 18.5 እስኪደርስ`;
                }

            } else if (bmi < 25) {
                category = 'Normal range';

            } else if (bmi < 30) {
                category = 'Overweight';

            } else {
                category = 'Obesity';
            }

            if (bmi >= 25) {
                const targetWeight = 25 * hM * hM;
                const loss = w - targetWeight;

                if (loss > 0) {
                    message = `ቢያንስ ${loss.toFixed(1)} kg ይቀንሱ፣ የሰውነት ክብደት መረጃ ጠቋሚው ከ25 በታች እስኪደርስ.`;
                }
            }

            indicator = 'BMI';
            reference = 'Adult BMI classification';
        }

        // CHILDREN 5–19 YEARS: WHO 2007 BMI-for-age.
        else {

            // Convert age in years to completed months.
            const ageMonths = Math.floor(age * 12);

            const lms = getLMS(
                bmiForAge,
                input.sex,
                ageMonths
            );

            if (!lms) {
                setInput(s => ({
                    ...s,
                    result: {
                        error: 'WHO reference data are unavailable for this age and sex. Please check the WHO reference dataset.'
                    }
                }));
                return;
            }

            zScore = calculateZScore(bmi, lms);

            if (zScore === null) {
                setInput(s => ({
                    ...s,
                    result: {
                        error: 'Unable to calculate BMI-for-age z-score.'
                    }
                }));
                return;
            }

            indicator = 'BMI-for-age';
            reference = 'WHO Growth Reference (2007)';

            if (zScore < -3) {
                category = 'Severe thinness';
            } else if (zScore < -2) {
                category = 'Thinness';
            } else if (zScore <= 1) {
                category = 'Normal range';
            } else if (zScore <= 2) {
                category = 'Overweight';
            } else {
                category = 'Obesity';
            }
        }

        const styles = getCategoryStyle(category);

        setInput(s => ({
            ...s,
            result: {
                value: bmi.toFixed(1),
                unit: 'kg/m²',
                category,
                zScore: zScore !== null ? zScore.toFixed(2) : null,
                indicator,
                reference,
                categoryColor: styles.categoryColor,
                bgColor: styles.bgColor,
                message
            }
        }));
    };

    const reset = () => {
        setInput({
            weight: '',
            height: '',
            age: '',
            sex: '',
            result: null
        });
    };

    const isChild =
        input.age !== '' &&
        Number(input.age) >= 5 &&
        Number(input.age) < 20;

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

            <form
                onSubmit={calculateBMI}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8"
            >

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Age */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                            <FaCalendarAlt className="text-green-600" />
                            Age (years)
                        </label>

                        <input
                            type="number"
                            step="0.083333"
                            min="5"
                            max="120"
                            value={input.age}
                            onChange={e => setInput({
                                ...input,
                                age: e.target.value,
                                result: null
                            })}
                            required
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                            placeholder="e.g. 8 or 35"
                        />

                        <p className="text-xs text-gray-500 mt-1">
                            Enter age in years. For children, age is converted to completed months.
                        </p>
                    </div>

                    {/* Sex: Children only */}
                    {isChild && (
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                <FaVenusMars className="text-green-600" />
                                Sex
                            </label>

                            <select
                                value={input.sex}
                                onChange={e => setInput({
                                    ...input,
                                    sex: e.target.value,
                                    result: null
                                })}
                                required
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                            >
                                <option value="">Select sex</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>
                    )}

                    {/* Weight */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                            <FaWeightHanging className="text-green-600" />
                            Weight (kg)
                        </label>

                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={input.weight}
                            onChange={e => setInput({
                                ...input,
                                weight: e.target.value,
                                result: null
                            })}
                            required
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                            placeholder="e.g. 70"
                        />
                    </div>

                    {/* Height */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                            <FaRulerVertical className="text-green-600" />
                            Height (cm)
                        </label>

                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={input.height}
                            onChange={e => setInput({
                                ...input,
                                height: e.target.value,
                                result: null
                            })}
                            required
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
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
                        onClick={reset}
                        className="inline-flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                    >
                        <FaRedo /> Reset
                    </button>

                </div>

                {/* Error */}
                {input.result?.error && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                        {input.result.error}
                    </div>
                )}

                {/* Result */}
                {input.result?.value && (
                    <div className={`mt-6 p-6 rounded-2xl border ${input.result.bgColor}`}>

                        <div className="text-center">

                            <p className="text-sm uppercase tracking-wider text-gray-600 font-semibold mb-1">
                                {input.result.indicator}
                            </p>

                            <p className="text-5xl font-black text-gray-900">
                                {input.result.value}

                                <span className="text-xl font-semibold text-gray-500 ml-2">
                                    {input.result.unit}
                                </span>
                            </p>

                            <p className={`text-lg font-bold mt-3 ${input.result.categoryColor}`}>
                                {input.result.category}
                            </p>

                            {input.result.zScore !== null && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <p className="text-sm text-gray-600">
                                        WHO BMI-for-age Z-score
                                    </p>

                                    <p className="text-3xl font-bold text-gray-900">
                                        {input.result.zScore} SD
                                    </p>
                                </div>
                            )}

                            {input.result.message && (
                                <p className="text-base font-bold text-gray-700 mt-3 max-w-md mx-auto">
                                    {input.result.message}
                                </p>
                            )}

                            <p className="text-xs text-gray-500 mt-4">
                                Reference: {input.result.reference}
                            </p>

                        </div>
                    </div>
                )}

            </form>

            {/* BMI Categories Reference */}
            <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

                <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-4">
                    <FaInfoCircle className="text-green-600" />
                    {isChild
                        ? 'WHO BMI-for-age Classification'
                        : 'BMI Categories'}
                </h3>

                <div className="space-y-2">

                    {(isChild ? [
                        {
                            range: 'Below −3 SD',
                            label: 'Severe thinness',
                            color: 'bg-amber-100 text-amber-800'
                        },
                        {
                            range: '−3 to below −2 SD',
                            label: 'Thinness',
                            color: 'bg-amber-100 text-amber-800'
                        },
                        {
                            range: '−2 to +1 SD',
                            label: 'Normal range',
                            color: 'bg-green-100 text-green-800'
                        },
                        {
                            range: 'Above +1 to +2 SD',
                            label: 'Overweight',
                            color: 'bg-orange-100 text-orange-800'
                        },
                        {
                            range: 'Above +2 SD',
                            label: 'Obesity',
                            color: 'bg-red-100 text-red-800'
                        }
                    ] : [
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
                    ]).map(c => (
                        <div
                            key={c.label}
                            className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                        >
                            <span className="text-sm text-gray-600">
                                {c.range}
                            </span>

                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${c.color}`}>
                                {c.label}
                            </span>
                        </div>
                    ))}

                </div>

                {isChild && (
                    <p className="text-xs text-gray-500 mt-4">
                        WHO Growth Reference for children and adolescents aged 5–19 years (2007). Classification is based on BMI-for-age z-score and sex.
                    </p>
                )}

            </div>

            <p className="mt-6 text-xs text-gray-500 leading-relaxed text-center">
                <strong>Disclaimer:</strong> BMI is a screening tool, not a diagnostic measure. In children and adolescents, BMI must be interpreted according to age and sex using WHO growth references. Consult a healthcare professional for a complete assessment.
            </p>

        </div>
    );
};

export default BMICalculator;
