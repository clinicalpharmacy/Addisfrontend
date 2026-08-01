import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FaSearch, FaArrowLeft, FaShieldAlt, FaBaby, FaBabyCarriage, 
    FaUserEdit, FaProcedures, FaHeartbeat, FaPills, FaExclamationTriangle,
    FaCheckCircle, FaExclamationCircle, FaSpinner, FaInfoCircle,
    FaCamera, FaTimes, FaMicrophone, FaUpload
} from 'react-icons/fa';
import Tesseract from 'tesseract.js';
import api from '../utils/api';

// Comprehensive medication database with brand names and generic names
const medicationDatabase = {
    // Pain relievers
    'advil': { generic: 'ibuprofen', category: 'NSAID' },
    'motrin': { generic: 'ibuprofen', category: 'NSAID' },
    'ibuprofen': { generic: 'ibuprofen', category: 'NSAID' },
    'tylenol': { generic: 'acetaminophen', category: 'Analgesic' },
    'paracetamol': { generic: 'acetaminophen', category: 'Analgesic' },
    'acetaminophen': { generic: 'acetaminophen', category: 'Analgesic' },
    'aleve': { generic: 'naproxen', category: 'NSAID' },
    'naprosyn': { generic: 'naproxen', category: 'NSAID' },
    'naproxen': { generic: 'naproxen', category: 'NSAID' },
    'aspirin': { generic: 'aspirin', category: 'NSAID' },
    
    // Antibiotics
    'amoxicillin': { generic: 'amoxicillin', category: 'Antibiotic' },
    'amoxil': { generic: 'amoxicillin', category: 'Antibiotic' },
    'azithromycin': { generic: 'azithromycin', category: 'Antibiotic' },
    'zithromax': { generic: 'azithromycin', category: 'Antibiotic' },
    'ciprofloxacin': { generic: 'ciprofloxacin', category: 'Antibiotic' },
    'cipro': { generic: 'ciprofloxacin', category: 'Antibiotic' },
    'doxycycline': { generic: 'doxycycline', category: 'Antibiotic' },
    'vibramycin': { generic: 'doxycycline', category: 'Antibiotic' },
    'cephalexin': { generic: 'cephalexin', category: 'Antibiotic' },
    'keflex': { generic: 'cephalexin', category: 'Antibiotic' },
    
    // Antidepressants
    'sertraline': { generic: 'sertraline', category: 'SSRI' },
    'zoloft': { generic: 'sertraline', category: 'SSRI' },
    'fluoxetine': { generic: 'fluoxetine', category: 'SSRI' },
    'prozac': { generic: 'fluoxetine', category: 'SSRI' },
    'escitalopram': { generic: 'escitalopram', category: 'SSRI' },
    'lexapro': { generic: 'escitalopram', category: 'SSRI' },
    'citalopram': { generic: 'citalopram', category: 'SSRI' },
    'celexa': { generic: 'citalopram', category: 'SSRI' },
    
    // Anti-anxiety
    'alprazolam': { generic: 'alprazolam', category: 'Benzodiazepine' },
    'xanax': { generic: 'alprazolam', category: 'Benzodiazepine' },
    'lorazepam': { generic: 'lorazepam', category: 'Benzodiazepine' },
    'ativan': { generic: 'lorazepam', category: 'Benzodiazepine' },
    'diazepam': { generic: 'diazepam', category: 'Benzodiazepine' },
    'valium': { generic: 'diazepam', category: 'Benzodiazepine' },
    'clonazepam': { generic: 'clonazepam', category: 'Benzodiazepine' },
    'klonopin': { generic: 'clonazepam', category: 'Benzodiazepine' },
    
    // Sleep aids
    'zolpidem': { generic: 'zolpidem', category: 'Sedative' },
    'ambien': { generic: 'zolpidem', category: 'Sedative' },
    
    // Cardiovascular
    'lisinopril': { generic: 'lisinopril', category: 'ACE Inhibitor' },
    'zestril': { generic: 'lisinopril', category: 'ACE Inhibitor' },
    'metformin': { generic: 'metformin', category: 'Antidiabetic' },
    'glucophage': { generic: 'metformin', category: 'Antidiabetic' },
    'atorvastatin': { generic: 'atorvastatin', category: 'Statin' },
    'lipitor': { generic: 'atorvastatin', category: 'Statin' },
    'simvastatin': { generic: 'simvastatin', category: 'Statin' },
    'zocor': { generic: 'simvastatin', category: 'Statin' },
    'amlodipine': { generic: 'amlodipine', category: 'Calcium Channel Blocker' },
    'norvasc': { generic: 'amlodipine', category: 'Calcium Channel Blocker' },
    
    // Blood pressure
    'hydrochlorothiazide': { generic: 'hydrochlorothiazide', category: 'Diuretic' },
    'hctz': { generic: 'hydrochlorothiazide', category: 'Diuretic' },
    'losartan': { generic: 'losartan', category: 'ARB' },
    'cozaar': { generic: 'losartan', category: 'ARB' },
    
    // Diabetes
    'insulin': { generic: 'insulin', category: 'Antidiabetic' },
    'lantus': { generic: 'insulin glargine', category: 'Antidiabetic' },
    
    // ADD MORE MEDICATIONS AS NEEDED
};

