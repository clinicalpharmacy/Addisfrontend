import React, { useState, useRef, useEffect } from 'react';
import {
    FaArrowLeft, FaCloudUploadAlt, FaFilePdf, FaFileExcel, FaFileWord, FaFileAlt,
    FaSpinner, FaCheckCircle, FaEdit, FaTrash, FaPlus,
    FaExclamationTriangle, FaTimesCircle
} from 'react-icons/fa';
import api from '../../utils/api';

// ── Parsing helpers ──────────────────────────────────────────

/**
 * Parse Excel file (xlsx/xls) into structured questions.
 * Expected columns: Question | Option A | Option B | Option C | Option D | Correct Answer | Explanation
 */
async function parseExcelFile(file) {
    const XLSX = await import('xlsx');
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

                if (rows.length === 0) {
                    resolve([]);
                    return;
                }

                const questions = rows
                    .filter(row => {
                        // Find question column (first text column with content)
                        const vals = Object.values(row);
                        return vals.some(v => String(v).trim().length > 5);
                    })
                    .map((row, idx) => {
                        const keys = Object.keys(row);
                        // Try to detect columns by name patterns
                        const questionKey = keys.find(k => /question|q\b|stem/i.test(k)) || keys[0];
                        const optKeys = keys.filter(k => /option|choice|^[a-d]$|opt/i.test(k));
                        const answerKey = keys.find(k => /answer|correct|key/i.test(k));
                        const explanationKey = keys.find(k => /explanation|rationale|explain/i.test(k));

                        // If no explicit option columns, use columns 1-4
                        let optionSources = optKeys.length >= 2
                            ? optKeys.slice(0, 4)
                            : keys.filter(k => k !== questionKey && k !== answerKey && k !== explanationKey).slice(0, 4);

                        const optionLabels = ['A', 'B', 'C', 'D'];
                        const correctAnswer = answerKey ? String(row[answerKey]).trim().toUpperCase() : '';

                        const options = optionSources.map((k, i) => {
                            const label = optionLabels[i] || String(i + 1);
                            const text = String(row[k]).trim();
                            const isCorrect = correctAnswer === label ||
                                correctAnswer === text ||
                                correctAnswer === String(i + 1) ||
                                correctAnswer.includes(label);
                            return { id: String(i + 1), text: text || `Option ${label}`, isCorrect };
                        });

                        // If no option is marked correct, default to none
                        return {
                            id: `q-${Date.now()}-${idx}`,
                            questionText: String(row[questionKey]).trim(),
                            options: options.length > 0 ? options : [
                                { id: '1', text: 'Option A', isCorrect: false },
                                { id: '2', text: 'Option B', isCorrect: false },
                                { id: '3', text: 'Option C', isCorrect: false },
                                { id: '4', text: 'Option D', isCorrect: false }
                            ],
                            explanation: explanationKey ? String(row[explanationKey]).trim() : ''
                        };
                    })
                    .filter(q => q.questionText.length > 3);

                resolve(questions);
            } catch (err) {
                reject(new Error('Failed to parse Excel file: ' + err.message));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Parse PDF file into structured questions using pdfjs-dist.
 * Attempts to detect MCQ patterns in the text.
 */
async function parsePdfFile(file) {
    const pdfjsLib = await import('pdfjs-dist');

    // Set worker source
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const typedArray = new Uint8Array(e.target.result);
                const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
                let fullText = '';

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    const pageText = content.items.map(item => item.str).join(' ');
                    fullText += pageText + '\n\n';
                }

                const questions = extractQuestionsFromText(fullText);
                resolve(questions);
            } catch (err) {
                reject(new Error('Failed to parse PDF: ' + err.message));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Extract MCQ questions from raw text using pattern matching.
 */
function extractQuestionsFromText(text) {
    const questions = [];

    // Split by numbers at the start of a line or word boundary (e.g., "1.", "1)", " 2. ")
    const questionBlocks = text.split(/(?=\s*\b\d+[\.\)]\s+)/);

    for (let block of questionBlocks) {
        block = block.trim();
        if (block.length < 10) continue;

        // Extract question text: matches "1. What is..." up until "A." or "a)"
        const questionMatch = block.match(/^\d+[\.\)]\s*([\s\S]+?)(?=\s+\b[A-Ea-e][\.\)]\s)/);
        if (!questionMatch) continue;

        const questionText = questionMatch[1].trim().replace(/\s+/g, ' ');
        if (questionText.length < 5) continue;

        // Extract options
        const optionMatches = [...block.matchAll(/\b([A-Ea-e])[\.\)]\s*([\s\S]+?)(?=\b[A-Ea-e][\.\)]\s|\b(?:Answer|Correct|Key|Explanation|Rationale)\b|$)/gi)];

        if (optionMatches.length < 2) continue;

        const options = optionMatches.slice(0, 4).map((m, i) => ({
            id: String(i + 1),
            text: m[2].trim().replace(/\s+/g, ' '),
            isCorrect: false
        }));

        // Try to find the correct answer
        const answerMatch = block.match(/(?:Answer|Correct|Key)\s*[:\-]?\s*([A-Ea-e])/i);
        if (answerMatch) {
            const correctLabel = answerMatch[1].toUpperCase();
            const correctIdx = correctLabel.charCodeAt(0) - 65;
            if (options[correctIdx]) {
                options[correctIdx].isCorrect = true;
            }
        }

        // Try to find explanation
        const explainMatch = block.match(/(?:Explanation|Rationale)\s*[:\-]?\s*([\s\S]+?)$/i);

        questions.push({
            id: `q-${Date.now()}-${questions.length}`,
            questionText,
            options,
            explanation: explainMatch ? explainMatch[1].trim().replace(/\s+/g, ' ') : ''
        });
    }

    return questions;
}

