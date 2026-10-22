import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    FaUserMd, FaHeartbeat, FaShieldAlt, FaPills, FaClipboardList,
    FaArrowRight, FaCheckCircle, FaBookMedical, FaBookOpen,
    FaBars, FaBook, FaCapsules, FaNotesMedical, FaTimes,
    FaCalculator, FaWeightHanging, FaRulerVertical
} from 'react-icons/fa';

const LandingPage = () => {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // ---- Calculator state ----
    const [bmiInput, setBmiInput] = useState({ weight: '', height: '', result: null });
    const [bsaInput, setBsaInput] = useState({ weight: '', height: '', result: null });
    const [egfrInput, setEgfrInput] = useState({ age: '', sex: 'male', scr: '', result: null });

    const token = localStorage.getItem('token');
    const user = (() => {
        try {
            return JSON.parse(localStorage.getItem('user'));
        } catch (e) {
            return null;
        }
    })();
    const isLoggedIn = !!token && !!user;

    const getDashboardPath = () => {
        if (!user) return '/login';
        if (user.role === 'admin' || user.role === 'superadmin') return '/admin/dashboard';
        if (user.role === 'company_admin' || (user.account_type === 'company' && user.company_id)) return '/company/dashboard';
        return '/home';
    };

    // ---- Calculator handlers ----
    const num = (v) => {
        const n = parseFloat(v);
        return Number.isFinite(n) && n > 0 ? n : null;
    };

    const calculateBMI = (e) => {
        e.preventDefault();
        const w = num(bmiInput.weight);
        const h = num(bmiInput.height);
        if (!w || !h) {
            setBmiInput((s) => ({ ...s, result: { error: 'Enter valid weight and height.' } }));
            return;
        }
        const hM = h / 100;
        const bmi = w / (hM * hM);

        let category = 'Obesity';
        let message = null;

        if (bmi < 18.5) {
            category = 'Underweight';
            const targetWeight = 18.5 * hM * hM; // weight needed to reach BMI 18.5
            const gain = targetWeight - w;
            if (gain > 0) {
                message = `Gain at least ${gain.toFixed(1)} kg to reach a BMI of 18.5.`;
            }
        } else if (bmi < 25) {
            category = 'Normal range';
        } else if (bmi < 30) {
            category = 'Overweight';
        }

        if (bmi >= 25) {
            const targetWeight = 25 * hM * hM; // weight for BMI 25
            const loss = w - targetWeight;
            if (loss > 0) {
                message = `Lose at least ${loss.toFixed(1)} kg to reach a BMI below 25.`;
            }
        }

        setBmiInput((s) => ({
            ...s,
            result: { value: bmi.toFixed(1), unit: 'kg/m²', category, message }
        }));
    };

    const calculateBSA = (e) => {
        e.preventDefault();
        const w = num(bsaInput.weight);
        const h = num(bsaInput.height);
        if (!w || !h) {
            setBsaInput((s) => ({ ...s, result: { error: 'Enter valid weight and height.' } }));
            return;
        }
        // Du Bois: 0.007184 × height(cm)^0.725 × weight(kg)^0.425
        const bsa = 0.007184 * Math.pow(h, 0.725) * Math.pow(w, 0.425);
        setBsaInput((s) => ({ ...s, result: { value: bsa.toFixed(2), unit: 'm²', category: 'Du Bois formula' } }));
    };

    const calculateEGFR = (e) => {
        e.preventDefault();
        const age = num(egfrInput.age);
        const scr = num(egfrInput.scr);
        if (!age || !scr) {
            setEgfrInput((s) => ({ ...s, result: { error: 'Enter valid age and serum creatinine.' } }));
            return;
        }
        const female = egfrInput.sex === 'female';
        const k = female ? 0.7 : 0.9;
        const alpha = female ? -0.241 : -0.302;
        const r = scr / k;
        let egfr =
            142 *
            Math.pow(Math.min(r, 1), alpha) *
            Math.pow(Math.max(r, 1), -1.2) *
            Math.pow(0.9938, age);
        if (female) egfr *= 1.012;
        setEgfrInput((s) => ({
            ...s,
            result: { value: egfr.toFixed(0), unit: 'mL/min/1.73 m²', category: 'CKD-EPI 2021 (race-free)' }
        }));
    };

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        {/* Logo */}
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg shadow-sm overflow-hidden">
                                <img
                                    src="/logo.png"
                                    alt="Addis Med Logo"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <span className="text-2xl font-bold tracking-tight text-slate-900">Addis Med</span>
                        </div>

                        {/* Desktop Navigation Links */}
                        <div className="hidden md:flex items-center gap-8">
                            <a href="#about" className="text-sm font-medium text-slate-600 hover:text-blue-700 transition-colors">About Us</a>
                            <a href="#contact" className="text-sm font-medium text-slate-600 hover:text-blue-700 transition-colors">Contact</a>
                            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-blue-700 transition-colors">Features</a>
                            <a href="#calculators" className="text-sm font-medium text-slate-600 hover:text-blue-700 transition-colors">Calculators</a>
                            <Link to="/vacancies" className="text-sm font-medium text-slate-600 hover:text-blue-700 transition-colors flex items-center gap-1">Vacancies <FaArrowRight className="text-[10px]" /></Link>
                        </div>

                        {/* Desktop Action Buttons */}
                        <div className="hidden md:flex items-center gap-4">
                            {isLoggedIn ? (
                                <button
                                    onClick={() => navigate(getDashboardPath())}
                                    className="px-5 py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm transition-all flex items-center gap-2"
                                >
                                    <span>Go to Dashboard</span>
                                    <FaArrowRight className="text-xs" />
                                </button>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        to="/signup"
                                        className="px-5 py-2.5 text-sm font-semibold text-white bg-green-500 hover:bg-green-600 rounded-lg shadow-sm transition-all"
                                    >
                                        Get Started
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden flex items-center">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="text-slate-600 hover:text-blue-700 focus:outline-none p-2"
                            >
                                {isMobileMenuOpen ? <FaTimes className="text-2xl" /> : <FaBars className="text-2xl" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {isMobileMenuOpen && (
                    <div className="md:hidden bg-white border-b border-slate-200 shadow-lg absolute w-full">
                        <div className="px-4 pt-2 pb-6 space-y-2">
                            <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 text-base font-medium text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg">About Us</a>
                            <a href="#contact" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 text-base font-medium text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg">Contact</a>
                            <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 text-base font-medium text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg">Features</a>
                            <a href="#calculators" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 text-base font-medium text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg">Calculators</a>
                            <Link to="/vacancies" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 text-base font-medium text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg">Vacancies</Link>
                            <div className="border-t border-slate-100 my-2 pt-2"></div>
                            {isLoggedIn ? (
                                <button
                                    onClick={() => {
                                        setIsMobileMenuOpen(false);
                                        navigate(getDashboardPath());
                                    }}
                                    className="w-full px-4 py-3 text-base font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg text-center"
                                >
                                    Go to Dashboard
                                </button>
                            ) : (
                                <>
                                    <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 text-base font-medium text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg">Sign In</Link>
                                    <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 text-base font-medium text-blue-700 bg-blue-50 rounded-lg mt-2 text-center border border-blue-100">Get Started</Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <main>
                <div className="relative pt-16 pb-24 lg:pt-24 lg:pb-32 overflow-hidden bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-100 text-slate-700 rounded-full text-sm font-semibold mb-8 border border-slate-200 shadow-sm">
                            <FaHeartbeat className="text-slate-600" />
                            Advancing Pharmacy Practice & Education in Ethiopia
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter leading-[1.1] mb-6 max-w-4xl mx-auto">
                            Your Partner in <span className="text-green-500">Digital Health</span>
                        </h1>
                        <p className="mt-6 text-base md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-10 font-medium">
                            Addis Med is a digital health platform providing information and educational content in healthcare, with a primary focus on medicines and their safe and effective use. It is designed to support healthcare professionals, students, organizations, and the public with accessible, evidence-based health and medication information.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <button
                                onClick={() => navigate('/login')}
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white bg-green-500 hover:bg-green-600 rounded-xl shadow-md hover:shadow-lg transition-all"
                            >
                                Access Platform
                                <FaArrowRight />
                            </button>
                            <Link
                                to="/signup"
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-green-600 bg-white hover:bg-green-50 border-2 border-green-500 rounded-xl shadow-sm hover:shadow transition-all"
                            >
                                Create an Account
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Features Grid */}
                <div id="features" className="bg-white py-20 border-t border-slate-200 pt-28 -mt-8">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Digital Health Tools</h2>
                            <p className="mt-4 text-slate-600 max-w-2xl mx-auto">Designed to enhance patient safety and optimize medicines use.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {[
                                {
                                    icon: <FaPills className="text-green-500 text-3xl" />,
                                    title: 'Medication Database',
                                    desc: 'Access medication information in local language.'
                                },
                                {
                                    icon: <FaShieldAlt className="text-green-500 text-3xl" />,
                                    title: 'Quick Screening',
                                    desc: 'Automated quick checks for pregnancy, elderly patients, and interactions.'
                                },
                                {
                                    icon: <FaClipboardList className="text-green-500 text-3xl" />,
                                    title: 'Medication Review',
                                    desc: 'Advanced tool providing information and consultation support in medication reviews.'
                                },
                                {
                                    icon: <FaBookOpen className="text-green-500 text-3xl" />,
                                    title: 'Education',
                                    desc: 'Automated features that provide educational contents for pharmacy students & professionals'
                                }
                            ].map((feature, idx) => (
                                <div key={idx} className="p-8 bg-slate-50 rounded-3xl border border-slate-200 hover:border-green-300 hover:shadow-xl transition-all duration-300 group">
                                    <div className="w-16 h-16 bg-green-50 border border-slate-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-xl font-extrabold text-slate-900 mb-3 tracking-tight">{feature.title}</h3>
                                    <p className="text-slate-600 text-base leading-relaxed font-medium">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Clinical Calculators */}
                <div id="calculators" className="bg-slate-50 py-20 border-t border-slate-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-14">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white text-green-700 rounded-full text-sm font-semibold mb-4 border border-green-200 shadow-sm">
                                <FaCalculator />
                                Free Clinical Calculators
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Quick Bedside & Pharmacy Tools</h2>
                            <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
                                Free, no-login calculators to support everyday clinical decisions.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* BMI */}
                            <form
                                onSubmit={calculateBMI}
                                className="p-8 bg-white rounded-3xl border border-slate-200 hover:border-green-300 hover:shadow-xl transition-all duration-300 flex flex-col"
                            >
                                <div className="w-14 h-14 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-center mb-5">
                                    <FaWeightHanging className="text-green-500 text-2xl" />
                                </div>
                                <h3 className="text-xl font-extrabold text-slate-900 mb-1 tracking-tight">BMI Calculator</h3>
                                <p className="text-sm text-slate-500 mb-5">Body Mass Index</p>

                                <label className="block text-sm font-medium text-slate-700 mb-1">Weight (kg)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={bmiInput.weight}
                                    onChange={(e) => setBmiInput({ ...bmiInput, weight: e.target.value })}
                                    className="w-full mb-4 px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                    placeholder="e.g. 70"
                                />

                                <label className="block text-sm font-medium text-slate-700 mb-1">Height (cm)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={bmiInput.height}
                                    onChange={(e) => setBmiInput({ ...bmiInput, height: e.target.value })}
                                    className="w-full mb-5 px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                    placeholder="e.g. 170"
                                />

                                <button
                                    type="submit"
                                    className="w-full py-3 text-sm font-semibold text-white bg-green-500 hover:bg-green-600 rounded-xl transition-all"
                                >
                                    Calculate BMI
                                </button>

                                <div className="mt-5 min-h-[110px] flex items-center justify-center">
                                    {bmiInput.result && bmiInput.result.error && (
                                        <p className="text-sm text-red-500 text-center">{bmiInput.result.error}</p>
                                    )}
                                    {bmiInput.result && bmiInput.result.value && (
                                        <div className="text-center">
                                            <p className="text-3xl font-black text-slate-900">
                                                {bmiInput.result.value}
                                                <span className="text-base font-semibold text-slate-500 ml-1">{bmiInput.result.unit}</span>
                                            </p>
                                            <p className="text-sm font-semibold text-green-600 mt-1">{bmiInput.result.category}</p>
                                            {bmiInput.result.message && (
                                                <p className="text-xs font-medium text-slate-600 mt-2 leading-relaxed">
                                                    {bmiInput.result.message}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </form>

                            {/* BSA Du Bois */}
                            <form
                                onSubmit={calculateBSA}
                                className="p-8 bg-white rounded-3xl border border-slate-200 hover:border-green-300 hover:shadow-xl transition-all duration-300 flex flex-col"
                            >
                                <div className="w-14 h-14 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-center mb-5">
                                    <FaRulerVertical className="text-green-500 text-2xl" />
                                </div>
                                <h3 className="text-xl font-extrabold text-slate-900 mb-1 tracking-tight">BSA Calculator</h3>
                                <p className="text-sm text-slate-500 mb-5">Body Surface Area — Du Bois</p>

                                <label className="block text-sm font-medium text-slate-700 mb-1">Weight (kg)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={bsaInput.weight}
                                    onChange={(e) => setBsaInput({ ...bsaInput, weight: e.target.value })}
                                    className="w-full mb-4 px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                    placeholder="e.g. 70"
                                />

                                <label className="block text-sm font-medium text-slate-700 mb-1">Height (cm)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={bsaInput.height}
                                    onChange={(e) => setBsaInput({ ...bsaInput, height: e.target.value })}
                                    className="w-full mb-5 px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                    placeholder="e.g. 170"
                                />

                                <button
                                    type="submit"
                                    className="w-full py-3 text-sm font-semibold text-white bg-green-500 hover:bg-green-600 rounded-xl transition-all"
                                >
                                    Calculate BSA
                                </button>

                                <div className="mt-5 min-h-[110px] flex items-center justify-center">
                                    {bsaInput.result && bsaInput.result.error && (
                                        <p className="text-sm text-red-500 text-center">{bsaInput.result.error}</p>
                                    )}
                                    {bsaInput.result && bsaInput.result.value && (
                                        <div className="text-center">
                                            <p className="text-3xl font-black text-slate-900">
                                                {bsaInput.result.value}
                                                <span className="text-base font-semibold text-slate-500 ml-1">{bsaInput.result.unit}</span>
                                            </p>
                                            <p className="text-sm font-semibold text-green-600 mt-1">{bsaInput.result.category}</p>
                                        </div>
                                    )}
                                </div>
                            </form>

                            {/* eGFR CKD-EPI 2021 */}
                            <form
                                onSubmit={calculateEGFR}
                                className="p-8 bg-white rounded-3xl border border-slate-200 hover:border-green-300 hover:shadow-xl transition-all duration-300 flex flex-col"
                            >
                                <div className="w-14 h-14 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-center mb-5">
                                    <FaHeartbeat className="text-green-500 text-2xl" />
                                </div>
                                <h3 className="text-xl font-extrabold text-slate-900 mb-1 tracking-tight">eGFR Calculator</h3>
                                <p className="text-sm text-slate-500 mb-5">CKD-EPI 2021 (race-free)</p>

                                <label className="block text-sm font-medium text-slate-700 mb-1">Age (years)</label>
                                <input
                                    type="number"
                                    step="1"
                                    min="1"
                                    value={egfrInput.age}
                                    onChange={(e) => setEgfrInput({ ...egfrInput, age: e.target.value })}
                                    className="w-full mb-4 px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                    placeholder="e.g. 45"
                                />

                                <label className="block text-sm font-medium text-slate-700 mb-1">Sex</label>
                                <select
                                    value={egfrInput.sex}
                                    onChange={(e) => setEgfrInput({ ...egfrInput, sex: e.target.value })}
                                    className="w-full mb-4 px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white"
                                >
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>

                                <label className="block text-sm font-medium text-slate-700 mb-1">Serum creatinine (mg/dL)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={egfrInput.scr}
                                    onChange={(e) => setEgfrInput({ ...egfrInput, scr: e.target.value })}
                                    className="w-full mb-5 px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                    placeholder="e.g. 0.9"
                                />

                                <button
                                    type="submit"
                                    className="w-full py-3 text-sm font-semibold text-white bg-green-500 hover:bg-green-600 rounded-xl transition-all"
                                >
                                    Calculate eGFR
                                </button>

                                <div className="mt-5 min-h-[110px] flex items-center justify-center">
                                    {egfrInput.result && egfrInput.result.error && (
                                        <p className="text-sm text-red-500 text-center">{egfrInput.result.error}</p>
                                    )}
                                    {egfrInput.result && egfrInput.result.value && (
                                        <div className="text-center">
                                            <p className="text-3xl font-black text-slate-900">
                                                {egfrInput.result.value}
                                                <span className="text-sm font-semibold text-slate-500 ml-1">{egfrInput.result.unit}</span>
                                            </p>
                                            <p className="text-sm font-semibold text-green-600 mt-1">{egfrInput.result.category}</p>
                                        </div>
                                    )}
                                </div>
                            </form>
                        </div>

                        <p className="mt-10 text-center text-xs text-slate-500 max-w-2xl mx-auto leading-relaxed">
                            <strong>Disclaimer:</strong> These calculators are for educational and informational purposes only and are not a substitute for clinical judgement. eGFR is normalized to 1.73 m² and may not match drug-label dosing methods (e.g., Cockcroft-Gault). Always follow the specific product label or institutional protocol.
                        </p>
                    </div>
                </div>

                {/* Trust / AAU Section */}
                <div id="about" className="bg-[#1A2535] py-24 text-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6 text-white drop-shadow-sm">Built on Academic Excellence</h2>
                                <p className="text-white/95 text-lg leading-relaxed mb-8 font-medium">
                                    Addis Med integrates health and medicines information with digital technology. Our platform ensures that healthcare providers have access to reliable, localized data.
                                </p>
                                <ul className="space-y-4">
                                    {[
                                        'Real-time medication availability tracking',
                                        'Regularly updated medication related information'
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center gap-3">
                                            <FaCheckCircle className="text-green-100 drop-shadow-sm" />
                                            <span className="text-white font-semibold">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-0 bg-white rounded-3xl transform rotate-3 opacity-10"></div>
                                <div className="relative bg-white border border-green-100 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center">
                                    <div className="bg-white p-2.5 rounded-full mb-4 border border-green-50 shadow-sm">
                                        <img
                                            src="/Addis Ababa University Logo.svg"
                                            alt="AAU Logo"
                                            className="w-28 h-28 object-contain"
                                        />
                                    </div>
                                    <span className="text-green-600 font-bold tracking-widest uppercase text-sm mb-2">Proudly Backed By</span>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-1">Addis Ababa University</h3>
                                    <p className="text-2xl font-bold text-slate-900">Startups Center</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer id="contact" className="bg-slate-50 border-t border-slate-200 pt-16 pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm overflow-hidden">
                            <img
                                src="/logo.png"
                                alt="Addis Med Logo"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <span className="text-xl font-bold text-slate-900">Addis Med</span>
                    </div>
                    <p className="text-slate-500 max-w-md mx-auto mb-8">
                        Enhancing patient safety and optimizing medicines use through innovative digital solution.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-slate-600 font-medium border-t border-slate-100 pt-8">
                        <span>Addis Ababa, Ethiopia</span>
                        <span className="hidden sm:inline text-slate-300">•</span>
                        <span>pharmcare2001@yahoo.com</span>
                        <span className="hidden sm:inline text-slate-300">•</span>
                        <span>+251919519512</span>
                    </div>
                    <div className="mt-8 text-sm text-slate-400">
                        © {new Date().getFullYear()} Addis Med. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