const CategoryIcon = ({ type }) => {
    switch (type) {
        case 'pregnancy': return <FaBabyCarriage />;
        case 'lactation': return <FaBaby />;
        case 'elderly': return <FaUserEdit />;
        case 'neonate': return <FaProcedures />;
        case 'kidney_failure': return <FaHeartbeat />;
        case 'liver_failure': return <FaHeartbeat />;
        default: return <FaShieldAlt />;
    }
};

const CategoryTitle = ({ type }) => {
    switch (type) {
        case 'pregnancy': return 'Pregnancy';
        case 'lactation': return 'Breastfeeding';
        case 'elderly': return 'Elderly (Over 65)';
        case 'neonate': return 'Neonates/Infants';
        case 'kidney_failure': return 'Kidney Failure';
        case 'liver_failure': return 'Liver Failure';
        default: return type;
    }
};

const StatusBadge = ({ status }) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('safe') && !s.includes('unsafe')) {
        return <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"><FaCheckCircle /> Safe</span>;
    }
    if (s.includes('caution') || s.includes('monitor') || s.includes('adjust')) {
        return <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"><FaExclamationTriangle /> Caution</span>;
    }
    if (s.includes('contraindicate') || s.includes('avoid') || s.includes('unsafe')) {
        return <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"><FaExclamationCircle /> Avoid / Contraindicated</span>;
    }
    return <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"><FaInfoCircle /> Unknown / Unclear</span>;
};

