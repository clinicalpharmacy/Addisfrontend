import React, { useState, useEffect } from 'react';
import { FaBriefcase, FaBuilding, FaMapMarkerAlt, FaCalendarAlt, FaExternalLinkAlt, FaSearch, FaUserMd, FaMoneyBillWave, FaClock } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { format } from 'date-fns';

const Vacancies = () => {
    const [vacancies, setVacancies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLocation, setFilterLocation] = useState('');

    useEffect(() => {
        fetchVacancies();
    }, []);

    const fetchVacancies = async () => {
        try {
            setLoading(true);
            const data = await api.get('/vacancies');
            if (data.success) {
                setVacancies(data.vacancies || []);
            }
        } catch (error) {
            console.error('Error fetching vacancies:', error);
        } finally {
            setLoading(false);
        }
    };

    const locations = [...new Set(vacancies.map(v => v.location))].filter(Boolean);

    const filteredVacancies = vacancies.filter(v => {
        const matchesSearch = (v.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                              (v.company?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                              (v.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        const matchesLocation = filterLocation ? v.location === filterLocation : true;
        return matchesSearch && matchesLocation;
    });

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* Simple Navigation */}
            <div className="bg-white py-4 px-6 border-b flex justify-between items-center shadow-sm">
                <Link to="/" className="flex items-center gap-2 cursor-pointer">
                    <img src="/logo.png" alt="Addis Med Logo" className="w-10 h-10 rounded-lg object-contain" />
                    <span className="font-bold text-xl text-gray-800 tracking-tight">Addis Med</span>
                </Link>
                <Link to="/" className="text-sm font-medium text-gray-600 hover:text-green-600 transition-colors">Back to Home</Link>
            </div>
            {/* Header Section */}
            <div className="bg-gradient-to-r from-green-600 to-green-500 text-white pt-32 pb-20 px-4 text-center">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">
                        Healthcare Opportunities
                    </h1>
                    <p className="text-xl text-green-100 font-medium mb-10 max-w-2xl mx-auto leading-relaxed">
                        Discover your next career move. Browse the latest job vacancies in the healthcare sector.
                    </p>

                    {/* Search Bar */}
                    <div className="bg-white p-3 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-3 max-w-3xl mx-auto">
                        <div className="flex-1 relative">
                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                                type="text"
                                placeholder="Search roles, companies, or keywords..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-green-500 text-gray-900 font-medium placeholder-gray-400"
                            />
                        </div>
                        <select 
                            value={filterLocation}
                            onChange={(e) => setFilterLocation(e.target.value)}
                            className="px-4 py-3.5 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-green-500 text-gray-700 font-medium md:w-48 appearance-none cursor-pointer"
                        >
                            <option value="">All Locations</option>
                            {locations.map((loc, i) => (
                                <option key={i} value={loc}>{loc}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="flex-grow max-w-6xl mx-auto w-full px-4 py-16">
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin w-12 h-12 border-4 border-green-200 border-t-green-500 rounded-full"></div>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black text-gray-900">
                                {filteredVacancies.length} {filteredVacancies.length === 1 ? 'Opportunity' : 'Opportunities'} Found
                            </h2>
                        </div>

                        {filteredVacancies.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredVacancies.map((vacancy) => (
                                    <div key={vacancy.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="bg-green-50 p-3 rounded-xl group-hover:bg-green-500 transition-colors duration-300">
                                                <FaBriefcase className="text-xl text-green-500 group-hover:text-white transition-colors duration-300" />
                                            </div>
                                            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-100">
                                                Active
                                            </span>
                                        </div>
                                        
                                        <h3 className="text-2xl font-black text-gray-900 mb-2 leading-tight">
                                            {vacancy.title}
                                        </h3>
                                        
                                        <div className="space-y-2.5 mb-5 flex-grow">
                                            <div className="flex items-center text-base font-bold text-gray-600">
                                                <FaBuilding className="mr-2.5 text-gray-400" />
                                                {vacancy.company}
                                            </div>
                                            <div className="flex items-center text-base font-medium text-gray-500">
                                                <FaMapMarkerAlt className="mr-2.5 text-gray-400" />
                                                {vacancy.location}
                                            </div>
                                            {vacancy.employment_type && (
                                                <div className="flex items-center text-base font-medium text-gray-500">
                                                    <FaClock className="mr-2.5 text-gray-400" />
                                                    {vacancy.employment_type}
                                                </div>
                                            )}
                                            {vacancy.salary && (
                                                <div className="flex items-center text-base font-medium text-green-600 bg-green-50 w-fit px-2 py-0.5 rounded">
                                                    <FaMoneyBillWave className="mr-2.5 text-green-500" />
                                                    {vacancy.salary}
                                                </div>
                                            )}
                                            {vacancy.deadline && (
                                                <div className="flex items-center text-base font-medium text-gray-500">
                                                    <FaCalendarAlt className="mr-2.5 text-gray-400" />
                                                    Deadline: {format(new Date(vacancy.deadline), 'MMM dd, yyyy')}
                                                </div>
                                            )}
                                        </div>

                                        <p className="text-base text-gray-700 whitespace-pre-line mb-6 flex-grow leading-relaxed">
                                            {vacancy.description}
                                        </p>

                                        {vacancy.url && (
                                            <a 
                                                href={vacancy.url.startsWith('http') ? vacancy.url : `https://${vacancy.url}`}
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="w-full py-3.5 bg-green-500 hover:bg-green-600 text-white text-sm font-black rounded-xl transition-colors flex items-center justify-center gap-2 group/btn shadow-sm"
                                            >
                                                Apply Now
                                                <FaExternalLinkAlt className="text-[10px] group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 py-24 px-4 text-center">
                                <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FaSearch className="text-3xl text-gray-300" />
                                </div>
                                <h3 className="text-xl font-black text-gray-900 mb-2">No vacancies found</h3>
                                <p className="text-gray-500 font-medium">Try adjusting your search filters or check back later for new opportunities.</p>
                                {(searchTerm || filterLocation) && (
                                    <button 
                                        onClick={() => { setSearchTerm(''); setFilterLocation(''); }}
                                        className="mt-6 text-green-500 font-black hover:text-green-600 underline underline-offset-4 decoration-2"
                                    >
                                        Clear all filters
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            <footer className="bg-white border-t border-gray-200 mt-auto py-8">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-gray-500 text-sm">© {new Date().getFullYear()} Addis Med. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default Vacancies;