/**
 * Parse DOCX file into structured questions using mammoth.
 */
async function parseDocxFile(file) {
    const mammoth = await import('mammoth');
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const arrayBuffer = e.target.result;
                const result = await mammoth.extractRawText({ arrayBuffer });
                const text = result.value;
                const questions = extractQuestionsFromText(text);
                resolve(questions);
            } catch (err) {
                reject(new Error('Failed to parse DOCX: ' + err.message));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Parse TXT file into structured questions.
 */
async function parseTxtFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            resolve(extractQuestionsFromText(text));
        };
        reader.onerror = () => reject(new Error('Failed to read TXT file'));
        reader.readAsText(file);
    });
}

// ── Component ────────────────────────────────────────────────

export const ExamCreator = ({ onBack, editData }) => {
    const isEditing = !!editData;

    // Workflow steps: 'upload' -> 'processing' -> 'review' -> 'success'
    const [step, setStep] = useState(isEditing ? 'review' : 'upload');
    const [examSubjects, setExamSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(isEditing ? editData.exam.subject : '');
    const [isCustomSubject, setIsCustomSubject] = useState(false);
    const [customSubject, setCustomSubject] = useState('');
    const [file, setFile] = useState(null);
    const [extractedQuestions, setExtractedQuestions] = useState([]);
    const [editingIndex, setEditingIndex] = useState(null);
    const [saving, setSaving] = useState(false);
    const [parseError, setParseError] = useState('');
    const fileInputRef = useRef(null);

    // Populate when editing
    useEffect(() => {
        if (isEditing && editData.questions) {
            setExtractedQuestions(editData.questions.map(q => ({
                id: q.id,
                questionText: q.question_text || q.questionText,
                options: q.options || [],
                explanation: q.explanation || ''
            })));
        }
    }, [isEditing, editData]);

    // Load subjects
    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const res = await api.get('/admin/exams/subjects');
                if (res.success && res.subjects) {
                    const subs = res.subjects.map(s => s.name);
                    setExamSubjects(subs);
                    if (!isEditing && subs.length > 0) {
                        setSelectedSubject(subs[0]);
                    }
                }
            } catch (err) {
                console.error('Failed to load subjects:', err);
            }
        };
        fetchSubjects();
    }, [isEditing]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setParseError('');
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current.click();
    };

    // Handle drag and drop
    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            const ext = droppedFile.name.split('.').pop().toLowerCase();
            if (['pdf', 'xls', 'xlsx', 'docx', 'txt'].includes(ext)) {
                setFile(droppedFile);
                setParseError('');
            } else {
                setParseError('Please upload a PDF, Excel, Word, or TXT file');
            }
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const startExtraction = async () => {
        if (!file) return;
        setStep('processing');
        setParseError('');

        try {
            const ext = file.name.split('.').pop().toLowerCase();
            let questions;

            if (ext === 'pdf') {
                questions = await parsePdfFile(file);
            } else if (['xls', 'xlsx'].includes(ext)) {
                questions = await parseExcelFile(file);
            } else if (ext === 'docx') {
                questions = await parseDocxFile(file);
            } else if (ext === 'txt') {
                questions = await parseTxtFile(file);
            } else {
                throw new Error('Unsupported file format. Please use PDF, Excel, Word, or TXT.');
            }

            if (questions.length === 0) {
                setParseError(
                    'No questions could be extracted. Please check the file format:\n' +
                    '• Excel: Columns for Question, Option A, Option B, Option C, Option D, Correct Answer, Explanation\n' +
                    '• PDF/Word/TXT: Numbered questions (1. 2. 3.) with labeled options (A. B. C. D.)'
                );
                setStep('upload');
                return;
            }

            setExtractedQuestions(questions);
            setStep('review');
        } catch (err) {
            console.error('Extraction error:', err);
            setParseError(err.message || 'Failed to extract questions from file');
            setStep('upload');
        }
    };

    const handleQuestionEdit = (index, field, value) => {
        const updated = [...extractedQuestions];
        updated[index] = { ...updated[index], [field]: value };
        setExtractedQuestions(updated);
    };

    const handleOptionEdit = (qIndex, oIndex, field, value) => {
        const updated = [...extractedQuestions];
        const question = { ...updated[qIndex] };
        const options = [...question.options];

        if (field === 'isCorrect' && value === true) {
            // Uncheck other options first
            options.forEach((opt, i) => {
                options[i] = { ...opt, isCorrect: false };
            });
        }

        options[oIndex] = { ...options[oIndex], [field]: value };
        question.options = options;
        updated[qIndex] = question;
        setExtractedQuestions(updated);
    };

    const deleteQuestion = (index) => {
        if (extractedQuestions.length <= 1) {
            alert('An exam must have at least one question.');
            return;
        }
        const updated = [...extractedQuestions];
        updated.splice(index, 1);
        setExtractedQuestions(updated);
    };

    const addManualQuestion = () => {
        setExtractedQuestions(prev => [
            ...prev,
            {
                id: `manual-${Date.now()}`,
                questionText: '',
                options: [
                    { id: '1', text: '', isCorrect: true },
                    { id: '2', text: '', isCorrect: false },
                    { id: '3', text: '', isCorrect: false },
                    { id: '4', text: '', isCorrect: false }
                ],
                explanation: ''
            }
        ]);
    };

    const publishExam = async () => {
        // Validate
        const emptyQuestions = extractedQuestions.filter(q => !q.questionText.trim());
        if (emptyQuestions.length > 0) {
            alert('Please fill in all question texts before publishing.');
            return;
        }

        const noCorrect = extractedQuestions.filter(q => !q.options.some(o => o.isCorrect));
        if (noCorrect.length > 0) {
            if (!window.confirm(`${noCorrect.length} question(s) have no correct answer marked. Continue anyway?`)) {
                return;
            }
        }

        setSaving(true);
        try {
            const finalSubject = isCustomSubject && customSubject.trim() ? customSubject.trim() : selectedSubject;
            const payload = {
                subject: finalSubject,
                title: `${finalSubject} Exam`,
                source_file_name: file?.name || (isEditing ? editData.exam.source_file_name : null),
                questions: extractedQuestions.map(q => ({
                    questionText: q.questionText,
                    options: q.options,
                    explanation: q.explanation || ''
                }))
            };

            if (isEditing) {
                await api.put(`/admin/exams/${editData.exam.id}`, payload);
            } else {
                await api.post('/admin/exams', payload);
            }

            setStep('success');
        } catch (err) {
            console.error('Failed to publish exam:', err);
            alert(err?.error || 'Failed to save exam. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fadeIn max-w-4xl mx-auto">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50/80 to-indigo-50/80">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="text-gray-500 hover:text-purple-600 transition-colors p-2 rounded-lg hover:bg-purple-50">
                        <FaArrowLeft />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">
                            {isEditing ? 'Edit Exam' : 'Create Exam via Upload'}
                        </h2>
                        <p className="text-sm text-gray-500">
                            Step {step === 'upload' ? '1' : step === 'processing' ? '2' : step === 'review' ? '3' : '4'} of 4
                            {' • '}
                            {step === 'upload' ? 'Upload File' : step === 'processing' ? 'Extracting' : step === 'review' ? 'Review & Edit' : 'Complete'}
                        </p>
                    </div>
                </div>

                {/* Step indicators */}
                <div className="hidden md:flex items-center gap-1">
                    {['upload', 'processing', 'review', 'success'].map((s, i) => (
                        <div key={s} className="flex items-center">
                            <div className={`w-2.5 h-2.5 rounded-full transition-colors ${
                                s === step ? 'bg-purple-600 scale-125' :
                                ['upload', 'processing', 'review', 'success'].indexOf(step) > i ? 'bg-green-500' : 'bg-gray-300'
                            }`} />
                            {i < 3 && <div className={`w-6 h-0.5 ${
                                ['upload', 'processing', 'review', 'success'].indexOf(step) > i ? 'bg-green-500' : 'bg-gray-300'
                            }`} />}
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-6 md:p-8">
                {/* ── STEP 1: Upload ── */}
                {step === 'upload' && (
                    <div className="space-y-6 animate-fadeIn">
                        {parseError && (
                            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm whitespace-pre-line flex items-start gap-2">
                                <FaExclamationTriangle className="text-amber-500 mt-0.5 shrink-0" />
                                <span>{parseError}</span>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Select Subject</label>
                            <select
                                value={isCustomSubject ? 'other' : selectedSubject}
                                onChange={(e) => {
                                    if (e.target.value === 'other') {
                                        setIsCustomSubject(true);
                                    } else {
                                        setIsCustomSubject(false);
                                        setSelectedSubject(e.target.value);
                                    }
                                }}
                                className="w-full md:w-1/2 p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 bg-white"
                            >
                                {examSubjects.map(sub => (
                                    <option key={sub} value={sub}>{sub}</option>
                                ))}
                                <option value="other">Other (Specify...)</option>
                            </select>

                            {isCustomSubject && (
                                <input
                                    type="text"
                                    placeholder="Type custom subject name..."
                                    value={customSubject}
                                    onChange={(e) => setCustomSubject(e.target.value)}
                                    className="w-full md:w-1/2 p-3 mt-3 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 bg-white"
                                    autoFocus
                                />
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Upload Source File</label>
                            <div
                                onClick={handleUploadClick}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                                    file ? 'border-purple-400 bg-purple-50/50' : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
                                }`}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept=".pdf,.xls,.xlsx,.docx,.txt"
                                    className="hidden"
                                />
                                {file ? (
                                    <div className="flex flex-col items-center">
                                        {file.name.endsWith('.pdf') ? (
                                            <FaFilePdf className="text-4xl text-red-500 mb-3" />
                                        ) : file.name.endsWith('.docx') ? (
                                            <FaFileWord className="text-4xl text-blue-500 mb-3" />
                                        ) : file.name.endsWith('.txt') ? (
                                            <FaFileAlt className="text-4xl text-gray-500 mb-3" />
                                        ) : (
                                            <FaFileExcel className="text-4xl text-green-500 mb-3" />
                                        )}
                                        <p className="font-bold text-purple-700">{file.name}</p>
                                        <p className="text-xs text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        <p className="text-sm text-purple-600 mt-4 font-medium hover:underline">Click to change file</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                                            <FaCloudUploadAlt className="text-3xl" />
                                        </div>
                                        <p className="font-bold text-gray-700">Click to upload Document</p>
                                        <p className="text-sm text-gray-500 mt-1">Drag and drop is supported</p>
                                        <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs text-gray-400">
                                            <span className="flex items-center gap-1"><FaFilePdf className="text-red-400" /> .pdf</span>
                                            <span className="flex items-center gap-1"><FaFileWord className="text-blue-400" /> .docx</span>
                                            <span className="flex items-center gap-1"><FaFileExcel className="text-green-400" /> .xlsx / .xls</span>
                                            <span className="flex items-center gap-1"><FaFileAlt className="text-gray-400" /> .txt</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Format hint */}
                            <div className="mt-3 p-3 bg-blue-50/70 rounded-lg border border-blue-100">
                                <p className="text-xs font-bold text-blue-700 mb-1">📋 Expected Formats:</p>
                                <p className="text-xs text-blue-600">
                                    <strong>Excel:</strong> Columns — Question | Option A | Option B | Option C | Option D | Correct Answer | Explanation
                                </p>
                                <p className="text-xs text-blue-600 mt-0.5">
                                    <strong>PDF / Word / TXT:</strong> Numbered questions (1. 2. 3.) with options (A. B. C. D.) and optionally "Answer: A"
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                            <button
                                onClick={addManualQuestion}
                                className="text-purple-600 hover:text-purple-700 text-sm font-bold flex items-center gap-1.5 hover:bg-purple-50 px-3 py-2 rounded-lg transition-colors"
                            >
                                <FaPlus className="text-xs" /> Skip upload — add manually
                            </button>
                            <button
                                onClick={file ? startExtraction : () => {
                                    // If user chose manual, go to review
                                    if (extractedQuestions.length > 0) {
                                        setStep('review');
                                    }
                                }}
                                disabled={!file && extractedQuestions.length === 0}
                                className={`px-6 py-2.5 rounded-lg font-bold transition-all ${
                                    file || extractedQuestions.length > 0
                                        ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-200'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                {file ? 'Extract Questions' : extractedQuestions.length > 0 ? 'Continue to Review' : 'Select a file first'}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── STEP 2: Processing ── */}
                {step === 'processing' && (
                    <div className="text-center py-20 animate-fadeIn">
                        <FaSpinner className="text-5xl text-purple-600 animate-spin mx-auto mb-6" />
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Analyzing File</h3>
                        <p className="text-gray-500 max-w-md mx-auto">
                            Extracting text and formatting it into structured questions.
                            This usually takes a few seconds depending on file size.
                        </p>
                    </div>
                )}

                {/* ── STEP 3: Review ── */}
                {step === 'review' && (
                    <div className="animate-fadeIn">
                        {/* Review header */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 p-4 bg-purple-50 rounded-lg border border-purple-100 gap-3">
                            <div>
                                <h3 className="font-bold text-purple-900 text-lg">
                                    {isEditing ? 'Edit Questions' : 'Review Extracted Questions'}
                                </h3>
                                <p className="text-sm text-purple-700">
                                    Subject: <strong>{isCustomSubject && customSubject ? customSubject : selectedSubject}</strong> • {extractedQuestions.length} question{extractedQuestions.length !== 1 ? 's' : ''}
                                    {file && ` • From: ${file.name}`}
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                                {/* Subject selector in review */}
                                <div className="flex gap-2">
                                    <select
                                        value={isCustomSubject ? 'other' : selectedSubject}
                                        onChange={(e) => {
                                            if (e.target.value === 'other') {
                                                setIsCustomSubject(true);
                                            } else {
                                                setIsCustomSubject(false);
                                                setSelectedSubject(e.target.value);
                                            }
                                        }}
                                        className="text-sm px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:border-purple-400 bg-white"
                                    >
                                        {examSubjects.map(sub => (
                                            <option key={sub} value={sub}>{sub}</option>
                                        ))}
                                        <option value="other">Other...</option>
                                    </select>
                                    {isCustomSubject && (
                                        <input
                                            type="text"
                                            placeholder="Subject..."
                                            value={customSubject}
                                            onChange={(e) => setCustomSubject(e.target.value)}
                                            className="text-sm px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:border-purple-400 bg-white w-32"
                                        />
                                    )}
                                </div>
                                <button
                                    onClick={publishExam}
                                    disabled={saving || extractedQuestions.length === 0 || (isCustomSubject && !customSubject.trim())}
                                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-md shadow-green-200 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? (
                                        <><FaSpinner className="animate-spin" /> Saving...</>
                                    ) : (
                                        <><FaCheckCircle /> {isEditing ? 'Update Exam' : 'Publish Exam'}</>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Questions list */}
                        <div className="space-y-4">
                            {extractedQuestions.map((q, qIndex) => (
                                <div key={q.id || qIndex} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm hover:border-purple-300 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1 mr-4">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                Question {qIndex + 1}
                                            </label>
                                            <textarea
                                                value={q.questionText}
                                                onChange={(e) => handleQuestionEdit(qIndex, 'questionText', e.target.value)}
                                                rows={2}
                                                placeholder="Enter question text..."
                                                className="w-full mt-1 p-2 border border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none font-bold text-gray-800 bg-gray-50/50 resize-none"
                                            />
                                        </div>
                                        <button
                                            onClick={() => deleteQuestion(qIndex)}
                                            className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                            title="Delete question"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>

                                    <div className="space-y-1.5 ml-4 mb-4 border-l-2 border-gray-100 pl-4">
                                        {q.options.map((opt, oIndex) => (
                                            <div key={opt.id || oIndex} className="flex items-center gap-3">
                                                <input
                                                    type="radio"
                                                    name={`correct-${q.id || qIndex}`}
                                                    checked={opt.isCorrect}
                                                    onChange={() => handleOptionEdit(qIndex, oIndex, 'isCorrect', true)}
                                                    className="w-4 h-4 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                                    title="Mark as correct answer"
                                                />
                                                <span className="text-xs font-bold text-gray-400 w-4">
                                                    {String.fromCharCode(65 + oIndex)}
                                                </span>
                                                <input
                                                    type="text"
                                                    value={opt.text}
                                                    onChange={(e) => handleOptionEdit(qIndex, oIndex, 'text', e.target.value)}
                                                    placeholder={`Option ${String.fromCharCode(65 + oIndex)}...`}
                                                    className={`flex-1 p-2 text-sm border rounded-lg ${
                                                        opt.isCorrect
                                                            ? 'border-green-300 bg-green-50 text-green-900 font-medium'
                                                            : 'border-gray-200 focus:border-purple-400 bg-white'
                                                    } focus:outline-none transition-colors`}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="ml-4 pl-4 border-l-2 border-gray-100">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Explanation</label>
                                        <textarea
                                            value={q.explanation}
                                            onChange={(e) => handleQuestionEdit(qIndex, 'explanation', e.target.value)}
                                            rows={2}
                                            placeholder="Add an explanation for the correct answer (optional)..."
                                            className="w-full mt-1 p-2 text-sm border border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none resize-none bg-gray-50"
                                        />
                                    </div>
                                </div>
                            ))}

                            {/* Add manual question button */}
                            <button
                                onClick={addManualQuestion}
                                className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <FaPlus /> Add Question Manually
                            </button>
                        </div>
                    </div>
                )}

                {/* ── STEP 4: Success ── */}
                {step === 'success' && (
                    <div className="text-center py-20 animate-fadeIn">
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FaCheckCircle className="text-5xl text-green-500" />
                        </div>
                        <h3 className="text-3xl font-black text-gray-800 mb-2">
                            {isEditing ? 'Exam Updated!' : 'Exam Published!'}
                        </h3>
                        <p className="text-gray-600 mb-2 max-w-md mx-auto">
                            {extractedQuestions.length} question{extractedQuestions.length !== 1 ? 's' : ''} in <strong>{selectedSubject}</strong> have been
                            {isEditing ? ' updated' : ' saved'} successfully.
                        </p>
                        <p className="text-sm text-gray-500 mb-8">
                            They are now available in the Education center for students.
                        </p>
                        <button
                            onClick={onBack}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-purple-200 transition-all transform hover:-translate-y-0.5"
                        >
                            Back to Exam Management
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
