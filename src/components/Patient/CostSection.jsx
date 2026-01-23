import React, { useState, useEffect } from 'react';
import supabase from '../../utils/supabase';
import { FaMoneyBillWave, FaEdit, FaTrash, FaPlus, FaChevronDown, FaChevronUp, FaChartLine } from 'react-icons/fa';

const CostSection = ({ patientCode }) => {
    const [costEntries, setCostEntries] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        analysis_type: 'medication', // incurred or reduced
        direct_costs: '',
        indirect_costs: '',
        cost_savings: '',
        category: '',
        description: '',
        currency: 'ETB',
        methodology: '',
        assumptions: '',
        findings: '',
        analysis_date: new Date().toISOString().split('T')[0]
    });
    const [loading, setLoading] = useState(false);
    const [showIncurred, setShowIncurred] = useState(true);
    const [showReduced, setShowReduced] = useState(true);

    const costCategories = [
        'Medication',
        'Laboratory',
        'Imaging',
        'Procedures',
        'Hospitalization',
        'Consultation',
        'Other'
    ];

    useEffect(() => {
        fetchCostEntries();
    }, [patientCode]);

    const fetchCostEntries = async () => {
        try {
            const { data, error } = await supabase
                .from('cost_analyses')
                .select('*')
                .eq('patient_code', patientCode)
                .order('analysis_date', { ascending: false });

            if (!error && data) {
                // Transform data to match your UI format
                const transformedData = data.map(cost => {
                    const totalCost = parseFloat(cost.total_costs) || 0;
                    const costSavings = parseFloat(cost.cost_savings) || 0;
                    
                    return {
                        id: cost.id,
                        type: totalCost > 0 ? 'incurred' : 'reduced',
                        amount: Math.abs(totalCost) || costSavings,
                        description: cost.findings || `Cost Analysis: ${cost.analysis_type}`,
                        category: cost.analysis_type,
                        date: cost.analysis_date,
                        direct_costs: cost.direct_costs,
                        indirect_costs: cost.indirect_costs,
                        total_costs: cost.total_costs,
                        cost_savings: cost.cost_savings,
                        roi: cost.roi,
                        currency: cost.currency,
                        findings: cost.findings,
                        recommendations: cost.recommendations,
                        originalData: cost
                    };
                });
                setCostEntries(transformedData);
            }
        } catch (error) {
            console.error('Error fetching cost entries:', error);
        }
    };

