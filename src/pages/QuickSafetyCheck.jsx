import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FaSearch, FaArrowLeft, FaShieldAlt, FaBaby, FaBabyCarriage, 
    FaUserEdit, FaProcedures, FaHeartbeat, FaPills, FaExclamationTriangle,
    FaCheckCircle, FaExclamationCircle, FaSpinner, FaInfoCircle,
    FaCamera, FaTimes, FaMicrophone, FaUpload
} from 'react-icons/fa';
import api from '../utils/api';

// Import Tesseract.js for OCR
const Tesseract = require('tesseract.js');

// Common medication name patterns (suffixes and prefixes)
const MEDICATION_PATTERNS = {
    suffixes: [
        /-ol$/i,      // propranolol, metoprolol
        /-am$/i,      // diazepam, lorazepam
        /-in$/i,      // insulin, lovastatin
        /-one$/i,     // prednisone, testosterone
        /-ide$/i,     // metformin, glipizide
        /-ine$/i,     // codeine, quinine
        /-pen$/i,     // amprenavir
        /-vir$/i,     // acyclovir, oseltamivir
        /-floxacin$/i,// ciprofloxacin
        /-mycin$/i,   // azithromycin
        /-cycline$/i, // doxycycline
        /-statin$/i,  // atorvastatin
        /-pril$/i,    // lisinopril
        /-sartan$/i,  // losartan
        /-prazole$/i, // omeprazole
        /-oxetine$/i, // fluoxetine
        /-lactam$/i,  // amoxicillin
        /-cillin$/i,  // penicillin
        /-conazole$/i,// fluconazole
        /-dipine$/i,  // amlodipine
        /-phen$/i,    // diphenhydramine
        /-done$/i,    // tramadone, methadone
        /-pam$/i,     // clonazepam, diazepam
        /-pine$/i,    // olanzapine, clozapine
    ],
    prefixes: [
        /^anti/i,     // antibiotic, antifungal
        /^hydro/i,    // hydrochlorothiazide, hydrocodone
        /^chlor/i,    // chlorpheniramine, chlordiazepoxide
        /^meth/i,     // methadone, methotrexate
        /^phen/i,     // phenytoin, phenobarbital
    ],
    commonMedicationWords: [
        'tablet', 'capsule', 'injection', 'solution', 'suspension',
        'ointment', 'cream', 'gel', 'patch', 'inhaler', 'spray',
        'drop', 'syrup', 'elixir', 'suppository', 'enema'
    ]
};

// Common words to ignore in text extraction
const COMMON_WORDS = new Set([
    'take', 'daily', 'once', 'twice', 'three', 'times', 'day', 'with', 
    'food', 'water', 'meal', 'dose', 'dosage', 'strength', 'generic', 
    'brand', 'tablet', 'capsule', 'pill', 'mg', 'ml', 'mcg', 'gram',
    'prescription', 'medication', 'medicine', 'drug', 'pharmacy',
    'adult', 'child', 'infant', 'elderly', 'patient', 'doctor',
    'hospital', 'clinic', 'pharmacist', 'nurse', 'physician',
    'morning', 'evening', 'night', 'week', 'month', 'year',
    'oral', 'topical', 'intravenous', 'subcutaneous', 'intramuscular',
    'please', 'store', 'keep', 'away', 'from', 'heat', 'light',
    'moisture', 'children', 'use', 'only', 'directed', 'consult',
    'physician', 'if', 'symptoms', 'persist', 'worsen', 'stop',
    'and', 'the', 'for', 'you', 'your', 'can', 'may', 'will',
    'should', 'could', 'would', 'have', 'has', 'had', 'been',
    'being', 'were', 'was', 'are', 'is', 'am', 'not', 'no'
]);

// Function to check if a word is a common word
const isCommonWord = (word) => {
    const lower = word.toLowerCase();
    return COMMON_WORDS.has(lower) || lower.length < 3;
};

// Function to check if a word looks like a medication name
const isLikelyMedication = (word) => {
    if (isCommonWord(word)) return false;
    if (word.length < 4) return false;
    if (word.match(/^\d+$/)) return false; // Just numbers
    
    const lower = word.toLowerCase();
    
    // Check suffixes
    for (const pattern of MEDICATION_PATTERNS.suffixes) {
        if (pattern.test(lower)) return true;
    }
    
    // Check prefixes
    for (const pattern of MEDICATION_PATTERNS.prefixes) {
        if (pattern.test(lower)) return true;
    }
    
    // Check for common medication word patterns
    // Many medications end with specific letters
    if (lower.match(/[a-z]{2,}[aeiou][a-z]{2,}$/)) return true;
    
    return false;
};

// Function to score words based on likelihood of being a medication
const scoreWord = (word, context) => {
    let score = 0;
    const lower = word.toLowerCase();
    
    // Check suffixes (high confidence)
    for (const pattern of MEDICATION_PATTERNS.suffixes) {
        if (pattern.test(lower)) score += 10;
    }
    
    // Check prefixes (medium confidence)
    for (const pattern of MEDICATION_PATTERNS.prefixes) {
        if (pattern.test(lower)) score += 5;
    }
    
    // Longer words are more likely to be medications
    if (word.length > 7) score += 3;
    if (word.length > 10) score += 2;
    
    // Check if it appears near common medication words
    if (context) {
        for (const medWord of MEDICATION_PATTERNS.commonMedicationWords) {
            if (context.includes(medWord)) score += 2;
        }
    }
    
    // Check if it has capital letters (brand names often capitalized)
    if (word.match(/^[A-Z]/)) score += 2;
    
    return score;
};