const QuickSafetyCheck = () => {
    const navigate = useNavigate();
    const [drugName, setDrugName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isProcessingImage, setIsProcessingImage] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recognitionResult, setRecognitionResult] = useState('');
    const [ocrProgress, setOcrProgress] = useState(0);
    
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const recognitionRef = useRef(null);

    // Initialize speech recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';
            
            recognitionRef.current.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';
                
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }
                
                const recognizedText = finalTranscript || interimTranscript;
                setRecognitionResult(recognizedText);
                
                // Try to find medication match
                const match = findMedicationMatch(recognizedText);
                if (match) {
                    setDrugName(match);
                    if (finalTranscript) {
                        setIsRecording(false);
                    }
                }
            };
            
            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsRecording(false);
                setError('Voice recognition failed. Please try again or type the name.');
            };
            
            recognitionRef.current.onend = () => {
                setIsRecording(false);
            };
        }
    }, []);

    // Find medication match from database
    const findMedicationMatch = (text) => {
        const cleaned = text.toLowerCase().trim();
        const words = cleaned.split(/\s+/);
        
        // Check each word for match
        for (const word of words) {
            if (medicationDatabase[word]) {
                return medicationDatabase[word].generic;
            }
        }
        
        // Check for partial matches
        for (const [key, value] of Object.entries(medicationDatabase)) {
            if (cleaned.includes(key) || key.includes(cleaned)) {
                return value.generic;
            }
        }
        
        return null;
    };

    // Extract medication name from OCR text
    const extractMedicationFromText = (text) => {
        const cleaned = text.toLowerCase().trim();
        const words = cleaned.split(/\s+/);
        
        // First try to find exact matches
        for (const word of words) {
            if (medicationDatabase[word]) {
                return medicationDatabase[word].generic;
            }
        }
        
        // Try to find matches with common medication name patterns
        // Look for words that might be medication names (more than 3 characters, not common words)
        const commonWords = ['take', 'take', 'daily', 'once', 'twice', 'three', 'times', 'day', 'with', 'food', 'water', 'meal', 'mg', 'ml', 'tablet', 'capsule'];
        const potentialMeds = words.filter(word => 
            word.length > 3 && 
            !commonWords.includes(word) &&
            !word.match(/^\d+$/) // not just numbers
        );
        
        for (const med of potentialMeds) {
            // Check if this word or any part of it matches our database
            for (const [key, value] of Object.entries(medicationDatabase)) {
                if (med.includes(key) || key.includes(med)) {
                    return value.generic;
                }
            }
        }
        
        // If we found potential medications but no exact match, return the first one
        if (potentialMeds.length > 0) {
            return potentialMeds[0];
        }
        
        return null;
    };

    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setIsCameraOpen(true);
            setError('');
        } catch (err) {
            console.error('Error accessing camera:', err);
            setError('Unable to access camera. Please check permissions or use a device with a camera.');
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsCameraOpen(false);
        setOcrProgress(0);
    }, []);

    const startVoiceRecognition = useCallback(() => {
        if (!recognitionRef.current) {
            setError('Voice recognition is not supported in your browser. Please type the medication name.');
            return;
        }
        
        try {
            setRecognitionResult('');
            recognitionRef.current.start();
            setIsRecording(true);
            setError('');
        } catch (err) {
            console.error('Error starting voice recognition:', err);
            setError('Failed to start voice recognition. Please try again.');
        }
    }, []);

    const handleImageUpload = useCallback((event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                processMedicationImage(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const captureImage = useCallback(async () => {
        if (!videoRef.current || !canvasRef.current) return;
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to base64 image
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        
        // Process the image to extract medication name
        await processMedicationImage(imageData);
        
        // Stop camera after capture
        stopCamera();
    }, [stopCamera]);

    const processMedicationImage = useCallback(async (imageData) => {
        setIsProcessingImage(true);
        setError('');
        setOcrProgress(0);
        
        try {
            // Use Tesseract.js for client-side OCR
            const result = await Tesseract.recognize(
                imageData,
                'eng',
                {
                    logger: (m) => {
                        if (m.status === 'recognizing text') {
                            const progress = Math.round(m.progress * 100);
                            setOcrProgress(progress);
                        }
                    }
                }
            );
            
            const recognizedText = result.data.text;
            console.log('OCR Result:', recognizedText);
            
            // Extract medication name from the recognized text
            const medicationName = extractMedicationFromText(recognizedText);
            
            if (medicationName) {
                // Check if it's a brand name that needs to be converted to generic
                const genericName = medicationDatabase[medicationName.toLowerCase()]?.generic || medicationName;
                setDrugName(genericName);
                setError('');
                
                // Optional: Auto-search after a short delay
                setTimeout(() => {
                    // Auto-submit the form
                    const form = document.getElementById('search-form');
                    if (form) form.dispatchEvent(new Event('submit'));
                }, 500);
                
            } else {
                setError('Could not identify medication name from the image. Please try again or type the name manually.');
            }
            
        } catch (err) {
            console.error('Error processing image:', err);
            setError('Failed to recognize medication from image. Please try again or enter the name manually.');
        } finally {
            setIsProcessingImage(false);
            setOcrProgress(0);
        }
    }, []);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!drugName.trim()) return;

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const response = await api.post('/quick-safety', { 
                medication: drugName.trim(),
                category: selectedCategory === 'all' ? null : selectedCategory
            });
            if (response.success && response.safetyProfile) {
                setResult(response.safetyProfile);
            } else {
                setError('Failed to retrieve safety data. Please try again.');
            }
        } catch (err) {
            console.error(err);
            setError(err.error || 'Failed to check medication. It might not be recognized.');
        } finally {
            setLoading(false);
        }
    };

    // Handle voice recognition result automatically
    useEffect(() => {
        if (recognitionResult && !isRecording) {
            const match = findMedicationMatch(recognitionResult);
            if (match) {
                setDrugName(match);
                // Auto-search after voice recognition
                setTimeout(() => {
                    const form = document.getElementById('search-form');
                    if (form) form.dispatchEvent(new Event('submit'));
                }, 300);
            }
        }
    }, [recognitionResult, isRecording]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <button 
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors font-medium"
                    >
                        <FaArrowLeft /> Back
                    </button>
                    <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
                        <FaShieldAlt className="text-blue-600" /> Quick Safety Check
                    </h1>
                    <div className="w-20"></div>
                </div>
            </header>

            <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8">
                {/* Search Hero */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 md:p-12 text-white shadow-xl text-center mb-8 relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">Check Medication Safety</h2>
                        <p className="text-blue-100 text-lg md:text-xl mb-8 max-w-2xl mx-auto opacity-90 font-medium">
                            Enter any drug name, take a photo, or use voice input to instantly see if it's safe for pregnancy, breastfeeding, neonate, the elderly, or those with organ failure.
                        </p>
                        
                        <form id="search-form" onSubmit={handleSearch} className="max-w-3xl mx-auto relative group flex flex-col md:flex-row gap-3">
                            <div className="relative flex-1">
                                <input 
                                    type="text"
                                    placeholder="e.g., Ibuprofen, Amoxicillin..."
                                    value={drugName}
                                    onChange={(e) => setDrugName(e.target.value)}
                                    className="w-full bg-white text-gray-800 px-6 py-4 pl-12 rounded-xl text-lg font-bold shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-400/50 transition-all placeholder:text-gray-400"
                                />
                                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                                
                                {/* Action buttons */}
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    {/* Voice button */}
                                    <button
                                        type="button"
                                        onClick={startVoiceRecognition}
                                        disabled={isRecording || isProcessingImage}
                                        className={`p-2 rounded-full transition-colors ${
                                            isRecording 
                                                ? 'text-red-500 bg-red-50 animate-pulse' 
                                                : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        title="Use voice input"
                                    >
                                        <FaMicrophone className="text-lg" />
                                    </button>
                                    
                                    {/* Camera button */}
                                    <button
                                        type="button"
                                        onClick={startCamera}
                                        disabled={isProcessingImage || isRecording}
                                        className="text-gray-400 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Take a photo of the medication package"
                                    >
                                        {isProcessingImage ? (
                                            <FaSpinner className="animate-spin text-blue-600" />
                                        ) : (
                                            <FaCamera className="text-lg" />
                                        )}
                                    </button>
                                    
                                    {/* Hidden file upload for image selection */}
                                    <label className="cursor-pointer">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                            disabled={isProcessingImage}
                                        />
                                        <FaUpload className="text-lg text-gray-400 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-blue-50" />
                                    </label>
                                </div>
                            </div>
                            
                            <select 
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="bg-white text-gray-800 px-4 py-4 rounded-xl text-base font-semibold shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-400/50 appearance-none cursor-pointer border-r-8 border-transparent"
                            >
                                <option value="all">Select Conditions</option>
                                <option value="pregnancy">Pregnancy</option>
                                <option value="lactation">Breastfeeding</option>
                                <option value="elderly">Elderly (Over 65 years old)</option>
                                <option value="neonate">Neonates/Infants</option>
                                <option value="kidney_failure">Kidney Failure</option>
                                <option value="liver_failure">Liver Failure</option>
                            </select>

                            <button 
                                type="submit"
                                disabled={loading || !drugName.trim()}
                                className="bg-blue-900 hover:bg-gray-900 disabled:bg-blue-400 text-white px-8 py-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
                            >
                                {loading ? <FaSpinner className="animate-spin" /> : 'Check Safety'}
                            </button>
                        </form>

                        {/* Voice recognition status */}
                        {isRecording && (
                            <div className="mt-4 text-white flex items-center justify-center gap-3 animate-pulse">
                                <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                                <span className="text-sm font-medium">Listening... Speak the medication name</span>
                                <span className="text-xs opacity-75">(e.g., "Ibuprofen")</span>
                            </div>
                        )}
                        
                        {recognitionResult && !isRecording && (
                            <div className="mt-3 text-blue-100 text-sm">
                                <span className="font-medium">Recognized: </span>
                                {recognitionResult}
                            </div>
                        )}

                        {/* OCR Progress */}
                        {isProcessingImage && (
                            <div className="mt-4 bg-white/20 rounded-xl p-4">
                                <div className="flex items-center justify-between text-white mb-2">
                                    <span className="text-sm font-medium">Processing image...</span>
                                    <span className="text-sm">{ocrProgress}%</span>
                                </div>
                                <div className="w-full bg-white/30 rounded-full h-2 overflow-hidden">
                                    <div 
                                        className="bg-white h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${ocrProgress}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Camera Modal */}
                {isCameraOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl">
                            <div className="p-4 flex items-center justify-between border-b border-gray-200">
                                <h3 className="text-xl font-bold text-gray-800">Take a Photo</h3>
                                <button
                                    onClick={stopCamera}
                                    className="text-gray-500 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
                                >
                                    <FaTimes className="text-2xl" />
                                </button>
                            </div>
                            
                            <div className="relative bg-black">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    className="w-full h-auto max-h-[500px] object-contain"
                                />
                                <canvas ref={canvasRef} className="hidden" />
                            </div>
                            
                            <div className="p-4 flex flex-col gap-4">
                                <div className="text-center text-sm text-gray-600">
                                    Position the medication package clearly in the frame and tap the capture button
                                </div>
                                <div className="flex justify-center gap-4">
                                    <button
                                        onClick={stopCamera}
                                        className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-full font-bold text-gray-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={captureImage}
                                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold transition-colors flex items-center gap-2"
                                    >
                                        <FaCamera /> Capture
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 animate-fadeIn mb-8">
                        <FaExclamationTriangle className="text-red-500 text-xl" />
                        <span className="font-medium">{error}</span>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-20 animate-fadeIn">
                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                            <FaShieldAlt className="text-4xl text-blue-600 animate-pulse" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Analyzing {drugName}...</h3>
                        <p className="text-gray-500">Checking clinical safety guidelines across special populations.</p>
                    </div>
                )}

                {/* Results */}
                {result && !loading && (
                    <div className="animate-fadeIn space-y-6">
                        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
                            <h3 className="text-3xl font-black text-gray-900 capitalize mb-2">{result.medication}</h3>
                            <p className="text-gray-600 text-lg leading-relaxed">{result.general_overview}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(result.categories || {})
                                .filter(([key]) => selectedCategory === 'all' || key === selectedCategory)
                                .map(([key, data]) => (
                                <div key={key} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-blue-200 transition-colors group">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                <CategoryIcon type={key} />
                                            </div>
                                            <h4 className="font-bold text-gray-800 text-lg"><CategoryTitle type={key} /></h4>
                                        </div>
                                        <StatusBadge status={data.status} />
                                    </div>
                                    <p className="text-gray-600 leading-relaxed text-sm">{data.details}</p>
                                </div>
                            ))}
                        </div>

                        {/* Major Interactions */}
                        {result.major_interactions && result.major_interactions.length > 0 && (
                            <div className="bg-amber-50 rounded-2xl p-6 md:p-8 shadow-sm border border-amber-200 mt-6">
                                <h4 className="text-xl font-bold text-amber-900 flex items-center gap-2 mb-4">
                                    <FaPills className="text-amber-600" /> Major Drug Interactions (Avoid With)
                                </h4>
                                <ul className="list-disc list-inside space-y-2 text-amber-800 font-medium ml-2">
                                    {result.major_interactions.map((interaction, i) => (
                                        <li key={i}>{interaction}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        
                        <div className="mt-8 text-center bg-gray-50 p-4 rounded-xl text-xs text-gray-400 flex items-center justify-center gap-2">
                            <FaInfoCircle /> Disclaimer: This information is for educational purposes only and does not replace consultation with a qualified healthcare professional. Medication information may change with emerging evidence, manufacturers' current prescribing information, and evolving medical practice. Users are responsible for verifying all information and exercising their own professional judgment. 
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default QuickSafetyCheck;
