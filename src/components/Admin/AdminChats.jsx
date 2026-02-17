import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FaComments, FaSearch, FaUser, FaPills, FaArrowRight, FaClock, FaSpinner } from 'react-icons/fa';

export const AdminChats = () => {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        fetchChats();
    }, []);

    const fetchChats = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/medication-availability/comments');
            if (response.success) {
                setChats(response.comments || []);
            }
        } catch (error) {
            console.error('Error fetching chats:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredChats = chats.filter(chat => {
        const term = filter.toLowerCase();
        const sender = chat.user?.full_name?.toLowerCase() || '';
        const recipient = chat.recipient?.full_name?.toLowerCase() || '';
        const med = chat.post?.medication_name?.toLowerCase() || '';
        const content = chat.content?.toLowerCase() || '';

        return sender.includes(term) || recipient.includes(term) || med.includes(term) || content.includes(term);
    });

    return (
        <div className="space-y-4 sm:space-y-6 animate-fadeIn pb-12">
            <div className="bg-white rounded-[28px] shadow-sm border border-gray-100 p-5 sm:p-6 transition-all">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-50 rounded-2xl shadow-inner">
                            <FaComments className="text-blue-600 text-xl" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 leading-tight">Conversation Intercepts</h2>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Global medication availability logs.</p>
                        </div>
                    </div>

                    <div className="relative w-full sm:w-64 group">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors text-[10px]" />
                        <input
                            type="text"
                            placeholder="Search conversation vectors..."
                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-xs font-medium"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-24 bg-gray-50/20 rounded-[32px] border border-dashed border-gray-100">
                        <div className="relative inline-block mb-4">
                            <FaSpinner className="animate-spin text-5xl text-blue-500/10" />
                            <FaComments className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl text-blue-500" />
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Streaming Logs...</p>
                    </div>
                ) : filteredChats.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50/30 border-2 border-dashed border-gray-100 rounded-[32px] overflow-hidden">
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-50 rotate-3">
                            <FaComments className="text-3xl text-gray-200" />
                        </div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No active communication vectors detected.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredChats.map((chat) => (
                            <div key={chat.id} className="p-5 border border-gray-100 rounded-[24px] hover:bg-gray-50/50 transition-all bg-white shadow-sm group hover:shadow-xl hover:-translate-y-1">
                                <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 mb-5">
                                    <div className="flex items-center gap-2 text-[10px] text-blue-700 font-black uppercase tracking-tighter bg-blue-50/50 px-3 py-1.5 rounded-xl border border-blue-100/30">
                                        <FaPills className="text-blue-500 text-[10px]" />
                                        <span className="truncate max-w-[140px]" title={chat.post?.medication_name}>
                                            {chat.post?.medication_name || 'Stock Alert'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[9px] text-gray-400 font-black uppercase tracking-widest bg-white border border-gray-100 px-3 py-1.5 rounded-xl shadow-sm">
                                        <FaClock className="text-blue-300" />
                                        {new Date(chat.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 mb-5 border-b border-gray-50 pb-4">
                                    <div className="flex items-center gap-2 bg-white border border-blue-50 px-3 py-1.5 rounded-xl shadow-sm">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-lg shadow-blue-200"></div>
                                        <span className="text-[10px] font-black text-gray-900 truncate max-w-[100px]">{chat.user?.full_name?.split(' ')[0] || 'Member'}</span>
                                    </div>
                                    <FaArrowRight className="text-gray-200 text-[10px]" />
                                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-50 px-3 py-1.5 rounded-xl">
                                        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                                        <span className="text-[10px] font-bold text-gray-500 truncate max-w-[100px]">{chat.recipient?.full_name?.split(' ')[0] || 'Registry'}</span>
                                    </div>
                                </div>

                                <div className="relative bg-indigo-50/30 p-4 rounded-2xl text-gray-700 text-xs sm:text-sm border border-indigo-100/30 font-medium leading-relaxed italic group-hover:bg-white transition-colors duration-500">
                                    <span className="text-indigo-200 absolute -top-1 -left-1 text-2xl opacity-50 font-serif">"</span>
                                    {chat.content}
                                    <span className="text-indigo-200 absolute -bottom-3 -right-1 text-2xl opacity-50 font-serif">"</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
