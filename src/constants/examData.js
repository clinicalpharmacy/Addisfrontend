export const examSubjects = [
    'Therapy', 'Pharmacology', 'Compounding', 'Minor Illness',
    'Dispensing', 'Pediatrics', 'Internal Medicine', 'Ambulatory',
    'Emergency', 'Oncology', 'Gynecology', 'Surgery', 'Dermatology'
];

export const mockQuestions = {
    'Therapy': [
        {
            id: 't1',
            questionText: 'What is the first-line therapy for uncomplicated hypertension in a non-black patient?',
            options: [
                { id: 'o1', text: 'ACE inhibitor or ARB', isCorrect: true },
                { id: 'o2', text: 'Beta-blocker', isCorrect: false },
                { id: 'o3', text: 'Alpha-blocker', isCorrect: false },
                { id: 'o4', text: 'Loop diuretic', isCorrect: false }
            ],
            explanation: 'According to guidelines, thiazide diuretics, CCBs, ACEIs, or ARBs are first-line.'
        },
        {
            id: 't2',
            questionText: 'Which medication is commonly used as a rescue inhaler for asthma exacerbations?',
            options: [
                { id: 'o1', text: 'Fluticasone', isCorrect: false },
                { id: 'o2', text: 'Albuterol (Salbutamol)', isCorrect: true },
                { id: 'o3', text: 'Salmeterol', isCorrect: false },
                { id: 'o4', text: 'Montelukast', isCorrect: false }
            ],
            explanation: 'Albuterol is a short-acting beta agonist (SABA) used for acute relief.'
        }
    ],
    'Pharmacology': [
        {
            id: 'p1',
            questionText: 'Which of the following describes the mechanism of action of Omeprazole?',
            options: [
                { id: 'po1', text: 'H2 receptor antagonist', isCorrect: false },
                { id: 'po2', text: 'Proton pump inhibitor', isCorrect: true },
                { id: 'po3', text: 'Antacid', isCorrect: false },
                { id: 'po4', text: 'Prostaglandin analog', isCorrect: false }
            ],
            explanation: 'Omeprazole irreversibly inhibits the H+/K+ ATPase pump in parietal cells.'
        }
    ]
};
