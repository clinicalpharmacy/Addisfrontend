import React, { useState } from 'react';
import {
    FaWeightHanging,
    FaRulerVertical,
    FaCalculator,
    FaInfoCircle,
    FaRedo
} from 'react-icons/fa';

const BMICalculator = () => {
    const [input, setInput] = useState({ weight: '', height: '', result: null });

    const num = (v) => {
        const n = parseFloat(v);
        return Number.isFinite(n) && n > 0 ? n : null;
    };

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
            if (gain > 0) message = `ቢያንስ ${gain.toFixed(1)} kg ክብደት ይጨምሩ፣ የሰውነት ክብደት መረጃ ጠቋሚው 18.5 እስኪደርስ`;
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
            if (loss > 0) message = `ቢያንስ ${loss.toFixed(1)} kg ይቀንሱ፣ የሰውነት ክብደት መረጃ ጠቋሚው ከ25 በታች እስኪደርስ.`;
        }

        setInput((s) => ({
            ...s,
            result: { value: bmi.toFixed(1), unit: 'kg/m²', category, categoryColor, bgColor, message }
        }));
    };

    const reset = () => setInput({ weight: '', height: '', result: null });

    return (
        <div className="p-4 md:p-6 max-w-3xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">BMI Calculator</h1>
                <p className="text-gray-600 mt-1">የሰውነት ክብደት መረጃ ጠቋሚ</p>
            </div>

            <form
                onSubmit={calculateBMI}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                            <FaWeightHanging className="text-green-600" /> Weight (kg)
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={input.weight}
                            onChange={(e) => setInput({ ...input, weight: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                            placeholder="e.g. 70"
                        />
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                            <FaRulerVertical className="text-green-600" /> Height (cm)
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={input.height}
                            onChange={(e) => setInput({ ...input, height: e.target.value })}
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
                        onClick={reset}
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
                    <div className={`mt-6 p-6 rounded-2xl border ${input.result.bgColor}`}>
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
                            <p className={`text-lg font-bold mt-2 ${input.result.categoryColor}`}>
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

            {/* BMI Categories Reference */}
            <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-4">
                    <FaInfoCircle className="text-green-600" /> BMI Categories
                </h3>
                <div className="space-y-2">
                    {[
                        { range: 'Below 18.5', label: 'Underweight', color: 'bg-amber-100 text-amber-800' },
                        { range: '18.5 – 24.9', label: 'Normal', color: 'bg-green-100 text-green-800' },
                        { range: '25.0 – 29.9', label: 'Overweight', color: 'bg-orange-100 text-orange-800' },
                        { range: '30.0 and above', label: 'Obesity', color: 'bg-red-100 text-red-800' }
                    ].map((c) => (
                        <div
                            key={c.label}
                            className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                        >
                            <span className="text-sm text-gray-600">{c.range}</span>
                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${c.color}`}>
                                {c.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <p className="mt-6 text-xs text-gray-500 leading-relaxed text-center">
                <strong>Disclaimer:</strong> BMI is a screening tool, not a diagnostic measure. It does not
                account for muscle mass, bone density, or body composition. Consult a healthcare professional
                for a complete assessment.
            </p>
        </div>
    );
};

export default BMICalculator;
