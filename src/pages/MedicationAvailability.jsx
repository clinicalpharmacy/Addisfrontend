import React, { useState, useEffect, useRef } from 'react';
import {
    FaPills, FaSearch, FaPlus, FaHospital,
    FaCalendarAlt, FaTrash, FaCheckCircle, FaExclamationCircle,
    FaUserMd, FaMapMarkerAlt, FaCommentMedical, FaPaperPlane, FaTimes, FaEdit, FaArrowLeft
} from 'react-icons/fa';
import api from '../utils/api';

const MedicationAvailability = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [selectedPost, setSelectedPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [selectedChatUser, setSelectedChatUser] = useState(null);
    const [isPoster, setIsPoster] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editPostId, setEditPostId] = useState(null);
    const isAdmin = currentUser?.role === 'admin';

    // Filter type: 'all', 'availability', or 'price'
    const [filterType, setFilterType] = useState('all');

    // Add refs to prevent unnecessary re-renders and track mounted state
    const isMounted = useRef(true);
    const pollingInterval = useRef(null);
    const autoDeleteInterval = useRef(null);
    const postsRef = useRef([]);
    const dateInputRef = useRef(null);

    const [formData, setFormData] = useState({
        medication_needed: '',
        search_date: '',
        notes: '',
        post_type: 'availability',
    });

    // Keep postsRef in sync with posts state
    useEffect(() => {
        postsRef.current = posts;
    }, [posts]);

    useEffect(() => {
        isMounted.current = true; // FIX: Reset to true for React 18 Strict Mode remounts
        fetchCurrentUser();
        fetchPosts();

        // Cleanup on unmount
        return () => {
            isMounted.current = false;
            if (pollingInterval.current) {
                clearInterval(pollingInterval.current);
            }
            if (autoDeleteInterval.current) {
                clearInterval(autoDeleteInterval.current);
            }
        };
    }, []);

    // Auto-delete posts when search_date has passed
    useEffect(() => {
        // Clear any existing interval
        if (autoDeleteInterval.current) {
            clearInterval(autoDeleteInterval.current);
        }

        const checkAndDeleteExpiredPosts = async () => {
            // Use postsRef to avoid dependency on posts state
            const currentPosts = postsRef.current;
            if (!currentPosts.length) return;

            const today = new Date().toISOString().split('T')[0];
            const expiredPosts = currentPosts.filter(post =>
                post.search_date && post.search_date < today
            );

            if (expiredPosts.length === 0) return;

            // Delete expired posts
            for (const post of expiredPosts) {
                try {
                    await api.delete(`/medication-availability/${post.id}`);
                    console.log(`Auto-deleted expired post: ${post.id}`);
                } catch (error) {
                    console.error(`Failed to auto-delete post ${post.id}:`, error);
                }
            }

            // Refresh posts only if we deleted something and component is still mounted
            if (expiredPosts.length > 0 && isMounted.current) {
                await fetchPosts();
            }
        };

        // Initial check after a small delay to avoid immediate re-render
        const initialTimeout = setTimeout(() => {
            checkAndDeleteExpiredPosts();
        }, 1000);

        // Set up interval
        autoDeleteInterval.current = setInterval(checkAndDeleteExpiredPosts, 3600000);

        return () => {
            clearTimeout(initialTimeout);
            if (autoDeleteInterval.current) {
                clearInterval(autoDeleteInterval.current);
            }
        };
    }, []); // Empty dependency array - only runs once on mount

    // Polling for live chat
    useEffect(() => {
        // Clear any existing polling interval
        if (pollingInterval.current) {
            clearInterval(pollingInterval.current);
            pollingInterval.current = null;
        }

        const fetchChatData = async () => {
            if (!selectedPost || !isMounted.current) return;

            try {
                if (isPoster) {
                    if (selectedChatUser) {
                        await fetchComments(selectedPost.id, selectedChatUser.id);
                    }
                } else {
                    await fetchComments(selectedPost.id);
                }
            } catch (error) {
                console.error('Error polling comments:', error);
            }
        };

        // Initial fetch
        if (selectedPost) {
            if (isPoster) {
                if (selectedChatUser) {
                    fetchComments(selectedPost.id, selectedChatUser.id);
                } else {
                    // Don't poll if no chat user selected
                }
            } else {
                fetchComments(selectedPost.id);
            }

            // Set up polling interval
            pollingInterval.current = setInterval(fetchChatData, 5000);
        }

        return () => {
            if (pollingInterval.current) {
                clearInterval(pollingInterval.current);
                pollingInterval.current = null;
            }
        };
    }, [selectedPost, selectedChatUser, isPoster]); // Proper dependencies

    const fetchCurrentUser = () => {
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                setCurrentUser(JSON.parse(userData));
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        }
    };

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const data = await api.get('/medication-availability');
            if (data && data.success && isMounted.current) {
                setPosts(Array.isArray(data.posts) ? data.posts : []);
            } else if (isMounted.current) {
                setPosts([]);
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
            if (isMounted.current) {
                setPosts([]);
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    };

    const fetchComments = async (postId, chatWithId = null) => {
        if (!postId || postId === 'undefined' || !isMounted.current) {
            return;
        }
        try {
            const isValidChatId = chatWithId && chatWithId !== 'undefined' && chatWithId !== 'null';
            const url = isValidChatId
                ? `/medication-availability/${postId}/comments?chat_with=${chatWithId}`
                : `/medication-availability/${postId}/comments`;

            const data = await api.get(url);
            if (data && data.success && isMounted.current) {
                setComments(Array.isArray(data.comments) ? data.comments : []);
            } else if (isMounted.current) {
                setComments([]);
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
            if (isMounted.current) {
                setComments([]);
            }
        } finally {
            if (isMounted.current) {
                setLoadingComments(false);
            }
        }
    };

    const fetchConversations = async (postId) => {
        try {
            const params = currentUser?.role === 'admin' ? '?admin=true' : '';
            const data = await api.get(`/medication-availability/${postId}/conversations${params}`);
            if (data && data.success && isMounted.current) {
                setConversations(Array.isArray(data.conversations) ? data.conversations : []);
            } else if (isMounted.current) {
                setConversations([]);
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
            if (isMounted.current) {
                setConversations([]);
            }
        }
    };

    const handlePostComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) {
            alert('Please enter a message');
            return;
        }

        try {
            const recipient_id = isPoster ? selectedChatUser?.id : selectedPost?.user_id;

            if (!recipient_id) {
                alert('Cannot determine recipient');
                return;
            }

            const data = await api.post(`/medication-availability/${selectedPost.id}/comments`, {
                content: newComment,
                recipient_id: recipient_id
            });

            if (data && data.success && isMounted.current) {
                setComments(prevComments => [...prevComments, data.comment]);
                setNewComment('');
                if (isPoster && !conversations.find(c => c.id === selectedChatUser?.id)) {
                    fetchConversations(selectedPost.id);
                }
            } else {
                alert('Message failed to send. Please try again.');
            }
        } catch (error) {
            const serverError = error?.error || error?.message || (typeof error === 'string' ? error : 'Unknown connection error');
            alert(`Message Failed!\n\nReason: ${serverError}`);
        }
    };

    const openChat = (post) => {
        setSelectedPost(post);
        const amIPoster = currentUser?.id === post.user_id;
        setIsPoster(amIPoster);
        setSelectedChatUser(null);
        setComments([]);

        if (amIPoster || isAdmin) {
            fetchConversations(post.id);
        }
    };

    const startChatWithUser = (user) => {
        setSelectedChatUser(user);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.medication_needed.trim()) {
            alert('Medication name is required');
            return;
        }

        // Ensure post_type is always one of the two valid values
        const safePostType = formData.post_type === 'price' ? 'price' : 'availability';

        try {
            const submitData = {
                medication_needed: formData.medication_needed.trim(),
                search_date: formData.search_date || null,
                notes: formData.notes || '',
                post_type: safePostType,
                // Some backends read "type" instead of "post_type" — send both to be safe.
                type: safePostType,
            };

            console.log('Submitting post:', submitData); // Debug: check DevTools Network tab

            if (isEditing) {
                const response = await api.put(`/medication-availability/${editPostId}`, submitData);
                if (response && response.success && isMounted.current) {
                    setIsEditing(false);
                    setEditPostId(null);
                    setFormData({
                        medication_needed: '',
                        search_date: '',
                        notes: '',
                        post_type: 'availability',
                    });
                    setShowAddForm(false);
                    await fetchPosts();
                }
            } else {
                const response = await api.post('/medication-availability', submitData);
                if (response && response.success && isMounted.current) {
                    setShowAddForm(false);
                    setFormData({
                        medication_needed: '',
                        search_date: '',
                        notes: '',
                        post_type: 'availability',
                    });
                    await fetchPosts();
                }
            }
        } catch (error) {
            const errorMsg = error?.error || error?.message || (typeof error === 'string' ? error : 'Operation failed');
            alert('Operation failed: ' + errorMsg);
        }
    };

    const handleEdit = (post) => {
        const rawType = post.post_type ?? post.postType ?? post.type;
        const normalizedType = rawType === 'price' ? 'price' : 'availability';

        setFormData({
            medication_needed: post.medication_needed || '',
            search_date: post.search_date || '',
            notes: post.notes || '',
            post_type: normalizedType,
        });
        setEditPostId(post.id);
        setIsEditing(true);
        setShowAddForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this post?')) return;

        const post = posts.find(p => p.id === id);
        if (!post) return;

        const isAuthorized = currentUser?.id === post.user_id || currentUser?.role === 'admin';

        if (!isAuthorized) {
            alert('You are not authorized to delete this post');
            return;
        }

        try {
            const data = await api.delete(`/medication-availability/${id}`);
            if (data && data.success && isMounted.current) {
                setPosts(prevPosts => prevPosts.filter(p => p.id !== id));
                if (selectedPost?.id === id) {
                    setSelectedPost(null);
                    setSelectedChatUser(null);
                }
            }
        } catch (error) {
            const errorMsg = error?.error || error?.message || 'Error deleting post';
            alert(errorMsg);
        }
    };

    // Helper: normalize post type from any possible backend field name
    const getNormalizedPostType = (post) => {
        const rawType = post?.post_type ?? post?.postType ?? post?.type;
        return rawType === 'price' ? 'price' : 'availability';
    };

    // Filter posts
    const filteredPosts = Array.isArray(posts) ? posts.filter(post => {
        if (!post || !post.medication_needed) return false;

        // Filter by post type (normalized)
        const normalizedType = getNormalizedPostType(post);
        if (filterType !== 'all' && normalizedType !== filterType) return false;

        const term = searchTerm.toLowerCase().trim();
        if (!term) return true;

        const medName = (post.medication_needed || '').toLowerCase();
        const institution = (post.user?.institution || '').toLowerCase();
        const location = (post.user?.location || '').toLowerCase();

        return medName.includes(term) || institution.includes(term) || location.includes(term);
    }) : [];

    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';

            return date.toLocaleDateString([], {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return '';
        }
    };

    const isDatePassed = (dateString) => {
        if (!dateString) return false;
        const today = new Date().toISOString().split('T')[0];
        return dateString < today;
    };

    // Memoize filtered posts to prevent unnecessary re-renders
    const memoizedFilteredPosts = React.useMemo(
        () => filteredPosts,
        [posts, searchTerm, filterType]
    );

    return (
        <div className="p-6 max-w-7xl mx-auto flex flex-col h-[calc(100vh-100px)]">
            {/* Header */}
            <div className="flex flex-col md:row justify-between items-start md:items-center mb-6 gap-4 flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <FaPills className="text-blue-600" />
                           መድሃኒት እና ዋጋ ማፈላለጊያ
                    </h1>

                    <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold text-gray-500">
                        <span className="bg-gray-100 px-3 py-1 rounded-full">• Anonymous post</span>
                        <span className="bg-gray-100 px-3 py-1 rounded-full">• Private chat</span>
                        <span className="bg-gray-100 px-3 py-1 rounded-full">• Deletes if expired</span>
                    </div>
                    
                    <p className="text-gray-600 mt-1">መድሃኒት እያፈላለጉ ነው? ዋጋ ቅናሽ እያፈላለጉ ነው? የሚፈለገው መድሃኒት ለፋርማሲ ባለሙያዎች እንዲደርስ በዚህ ያጋሩን</p>
                </div>
                <button
                    onClick={() => {
                        setShowAddForm(!showAddForm);
                        if (isEditing) {
                            setIsEditing(false);
                            setFormData({ medication_needed: '', search_date: '', notes: '', post_type: 'availability' });
                        }
                    }}
                    className={`${showAddForm ? 'bg-gray-500' : 'bg-blue-600'} text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:opacity-90 transition shadow-lg font-bold`}
                >
                    {showAddForm ? 'Cancel' : <><FaPlus />መድሃኒቱን በዚህ ያጋሩ</>}
                </button>
            </div>

            <div className="flex flex-col md:flex-row flex-1 gap-6 overflow-hidden">
                {/* ==================== Left Side: Posts List ==================== */}
                {/* Restructured: flex-col so form stays fixed and only posts scroll */}
                <div className={`flex-1 flex flex-col overflow-hidden ${selectedPost ? 'hidden md:block' : ''}`}>

                    {/* -------- Fixed Header: Search + Filter Tabs -------- */}
                    <div className="flex-shrink-0 pr-2">
                        {/* Search */}
                        <div className="relative mb-4 bg-gray-50 pt-2 pb-2">
                            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search medication"
                                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setFilterType('all')}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition ${filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'}`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setFilterType('availability')}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition ${filterType === 'availability' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'}`}
                            >
                                Availability
                            </button>
                            <button
                                onClick={() => setFilterType('price')}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition ${filterType === 'price' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-green-300'}`}
                            >
                                Price
                            </button>
                        </div>
                    </div>

                    {/* -------- Fixed: Add/Edit Form (COMPACT, no scroll) -------- */}
                    {showAddForm && (
                        <div className="flex-shrink-0 bg-white p-4 rounded-2xl shadow-lg border-2 border-blue-100 mb-4">
                            <form onSubmit={handleSubmit} className="flex flex-col gap-3">

                                {/* Post Type Selector */}
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, post_type: 'availability' })}
                                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${formData.post_type === 'availability' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    >
                                        የጠፋ መድሃኒት ማፈላለጊያ 
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, post_type: 'price' })}
                                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${formData.post_type === 'price' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    >
                                        ዋጋ ቅናሽ ማፈላለጊያ
                                    </button>
                                </div>

                                {/* Medication name */}
                                <input
                                    type="text"
                                    required
                                    value={formData.medication_needed}
                                    onChange={(e) => setFormData({ ...formData, medication_needed: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:border-blue-500 outline-none"
                                    placeholder="የመድሃኒቱን ስም ይጻፉ"
                                />

                                {/* Date row */}
                                <div className="flex items-center gap-2">
                                    <label className="text-sm text-gray-500 whitespace-nowrap">
                                        እስከ መች ይፈለግ
                                    </label>

                                    {/* Calendar Button */}
                                    <div
                                        className="relative w-10 h-10 flex-shrink-0 cursor-pointer flex items-center justify-center bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                                        onClick={() => {
                                            try {
                                                dateInputRef.current?.showPicker();
                                            } catch (e) {
                                                dateInputRef.current?.focus();
                                            }
                                        }}
                                    >
                                        <FaCalendarAlt className="text-lg text-blue-600 pointer-events-none" />

                                        <input
                                            ref={dateInputRef}
                                            type="date"
                                            value={formData.search_date}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    search_date: e.target.value,
                                                })
                                            }
                                            min={new Date().toISOString().split("T")[0]}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onClick={(e) => {
                                                try {
                                                    e.target.showPicker();
                                                } catch (err) {}
                                            }}
                                        />
                                    </div>

                                    {/* Selected Date */}
                                    <span className="text-gray-700 text-sm">
                                        {formData.search_date
                                            ? new Date(formData.search_date).toLocaleDateString("en-CA", {
                                                  month: "short",
                                                  day: "numeric",
                                              })
                                            : "ቀን ይምረጡ"}
                                    </span>
                                </div>

                                {/* Textarea + Post button */}
                                <div className="flex items-center gap-2">
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="flex-1 border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:border-blue-500 resize-none"
                                        placeholder="ተጨማሪ መረጃ"
                                        rows="1"
                                    />
                                    <button
                                        type="submit"
                                        className="text-white font-bold py-2.5 px-4 rounded-xl whitespace-nowrap flex-shrink-0 bg-green-600 hover:bg-green-700 transition"
                                    >
                                        {isEditing ? "Update" : "Post"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* -------- Scrollable: Posts List ONLY -------- */}
                    <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                        {loading ? (
                            <div className="py-10 text-center">Loading posts...</div>
                        ) : memoizedFilteredPosts.length === 0 ? (
                            <div className="py-20 text-center text-gray-400">No postings found.</div>
                        ) : (
                            memoizedFilteredPosts.map(post => {
                                const searchDatePassed = isDatePassed(post.search_date);
                                const normalizedType = getNormalizedPostType(post);
                                const isPricePost = normalizedType === 'price';

                                return (
                                    <div
                                        key={post.id}
                                        onClick={() => openChat(post)}
                                        className={`p-5 rounded-2xl border-2 transition-all cursor-pointer bg-white 
                                            ${selectedPost?.id === post.id ? 'border-blue-500 shadow-md scale-[1.01]' : 'border-gray-100 hover:border-blue-200'}
                                            ${searchDatePassed ? 'opacity-50 border-red-200' : ''}
                                        `}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-800">
                                                    {post.medication_needed}
                                                    {searchDatePassed && (
                                                        <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                                                            Expired
                                                        </span>
                                                    )}
                                                </h3>
                                                {post.search_date && (
                                                    <span className="text-[11px] text-lg font-medium">
                                                        እስከ: {formatDate(post.search_date)}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex flex-col items-end gap-1">
                                                {/* Post Type Badge - Right Upper Corner */}
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${isPricePost ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {isPricePost ? 'Price' : 'Availability'}
                                                </span>

                                                <span className="text-[11px] text-gray-400 font-medium">
                                                    Posted: {formatDate(post.created_at)}
                                                </span>

                                                {currentUser && (currentUser.id === post.user_id || currentUser.role === 'admin') && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleEdit(post); }}
                                                            className="text-blue-500 hover:text-blue-700 p-1"
                                                            title="Edit"
                                                        >
                                                            <FaEdit className="text-sm" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(post.id); }}
                                                            className="text-red-400 hover:text-red-600 p-1"
                                                            title="Delete"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* ==================== Right Side: Chat Sidebar ==================== */}
                <div className={`w-full md:w-96 flex flex-col bg-gray-50 rounded-3xl overflow-hidden border border-gray-200 ${!selectedPost ? 'hidden md:flex' : 'flex'}`}>
                    {selectedPost ? (
                        <>
                            <div className="p-4 bg-white border-b flex justify-between items-center">
                                <button
                                    onClick={() => setSelectedPost(null)}
                                    className="mr-3 md:hidden text-gray-500 p-2 hover:bg-gray-100 rounded-full"
                                >
                                    <FaArrowLeft />
                                </button>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-800 truncate">{selectedPost.medication_needed}</h4>
                                    <p className="text-xs text-blue-600 font-bold truncate">
                                        {isPoster
                                            ? (selectedChatUser ? `Chatting with: ${selectedChatUser.full_name}` : 'Select a conversation')
                                            : `Contacting: ${selectedPost.user?.institution || 'Pharmacy'}`
                                        }
                                    </p>
                                </div>
                                <button onClick={() => { setSelectedPost(null); setSelectedChatUser(null); }} className="p-2 text-gray-400 hover:text-gray-600 flex-shrink-0"><FaTimes /></button>
                            </div>

                            {isPoster && !selectedChatUser ? (
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Inquiries</h5>
                                    {conversations.length === 0 ? (
                                        <div className="text-center py-20 text-gray-400">
                                            <FaCommentMedical className="text-4xl mx-auto mb-4 opacity-20" />
                                            <p className="text-sm px-4">No one has messaged about this post yet.</p>
                                        </div>
                                    ) : (
                                        conversations.map(user => (
                                            <div
                                                key={user.id}
                                                onClick={() => startChatWithUser(user)}
                                                className="p-4 bg-white rounded-2xl border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer flex items-center gap-3"
                                            >
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                                    {user.full_name?.charAt(0) || 'U'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-gray-800 truncate">{user.full_name || 'User'}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
                                        {isPoster && (
                                            <button
                                                onClick={() => setSelectedChatUser(null)}
                                                className="self-start text-[10px] font-bold text-blue-600 hover:underline mb-2 flex items-center gap-1"
                                            >
                                                ← Back to all inquiries
                                            </button>
                                        )}

                                        <div className="bg-blue-50 p-3 rounded-xl text-xs text-blue-800 border border-blue-100 italic">
                                            {selectedPost.notes || "No additional notes provided."}
                                        </div>

                                        {loadingComments ? (
                                            <div className="flex flex-col items-center justify-center py-10">
                                                <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mb-2"></div>
                                                <p className="text-xs text-gray-400">Loading conversation...</p>
                                            </div>
                                        ) : comments.length === 0 ? (
                                            <div className="text-center py-10 text-gray-400 text-sm">No messages yet. Start a conversation about this medication.</div>
                                        ) : (
                                            comments.map(comment => {
                                                const userObj = JSON.parse(localStorage.getItem('user') || '{}');
                                                const myId = String(userObj.id || userObj.user_id || '').toLowerCase();
                                                const commentUserId = String(comment.user_id || '').toLowerCase();
                                                const isMe = (commentUserId === myId && myId !== '');

                                                const getUserStyle = (userId, isCurrentUser) => {
                                                    if (isCurrentUser) return {
                                                        bubble: 'bg-blue-600',
                                                        label: 'text-blue-600',
                                                        align: 'items-end',
                                                        radius: 'rounded-tr-none'
                                                    };
                                                    return {
                                                        bubble: 'bg-gray-800',
                                                        label: 'text-gray-800',
                                                        align: 'items-start',
                                                        radius: 'rounded-tl-none'
                                                    };
                                                };

                                                const style = getUserStyle(comment.user_id, isMe);

                                                return (
                                                    <div key={comment.id} className={`flex flex-col ${isMe ? 'self-end items-end' : 'self-start items-start'} max-w-[90%] mb-2`}>
                                                        <div className={`p-3 px-4 rounded-2xl shadow-md text-sm leading-relaxed text-white ${style.bubble} ${style.radius}`}>
                                                            {comment.content}
                                                        </div>
                                                        <div className={`flex items-center gap-2 mt-1.5 px-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${style.label}`}>
                                                                {isMe ? 'You' : comment.user?.full_name || 'Pharmacist'}
                                                            </span>
                                                            <span className="text-[9px] text-gray-400 font-medium ml-2">
                                                                {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>

                                    <form onSubmit={handlePostComment} className="p-4 bg-white border-t flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Type a secrete message..."
                                            className="flex-1 border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-1 focus:ring-blue-500"
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                        />
                                        <button type="submit" className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition">
                                            <FaPaperPlane />
                                        </button>
                                    </form>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
                            <FaCommentMedical className="text-5xl mb-4 text-gray-200" />
                            <p className="font-medium">Select a medication posting to view details and start a private (secrete) conversation.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MedicationAvailability;
