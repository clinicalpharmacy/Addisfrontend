import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FaComments, FaSearch, FaUser, FaPills, FaArrowRight, FaClock } from 'react-icons/fa';

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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <FaComments className="text-blue-600" />
                        Recent Medication Chats
                    </h2>
                    <p className="text-sm text-gray-500">Monitor conversations between users on Medication Availability posts</p>
                </div>

                <div className="relative w-full md:w-64">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search chats..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-500 text-sm">Loading conversations...</p>
                </div>
            ) : filteredChats.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <FaComments className="text-4xl text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No chats found</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredChats.map((chat) => (
                        <div key={chat.id} className="p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition bg-white shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2 text-sm text-blue-600 font-semibold">
                                    <FaPills className="text-xs" />
                                    {chat.post?.medication_name || 'Unknown Medication'}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                    <FaClock />
                                    {new Date(chat.created_at).toLocaleString()}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mb-3 text-sm">
                                <div className="flex items-center gap-2 text-gray-700 bg-gray-100 px-2 py-1 rounded-md">
                                    <FaUser className="text-xs text-gray-500" />
                                    <span className="font-medium">{chat.user?.full_name || chat.user?.email || 'Unknown'}</span>
                                </div>
                                <FaArrowRight className="text-gray-300 text-xs" />
                                <div className="flex items-center gap-2 text-gray-700 bg-gray-100 px-2 py-1 rounded-md">
                                    <FaUser className="text-xs text-gray-500" />
                                    <span className="font-medium">{chat.recipient?.full_name || chat.recipient?.email || 'Unknown'}</span>
                                </div>
                            </div>

                            <div className="bg-blue-50 p-3 rounded-lg text-gray-700 text-sm border border-blue-100">
                                "{chat.content}"
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
