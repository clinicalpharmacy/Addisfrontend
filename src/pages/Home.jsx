import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    FaUserInjured,
    FaPills,
    FaVial,
    FaUserMd,
    FaArrowRight,
    FaHeartbeat,
    FaLeaf,
    FaBookOpen,
    FaStethoscope,
    FaCalendarCheck,
    FaSun,
    FaMoon,
    FaCloudSun,
    FaStar,
    FaChartLine,
    FaShieldAlt,
    FaClipboardList,
    FaSearch,
    FaInfoCircle
} from 'react-icons/fa';

const Home = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [greetingIcon, setGreetingIcon] = useState(<FaSun className="animate-spin-slow" />);
    const [featuredTip, setFeaturedTip] = useState(0);
    const [showWelcome, setShowWelcome] = useState(true);
    const [statsVisible, setStatsVisible] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) {
            setGreetingIcon(<FaSun className="animate-bounce text-yellow-300" />);
            return 'Good morning';
        }
        if (hour < 18) {
            setGreetingIcon(<FaCloudSun className="animate-pulse text-orange-300" />);
            return 'Good afternoon';
        }
        setGreetingIcon(<FaMoon className="animate-pulse text-blue-200" />);
        return 'Good evening';
    };

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        
        // Simulate stats loading
        setTimeout(() => setStatsVisible(true), 500);
        
        return () => clearInterval(timer);
    }, []);

    // Rotate health tips
    useEffect(() => {
        const tipInterval = setInterval(() => {
            setFeaturedTip((prev) => (prev + 1) % healthTips.length);
        }, 5000);
        return () => clearInterval(tipInterval);
    }, []);

    // Track mouse movement for parallax effect
    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePosition({
                x: (e.clientX / window.innerWidth - 0.5) * 20,
                y: (e.clientY / window.innerHeight - 0.5) * 20
            });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const healthTips = [
        { icon: FaHeartbeat, text: "Stay hydrated - drink 8 glasses of water daily", color: "from-blue-400 to-blue-600" },
        { icon: FaLeaf, text: "Include colorful vegetables in your meals", color: "from-green-400 to-green-600" },
        { icon: FaMoon, text: "Get 7-8 hours of quality sleep", color: "from-purple-400 to-purple-600" },
        { icon: FaStethoscope, text: "Regular check-ups prevent health issues", color: "from-red-400 to-red-600" }
    ];

    const quickStats = [
        { label: "Active Patients", value: "1,247", icon: FaUserInjured, color: "blue" },
        { label: "Medications", value: "3,892", icon: FaPills, color: "purple" },
        { label: "Remedies", value: "156", icon: FaVial, color: "green" },
        { label: "Daily Consultations", value: "89", icon: FaStethoscope, color: "orange" }
    ];

    const features = [
        { icon: FaShieldAlt, title: "Secure & Private", description: "Your data is encrypted and protected" },
        { icon: FaChartLine, title: "Track Progress", description: "Monitor health improvements over time" },
        { icon: FaClipboardList, title: "Digital Records", description: "Access your health history anytime" }
    ];

    const TipIcon = healthTips[featuredTip].icon;

    // Get user role from localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    const isAdmin = user?.role === 'admin';

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div 
                    className="absolute top-20 left-20 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"
                    style={{ transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)` }}
                ></div>
                <div 
                    className="absolute top-40 right-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"
                    style={{ transform: `translate(${-mousePosition.x}px, ${-mousePosition.y}px)` }}
                ></div>
                <div 
                    className="absolute bottom-20 left-1/2 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"
                    style={{ transform: `translate(${mousePosition.y}px, ${-mousePosition.x}px)` }}
                ></div>
                
                {/* Floating medical symbols */}
                <FaHeartbeat className="absolute top-1/4 left-1/4 text-blue-200 opacity-10 text-7xl animate-float" />
                <FaPills className="absolute bottom-1/4 right-1/4 text-purple-200 opacity-10 text-7xl animate-float-delayed" />
                <FaUserMd className="absolute top-3/4 left-1/3 text-green-200 opacity-10 text-7xl animate-float-slow" />
            </div>

            <div className="relative z-10 space-y-8 px-6 max-w-7xl mx-auto py-8">
                {/* Enhanced Welcome Section with Parallax */}
                <div 
                    className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-2xl transform hover:scale-[1.02] transition-transform duration-500 relative overflow-hidden group"
                    style={{
                        transform: `perspective(1000px) rotateX(${mousePosition.y * 0.5}deg) rotateY(${mousePosition.x * 0.5}deg)`
                    }}
                >
                    {/* Animated background pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M30 0 L30 60 M0 30 L60 30" stroke="white" stroke-width="0.5"%3E%3C/path%3E%3C/svg%3E')] bg-repeat animate-pulse"></div>
                    </div>

                    <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center">
                        <div className="transform transition-all duration-700 hover:translate-x-2">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm animate-pulse">
                                    {greetingIcon}
                                </div>
                                <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
                                    {getGreeting()}.
                                </h1>
                            </div>
                            <p className="text-blue-100 text-lg flex items-center gap-2">
                                <FaStethoscope className="animate-pulse" />
                                AddisMed Digital Health Platform
                            </p>
                            
                            {/* Animated Health Tip */}
                            {showWelcome && (
                                <div className="mt-4 flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 w-fit animate-slide-in">
                                    <div className={`p-1 bg-gradient-to-r ${healthTips[featuredTip].color} rounded-full`}>
                                        <TipIcon className="text-white text-sm" />
                                    </div>
                                    <p className="text-sm text-white font-light">
                                        {healthTips[featuredTip].text}
                                    </p>
                                </div>
                            )}
                        </div>
                        
                        <div className="mt-6 md:mt-0 text-right transform transition-all duration-700 hover:scale-110">
                            <div className="flex items-center gap-3 justify-end">
                                <FaCalendarCheck className="text-2xl text-blue-200 animate-bounce" />
                                <p className="text-sm text-blue-200 font-medium tracking-wide">
                                    {currentTime.toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                            <div className="relative mt-2">
                                <p className="text-5xl font-bold font-mono tracking-wider bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2 inline-block">
                                    {currentTime.toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit'
                                    })}
                                </p>
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Preview */}
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {quickStats.map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                                <div 
                                    key={index}
                                    className={`bg-white/10 backdrop-blur-sm rounded-xl p-3 transform transition-all duration-500 hover:scale-105 hover:bg-white/20 ${
                                        statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                                    }`}
                                    style={{ transitionDelay: `${index * 100}ms` }}
                                >
                                    <div className="flex items-center gap-2">
                                        <Icon className={`text-${stat.color}-300 text-xl`} />
                                        <div>
                                            <p className="text-2xl font-bold">{stat.value}</p>
                                            <p className="text-xs text-blue-200">{stat.label}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Features Banner */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <div 
                                key={index}
                                className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1 border border-white/50"
                                style={{ animationDelay: `${index * 150}ms` }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg text-white">
                                        <Icon className="text-xl animate-pulse" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800">{feature.title}</h3>
                                        <p className="text-xs text-gray-600">{feature.description}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Quick Access Grid with Enhanced Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-fr">
                    {/* Patients - Hidden for Admin */}
                    {!isAdmin && (
                        <Link 
                            to="/patients" 
                            className="group bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-[1.02] border border-transparent hover:border-blue-200 relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
                            <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-200 rounded-full opacity-0 group-hover:opacity-20 transition-all duration-500 group-hover:scale-150"></div>
                            
                            <div className="flex items-center gap-5 mb-4 relative">
                                <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                                    <FaUserInjured className="text-blue-600 text-3xl group-hover:animate-bounce" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-blue-900 transition-all">
                                        Patients
                                    </h2>
                                    <p className="text-sm text-gray-600 flex items-center gap-1">
                                        <FaInfoCircle className="text-blue-400 text-xs" />
                                        Medicines review for individual patients
                                    </p>
                                </div>
                                <div className="p-2 bg-blue-50 rounded-full group-hover:bg-blue-100 transition-all group-hover:scale-110 group-hover:rotate-45">
                                    <FaArrowRight className="text-blue-600" />
                                </div>
                            </div>
                            
                            {/* Progress indicator */}
                            <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full w-3/4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full group-hover:animate-pulse"></div>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">75% of patients reviewed today</p>
                        </Link>
                    )}

                    {/* Home Remedies */}
                    <Link 
                        to="/knowledge/remedies" 
                        className="group bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-[1.02] border border-transparent hover:border-green-200 relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
                        <div className="absolute -right-10 -top-10 w-32 h-32 bg-green-200 rounded-full opacity-0 group-hover:opacity-20 transition-all duration-500 group-hover:scale-150"></div>
                        
                        <div className="flex items-center gap-5 mb-4 relative">
                            <div className="p-4 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500">
                                <FaVial className="text-green-600 text-3xl group-hover:animate-bounce" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent group-hover:from-green-700 group-hover:to-green-900 transition-all">
                                    Home Remedies
                                </h2>
                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                    <FaLeaf className="text-green-400 text-xs" />
                                    Natural & home-made remedies
                                </p>
                            </div>
                            <div className="p-2 bg-green-50 rounded-full group-hover:bg-green-100 transition-all group-hover:scale-110 group-hover:-rotate-45">
                                <FaArrowRight className="text-green-600" />
                            </div>
                        </div>
                        
                        <div className="flex gap-2 mt-2">
                            {['🌿', '🍯', '🌼', '🍋'].map((emoji, i) => (
                                <span key={i} className="text-lg opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all" style={{ transitionDelay: `${i * 50}ms` }}>
                                    {emoji}
                                </span>
                            ))}
                        </div>
                    </Link>

                    {/* Medication Info */}
                    <Link 
                        to="/knowledge/medications" 
                        className="group bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-[1.02] border border-transparent hover:border-purple-200 relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
                        <div className="absolute -right-10 -top-10 w-32 h-32 bg-purple-200 rounded-full opacity-0 group-hover:opacity-20 transition-all duration-500 group-hover:scale-150"></div>
                        
                        <div className="flex items-center gap-5 mb-4 relative">
                            <div className="p-4 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                                <FaPills className="text-purple-600 text-3xl group-hover:animate-pulse" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent group-hover:from-purple-700 group-hover:to-purple-900 transition-all">
                                    Medication Info
                                </h2>
                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                    <FaSearch className="text-purple-400 text-xs" />
                                    Comprehensive medicines database
                                </p>
                            </div>
                            <div className="p-2 bg-purple-50 rounded-full group-hover:bg-purple-100 transition-all group-hover:scale-110 group-hover:rotate-12">
                                <FaArrowRight className="text-purple-600" />
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">3,892 drugs</span>
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Interactions</span>
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Dosages</span>
                        </div>
                    </Link>

                    {/* Minor Illnesses */}
                    <Link 
                        to="/knowledge/illnesses" 
                        className="group bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-[1.02] border border-transparent hover:border-orange-200 relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
                        <div className="absolute -right-10 -top-10 w-32 h-32 bg-orange-200 rounded-full opacity-0 group-hover:opacity-20 transition-all duration-500 group-hover:scale-150"></div>
                        
                        <div className="flex items-center gap-5 mb-4 relative">
                            <div className="p-4 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500">
                                <FaUserMd className="text-orange-600 text-3xl group-hover:animate-bounce" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent group-hover:from-orange-700 group-hover:to-orange-900 transition-all">
                                    Minor Illnesses
                                </h2>
                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                    <FaBookOpen className="text-orange-400 text-xs" />
                                    OTC-based treatment guides
                                </p>
                            </div>
                            <div className="p-2 bg-orange-50 rounded-full group-hover:bg-orange-100 transition-all group-hover:scale-110 group-hover:-rotate-12">
                                <FaArrowRight className="text-orange-600" />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-1 mt-2">
                            {['Cold', 'Flu', 'Headache', 'Allergy'].map((illness, i) => (
                                <span key={i} className="text-xs bg-orange-100 text-orange-700 px-1 py-1 rounded text-center group-hover:bg-orange-200 transition-all">
                                    {illness}
                                </span>
                            ))}
                        </div>
                    </Link>
                </div>

                {/* Enhanced Footer with Stats */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-2">
                            <FaStar className="text-yellow-500 animate-spin-slow" />
                            <p className="text-gray-700 font-medium">
                                Addismed - Supporting patient care decisions
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-sm text-gray-600">System Online</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FaShieldAlt className="text-blue-500" />
                                <span className="text-sm text-gray-600">HIPAA Compliant</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Live activity indicator */}
                    <div className="mt-4 flex items-center justify-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                            <span className="w-1 h-1 bg-green-500 rounded-full animate-ping"></span>
                            247 active users
                        </span>
                        <span>•</span>
                        <span>Updated 1 min ago</span>
                        <span>•</span>
                        <span className="text-blue-500 hover:underline cursor-pointer">View all activity</span>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes blob {
                    0% { transform: scale(1) translate(0px, 0px); }
                    33% { transform: scale(1.1) translate(30px, -50px); }
                    66% { transform: scale(0.9) translate(-20px, 20px); }
                    100% { transform: scale(1) translate(0px, 0px); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
                
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(5deg); }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                .animate-float-delayed {
                    animation: float 8s ease-in-out infinite;
                    animation-delay: 1s;
                }
                .animate-float-slow {
                    animation: float 10s ease-in-out infinite;
                    animation-delay: 2s;
                }
                
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 3s linear infinite;
                }
                
                @keyframes slide-in {
                    0% { opacity: 0; transform: translateX(-20px); }
                    100% { opacity: 1; transform: translateX(0); }
                }
                .animate-slide-in {
                    animation: slide-in 0.5s ease-out;
                }
            `}</style>
        </div>
    );
};

export default Home;