const saveCostEntry = async () => {
    try {
        setLoading(true);
        
        // Get token from localStorage for authentication
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Please login to save cost analysis');
        }

        // Get patient ID first (this returns the UUID)
        const patientResponse = await fetch(`http://localhost:3000/api/patients/code/${patientCode}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!patientResponse.ok) {
            throw new Error('Failed to fetch patient data');
        }

        const patientData = await patientResponse.json();
        if (!patientData.success || !patientData.patient) {
            throw new Error('Patient not found');
        }

        // Calculate totals
        const directCosts = parseFloat(formData.direct_costs) || 0;
        const indirectCosts = parseFloat(formData.indirect_costs) || 0;
        const savings = parseFloat(formData.cost_savings) || 0;
        const totalCosts = directCosts + indirectCosts;
        
        // For cost reduction, total_costs can be negative
        const isReduced = formData.analysis_type === 'reduced';
        const finalTotalCosts = isReduced ? -savings : totalCosts;

        // Calculate ROI if there are savings
        const roi = savings > 0 && totalCosts > 0 ? 
            ((savings - totalCosts) / totalCosts * 100) : 0;

        // ✅ FIXED: Don't send patient_id, let backend look it up
        const costData = {
            // Remove: patient_id: patientData.patient.id, // Don't send ID
            patient_code: patientCode, // Send only patient_code
            analysis_date: formData.analysis_date,
            analysis_type: formData.category || 'other',
            direct_costs: directCosts,
            indirect_costs: indirectCosts,
            total_costs: finalTotalCosts,
            cost_savings: savings,
            roi: roi,
            cost_per_outcome: totalCosts > 0 ? totalCosts : 0,
            currency: 'ETB',
            methodology: formData.methodology || 'Standard cost analysis',
            assumptions: formData.assumptions || '',
            findings: formData.description || 'Cost analysis conducted',
            recommendations: [],
            analyzed_by: 'System User',
            notes: formData.notes || ''
        };

        console.log('📤 Sending cost data to backend:', {
            patient_code: costData.patient_code,
            analysis_type: costData.analysis_type,
            direct_costs: costData.direct_costs,
            indirect_costs: costData.indirect_costs,
            total_costs: costData.total_costs
        });

        // Use your backend API
        const url = editingId 
            ? `http://localhost:3000/api/costs/${editingId}`
            : 'http://localhost:3000/api/costs';
        
        const method = editingId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(costData)
        });

        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Failed to save cost analysis');
        }

        alert(editingId ? 'Cost analysis updated successfully!' : 'Cost analysis added successfully!');
        resetForm();
        fetchCostEntries();
        
    } catch (error) {
        console.error('Error saving cost analysis:', error);
        alert('Error saving cost analysis: ' + error.message);
    } finally {
        setLoading(false);
    }
};
    const handleEdit = (cost) => {
        setEditingId(cost.id);
        setFormData({
            analysis_type: cost.type === 'incurred' ? 'incurred' : 'reduced',
            direct_costs: cost.direct_costs || '',
            indirect_costs: cost.indirect_costs || '',
            cost_savings: cost.cost_savings || '',
            category: cost.category,
            description: cost.description,
            currency: cost.currency || 'ETB',
            methodology: cost.originalData?.methodology || '',
            assumptions: cost.originalData?.assumptions || '',
            findings: cost.originalData?.findings || '',
            analysis_date: cost.date || new Date().toISOString().split('T')[0]
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this cost analysis?')) return;

        try {
            const { error } = await supabase
                .from('cost_analyses')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setCostEntries(prev => prev.filter(entry => entry.id !== id));
            alert('Cost analysis deleted successfully!');
        } catch (error) {
            console.error('Error deleting cost analysis:', error);
            alert('Error deleting cost analysis: ' + error.message);
        }
    };

    const resetForm = () => {
        setFormData({
            analysis_type: 'incurred',
            direct_costs: '',
            indirect_costs: '',
            cost_savings: '',
            category: '',
            description: '',
            currency: 'ETB',
            methodology: '',
            assumptions: '',
            findings: '',
            analysis_date: new Date().toISOString().split('T')[0]
        });
        setEditingId(null);
        setShowForm(false);
    };

    const calculateTotals = () => {
        const incurred = costEntries
            .filter(entry => entry.type === 'incurred')
            .reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0);

        const reduced = costEntries
            .filter(entry => entry.type === 'reduced')
            .reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0);

        return { incurred, reduced };
    };

    const totals = calculateTotals();

    const incurredEntries = costEntries.filter(entry => entry.type === 'incurred');
    const reducedEntries = costEntries.filter(entry => entry.type === 'reduced');

    const getCategoryColor = (category) => {
        const colors = {
            'medication': 'bg-blue-100 text-blue-800',
            'laboratory': 'bg-green-100 text-green-800',
            'imaging': 'bg-purple-100 text-purple-800',
            'procedures': 'bg-red-100 text-red-800',
            'hospitalization': 'bg-orange-100 text-orange-800',
            'consultation': 'bg-indigo-100 text-indigo-800',
            'Medication': 'bg-blue-100 text-blue-800',
            'Laboratory': 'bg-green-100 text-green-800',
            'Imaging': 'bg-purple-100 text-purple-800',
            'Procedures': 'bg-red-100 text-red-800',
            'Hospitalization': 'bg-orange-100 text-orange-800',
            'Consultation': 'bg-indigo-100 text-indigo-800',
            'other': 'bg-gray-100 text-gray-800',
            'Other': 'bg-gray-100 text-gray-800'
        };
        return colors[category] || colors['other'];
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-amber-100 p-3 rounded-full">
                    <FaChartLine className="text-amber-600 text-xl" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Cost Analysis</h2>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">Total Costs</h3>
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-3xl font-bold text-blue-900">
                                ETB {totals.incurred.toLocaleString()}
                            </p>
                            <p className="text-sm text-blue-600 mt-1">
                                {incurredEntries.length} analyses
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setFormData(prev => ({ ...prev, analysis_type: 'incurred' }));
                                setShowForm(true);
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                        >
                            <FaPlus /> Add Cost
                        </button>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                    <h3 className="text-lg font-semibold text-green-800 mb-2">Total Savings</h3>
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-3xl font-bold text-green-900">
                                ETB {totals.reduced.toLocaleString()}
                            </p>
                            <p className="text-sm text-green-600 mt-1">
                                {reducedEntries.length} analyses
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setFormData(prev => ({ ...prev, analysis_type: 'reduced' }));
                                setShowForm(true);
                            }}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                        >
                            <FaPlus /> Add Savings
                        </button>
                    </div>
                </div>
            </div>

            {/* Cost Analysis Form */}
            {showForm && (
                <div className="mb-8 bg-gray-50 rounded-lg p-6">
                    <h3 className="text-xl font-semibold mb-4 text-gray-800">
                        {editingId ? 'Edit Cost Analysis' : 'New Cost Analysis'}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Analysis Type
                            </label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setFormData({...formData, analysis_type: 'incurred'})}
                                    className={`flex-1 py-2 rounded-lg ${formData.analysis_type === 'incurred' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                                >
                                    Cost Incurred
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({...formData, analysis_type: 'reduced'})}
                                    className={`flex-1 py-2 rounded-lg ${formData.analysis_type === 'reduced' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                                >
                                    Cost Reduced/Savings
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Category
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({...formData, category: e.target.value})}
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-amber-500"
                            >
                                <option value="">Select category</option>
                                {costCategories.map(category => (
                                    <option key={category} value={category.toLowerCase()}>{category}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Direct Costs (ETB)
                            </label>
                            <input
                                type="number"
                                value={formData.direct_costs}
                                onChange={(e) => setFormData({...formData, direct_costs: e.target.value})}
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-amber-500"
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Indirect Costs (ETB)
                            </label>
                            <input
                                type="number"
                                value={formData.indirect_costs}
                                onChange={(e) => setFormData({...formData, indirect_costs: e.target.value})}
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-amber-500"
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {formData.analysis_type === 'reduced' ? 'Savings Amount (ETB)' : 'Additional Notes'}
                            </label>
                            {formData.analysis_type === 'reduced' ? (
                                <input
                                    type="number"
                                    value={formData.cost_savings}
                                    onChange={(e) => setFormData({...formData, cost_savings: e.target.value})}
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-amber-500"
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                />
                            ) : (
                                <input
                                    type="text"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-amber-500"
                                    placeholder="Additional notes..."
                                />
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Analysis Date
                            </label>
                            <input
                                type="date"
                                value={formData.analysis_date}
                                onChange={(e) => setFormData({...formData, analysis_date: e.target.value})}
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-amber-500"
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description/Findings *
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            rows="3"
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-amber-500"
                            placeholder="Describe the cost analysis findings..."
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Methodology
                            </label>
                            <textarea
                                value={formData.methodology}
                                onChange={(e) => setFormData({...formData, methodology: e.target.value})}
                                rows="2"
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-amber-500"
                                placeholder="Analysis methodology used..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Assumptions
                            </label>
                            <textarea
                                value={formData.assumptions}
                                onChange={(e) => setFormData({...formData, assumptions: e.target.value})}
                                rows="2"
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-amber-500"
                                placeholder="Key assumptions made..."
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={saveCostEntry}
                            disabled={loading}
                            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FaChartLine /> {loading ? 'Saving...' : (editingId ? 'Update Analysis' : 'Save Analysis')}
                        </button>
                        <button
                            onClick={resetForm}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-lg"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Cost Entries List */}
            <div className="space-y-6">
                {/* Incurred Costs Section */}
                <div className="border rounded-lg overflow-hidden">
                    <div className="bg-blue-50 p-4 border-b">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <h3 className="text-lg font-semibold text-blue-800">
                                    Costs Incurred
                                </h3>
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                                    {incurredEntries.length} entries
                                </span>
                            </div>
                            <button
                                onClick={() => setShowIncurred(!showIncurred)}
                                className="text-blue-600 hover:text-blue-800"
                            >
                                {showIncurred ? <FaChevronUp /> : <FaChevronDown />}
                            </button>
                        </div>
                        <p className="text-sm text-blue-600 mt-1">
                            Total: ETB {totals.incurred.toLocaleString()}
                        </p>
                    </div>
                    
                    {showIncurred && (
                        <div className="p-4">
                            {incurredEntries.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">No costs incurred recorded.</p>
                            ) : (
                                <div className="space-y-3">
                                    {incurredEntries.map((entry) => (
                                        <div key={entry.id} className="border rounded-lg p-4 hover:bg-gray-50">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-medium text-gray-800">{entry.description}</h4>
                                                    <p className="text-sm text-gray-600">
                                                        {entry.date && new Date(entry.date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg font-bold text-red-600">
                                                        ETB {entry.amount?.toLocaleString() || '0'}
                                                    </span>
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => handleEdit(entry)}
                                                            className="text-blue-500 hover:text-blue-700"
                                                            title="Edit"
                                                        >
                                                            <FaEdit />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(entry.id)}
                                                            className="text-red-500 hover:text-red-700"
                                                            title="Delete"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`px-2 py-1 rounded text-xs ${getCategoryColor(entry.category)}`}>
                                                    {entry.category}
                                                </span>
                                                {entry.direct_costs > 0 && (
                                                    <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                                                        Direct: ETB {entry.direct_costs}
                                                    </span>
                                                )}
                                                {entry.indirect_costs > 0 && (
                                                    <span className="px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
                                                        Indirect: ETB {entry.indirect_costs}
                                                    </span>
                                                )}
                                            </div>
                                            {entry.findings && (
                                                <p className="text-sm text-gray-600 mt-2">{entry.findings}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Reduced Costs Section */}
                <div className="border rounded-lg overflow-hidden">
                    <div className="bg-green-50 p-4 border-b">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <h3 className="text-lg font-semibold text-green-800">
                                    Cost Savings
                                </h3>
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                                    {reducedEntries.length} entries
                                </span>
                            </div>
                            <button
                                onClick={() => setShowReduced(!showReduced)}
                                className="text-green-600 hover:text-green-800"
                            >
                                {showReduced ? <FaChevronUp /> : <FaChevronDown />}
                            </button>
                        </div>
                        <p className="text-sm text-green-600 mt-1">
                            Total Savings: ETB {totals.reduced.toLocaleString()}
                        </p>
                    </div>
                    
                    {showReduced && (
                        <div className="p-4">
                            {reducedEntries.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">No cost savings recorded.</p>
                            ) : (
                                <div className="space-y-3">
                                    {reducedEntries.map((entry) => (
                                        <div key={entry.id} className="border rounded-lg p-4 hover:bg-gray-50">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-medium text-gray-800">{entry.description}</h4>
                                                    <p className="text-sm text-gray-600">
                                                        {entry.date && new Date(entry.date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg font-bold text-green-600">
                                                        ETB {entry.amount?.toLocaleString() || '0'}
                                                    </span>
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => handleEdit(entry)}
                                                            className="text-blue-500 hover:text-blue-700"
                                                            title="Edit"
                                                        >
                                                            <FaEdit />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(entry.id)}
                                                            className="text-red-500 hover:text-red-700"
                                                            title="Delete"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`px-2 py-1 rounded text-xs ${getCategoryColor(entry.category)}`}>
                                                    {entry.category}
                                                </span>
                                                <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                                                    Savings
                                                </span>
                                                {entry.roi > 0 && (
                                                    <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">
                                                        ROI: {entry.roi.toFixed(1)}%
                                                    </span>
                                                )}
                                            </div>
                                            {entry.findings && (
                                                <p className="text-sm text-gray-600 mt-2">{entry.findings}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Summary */}
            {costEntries.length > 0 && (
                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">Cost Analysis Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-3">
                            <p className="text-sm text-gray-600">Total Costs Incurred</p>
                            <p className="text-2xl font-bold text-red-600">
                                ETB {totals.incurred.toLocaleString()}
                            </p>
                        </div>
                        <div className="text-center p-3">
                            <p className="text-sm text-gray-600">Total Cost Savings</p>
                            <p className="text-2xl font-bold text-green-600">
                                ETB {totals.reduced.toLocaleString()}
                            </p>
                        </div>
                        <div className="text-center p-3">
                            <p className="text-sm text-gray-600">Net Impact</p>
                            <p className={`text-2xl font-bold ${totals.reduced > totals.incurred ? 'text-green-600' : 'text-red-600'}`}>
                                ETB {(totals.reduced - totals.incurred).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CostSection;