// Extract the most likely medication name from OCR text
const extractMedicationFromText = (text) => {
    if (!text || text.length < 3) return null;
    
    // Clean the text
    const cleaned = text
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    
    // Split into words and phrases
    const words = cleaned.split(/\s+/);
    
    // Filter out common words and short words
    const filteredWords = words.filter(word => !isCommonWord(word) && word.length >= 3);
    
    if (filteredWords.length === 0) return null;
    
    // Score each word
    const scoredWords = filteredWords.map((word, index) => {
        // Get surrounding context (5 words before and after)
        const start = Math.max(0, index - 5);
        const end = Math.min(words.length, index + 6);
        const context = words.slice(start, end).join(' ');
        
        return {
            word: word,
            score: scoreWord(word, context),
            index: index
        };
    });
    
    // Sort by score (highest first)
    scoredWords.sort((a, b) => b.score - a.score);
    
    // Get the highest scoring word
    const bestMatch = scoredWords[0];
    
    // If the best match has a score > 0, return it
    if (bestMatch && bestMatch.score > 0) {
        // Check if it's already a medication name by pattern
        if (isLikelyMedication(bestMatch.word)) {
            return bestMatch.word;
        }
        
        // Check for multi-word medication names
        // Look for combinations like "metformin hydrochloride"
        const index = bestMatch.index;
        const nextWord = index + 1 < words.length ? words[index + 1] : null;
        const prevWord = index - 1 >= 0 ? words[index - 1] : null;
        
        // Common medication name combinations
        const commonCombinations = [
            'hydrochloride', 'sulfate', 'phosphate', 'citrate', 'tartrate',
            'maleate', 'fumarate', 'succinate', 'lactate', 'bitartrate'
        ];
        
        if (nextWord && commonCombinations.includes(nextWord.toLowerCase())) {
            return `${bestMatch.word} ${nextWord}`;
        }
        
        if (prevWord && ['sodium', 'calcium', 'potassium', 'magnesium'].includes(prevWord.toLowerCase())) {
            return `${prevWord} ${bestMatch.word}`;
        }
        
        return bestMatch.word;
    }
    
    // If no word scored well, try to find any word that looks like a medication
    const likelyMed = words.find(word => isLikelyMedication(word));
    if (likelyMed) return likelyMed;
    
    // Last resort: return the longest word that's not common
    const sortedByLength = filteredWords.sort((a, b) => b.length - a.length);
    if (sortedByLength.length > 0) {
        return sortedByLength[0];
    }
    
    return null;
};

// Function to try to get generic name from online sources
// Using Wikipedia API (free, no key required)
const getGenericNameFromWikipedia = async (medicationName) => {
    try {
        // Search Wikipedia for the medication
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(medicationName)}&format=json&origin=*`;
        
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();
        
        if (searchData.query && searchData.query.search && searchData.query.search.length > 0) {
            // Get the first result
            const pageTitle = searchData.query.search[0].title;
            
            // Get the page content
            const contentUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&format=json&origin=*`;
            const contentResponse = await fetch(contentUrl);
            const contentData = await contentResponse.json();
            
            if (contentData.parse && contentData.parse.text) {
                const html = contentData.parse.text['*'];
                
                // Look for drug name patterns in the HTML
                // Many Wikipedia drug pages start with "Brand name" or contain "generic name"
                const genericMatch = html.match(/generic name[:\s]+([A-Za-z\s]+)/i);
                if (genericMatch && genericMatch[1]) {
                    return genericMatch[1].trim();
                }
                
                // Look for "also known as" patterns
                const alsoKnownMatch = html.match(/also known as[:\s]+([A-Za-z\s]+)/i);
                if (alsoKnownMatch && alsoKnownMatch[1]) {
                    return alsoKnownMatch[1].trim();
                }
            }
        }
        return null;
    } catch (error) {
        console.error('Error fetching from Wikipedia:', error);
        return null;
    }
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
    const [isFetchingGeneric, setIsFetchingGeneric] = useState(false);
    
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
                const match = extractMedicationFromText(recognizedText);
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
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        await processMedicationImage(imageData);
        stopCamera();
    }, [stopCamera]);

    const processMedicationImage = useCallback(async (imageData) => {
        setIsProcessingImage(true);
        setError('');
        setOcrProgress(0);
        
        try {
            // Perform OCR
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
            let medicationName = extractMedicationFromText(recognizedText);
            
            if (medicationName) {
                setDrugName(medicationName);
                setError('');
                console.log(`Medication recognized: ${medicationName}`);
                
                // Try to get generic name from Wikipedia (free, no API key)
                setIsFetchingGeneric(true);
                try {
                    const genericName = await getGenericNameFromWikipedia(medicationName);
                    if (genericName && genericName !== medicationName) {
                        setDrugName(genericName);
                        console.log(`Generic name found: ${genericName}`);
                    }
                } catch (err) {
                    console.log('Could not fetch generic name, using detected name');
                } finally {
                    setIsFetchingGeneric(false);
                }
                
                // Auto-search after a short delay
                setTimeout(() => {
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
            const match = extractMedicationFromText(recognitionResult);
            if (match) {
                setDrugName(match);
                setTimeout(() => {
                    const form = document.getElementById('search-form');
                    if (form) form.dispatchEvent(new Event('submit'));
                }, 300);
            }
        }
    }, [recognitionResult, isRecording]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
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
                                
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
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

                        {isProcessingImage && (
                            <div className="mt-4 bg-white/20 rounded-xl p-4">
                                <div className="flex items-center justify-between text-white mb-2">
                                    <span className="text-sm font-medium">
                                        {isFetchingGeneric ? 'Fetching generic name...' : 'Processing image...'}
                                    </span>
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
