// components/Patient/PhAssistPlan.jsx
import React, { useState, useEffect } from 'react';
import { 
  FaClipboardList, 
  FaEdit, 
  FaSave, 
  FaTrash,
  FaCalendarAlt,
  FaPills,
  FaUserMd,
  FaFileMedical 
} from 'react-icons/fa';

const PhAssistPlan = ({ patientCode }) => {
    const [pharmacyAssessment, setPharmacyAssessment] = useState('');
    const [plan, setPlan] = useState('');
    const [savedPlans, setSavedPlans] = useState([]);
    const [editIndex, setEditIndex] = useState(null);
    const [loading, setLoading] = useState(false);
    const [planType, setPlanType] = useState('medication_review');
    const [followUpDate, setFollowUpDate] = useState('');

    useEffect(() => {
        fetchSavedPlans();
    }, [patientCode]);

    const fetchSavedPlans = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3000/api/plans/patient/${patientCode}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.plans) {
                    setSavedPlans(result.plans);
                }
            }
        } catch (error) {
            console.error('Error fetching pharmacy plans:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fixed savePlan function - removed patient?.id reference
    const savePlan = async () => {
        try {
            setLoading(true);
            
            if (!pharmacyAssessment.trim() || !plan.trim()) {
                alert('Please fill in both Pharmacy Assessment and Plan of Action');
                return;
            }

            const token = localStorage.getItem('token');
            const planData = {
                patient_code: patientCode,
                plan_type: planType,
                goals: pharmacyAssessment,
                medications: '',
                monitoring: '',
                follow_up: followUpDate,
                notes: plan
            };

            console.log('Saving plan with data:', planData);

            const response = await fetch('http://localhost:3000/api/plans/pharmacy-assistance', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(planData)
            });

            const result = await response.json();
            
            if (response.ok && result.success) {
                alert('Plan saved successfully!');
                // Clear form
                setPharmacyAssessment('');
                setPlan('');
                setFollowUpDate('');
                setPlanType('medication_review');
                setEditIndex(null);
                // Refresh list
                fetchSavedPlans();
            } else {
                throw new Error(result.error || 'Failed to save plan');
            }
        } catch (error) {
            console.error('Error saving plan:', error);
            alert('Error saving plan: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (planItem) => {
        setPharmacyAssessment(planItem.goals || '');
        setPlan(planItem.notes || '');
        setPlanType(planItem.plan_type || 'medication_review');
        setFollowUpDate(planItem.follow_up || '');
        setEditIndex(planItem.id);
    };

    const handleDelete = async (planId) => {
        if (!window.confirm('Are you sure you want to delete this plan?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3000/api/plans/${planId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                alert('Plan deleted successfully!');
                fetchSavedPlans();
            }
        } catch (error) {
            console.error('Error deleting plan:', error);
            alert('Error deleting plan: ' + error.message);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-green-100 p-3 rounded-full">
                    <FaClipboardList className="text-green-600 text-xl" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Pharmacy Assessment & Plan</h2>
                    <p className="text-gray-600">For Patient: {patientCode}</p>
                </div>
            </div>

            {/* Input Form */}
            <div className="mb-8">
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                        <FaFileMedical /> 
                        {editIndex !== null ? 'Edit Assessment & Plan' : 'New Assessment & Plan'}
                    </h3>

                    <div className="space-y-4">
                        {/* Plan Type */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Plan Type *
                                </label>
                                <select
                                    value={planType}
                                    onChange={(e) => setPlanType(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500"
                                >
                                    <option value="medication_review">Medication Therapy Review</option>
                                    <option value="disease_management">Disease Management</option>
                                    <option value="immunization">Immunization Plan</option>
                                    <option value="adherence">Medication Adherence</option>
                                    <option value="education">Patient Education</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Follow-up Date
                                </label>
                                <div className="flex items-center">
                                    <FaCalendarAlt className="text-gray-400 mr-2" />
                                    <input
                                        type="date"
                                        value={followUpDate}
                                        onChange={(e) => setFollowUpDate(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Pharmacy Assessment *
                            </label>
                            <textarea
                                value={pharmacyAssessment}
                                onChange={(e) => setPharmacyAssessment(e.target.value)}
                                rows="4"
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500"
                                placeholder="Document your comprehensive pharmacy assessment..."
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Include medication therapy problems, drug interactions, monitoring needs, etc.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Plan of Action *
                            </label>
                            <textarea
                                value={plan}
                                onChange={(e) => setPlan(e.target.value)}
                                rows="4"
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500"
                                placeholder="Outline your recommendations and follow-up plan..."
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Include specific recommendations, monitoring parameters, and follow-up timeline
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={savePlan}
                                disabled={loading}
                                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 disabled:opacity-50"
                            >
                                <FaSave /> {loading ? 'Saving...' : (editIndex !== null ? 'Update Plan' : 'Save Plan')}
                            </button>

                            {editIndex !== null && (
                                <button
                                    onClick={() => {
                                        setPharmacyAssessment('');
                                        setPlan('');
                                        setFollowUpDate('');
                                        setPlanType('medication_review');
                                        setEditIndex(null);
                                    }}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-lg"
                                >
                                    Cancel Edit
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Saved Plans */}
            <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                    <FaClipboardList />
                    Saved Pharmacy Assessments & Plans ({savedPlans.length})
                </h3>

                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
                        <p className="text-gray-600 mt-2">Loading plans...</p>
                    </div>
                ) : savedPlans.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <FaClipboardList className="text-4xl mx-auto mb-3 text-gray-300" />
                        <p>No pharmacy assessments and plans saved yet.</p>
                        <p className="text-sm mt-1">Create your first plan using the form above.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {savedPlans.map((item, index) => (
                            <div key={item.id} className="border rounded-lg p-4 bg-gray-50 hover:bg-white transition hover:shadow-md">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                                            <FaFileMedical />
                                            {item.plan_type ? item.plan_type.replace(/_/g, ' ').toUpperCase() : 'Plan'} #{index + 1}
                                        </h4>
                                        <div className="flex flex-wrap gap-3 mt-1">
                                            <p className="text-sm text-gray-600 flex items-center gap-1">
                                                <FaCalendarAlt />
                                                {new Date(item.created_at).toLocaleString()}
                                            </p>
                                            {item.follow_up && (
                                                <p className="text-sm text-green-600 flex items-center gap-1">
                                                    <FaCalendarAlt />
                                                    Follow-up: {new Date(item.follow_up).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="text-blue-500 hover:text-blue-700 flex items-center gap-2 px-3 py-1 rounded hover:bg-blue-50"
                                        >
                                            <FaEdit /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="text-red-500 hover:text-red-700 flex items-center gap-2 px-3 py-1 rounded hover:bg-red-50"
                                        >
                                            <FaTrash /> Delete
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h5 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                                            <FaPills /> Pharmacy Assessment
                                        </h5>
                                        <div className="bg-white border rounded p-3 text-gray-700 whitespace-pre-wrap">
                                            {item.goals || 'No assessment provided'}
                                        </div>
                                    </div>

                                    <div>
                                        <h5 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                                            <FaUserMd /> Plan of Action
                                        </h5>
                                        <div className="bg-white border rounded p-3 text-gray-700 whitespace-pre-wrap">
                                            {item.notes || 'No plan provided'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PhAssistPlan;