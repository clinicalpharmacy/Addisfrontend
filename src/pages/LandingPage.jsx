import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    FaUserMd, FaHeartbeat, FaShieldAlt, FaPills, FaClipboardList,
    FaArrowRight, FaCheckCircle, FaBookMedical, FaBookOpen,
    FaBars, FaBook, FaCapsules, FaNotesMedical, FaTimes
} from 'react-icons/fa';

const LandingPage = () => {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        {/* Logo */}
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
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
                            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-blue-700 transition-colors">Features</a>
                            <a href="#about" className="text-sm font-medium text-slate-600 hover:text-blue-700 transition-colors">About Us</a>
                            <a href="#contact" className="text-sm font-medium text-slate-600 hover:text-blue-700 transition-colors">Contact</a>
                        </div>

                        {/* Desktop Action Buttons */}
                        <div className="hidden md:flex items-center gap-4">
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
                            <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 text-base font-medium text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg">Features</a>
                            <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 text-base font-medium text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg">About Us</a>
                            <a href="#contact" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 text-base font-medium text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg">Contact</a>
                            <div className="border-t border-slate-100 my-2 pt-2"></div>
                            <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 text-base font-medium text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg">Sign In</Link>
                            <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 text-base font-medium text-blue-700 bg-blue-50 rounded-lg mt-2 text-center border border-blue-100">Get Started</Link>
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
                        <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[1.1] mb-6 max-w-4xl mx-auto">
                            Your Trusted Partner in <span className="text-green-500">Digital Health</span>
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
                            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Comprehensive Healthcare Tools</h2>
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
                                    title: 'Safety Screening',
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
                                    desc: 'Automated features that provide educational contents for healthcare professionals and students'
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
