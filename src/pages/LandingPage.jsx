import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    FaUserMd, FaHeartbeat, FaShieldAlt, FaPills, FaClipboardList,
    FaArrowRight, FaCheckCircle, FaBookMedical, FaBookOpen,
    FaBars, FaBook, FaCapsules, FaNotesMedical, FaTimes,
    FaCalculator, FaWeightHanging, FaRulerVertical,
    FaNewspaper, FaCalendarAlt, FaTag
} from 'react-icons/fa';
import api from '../utils/api';
import { format } from 'date-fns';

// ---- Unit tables for the Vial / Bottle calculator ----
const AMOUNT_UNITS = {
    mg:    { base: 'mg',    factor: 1 },
    mcg:   { base: 'mg',    factor: 0.001 },
    g:     { base: 'mg',    factor: 1000 },
    units: { base: 'units', factor: 1 }
};

const DOSE_UNITS = {
    mg:    { base: 'mg',    factor: 1 },
    mcg:   { base: 'mg',    factor: 0.001 },
    g:     { base: 'mg',    factor: 1000 },
    units: { base: 'units', factor: 1 }
};

// ---- Client counselling messages (Amharic) ----
const CLIENT_TIPS = [
    'መድኃኒትዎን የጤና ባለሙያ ባዘዘው መጠንና ጊዜ ይውሰዱ።',
    'ምንም እንኳን የተሻለወት ቢመስልወትም መድኃኒትዎን አያቋርጡ፣ በታዘዘው መሰረት ይውሰዱ።',
    'የመድኃኒቱን አወሳሰድ ለማወቅ የፋርማሲ ባለሙያን ያማክሩ።',
    'መድኃኒትዎን ለሌላ ሰው አያጋሩ።',
    'መድኃኒቱን መቼ መውሰድ እንዳለብዎ እና ምን ያህል ጊዜ እንደሚወስድ ይረዱ።',
    'መድኃኒቱን ከወሰዱ በኋላ ያልተለመደ ምልክት ካጋጠምዎ ለሐኪምዎ ወይም ለፋርማሲስትዎ ያሳውቁ።',
    'መድኃኒትን ልጆች የማይደርሱበት ቦታ ያስቀምጡ።',
    'የሚወስዱትን ሁሉንም መድኃኒቶች ዝርዝር (ያለሐኪም ትዕዛዝ የሚሰጡትንም) ለሐኪምዎ ያሳውቁ።'
];

