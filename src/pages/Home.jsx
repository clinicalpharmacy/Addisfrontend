import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    FaUserInjured,
    FaPills,
    FaVial,
    FaUserMd,
    FaArrowRight,
    FaBookmark,
    FaShieldAlt,
    FaUser,
    FaStethoscope,
    FaHeartbeat,
    FaTimes
} from 'react-icons/fa';

const Home = () => {
    const navigate = useNavigate();
    const [showSectionSelector, setShowSectionSelector] = useState(false);
    const [selectedSections, setSelectedSections] = useState({
        demography: false,
        diagnosis: false,
        anthropometry: false,
        vitals: false,
        labs: false,
        medication: false
    });
    const [showDiagnosisSubCategory, setShowDiagnosisSubCategory] = useState(false);
    const [diagnosisSubCategory, setDiagnosisSubCategory] = useState('');
    const [specialConditions, setSpecialConditions] = useState([
        'Kidney Impairment',
        'Liver Impairment'
    ]);
    const [newSpecialCondition, setNewSpecialCondition] = useState('');

    const user = JSON.parse(localStorage.getItem('user'));
    const role = user?.role;
    const isSecurityActive = !!user?.public_key;

    // Check user roles
    const isAdmin = user?.role === 'admin';
    const isCompanyAdmin = user?.role === 'company_admin';
    const isCompanyUser = !!user?.company_id || user?.account_type === 'company' || ['company_admin', 'company_user'].includes(user?.role);
    const isIndividual = !isAdmin && !isCompanyUser;
    
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const handleSectionToggle = (section) => {
        setSelectedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handleSectionSelectionConfirm = () => {
        const anySelected = Object.values(selectedSections).some(v => v === true);
        if (!anySelected) {
            alert('Please select at least one section to proceed.');
            return;
        }
        setShowSectionSelector(false);
        // If diagnosis is selected, show sub-category selection
        if (selectedSections.diagnosis) {
            setShowDiagnosisSubCategory(true);
        } else {
            // Navigate to patients page with selected sections
            navigate('/patients/new', { 
                state: { 
                    selectedSections,
                    fromHome: true 
                } 
            });
        }
    };

    const handleDiagnosisSubCategoryConfirm = () => {
        if (!diagnosisSubCategory) {
            alert('Please select a diagnosis sub-category.');
            return;
        }
        setShowDiagnosisSubCategory(false);
        navigate('/patients/new', { 
            state: { 
                selectedSections,
                diagnosisSubCategory,
                fromHome: true 
            } 
        });
    };

    const handleAddSpecialCondition = () => {
        if (newSpecialCondition.trim() === '') return;
        if (specialConditions.includes(newSpecialCondition.trim())) {
            alert('This condition already exists.');
            return;
        }
        setSpecialConditions(prev => [...prev, newSpecialCondition.trim()]);
        setNewSpecialCondition('');
    };

    const handleRemoveSpecialCondition = (condition) => {
        setSpecialConditions(prev => prev.filter(c => c !== condition));
    };

    // Handler for Medication Review click
    const handleMedicationReviewClick = () => {
        setShowSectionSelector(true);
    };

    return (
        <div className="page-container w-full max-w-full overflow-x-hidden px-2 sm:px-4 md:px-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-4 sm:p-6 text-white shadow-lg w-full mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold">
                            {getGreeting()}.
                        </h1>
                        <p className="text-blue-100 mt-1">
                            Addis Med Digital Health
                        </p>
                    </div>
                    <div className="text-left sm:text-right">
                        <p className="text-xs md:text-sm text-blue-200 uppercase tracking-wider">
                            {new Date().toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                            })}
                        </p>
                        <p className="text-xl md:text-2xl font-bold mt-1">
                            {new Date().toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Access Grid - Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* 1. Medication Availability */}
                <Link to="/medication-availability" className="bg-white rounded-xl shadow p-4 hover:shadow-md transition">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <FaPills className="text-yellow-600 text-lg" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-gray-800">መድሃኒት ማፈላለጊያ</h2>
                            <p className="text-xs text-gray-500">Medication availability</p>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <span className="text-yellow-600 text-sm flex items-center gap-1">
                            Search <FaArrowRight className="text-xs" />
                        </span>
                    </div>
                </Link>
                
                {/* 2. Medication Information */}
                <Link to="/knowledge/medications" className="bg-white rounded-xl shadow p-4 hover:shadow-md transition">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <FaPills className="text-purple-600 text-lg" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-gray-800">የመድሃኒት መረጃ</h2>
                            <p className="text-xs text-gray-500">Medicines database</p>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <span className="text-purple-600 text-sm flex items-center gap-1">
                            Search <FaArrowRight className="text-xs" />
                        </span>
                    </div>
                </Link>

                {/* 3. Quick Safety Check */}
                <Link to="/quick-safety" className="bg-white rounded-xl shadow p-4 hover:shadow-md transition border-2 border-transparent hover:border-blue-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <FaShieldAlt className="text-indigo-600 text-lg" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-gray-800">Quick Safety Check</h2>
                            <p className="text-xs text-gray-500">Pregnancy, elderly, organs</p>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <span className="text-indigo-600 text-sm flex items-center gap-1">
                            Check <FaArrowRight className="text-xs" />
                        </span>
                    </div>
                </Link>
            </div>

            {/* Quick Access Grid - Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* 4. Medication Review - Opens Section Selector */}
                {!isAdmin && user?.role !== 'healthcare_client' && (
                    <div 
                        onClick={handleMedicationReviewClick}
                        className="bg-white rounded-xl shadow p-4 hover:shadow-md transition cursor-pointer"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <FaUserInjured className="text-blue-600 text-lg" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-gray-800">Medication Review</h2>
                                <p className="text-xs text-gray-500">Review medication use</p>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <span className="text-blue-600 text-sm flex items-center gap-1">
                                Open <FaArrowRight className="text-xs" />
                            </span>
                        </div>
                    </div>
                )}

                {/* 5. Useful Links */}
                {(user?.role !== 'healthcare_client' || !isIndividual) && (
                    <Link to="/useful-links" className="bg-white rounded-xl shadow p-4 hover:shadow-md transition">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <FaBookmark className="text-green-600 text-lg" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-gray-800">Useful Links</h2>
                                <p className="text-xs text-gray-500">External resources & references</p>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <span className="text-green-600 text-sm flex items-center gap-1">
                                View <FaArrowRight className="text-xs" />
                            </span>
                        </div>
                    </Link>
                )}

                {/* 6. Home Remedies */}
                <Link to="/knowledge/remedies" className="bg-white rounded-xl shadow p-4 hover:shadow-md transition">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <FaVial className="text-green-600 text-lg" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-gray-800">የቤት ውስጥ ጤና ክብካቤ</h2>
                            <p className="text-xs text-gray-500">Home remedies</p>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <span className="text-green-600 text-sm flex items-center gap-1">
                            Browse <FaArrowRight className="text-xs" />
                        </span>
                    </div>
                </Link>
            </div>

            {/* Quick Access Grid - Row 3 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* 7. Minor Illnesses */}
                {['company_admin', 'company_user', 'pharmacist', 'pharmacy_student'].includes(role) && (
                    <Link to="/knowledge/illnesses" className="bg-white rounded-xl shadow p-4 hover:shadow-md transition">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <FaUserMd className="text-orange-600 text-lg" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-gray-800">Minor Illnesses</h2>
                                <p className="text-xs text-gray-500">OTC Treatment guides</p>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <span className="text-orange-600 text-sm flex items-center gap-1">
                                View <FaArrowRight className="text-xs" />
                            </span>
                        </div>
                    </Link>
                )}

                {/* 8. Compounding */}
                {['company_admin', 'company_user', 'pharmacist', 'pharmacy_student'].includes(role) && (
                    <Link to="/knowledge/compounding" className="bg-white rounded-xl shadow p-4 hover:shadow-md transition">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <FaUserMd className="text-orange-600 text-lg" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-gray-800">Compounding</h2>
                                <p className="text-xs text-gray-500">Compounding SOPs</p>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <span className="text-orange-600 text-sm flex items-center gap-1">
                                View <FaArrowRight className="text-xs" />
                            </span>
                        </div>
                    </Link>
                )}

                {/* 9. Education */}
                {['company_admin', 'company_user', 'pharmacist', 'pharmacy_student'].includes(role) && (
                    <Link to="/knowledge/Education" className="bg-white rounded-xl shadow p-4 hover:shadow-md transition">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <FaUserMd className="text-purple-600 text-lg" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-gray-800">Education</h2>
                                <p className="text-xs text-gray-500">Educational reviews</p>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <span className="text-purple-600 text-sm flex items-center gap-1">
                                View <FaArrowRight className="text-xs" />
                            </span>
                        </div>
                    </Link>
                )}
            </div>

            {/* --- SECTION SELECTOR MODAL --- */}
            {showSectionSelector && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <div className="text-center flex-1">
                                <FaUser className="text-4xl text-indigo-500 mx-auto mb-2" />
                                <h2 className="text-2xl font-bold text-gray-800">Which data are you gonna fill?</h2>
                                <p className="text-gray-500 text-sm mt-1">Select the sections you want to complete</p>
                            </div>
                            <button
                                onClick={() => setShowSectionSelector(false)}
                                className="text-gray-400 hover:text-gray-600 p-1"
                            >
                                <FaTimes className="text-xl" />
                            </button>
                        </div>
                        
                        <div className="space-y-3 mb-6">
                            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-indigo-50 transition cursor-pointer border border-gray-200 hover:border-indigo-300">
                                <input
                                    type="checkbox"
                                    checked={selectedSections.demography}
                                    onChange={() => handleSectionToggle('demography')}
                                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                                />
                                <div>
                                    <span className="font-medium text-gray-800">Demography</span>
                                    <p className="text-xs text-gray-500">Basic patient information</p>
                                </div>
                            </label>
                            
                            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-indigo-50 transition cursor-pointer border border-gray-200 hover:border-indigo-300">
                                <input
                                    type="checkbox"
                                    checked={selectedSections.diagnosis}
                                    onChange={() => handleSectionToggle('diagnosis')}
                                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                                />
                                <div>
                                    <span className="font-medium text-gray-800">Diagnosis</span>
                                    <p className="text-xs text-gray-500">Medical diagnosis and conditions</p>
                                </div>
                            </label>
                            
                            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-indigo-50 transition cursor-pointer border border-gray-200 hover:border-indigo-300">
                                <input
                                    type="checkbox"
                                    checked={selectedSections.anthropometry}
                                    onChange={() => handleSectionToggle('anthropometry')}
                                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                                />
                                <div>
                                    <span className="font-medium text-gray-800">Anthropometry</span>
                                    <p className="text-xs text-gray-500">Body measurements</p>
                                </div>
                            </label>
                            
                            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-indigo-50 transition cursor-pointer border border-gray-200 hover:border-indigo-300">
                                <input
                                    type="checkbox"
                                    checked={selectedSections.vitals}
                                    onChange={() => handleSectionToggle('vitals')}
                                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                                />
                                <div>
                                    <span className="font-medium text-gray-800">Vitals</span>
                                    <p className="text-xs text-gray-500">Clinical vital signs</p>
                                </div>
                            </label>
                            
                            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-indigo-50 transition cursor-pointer border border-gray-200 hover:border-indigo-300">
                                <input
                                    type="checkbox"
                                    checked={selectedSections.labs}
                                    onChange={() => handleSectionToggle('labs')}
                                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                                />
                                <div>
                                    <span className="font-medium text-gray-800">Labs</span>
                                    <p className="text-xs text-gray-500">Laboratory test results</p>
                                </div>
                            </label>
                            
                            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-indigo-50 transition cursor-pointer border border-gray-200 hover:border-indigo-300">
                                <input
                                    type="checkbox"
                                    checked={selectedSections.medication}
                                    onChange={() => handleSectionToggle('medication')}
                                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                                />
                                <div>
                                    <span className="font-medium text-gray-800">Medication</span>
                                    <p className="text-xs text-gray-500">Prescribed medications</p>
                                </div>
                            </label>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowSectionSelector(false)}
                                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-3 rounded-lg font-medium transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSectionSelectionConfirm}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg font-medium transition"
                            >
                                Proceed
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- DIAGNOSIS SUB-CATEGORY MODAL --- */}
            {showDiagnosisSubCategory && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                        <div className="text-center mb-6">
                            <FaStethoscope className="text-4xl text-purple-500 mx-auto mb-3" />
                            <h2 className="text-2xl font-bold text-gray-800">Diagnosis Sub-Category</h2>
                            <p className="text-gray-500 text-sm mt-1">Select the type of diagnosis you want to record</p>
                        </div>
                        
                        <div className="space-y-3 mb-6">
                            <label className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition cursor-pointer border border-purple-200">
                                <input
                                    type="radio"
                                    name="diagnosisSubCategory"
                                    value="primary"
                                    checked={diagnosisSubCategory === 'primary'}
                                    onChange={() => setDiagnosisSubCategory('primary')}
                                    className="w-5 h-5 text-purple-600"
                                />
                                <div>
                                    <span className="font-medium text-gray-800">Primary Diagnosis</span>
                                    <p className="text-xs text-gray-500">Main diagnosis for this case</p>
                                </div>
                            </label>
                            
                            <label className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition cursor-pointer border border-purple-200">
                                <input
                                    type="radio"
                                    name="diagnosisSubCategory"
                                    value="special_conditions"
                                    checked={diagnosisSubCategory === 'special_conditions'}
                                    onChange={() => setDiagnosisSubCategory('special_conditions')}
                                    className="w-5 h-5 text-purple-600"
                                />
                                <div>
                                    <span className="font-medium text-gray-800">Special Conditions</span>
                                    <p className="text-xs text-gray-500">Kidney impairment, liver impairment, etc.</p>
                                </div>
                            </label>
                        </div>

                        {/* Special Conditions Management */}
                        {diagnosisSubCategory === 'special_conditions' && (
                            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <p className="text-sm font-medium text-gray-700 mb-2">Manage available conditions:</p>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {specialConditions.map((condition, idx) => (
                                        <span key={idx} className="bg-gray-200 text-gray-700 px-3 py-1 rounded-lg text-sm flex items-center gap-2">
                                            {condition}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveSpecialCondition(condition)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <FaTimes size={12} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newSpecialCondition}
                                        onChange={(e) => setNewSpecialCondition(e.target.value)}
                                        className="flex-1 border border-gray-300 rounded-lg p-2 text-sm"
                                        placeholder="Add new condition..."
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddSpecialCondition()}
                                    />
                                    <button
                                        onClick={handleAddSpecialCondition}
                                        className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowDiagnosisSubCategory(false);
                                    setDiagnosisSubCategory('');
                                }}
                                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-3 rounded-lg font-medium transition"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleDiagnosisSubCategoryConfirm}
                                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-medium transition"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="text-center text-gray-500 text-xs sm:text-sm mt-4">
                <p>Addis Med - Enhancing patient safety and rational medicines use</p>
            </div>
        </div>
    );
};

export default Home;
