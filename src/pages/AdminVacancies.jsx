import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSave, FaBriefcase, FaBuilding, FaMapMarkerAlt, FaLink } from 'react-icons/fa';
import api from '../utils/api';
import { format } from 'date-fns';

const AdminVacancies = () => {
    const [vacancies, setVacancies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingVacancy, setEditingVacancy] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        company: '',
        location: '',
        description: '',
        url: '',
        deadline: '',
        is_active: true
    });

    useEffect(() => {
        fetchVacancies();
    }, []);

    const fetchVacancies = async () => {
        try {
            setLoading(true);
            const data = await api.get('/vacancies/all');
            if (data.success) {
                setVacancies(data.vacancies || []);
            }
        } catch (error) {
            console.error('Error fetching vacancies:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            let response;
            
            // Format deadline if provided, else send null
            const payload = { 
                ...formData, 
                deadline: formData.deadline || null 
            };

            if (editingVacancy) {
                response = await api.put(`/vacancies/${editingVacancy.id}`, payload);
            } else {
                response = await api.post('/vacancies', payload);
            }

            if (response.success) {
                alert(editingVacancy ? 'Vacancy updated' : 'Vacancy added');
                resetForm();
                fetchVacancies();
            }
        } catch (error) {
            alert('Error saving vacancy: ' + (error?.details || error?.error || error?.message || JSON.stringify(error)));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this vacancy?')) return;
        try {
            const data = await api.delete(`/vacancies/${id}`);
            if (data.success) {
                fetchVacancies();
            }
        } catch (error) {
            alert('Error deleting vacancy');
        }
    };

    const toggleStatus = async (vacancy) => {
        try {
            const data = await api.put(`/vacancies/${vacancy.id}`, { is_active: !vacancy.is_active });
            if (data.success) {
                fetchVacancies();
            }
        } catch (error) {
            alert('Error updating status');
        }
    };

    const startEdit = (vacancy) => {
        setEditingVacancy(vacancy);
        setFormData({
            title: vacancy.title,
            company: vacancy.company,
            location: vacancy.location,
            description: vacancy.description,
            url: vacancy.url || '',
            deadline: vacancy.deadline ? vacancy.deadline.split('T')[0] : '',
            is_active: vacancy.is_active
        });
        setIsAdding(true);
    };

    const resetForm = () => {
        setIsAdding(false);
        setEditingVacancy(null);
        setFormData({
            title: '',
            company: '',
            location: '',
            description: '',
            url: '',
            deadline: '',
            is_active: true
        });
    };

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                            <FaBriefcase className="text-blue-600 text-lg" /> Vacancies Management
                        </h2>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Manage job postings for the public vacancies page.</p>
                    </div>
                    <button
                        onClick={() => {
                            if (isAdding) resetForm();
                            else setIsAdding(true);
                        }}
                        className={`w-full sm:w-auto px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm font-black text-xs active:scale-95 ${isAdding ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                    >
                        {isAdding ? <FaPlus className="rotate-45" /> : <FaPlus />}
                        {isAdding ? 'Cancel' : 'New Vacancy'}
                    </button>
                </div>

                {isAdding && (
                    <div className="bg-gray-50/50 p-5 md:p-8 rounded-2xl border border-gray-100 shadow-inner mb-8 animate-slideDown">
                        <h3 className="text-sm font-black text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-widest">
                            <div className="bg-white p-2 rounded-lg shadow-sm"><FaBriefcase className="text-blue-600" /></div>
                            {editingVacancy ? 'Edit Vacancy' : 'Post New Vacancy'}
                        </h3>
                        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="md:col-span-1">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-1.5 ml-1">Job Title *</label>
                                <input
                                    type="text" required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-bold transition-all"
                                    placeholder="e.g. Senior Pharmacist"
                                />
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-1.5 ml-1">Company/Hospital *</label>
                                <input
                                    type="text" required
                                    value={formData.company}
                                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-bold transition-all"
                                    placeholder="e.g. Tikur Anbessa Hospital"
                                />
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-1.5 ml-1">Location *</label>
                                <input
                                    type="text" required
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-bold transition-all"
                                    placeholder="e.g. Addis Ababa"
                                />
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-1.5 ml-1">Application URL</label>
                                <input
                                    type="url"
                                    value={formData.url}
                                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-mono text-[11px] font-bold"
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-1.5 ml-1">Job Description *</label>
                                <textarea
                                    required
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium min-h-[300px]"
                                    placeholder="Describe the role, requirements, and responsibilities..."
                                    rows="12"
                                />
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-1.5 ml-1">Deadline</label>
                                <input
                                    type="date"
                                    value={formData.deadline}
                                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-bold"
                                />
                            </div>
                            
                            <div className="md:col-span-1 flex items-end justify-between gap-4">
                                <label className="flex items-center gap-2 cursor-pointer pb-3">
                                    <input 
                                        type="checkbox" 
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-bold text-gray-700">Active (Visible to public)</span>
                                </label>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                                >
                                    {loading ? <div className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full"></div> : <FaSave />}
                                    {editingVacancy ? 'Update' : 'Publish'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="overflow-hidden">
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Position & Details</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Company & Location</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {vacancies.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-10 text-center text-gray-300 font-bold uppercase tracking-widest text-xs italic">
                                            No vacancies found.
                                        </td>
                                    </tr>
                                ) : (
                                    vacancies.map(vacancy => (
                                        <tr key={vacancy.id} className="hover:bg-gray-50/80 transition-colors group">
                                            <td className="px-6 py-4">
                                                <button 
                                                    onClick={() => toggleStatus(vacancy)}
                                                    className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-colors ${
                                                        vacancy.is_active 
                                                        ? 'bg-green-50 text-green-600 border-green-100 hover:bg-green-100' 
                                                        : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                                                    }`}
                                                >
                                                    {vacancy.is_active ? 'Active' : 'Inactive'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-black text-gray-900 text-sm mb-0.5">{vacancy.title}</div>
                                                {vacancy.deadline && (
                                                    <div className="text-[10px] font-medium text-gray-400 leading-tight">
                                                        Deadline: {format(new Date(vacancy.deadline), 'MMM dd, yyyy')}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-700 text-xs flex items-center gap-1.5">
                                                    <FaBuilding className="text-gray-400" /> {vacancy.company}
                                                </div>
                                                <div className="font-medium text-gray-500 text-[10px] flex items-center gap-1.5 mt-1">
                                                    <FaMapMarkerAlt className="text-gray-400" /> {vacancy.location}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1.5">
                                                    <button onClick={() => startEdit(vacancy)} className="text-blue-600 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors text-xs"><FaEdit /></button>
                                                    <button onClick={() => handleDelete(vacancy.id)} className="text-red-600 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors text-xs"><FaTrash /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View Grid */}
                    <div className="lg:hidden grid grid-cols-1 gap-4">
                        {vacancies.map(vacancy => (
                            <div key={vacancy.id} className="bg-gray-50/50 border border-gray-100 rounded-2xl p-4 flex flex-col hover:bg-white hover:border-blue-100 transition-all group shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <button 
                                        onClick={() => toggleStatus(vacancy)}
                                        className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border transition-colors ${
                                            vacancy.is_active 
                                            ? 'bg-green-50 text-green-600 border-green-100' 
                                            : 'bg-gray-100 text-gray-500 border-gray-200'
                                        }`}
                                    >
                                        {vacancy.is_active ? 'Active' : 'Inactive'}
                                    </button>
                                    <div className="flex gap-1">
                                        <button onClick={() => startEdit(vacancy)} className="bg-white p-2 rounded-lg text-blue-600 border border-gray-100 shadow-sm active:scale-90 transition-transform"><FaEdit size={12} /></button>
                                        <button onClick={() => handleDelete(vacancy.id)} className="bg-white p-2 rounded-lg text-red-500 border border-gray-100 shadow-sm active:scale-90 transition-transform"><FaTrash size={12} /></button>
                                    </div>
                                </div>
                                <h4 className="font-black text-gray-900 text-sm mb-2 leading-tight">{vacancy.title}</h4>
                                <div className="space-y-1 mb-3">
                                    <div className="text-xs font-bold text-gray-600 flex items-center gap-1.5"><FaBuilding className="text-gray-400" /> {vacancy.company}</div>
                                    <div className="text-[10px] font-medium text-gray-500 flex items-center gap-1.5"><FaMapMarkerAlt className="text-gray-400" /> {vacancy.location}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminVacancies;