const LandingPage = () => {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // ---- Latest news state ----
    const [latestNews, setLatestNews] = useState([]);
    const [newsLoading, setNewsLoading] = useState(true);
    const [imgErrors, setImgErrors] = useState({});

    // ---- Calculator state ----
    const [bmiInput, setBmiInput] = useState({ weight: '', height: '', result: null });
    const [bsaInput, setBsaInput] = useState({ weight: '', height: '', result: null });
    const [egfrInput, setEgfrInput] = useState({ age: '', sex: 'male', scr: '', result: null });
    const [vialInput, setVialInput] = useState({
        strengthValue: '',
        strengthUnit: 'mg',
        strengthBasis: 'perMl',
        strengthPerMl: '1',
        vialVolume: '',
        doseValue: '',
        doseUnit: 'mg',
        freqValue: '',
        freqType: 'perDay',
        durationDays: '',
        vialType: 'multi',
        result: null
    });

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

    // ---- Fetch latest news (non-blocking; guests can still see the page) ----
    useEffect(() => {
        let cancelled = false;
        const loadNews = async () => {
            try {
                setNewsLoading(true);
                const data = await api.get('/news?limit=3');
                if (!cancelled && data?.success) {
                    setLatestNews((data.news || []).slice(0, 3));
                }
            } catch (err) {
                // Silent: guests without a token will 401 here until /news is made public
                console.warn('⚠️ Could not load landing news:', err?.message || err);
            } finally {
                if (!cancelled) setNewsLoading(false);
            }
        };
        loadNews();
        return () => { cancelled = true; };
    }, []);

    // ---- Calculator helpers ----
    const num = (v) => {
        const n = parseFloat(v);
        return Number.isFinite(n) && n > 0 ? n : null;
    };

    const fmt = (n, dec = 2) =>
        Number.isFinite(n)
            ? n.toLocaleString(undefined, { maximumFractionDigits: dec, minimumFractionDigits: 0 })
            : '—';

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
            const targetWeight = 18.5 * hM * hM;
            const gain = targetWeight - w;
            if (gain > 0) message = `Gain at least ${gain.toFixed(1)} kg to reach a BMI of 18.5.`;
        } else if (bmi < 25) {
            category = 'Normal range';
        } else if (bmi < 30) {
            category = 'Overweight';
        }

        if (bmi >= 25) {
            const targetWeight = 25 * hM * hM;
            const loss = w - targetWeight;
            if (loss > 0) message = `Lose at least ${loss.toFixed(1)} kg to reach a BMI below 25.`;
        }

        setBmiInput((s) => ({ ...s, result: { value: bmi.toFixed(1), unit: 'kg/m²', category, message } }));
    };

    const calculateBSA = (e) => {
        e.preventDefault();
        const w = num(bsaInput.weight);
        const h = num(bsaInput.height);
        if (!w || !h) {
            setBsaInput((s) => ({ ...s, result: { error: 'Enter valid weight and height.' } }));
            return;
        }
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

    const calculateVials = (e) => {
        e.preventDefault();

        const ceil = (n) => Math.ceil(n - 1e-9);
        const fail = (error) => setVialInput((s) => ({ ...s, result: { error } }));

        const sVal = parseFloat(vialInput.strengthValue);
        if (!(sVal > 0)) return fail('Enter a valid strength greater than 0.');

        const uInfo = AMOUNT_UNITS[vialInput.strengthUnit];
        const isPerMl = vialInput.strengthBasis === 'perMl';

        let perVol = null;
        if (isPerMl) {
            perVol = parseFloat(vialInput.strengthPerMl);
            if (!(perVol > 0)) return fail('Enter a valid "per volume" (mL) for the strength — e.g. 5 for 500 mg per 5 mL.');
        }

        let vVol = null;
        if (isPerMl) {
            vVol = parseFloat(vialInput.vialVolume);
            if (!(vVol > 0)) return fail('Enter a valid bottle / vial volume (mL).');
        }

        const dVal = parseFloat(vialInput.doseValue);
        if (!(dVal > 0)) return fail('Enter a valid dose per administration greater than 0.');
        const dInfo = DOSE_UNITS[vialInput.doseUnit];

        if (dInfo.base !== uInfo.base) {
            return fail(
                `Unit mismatch: dose unit (${vialInput.doseUnit}) is not compatible with ` +
                `strength unit (${vialInput.strengthUnit}). Both must be mass units (mg / mcg / g) ` +
                `or both must be "units".`
            );
        }

        const fVal = parseFloat(vialInput.freqValue);
        if (!(fVal > 0)) return fail('Enter a valid frequency greater than 0.');

        const dur = parseFloat(vialInput.durationDays);
        if (!(dur > 0)) return fail('Enter a valid treatment duration greater than 0.');

        const dosesPerDay = vialInput.freqType === 'perDay' ? fVal : 24 / fVal;
        const totalDoses = ceil(dosesPerDay * dur);
        const doseBase = dVal * dInfo.factor;
        const wm = 1;
        const vt = vialInput.vialType;

        let vialsNeeded;
        let totalAmountNeeded;
        let totalVolumeNeeded = null;
        let volumePerDose = null;
        let amountPerVial = null;
        let vialsPerDose = null;
        let dosesPerVial = null;
        let concentration = null;

        if (isPerMl) {
            concentration = (sVal * uInfo.factor) / perVol;
            volumePerDose = doseBase / concentration;
            amountPerVial = concentration * vVol;
            totalVolumeNeeded = volumePerDose * totalDoses;
            totalAmountNeeded = doseBase * totalDoses;

            if (vt === 'multi') {
                vialsNeeded = ceil((totalVolumeNeeded * wm) / vVol);
                dosesPerVial = Math.floor(vVol / (volumePerDose * wm));
                if (dosesPerVial < 1) dosesPerVial = null;
            } else {
                vialsPerDose = ceil((volumePerDose * wm) / vVol);
                vialsNeeded = vialsPerDose * totalDoses;
            }
        } else {
            amountPerVial = sVal * uInfo.factor;
            totalAmountNeeded = doseBase * totalDoses;

            if (vt === 'multi') {
                vialsNeeded = ceil((totalAmountNeeded * wm) / amountPerVial);
                dosesPerVial = Math.floor(amountPerVial / (doseBase * wm));
                if (dosesPerVial < 1) dosesPerVial = null;
            } else {
                vialsPerDose = ceil((doseBase * wm) / amountPerVial);
                vialsNeeded = vialsPerDose * totalDoses;
            }
        }

        vialsNeeded = ceil(vialsNeeded);

        setVialInput((s) => ({
            ...s,
            result: {
                error: null,
                vialsNeeded,
                totalDoses,
                dosesPerDay,
                doseEntered: dVal,
                doseUnitLabel: vialInput.doseUnit,
                doseBaseUnit: dInfo.base,
                totalAmountNeeded,
                isConc: isPerMl,
                strengthEntered: `${fmt(sVal, 4)} ${vialInput.strengthUnit}` +
                    (isPerMl ? ` per ${fmt(perVol, 2)} mL` : ' per vial'),
                concentration,
                vVol,
                volumePerDose,
                totalVolumeNeeded,
                amountPerVial,
                vialsPerDose,
                dosesPerVial,
                vt
            }
        }));
    };

    const vialIsPerMl = vialInput.strengthBasis === 'perMl';
    const vialResult = vialInput.result;
    const vialBreakdown = [];

    if (vialResult && !vialResult.error) {
        vialBreakdown.push(['Strength used', vialResult.strengthEntered]);

        if (vialResult.isConc) {
            vialBreakdown.push(['Concentration', `${fmt(vialResult.concentration, 4)} ${vialResult.doseBaseUnit}/mL`]);
        }

        vialBreakdown.push([
            'Doses per day',
            `${fmt(vialResult.dosesPerDay, 2)} ${vialResult.dosesPerDay === 1 ? 'dose' : 'doses'}`
        ]);
        vialBreakdown.push(['Total administrations', fmt(vialResult.totalDoses, 0)]);
        vialBreakdown.push(['Dose per administration', `${fmt(vialResult.doseEntered, 4)} ${vialResult.doseUnitLabel}`]);
        vialBreakdown.push([
            'Total medication required',
            `${fmt(vialResult.totalAmountNeeded, 2)} ${vialResult.doseBaseUnit}`
        ]);

        if (vialResult.isConc) {
            vialBreakdown.push(['Volume per dose', `${fmt(vialResult.volumePerDose, 3)} mL`]);
            vialBreakdown.push(['Total volume required', `${fmt(vialResult.totalVolumeNeeded, 2)} mL`]);
            vialBreakdown.push(['Volume per vial / bottle', `${fmt(vialResult.vVol, 2)} mL`]);
            if (vialResult.vialsPerDose != null) {
                vialBreakdown.push(['Vials per dose (single-use)', fmt(vialResult.vialsPerDose, 0)]);
            }
        } else {
            vialBreakdown.push([
                'Medication per vial / bottle',
                `${fmt(vialResult.amountPerVial, 2)} ${vialResult.doseBaseUnit}`
            ]);
            if (vialResult.vialsPerDose != null) {
                vialBreakdown.push(['Vials per dose', fmt(vialResult.vialsPerDose, 0)]);
            }
        }

        if (vialResult.dosesPerVial != null && vialResult.vt === 'multi') {
            vialBreakdown.push(['Doses obtainable per vial', fmt(vialResult.dosesPerVial, 0)]);
        }

        vialBreakdown.push(['Vial type', vialResult.vt === 'multi' ? 'Multi-use' : 'Single-use']);
    }

    // Helper for trimming article previews
    const truncate = (text, max = 160) => {
        if (!text) return '';
        return text.length > max ? text.slice(0, max).trim() + '…' : text;
    };

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg shadow-sm overflow-hidden">
                                <img src="/logo.png" alt="Addis Med Logo" className="w-full h-full object-contain" />
                            </div>
                            <span className="text-2xl font-bold tracking-tight text-slate-900">Addis Med</span>
                        </div>

                        <div className="hidden md:flex items-center gap-8">
                            <a href="#about" className="text-sm font-medium text-slate-600 hover:text-blue-700 transition-colors">About Us</a>
                            <a href="#contact" className="text-sm font-medium text-slate-600 hover:text-blue-700 transition-colors">Contact</a>
                            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-blue-700 transition-colors">Features</a>
                            {/* 👇 NEW: News link, between Features and Calculators */}
                            <a href="#news" className="text-sm font-medium text-slate-600 hover:text-blue-700 transition-colors">News & Alerts</a>
                            <a href="#calculators" className="text-sm font-medium text-slate-600 hover:text-blue-700 transition-colors">Calculators</a>
                            <a href="#clients" className="text-sm font-medium text-slate-600 hover:text-blue-700 transition-colors">For Clients</a>
                            <Link to="/vacancies" className="text-sm font-medium text-slate-600 hover:text-blue-700 transition-colors flex items-center gap-1">Vacancies <FaArrowRight className="text-[10px]" /></Link>
                        </div>

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
                                    <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Sign In</Link>
                                    <Link to="/signup" className="px-5 py-2.5 text-sm font-semibold text-white bg-green-500 hover:bg-green-600 rounded-lg shadow-sm transition-all">Get Started</Link>
                                </>
                            )}
                        </div>

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

                {isMobileMenuOpen && (
                    <div className="md:hidden bg-white border-b border-slate-200 shadow-lg absolute w-full">
                        <div className="px-4 pt-2 pb-6 space-y-2">
                            <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 text-base font-medium text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg">About Us</a>
                            <a href="#contact" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 text-base font-medium text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg">Contact</a>
                            <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 text-base font-medium text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg">Features</a>
                            {/* 👇 NEW: News link in mobile menu */}
                            <a href="#news" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 text-base font-medium text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg">News</a>
                            <a href="#calculators" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 text-base font-medium text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg">Calculators</a>
                            <a href="#clients" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 text-sm font-medium text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg">ለጤና አገልግሎት ተጠቃሚዎች</a>
                            <Link to="/vacancies" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 text-base font-medium text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg">Vacancies</Link>
                            <div className="border-t border-slate-100 my-2 pt-2"></div>
                            {isLoggedIn ? (
                                <button
                                    onClick={() => { setIsMobileMenuOpen(false); navigate(getDashboardPath()); }}
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

            <main>
                {/* Hero */}
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

                {/* Features */}
                <div id="features" className="bg-white py-20 border-t border-slate-200 pt-28 -mt-8">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Digital Health Tools</h2>
                            <p className="mt-4 text-slate-600 max-w-2xl mx-auto">Designed to enhance patient safety and optimize medicines use.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {[
                                { icon: <FaPills className="text-green-500 text-3xl" />, title: 'Medication Database', desc: 'Access medication information in local language.' },
                                { icon: <FaShieldAlt className="text-green-500 text-3xl" />, title: 'Quick Screening', desc: 'Automated quick checks for pregnancy, elderly patients, and interactions.' },
                                { icon: <FaClipboardList className="text-green-500 text-3xl" />, title: 'Medication Review', desc: 'Advanced tool providing information and consultation support in medication reviews.' },
                                { icon: <FaBookOpen className="text-green-500 text-3xl" />, title: 'Education', desc: 'Automated features that provide educational contents for pharmacy students & professionals' }
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

                {/* ===== NEWS SECTION — between Features and Calculators ===== */}
                <div id="news" className="bg-slate-50 py-20 border-t border-slate-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold mb-3 border border-green-100">
                                    <FaNewspaper className="text-green-500" />
                                    Latest Updates
                                </div>
                                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Health News & Drug Alerts</h2>
                                <p className="mt-3 text-slate-600 max-w-2xl">
                                    Stay informed with the latest developments, research findings, and policy updates from the healthcare world.
                                </p>
                            </div>
                            <Link
                                to="/news"
                                className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-green-500 hover:bg-green-600 rounded-xl shadow-sm transition-all whitespace-nowrap"
                            >
                                View All News
                                <FaArrowRight className="text-xs" />
                            </Link>
                        </div>

                        {newsLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {[1, 2, 3].map((n) => (
                                    <div key={n} className="bg-white rounded-3xl border border-slate-200 overflow-hidden animate-pulse">
                                        <div className="h-44 bg-slate-100" />
                                        <div className="p-6 space-y-3">
                                            <div className="h-3 bg-slate-100 rounded w-1/3" />
                                            <div className="h-5 bg-slate-100 rounded w-5/6" />
                                            <div className="h-3 bg-slate-100 rounded w-full" />
                                            <div className="h-3 bg-slate-100 rounded w-4/6" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : latestNews.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {latestNews.map((item) => (
                                    <Link
                                        key={item.id}
                                        to={`/news/${item.id}`}
                                        className="group bg-white rounded-3xl border border-slate-200 overflow-hidden hover:border-green-300 hover:shadow-xl transition-all duration-300 flex flex-col"
                                    >
                                        {item.image_url && !imgErrors[item.id] && (
                                            <div className="h-44 overflow-hidden bg-slate-100">
                                                <img
                                                    src={item.image_url}
                                                    alt={item.title}
                                                    loading="lazy"
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    onError={() =>
                                                        setImgErrors((prev) => ({ ...prev, [item.id]: true }))
                                                    }
                                                />
                                            </div>
                                        )}

                                        <div className="p-6 flex flex-col flex-grow">
                                            {item.category && (
                                                <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border border-green-100 w-fit mb-3">
                                                    <FaTag className="text-[8px]" /> {item.category}
                                                </span>
                                            )}
                                            <h3 className="text-lg font-extrabold text-slate-900 mb-2 leading-snug group-hover:text-green-600 transition-colors">
                                                {item.title}
                                            </h3>
                                            <p className="text-sm text-slate-600 leading-relaxed flex-grow">
                                                {truncate(item.content, 140)}
                                            </p>
                                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                                                <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                                                    <FaCalendarAlt />
                                                    {item.created_at ? format(new Date(item.created_at), 'MMM dd, yyyy') : ''}
                                                </span>
                                                <span className="text-green-600 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                                                    Read <FaArrowRight className="text-[10px]" />
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-3xl border border-slate-200 py-16 px-6 text-center">
                                <FaNewspaper className="text-4xl text-slate-200 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-slate-900 mb-1">No articles yet</h3>
                                <p className="text-sm text-slate-500 mb-5">
                                    Health news and updates will appear here soon. In the meantime, browse the full archive.
                                </p>
                                <Link
                                    to="/news"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-green-500 hover:bg-green-600 rounded-xl transition-all"
                                >
                                    Open News Archive <FaArrowRight className="text-xs" />
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Clinical Calculators */}
                <div id="calculators" className="bg-slate-50 py-20 border-t border-slate-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-14">
                            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Calculators to support everyday practice</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* BMI */}
                            <form onSubmit={calculateBMI} className="p-8 bg-white rounded-3xl border border-slate-200 hover:border-green-300 hover:shadow-xl transition-all duration-300 flex flex-col">
                                <h3 className="text-xl font-extrabold text-slate-900 mb-1 tracking-tight">BMI Calculator</h3>
                                <p className="text-sm text-slate-500 mb-5">የሰውነት ክብደት መረጃ ጠቋሚ</p>

                                <label className="block text-sm font-medium text-slate-700 mb-1">Weight (kg)</label>
                                <input
                                    type="number" step="0.1" min="0"
                                    value={bmiInput.weight}
                                    onChange={(e) => setBmiInput({ ...bmiInput, weight: e.target.value })}
                                    className="w-full mb-4 px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                    placeholder="e.g. 70"
                                />

                                <label className="block text-sm font-medium text-slate-700 mb-1">Height (cm)</label>
                                <input
                                    type="number" step="0.1" min="0"
                                    value={bmiInput.height}
                                    onChange={(e) => setBmiInput({ ...bmiInput, height: e.target.value })}
                                    className="w-full mb-5 px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                    placeholder="e.g. 170"
                                />

                                <button type="submit" className="w-full py-3 text-sm font-semibold text-white bg-green-500 hover:bg-green-600 rounded-xl transition-all">
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
                                                <p className="text-xs font-medium text-slate-600 mt-2 leading-relaxed">{bmiInput.result.message}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </form>

                            {/* BSA */}
                            <form onSubmit={calculateBSA} className="p-8 bg-white rounded-3xl border border-slate-200 hover:border-green-300 hover:shadow-xl transition-all duration-300 flex flex-col">
                                <h3 className="text-xl font-extrabold text-slate-900 mb-1 tracking-tight">BSA Calculator</h3>
                                <p className="text-sm text-slate-500 mb-5">Body Surface Area — Du Bois</p>

                                <label className="block text-sm font-medium text-slate-700 mb-1">Weight (kg)</label>
                                <input
                                    type="number" step="0.1" min="0"
                                    value={bsaInput.weight}
                                    onChange={(e) => setBsaInput({ ...bsaInput, weight: e.target.value })}
                                    className="w-full mb-4 px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                    placeholder="e.g. 70"
                                />

                                <label className="block text-sm font-medium text-slate-700 mb-1">Height (cm)</label>
                                <input
                                    type="number" step="0.1" min="0"
                                    value={bsaInput.height}
                                    onChange={(e) => setBsaInput({ ...bsaInput, height: e.target.value })}
                                    className="w-full mb-5 px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                    placeholder="e.g. 170"
                                />

                                <button type="submit" className="w-full py-3 text-sm font-semibold text-white bg-green-500 hover:bg-green-600 rounded-xl transition-all">
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

                            {/* eGFR */}
                            <form onSubmit={calculateEGFR} className="p-8 bg-white rounded-3xl border border-slate-200 hover:border-green-300 hover:shadow-xl transition-all duration-300 flex flex-col">
                                <h3 className="text-xl font-extrabold text-slate-900 mb-1 tracking-tight">eGFR Calculator</h3>
                                <p className="text-sm text-slate-500 mb-5">CKD-EPI 2021 (race-free)</p>

                                <label className="block text-sm font-medium text-slate-700 mb-1">Age (years)</label>
                                <input
                                    type="number" step="1" min="1"
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
                                    type="number" step="0.01" min="0"
                                    value={egfrInput.scr}
                                    onChange={(e) => setEgfrInput({ ...egfrInput, scr: e.target.value })}
                                    className="w-full mb-5 px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                    placeholder="e.g. 0.9"
                                />

                                <button type="submit" className="w-full py-3 text-sm font-semibold text-white bg-green-500 hover:bg-green-600 rounded-xl transition-all">
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

                        {/* ===== Vial / Bottle Calculator ===== */}
                        <form
                            onSubmit={calculateVials}
                            className="mt-8 p-8 bg-white rounded-3xl border border-slate-200 hover:border-green-300 hover:shadow-xl transition-all duration-300"
                        >
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-14 h-14 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-center shrink-0">
                                    <FaCapsules className="text-green-500 text-2xl" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Vial / Bottle Calculator</h3>
                                    <p className="text-sm text-slate-500">
                                        Determine how many vials or bottles are needed based on strength, dose, frequency, and treatment duration.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Strength</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number" step="any" min="0"
                                            value={vialInput.strengthValue}
                                            onChange={(e) => setVialInput({ ...vialInput, strengthValue: e.target.value })}
                                            className="flex-1 min-w-0 px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                            placeholder="e.g. 500"
                                        />
                                        <select
                                            value={vialInput.strengthUnit}
                                            onChange={(e) => setVialInput({ ...vialInput, strengthUnit: e.target.value })}
                                            className="px-2 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white"
                                        >
                                            <option value="mg">mg</option>
                                            <option value="mcg">mcg</option>
                                            <option value="g">g</option>
                                            <option value="units">units</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 text-sm">
                                        <select
                                            value={vialInput.strengthBasis}
                                            onChange={(e) => setVialInput({ ...vialInput, strengthBasis: e.target.value })}
                                            className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white text-slate-700"
                                        >
                                            <option value="perMl">per volume</option>
                                            <option value="perVial">per vial</option>
                                        </select>
                                        {vialIsPerMl && (
                                            <>
                                                <input
                                                    type="number" step="any" min="0"
                                                    value={vialInput.strengthPerMl}
                                                    onChange={(e) => setVialInput({ ...vialInput, strengthPerMl: e.target.value })}
                                                    className="w-16 px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                                    placeholder="1"
                                                />
                                                <span className="text-slate-500 text-xs">mL</span>
                                            </>
                                        )}
                                    </div>
                                    <p className="mt-1 text-[11px] text-slate-400">
                                        {vialIsPerMl
                                            ? 'e.g. 500 mg per 5 mL → enter 500 mg, per volume 5 mL'
                                            : 'e.g. 1 g per vial → enter 1 g, per vial'}
                                    </p>
                                </div>

                                {vialIsPerMl && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Bottle / vial volume <span className="text-slate-400 font-normal">(mL)</span>
                                        </label>
                                        <input
                                            type="number" step="any" min="0"
                                            value={vialInput.vialVolume}
                                            onChange={(e) => setVialInput({ ...vialInput, vialVolume: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                            placeholder="e.g. 100"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Dose per administration</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number" step="any" min="0"
                                            value={vialInput.doseValue}
                                            onChange={(e) => setVialInput({ ...vialInput, doseValue: e.target.value })}
                                            className="flex-1 min-w-0 px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                            placeholder="e.g. 250"
                                        />
                                        <select
                                            value={vialInput.doseUnit}
                                            onChange={(e) => setVialInput({ ...vialInput, doseUnit: e.target.value })}
                                            className="px-2 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white"
                                        >
                                            <option value="mg">mg</option>
                                            <option value="mcg">mcg</option>
                                            <option value="g">g</option>
                                            <option value="units">units</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Frequency</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number" step="any" min="0"
                                            value={vialInput.freqValue}
                                            onChange={(e) => setVialInput({ ...vialInput, freqValue: e.target.value })}
                                            className="flex-1 min-w-0 px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                            placeholder="e.g. 3"
                                        />
                                        <select
                                            value={vialInput.freqType}
                                            onChange={(e) => setVialInput({ ...vialInput, freqType: e.target.value })}
                                            className="px-2 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white"
                                        >
                                            <option value="perDay">times per day</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Treatment duration <span className="text-slate-400 font-normal">(days)</span>
                                    </label>
                                    <input
                                        type="number" step="any" min="0"
                                        value={vialInput.durationDays}
                                        onChange={(e) => setVialInput({ ...vialInput, durationDays: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                        placeholder="e.g. 7"
                                    />
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Vial / bottle type</label>
                                <div className="flex flex-wrap gap-3">
                                    <label
                                        className={`flex items-start gap-2 px-4 py-3 border rounded-xl cursor-pointer transition-all flex-1 min-w-[180px] ${
                                            vialInput.vialType === 'multi'
                                                ? 'border-green-500 bg-green-50'
                                                : 'border-slate-200 bg-white hover:border-green-200'
                                        }`}
                                    >
                                        <input
                                            type="radio" name="vialType" value="multi"
                                            checked={vialInput.vialType === 'multi'}
                                            onChange={() => setVialInput({ ...vialInput, vialType: 'multi' })}
                                            className="mt-1 accent-green-500"
                                        />
                                        <span className="text-sm">
                                            <span className="font-semibold text-slate-800 block">Multi-use</span>
                                            <span className="text-xs text-slate-500">Remainder can be used for later doses</span>
                                        </span>
                                    </label>
                                    <label
                                        className={`flex items-start gap-2 px-4 py-3 border rounded-xl cursor-pointer transition-all flex-1 min-w-[180px] ${
                                            vialInput.vialType === 'single'
                                                ? 'border-green-500 bg-green-50'
                                                : 'border-slate-200 bg-white hover:border-green-200'
                                        }`}
                                    >
                                        <input
                                            type="radio" name="vialType" value="single"
                                            checked={vialInput.vialType === 'single'}
                                            onChange={() => setVialInput({ ...vialInput, vialType: 'single' })}
                                            className="mt-1 accent-green-500"
                                        />
                                        <span className="text-sm">
                                            <span className="font-semibold text-slate-800 block">Single-use</span>
                                            <span className="text-xs text-slate-500">Discard remainder after each dose</span>
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <button type="submit" className="mt-5 w-full py-3 text-sm font-semibold text-white bg-green-500 hover:bg-green-600 rounded-xl transition-all">
                                Calculate Vials / Bottles
                            </button>

                            {vialResult && vialResult.error && (
                                <p className="mt-4 text-sm text-red-500 font-medium">{vialResult.error}</p>
                            )}

                            {vialResult && !vialResult.error && (
                                <div className="mt-6 border-t border-slate-100 pt-5">
                                    <div className="text-center mb-4">
                                        <p className="text-4xl font-black text-green-600">{fmt(vialResult.vialsNeeded, 0)}</p>
                                        <p className="text-sm text-slate-500 mt-1">
                                            {vialResult.vialsNeeded === 1 ? 'vial / bottle needed' : 'vials / bottles needed'}
                                        </p>
                                    </div>
                                    <div className="space-y-2 max-w-2xl mx-auto">
                                        {vialBreakdown.map(([key, val]) => (
                                            <div
                                                key={key}
                                                className="flex justify-between gap-4 text-sm py-1 border-b border-dashed border-slate-100 last:border-0"
                                            >
                                                <span className="text-slate-500">{key}</span>
                                                <span className="font-semibold text-slate-800 text-right">{val}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <p className="mt-5 text-xs text-slate-500 leading-relaxed">
                                <strong>Note:</strong> This calculator is for planning purposes only. Multi-use vial
                                calculations assume the vial remains stable for the entire treatment period — check the
                                beyond-use date (BUD) after opening. Frequencies that don't divide evenly into 24 hours
                                are rounded up to whole administrations.
                            </p>
                        </form>

                        <p className="mt-10 text-center text-xs text-slate-500 max-w-2xl mx-auto leading-relaxed">
                            <strong>Disclaimer:</strong> These calculators are for educational and informational purposes only and are not a substitute for clinical judgement. eGFR is normalized to 1.73 m² and may not match drug-label dosing methods (e.g., Cockcroft-Gault). Always follow the specific product label or institutional protocol.
                        </p>
                    </div>
                </div>

                {/* ===== For Clients ===== */}
                <div id="clients" className="bg-white py-20 border-t border-slate-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">For Clients</h2>
                            <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
                                መድኃኒትዎን በአግባቡ ለመጠቀም የሚረዱ አስፈላጊ ምክሮች።
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {CLIENT_TIPS.map((tip, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-start gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:border-green-300 hover:shadow-md transition-all duration-300"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center shrink-0">
                                        <FaCheckCircle className="text-green-500" />
                                    </div>
                                    <p className="text-sm md:text-base text-slate-700 leading-relaxed pt-1.5">{tip}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Trust / AAU */}
                <div id="about" className="bg-[#1A2535] py-24 text-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6 text-white drop-shadow-sm">Built on Academic Excellence</h2>
                                <p className="text-white/95 text-lg leading-relaxed mb-8 font-medium">
                                    Addis Med integrates health and medicines information with digital technology. Our platform ensures that healthcare providers have access to reliable, localized data.
                                </p>
                                <ul className="space-y-4">
                                    {['Support the optimization of medicines use', 'Provide medication related information'].map((item, i) => (
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
                                        <img src="/Addis Ababa University Logo.svg" alt="AAU Logo" className="w-28 h-28 object-contain" />
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

            <footer id="contact" className="bg-slate-50 border-t border-slate-200 pt-16 pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm overflow-hidden">
                            <img src="/logo.png" alt="Addis Med Logo" className="w-full h-full object-contain" />
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
