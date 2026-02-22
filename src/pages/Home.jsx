import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    FaUserInjured,
    FaPills,
    FaVial,
    FaUserMd,
    FaArrowRight,
    FaHeartbeat,
    FaShieldAlt,
    FaChartLine,
    FaBell,
    FaCalendarCheck,
    FaClock,
    FaSun,
    FaMoon,
    FaCloudSun,
    FaLeaf,
    FaFlask,
    FaBookOpen,
    FaStethoscope
} from 'react-icons/fa';

const Home = () => {
    const [greeting, setGreeting] = useState('');
    const [greetingIcon, setGreetingIcon] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [quote, setQuote] = useState('');
    const [weatherEffect, setWeatherEffect] = useState('sunny');
    const [recentActivities, setRecentActivities] = useState([]);
    const [showWelcomeAnimation, setShowWelcomeAnimation] = useState(true);
    const [hoveredCard, setHoveredCard] = useState(null);
    const [user, setUser] = useState(null);

    // Medical quotes for inspiration
    const quotes = [
        { text: "The art of medicine consists of amusing the patient while nature cures the disease.", author: "Voltaire" },
        { text: "Wherever the art of medicine is loved, there is also a love of humanity.", author: "Hippocrates" },
        { text: "Medicine is not only a science; it is also an art. It does not consist of compounding pills and plasters.", author: "Paracelsus" },
        { text: "The best medicine is to prevent disease from occurring.", author: "Chinese Proverb" },
        { text: "Healing is a matter of time, but it is sometimes also a matter of opportunity.", author: "Hippocrates" }
    ];

    useEffect(() => {
        // Get user from localStorage
        const userData = JSON.parse(localStorage.getItem('user'));
        setUser(userData);

        // Update greeting
        const hour = new Date().getHours();
        if (hour < 12) {
            setGreeting('Good morning');
            setGreetingIcon(<FaSun className="animate-spin-slow" />);
            setWeatherEffect('morning');
        } else if (hour < 18) {
            setGreeting('Good afternoon');
            setGreetingIcon(<FaCloudSun className="animate-bounce-slow" />);
            setWeatherEffect('afternoon');
        } else {
            setGreeting('Good evening');
            setGreetingIcon(<FaMoon className="animate-pulse" />);
            setWeatherEffect('evening');
        }

        // Get random quote
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        setQuote(randomQuote);

        // Update time every second
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        // Simulate recent activities
        setRecentActivities([
            { id: 1, action: 'Patient review completed', time: '5 min ago', icon: FaUserInjured, color: 'blue' },
            { id: 2, action: 'Medication info accessed', time: '15 min ago', icon: FaPills, color: 'purple' },
            { id: 3, action: 'Home remedy saved', time: '32 min ago', icon: FaLeaf, color: 'green' }
        ]);

        // Hide welcome animation after 3 seconds
        const animationTimer = setTimeout(() => {
            setShowWelcomeAnimation(false);
        }, 3000);

        return () => {
            clearInterval(timer);
            clearTimeout(animationTimer);
        };
    }, []);

    // Get greeting-specific styles
    const getGreetingStyles = () => {
        switch(weatherEffect) {
            case 'morning':
                return 'from-amber-400 via-orange-400 to-rose-400';
            case 'afternoon':
                return 'from-sky-400 via-blue-400 to-indigo-400';
            case 'evening':
                return 'from-indigo-800 via-purple-800 to-pink-800';
            default:
                return 'from-blue-500 to-purple-600';
        }
    };

    // Card data with enhanced properties
    const cards = [
        {
            id: 'patients',
            title: 'Patients',
            description: 'Medicines review for individual patients',
            icon: FaUserInjured,
            color: 'blue',
            gradient: 'from-blue-500 to-blue-600',
            lightBg: 'bg-blue-50',
            link: '/patients',
            role: 'non-admin',
            stats: '24 active',
            icon2: FaStethoscope
        },
        {
            id: 'remedies',
            title: 'Home Remedies',
            description: 'Natural and home-made remedies',
            icon: FaLeaf,
            color: 'green',
            gradient: 'from-green-500 to-emerald-600',
            lightBg: 'bg-green-50',
            link: '/knowledge/remedies',
            stats: '156 remedies',
            icon2: FaFlask
        },
        {
            id: 'medications',
            title: 'Medication Info',
            description: 'Comprehensive medicines database',
            icon: FaPills,
            color: 'purple',
            gradient: 'from-purple-500 to-purple-600',
            lightBg: 'bg-purple-50',
            link: '/knowledge/medications',
            stats: '2.5k+ drugs',
            icon2: FaBookOpen
        },
        {
            id: 'illnesses',
            title: 'Minor Illnesses',
            description: 'OTC-based treatment guides',
            icon: FaUserMd,
            color: 'orange',
            gradient: 'from-orange-500 to-red-500',
            lightBg: 'bg-orange-50',
            link: '/knowledge/illnesses',
            stats: '85 conditions',
            icon2: FaHeartbeat
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            <div className="relative space-y-6 px-4 md:px-6 max-w-7xl mx-auto py-6">
                {/* Welcome Animation Overlay */}
                {showWelcomeAnimation && (
                    <div className="fixed inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm z-50 animate-fade-out">
                        <div className="text-center">
                            <div className="relative">
                                <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-4 animate-pulse"></div>
                                <FaHeartbeat className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-4xl animate-ping" />
                            </div>
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent animate-slide-up">
                                Welcome back!
                            </h2>
                            <p className="text-gray-600 mt-2 animate-slide-up animation-delay-300">
                                {user?.name || 'Loading your dashboard...'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Enhanced Welcome Section */}
                <div className={`bg-gradient-to-r ${getGreetingStyles()} rounded-3xl p-8 text-white shadow-2xl transform transition-all duration-500 hover:scale-[1.02] hover:shadow-3xl relative overflow-hidden group`}>
                    {/* Animated background patterns */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white rounded-full animate-ping"></div>
                        <div className="absolute -left-10 -bottom-10 w-60 h-60 bg-white rounded-full animate-pulse"></div>
                    </div>
                    
                    {/* Medical icons floating in background */}
                    <FaHeartbeat className="absolute right-20 top-5 text-white opacity-5 text-7xl animate-float" />
                    <FaShieldAlt className="absolute left-20 bottom-5 text-white opacity-5 text-7xl animate-float animation-delay-1000" />
                    <FaChartLine className="absolute right-40 bottom-10 text-white opacity-5 text-6xl animate-float animation-delay-2000" />
                    
                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                            <div className="group-hover:transform group-hover:translate-x-2 transition-transform duration-300">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-4xl animate-float">
                                        {greetingIcon}
                                    </span>
                                    <h1 className="text-3xl md:text-4xl font-bold">
                                        {greeting}, {user?.name?.split(' ')[0] || 'User'}!
                                    </h1>
                                </div>
                                <p className="text-white/90 text-lg flex items-center gap-2">
                                    <FaHeartbeat className="animate-pulse" />
                                    {quote.text}
                                </p>
                                <p className="text-white/70 text-sm mt-1 italic">
                                    — {quote.author}
                                </p>
                            </div>
                            
                            <div className="mt-4 md:mt-0 text-right bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20 group-hover:scale-105 transition-all duration-300">
                                <div className="flex items-center gap-3 justify-end">
                                    <FaCalendarCheck className="text-2xl animate-bounce-slow" />
                                    <p className="text-sm text-white/80">
                                        {currentTime.toLocaleDateString('en-US', {
                                            weekday: 'short',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 justify-end mt-2">
                                    <FaClock className="text-xl animate-spin-slow" />
                                    <p className="text-3xl font-bold font-mono">
                                        {currentTime.toLocaleTimeString('en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats Row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-3 border border-white/20 transform hover:scale-105 transition-all duration-300">
                                <p className="text-xs text-white/70">Patients Today</p>
                                <p className="text-xl font-bold">12</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-3 border border-white/20 transform hover:scale-105 transition-all duration-300">
                                <p className="text-xs text-white/70">Remedies</p>
                                <p className="text-xl font-bold">156</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-3 border border-white/20 transform hover:scale-105 transition-all duration-300">
                                <p className="text-xs text-white/70">Medications</p>
                                <p className="text-xl font-bold">2.5k+</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-3 border border-white/20 transform hover:scale-105 transition-all duration-300">
                                <p className="text-xs text-white/70">Conditions</p>
                                <p className="text-xl font-bold">85</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content - Quick Access Grid */}
                    <div className="lg:col-span-2">
                        {/* Section Title */}
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                                Quick Access
                            </h2>
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse animation-delay-300"></div>
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse animation-delay-600"></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {cards.map((card) => {
                                const Icon = card.icon;
                                const Icon2 = card.icon2;
                                
                                // Skip patients card for admin
                                if (card.id === 'patients' && user?.role === 'admin') {
                                    return null;
                                }

                                return (
                                    <Link
                                        key={card.id}
                                        to={card.link}
                                        onMouseEnter={() => setHoveredCard(card.id)}
                                        onMouseLeave={() => setHoveredCard(null)}
                                        className="group relative bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all duration-500 hover:scale-105 hover:shadow-2xl"
                                    >
                                        {/* Animated background gradient */}
                                        <div className={`absolute inset-0 bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                                        
                                        {/* Corner decoration */}
                                        <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${card.gradient} opacity-20 rounded-bl-full transform translate-x-10 -translate-y-10 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-500`}></div>
                                        
                                        <div className="relative p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={`relative p-4 ${card.lightBg} rounded-2xl group-hover:scale-110 transition-transform duration-300`}>
                                                        <Icon className={`text-${card.color}-600 text-3xl relative z-10`} />
                                                        <div className={`absolute inset-0 bg-gradient-to-r ${card.gradient} rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
                                                        <Icon2 className={`absolute -bottom-1 -right-1 text-${card.color}-400 text-sm opacity-0 group-hover:opacity-100 transition-all duration-300`} />
                                                    </div>
                                                    <div>
                                                        <h2 className="text-xl font-bold text-gray-800 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-gray-800 group-hover:to-gray-600 transition-all duration-300">
                                                            {card.title}
                                                        </h2>
                                                        <p className="text-sm text-gray-500 mt-1">{card.description}</p>
                                                    </div>
                                                </div>
                                                
                                                {/* Stats badge */}
                                                <div className={`px-2 py-1 ${card.lightBg} rounded-full text-${card.color}-600 text-xs font-bold`}>
                                                    {card.stats}
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 bg-${card.color}-500 rounded-full animate-pulse`}></div>
                                                    <span className="text-xs text-gray-400">Updated today</span>
                                                </div>
                                                <span className={`text-${card.color}-600 flex items-center gap-2 font-medium group-hover:gap-3 transition-all duration-300`}>
                                                    {card.id === 'patients' ? 'Open' : 
                                                     card.id === 'remedies' ? 'Browse' :
                                                     card.id === 'medications' ? 'Search' : 'View'}
                                                    <FaArrowRight className={`text-sm group-hover:translate-x-1 transition-transform duration-300 ${hoveredCard === card.id ? 'animate-bounce-x' : ''}`} />
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Sidebar - Recent Activity & Notifications */}
                    <div className="lg:col-span-1">
                        {/* Recent Activity Card */}
                        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 transform transition-all duration-300 hover:shadow-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <FaBell className="text-yellow-500 animate-bounce-slow" />
                                    Recent Activity
                                </h3>
                                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                                    3 new
                                </span>
                            </div>
                            
                            <div className="space-y-4">
                                {recentActivities.map((activity, index) => {
                                    const ActivityIcon = activity.icon;
                                    return (
                                        <div 
                                            key={activity.id}
                                            className="flex items-start gap-3 group hover:bg-gray-50 p-2 rounded-xl transition-all duration-300 transform hover:scale-105"
                                            style={{ animationDelay: `${index * 200}ms` }}
                                        >
                                            <div className={`p-2 bg-${activity.color}-100 rounded-lg group-hover:scale-110 transition-transform duration-300`}>
                                                <ActivityIcon className={`text-${activity.color}-600`} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-800">{activity.action}</p>
                                                <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                                            </div>
                                            <div className={`w-2 h-2 bg-${activity.color}-500 rounded-full animate-pulse`}></div>
                                        </div>
                                    );
                                })}
                            </div>
                            
                            <button className="w-full mt-6 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center gap-2 group">
                                View all activity
                                <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>

                        {/* Quick Tips Card */}
                        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <FaHeartbeat className="animate-pulse" />
                                Quick Tip
                            </h3>
                            <p className="text-sm text-white/90 mb-4">
                                Remember to check for potential drug interactions when prescribing new medications.
                            </p>
                            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-3 border border-white/20">
                                <p className="text-xs text-white/70">Did you know?</p>
                                <p className="text-sm font-medium mt-1">
                                    Regular medication reviews can reduce hospital admissions by up to 30%.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enhanced Footer */}
                <div className="relative mt-8 pt-8 border-t border-gray-200">
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-xl animate-pulse">
                            <FaHeartbeat className="text-white text-xl" />
                        </div>
                    </div>
                    
                    <div className="text-center">
                        <p className="text-gray-600 text-sm mb-2">
                            AddisMed - Supporting patient care decisions with evidence-based information
                        </p>
                        <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                            <span className="hover:text-gray-600 transition-colors cursor-pointer">About</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            <span className="hover:text-gray-600 transition-colors cursor-pointer">Privacy</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            <span className="hover:text-gray-600 transition-colors cursor-pointer">Terms</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            <span className="hover:text-gray-600 transition-colors cursor-pointer">Contact</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-4">
                            © 2024 AddisMed Digital Health. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 10s linear infinite;
                }
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 3s ease-in-out infinite;
                }
                @keyframes slide-up {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-up {
                    animation: slide-up 0.6s ease-out;
                }
                @keyframes fade-out {
                    0% { opacity: 1; }
                    70% { opacity: 1; }
                    100% { opacity: 0; visibility: hidden; }
                }
                .animate-fade-out {
                    animation: fade-out 3s ease-in-out forwards;
                }
                @keyframes bounce-x {
                    0%, 100% { transform: translateX(0); }
                    50% { transform: translateX(5px); }
                }
                .animate-bounce-x {
                    animation: bounce-x 0.5s ease-in-out infinite;
                }
                .animation-delay-300 {
                    animation-delay: 300ms;
                }
                .animation-delay-600 {
                    animation-delay: 600ms;
                }
                .animation-delay-1000 {
                    animation-delay: 1000ms;
                }
                .animation-delay-2000 {
                    animation-delay: 2000ms;
                }
                .animation-delay-4000 {
                    animation-delay: 4000ms;
                }
            `}</style>
        </div>
    );
};

export default Home;
