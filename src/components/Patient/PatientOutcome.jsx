import React, { useState, useEffect } from 'react';
import { 
  FaCheckCircle, 
  FaTimesCircle, 
  FaUserMd, 
  FaEdit, 
  FaSave, 
  FaTrash,
  FaCalendarAlt,
  FaFileMedical,
  FaChartLine,
  FaNotesMedical 
} from 'react-icons/fa';

const PatientOutcome = ({ patientCode }) => {
    const [outcomes, setOutcomes] = useState([]);
    const [formData, setFormData] = useState({
        outcome_type: 'clinical',
        outcome_status: 'resolved',
        notes: '',
        outcome_date: new Date().toISOString().split('T')[0]
    });
    const [editIndex, setEditIndex] = useState(null);
    const [loading, setLoading] = useState(false);

    const outcomeTypeOptions = [
        { value: 'clinical', label: 'Clinical Outcome' },
        { value: 'medication', label: 'Medication Outcome' },
        { value: 'safety', label: 'Safety Outcome' },
        { value: 'economic', label: 'Economic Outcome' },
        { value: 'patient_reported', label: 'Patient-Reported Outcome' },
        { value: 'other', label: 'Other' }
    ];

    const outcomeStatusOptions = [
        { value: 'resolved', label: 'Resolved', color: 'green' },
        { value: 'improved', label: 'Improved', color: 'green' },
        { value: 'stable', label: 'Stable', color: 'blue' },
        { value: 'worsened', label: 'Worsened', color: 'red' },
        { value: 'discharged', label: 'Discharged', color: 'green' },
        { value: 'referred', label: 'Referred', color: 'yellow' },
        { value: 'lost_to_followup', label: 'Lost to Follow-up', color: 'gray' },
        { value: 'deceased', label: 'Deceased', color: 'red' }
    ];

    useEffect(() => {
        fetchOutcomes();
    }, [patientCode]);

    const fetchOutcomes = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3000/api/outcomes/patient/${patientCode}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.outcomes) {
                    setOutcomes(result.outcomes);
                }
            }
        } catch (error) {
            console.error('Error fetching outcomes:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveOutcome = async () => {
        try {
            setLoading(true);
            if (!formData.notes.trim()) {
                alert('Please enter outcome notes/description');
                return;
            }

            const token = localStorage.getItem('token');

            const outcomeData = {
                patient_code: patientCode,
                outcome_type: formData.outcome_type,
                outcome_status: formData.outcome_status,
                notes: formData.notes.trim(),
                outcome_date: formData.outcome_date
            };

            const url = editIndex
                ? `http://localhost:3000/api/outcomes/${editIndex}`
                : 'http://localhost:3000/api/outcomes';

            const method = editIndex ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(outcomeData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                alert(editIndex ? 'Outcome updated successfully!' : 'Outcome saved successfully!');
                setFormData({
                    outcome_type: 'clinical',
                    outcome_status: 'resolved',
                    notes: '',
                    outcome_date: new Date().toISOString().split('T')[0]
                });
                setEditIndex(null);
                fetchOutcomes();
            } else {
                throw new Error(result.error || 'Failed to save outcome');
            }
        } catch (error) {
            console.error('Error saving outcome:', error);
            alert('Error saving outcome: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (outcomeItem) => {
        setFormData({
            outcome_type: outcomeItem.outcome_type || 'clinical',
            outcome_status: outcomeItem.outcome_status || 'resolved',
            notes: outcomeItem.notes || '',
            outcome_date: outcomeItem.outcome_date || new Date().toISOString().split('T')[0]
        });
        setEditIndex(outcomeItem.id);
    };

    const handleDelete = async (outcomeId) => {
        if (!window.confirm('Are you sure you want to delete this outcome?')) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3000/api/outcomes/${outcomeId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();
            if (response.ok && result.success) {
                alert('Outcome deleted successfully!');
                fetchOutcomes();
            } else {
                throw new Error(result.error || 'Delete failed');
            }
        } catch (error) {
            console.error('Error deleting outcome:', error);
            alert('Error deleting outcome: ' + error.message);
        }
    };

    const getStatusColor = (status) => {
        const statusObj = outcomeStatusOptions.find(opt => opt.value === status);
        if (!statusObj) return 'bg-gray-100 text-gray-800';
        switch (statusObj.color) {
            case 'green': return 'bg-green-100 text-green-800 border border-green-200';
            case 'red': return 'bg-red-100 text-red-800 border border-red-200';
            case 'blue': return 'bg-blue-100 text-blue-800 border border-blue-200';
            case 'yellow': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
            case 'gray': return 'bg-gray-100 text-gray-800 border border-gray-200';
            default: return 'bg-gray-100 text-gray-800 border border-gray-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'resolved':
            case 'improved':
            case 'discharged':
                return <FaCheckCircle className="text-green-500" />;
            case 'worsened':
            case 'deceased':
                return <FaTimesCircle className="text-red-500" />;
            default:
                return <FaUserMd className="text-blue-500" />;
        }
    };

    const getOutcomeTypeLabel = (type) => {
        const typeObj = outcomeTypeOptions.find(opt => opt.value === type);
        return typeObj ? typeObj.label : type;
    };

    const getOutcomeStatusLabel = (status) => {
        const statusObj = outcomeStatusOptions.find(opt => opt.value === status);
        return statusObj ? statusObj.label : status;
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-teal-100 p-3 rounded-full">
                    <FaChartLine className="text-teal-600 text-xl" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Patient Outcome</h2>
                    <p className="text-gray-600">For Patient: {patientCode}</p>
                </div>
            </div>

            {/* Outcome Form */}
            <div className="mb-8">
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                        <FaFileMedical /> 
                        {editIndex !== null ? 'Edit Patient Outcome' : 'Record Patient Outcome'}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Outcome Type *</label>
                            <select value={formData.outcome_type} onChange={(e) => setFormData({...formData, outcome_type: e.target.value})}
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500">
                                {outcomeTypeOptions.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Outcome Status *</label>
                            <select value={formData.outcome_status} onChange={(e) => setFormData({...formData, outcome_status: e.target.value})}
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500">
                                {outcomeStatusOptions.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Outcome Date *</label>
                        <input type="date" value={formData.outcome_date}
                            onChange={(e) => setFormData({...formData, outcome_date: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500" />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Outcome Notes/Description *</label>
                        <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})}
                            rows="4" className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500" required />
                    </div>

                    <div className="flex gap-3">
                        <button onClick={saveOutcome} disabled={loading}
                            className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 disabled:opacity-50">
                            <FaSave /> {loading ? 'Saving...' : (editIndex !== null ? 'Update Outcome' : 'Save Outcome')}
                        </button>

                        {editIndex !== null && (
                            <button onClick={() => { setFormData({ outcome_type: 'clinical', outcome_status: 'resolved', notes: '', outcome_date: new Date().toISOString().split('T')[0] }); setEditIndex(null); }}
                                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-lg">Cancel Edit</button>
                        )}
                    </div>
                </div>
            </div>

            {/* Saved Outcomes */}
            <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                    <FaNotesMedical /> Patient Outcome History ({outcomes.length})
                </h3>

                {loading ? (
                    <div className="text-center py-8">Loading outcomes...</div>
                ) : outcomes.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No patient outcomes recorded yet.</div>
                ) : (
                    <div className="space-y-4">
                        {outcomes.map((item, index) => (
                            <div key={item.id} className="border rounded-lg p-4 bg-gray-50 hover:bg-white transition hover:shadow-md">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="text-xl">{getStatusIcon(item.outcome_status)}</div>
                                        <div>
                                            <h4 className="font-semibold text-gray-800">{getOutcomeTypeLabel(item.outcome_type)} #{index + 1}</h4>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                <p className="text-sm text-gray-600 flex items-center gap-1"><FaCalendarAlt /> {item.outcome_date || new Date(item.created_at).toLocaleDateString()}</p>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.outcome_status)}`}>
                                                    {getOutcomeStatusLabel(item.outcome_status)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(item)} className="text-blue-500 hover:text-blue-700 flex items-center gap-2 px-3 py-1 rounded hover:bg-blue-50"><FaEdit /> Edit</button>
                                        <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 flex items-center gap-2 px-3 py-1 rounded hover:bg-red-50"><FaTrash /> Delete</button>
                                    </div>
                                </div>

                                <div>
                                    <h5 className="font-medium text-gray-700 mb-2">Outcome Notes</h5>
                                    <p className="text-gray-700 bg-white border rounded p-3 whitespace-pre-wrap">{item.notes}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientOutcome;
