import React from 'react';
import { FaShieldAlt, FaCheck, FaExclamationTriangle, FaFileContract } from 'react-icons/fa';

const UserAgreement = ({ accountType, onAgree, onBack }) => {
    const isIndividual = accountType === 'individual';

    const individualAgreement = [
        "This digital health platform provides educational, informational, and supportive clinical reference content only.",
        "The platform may generate alerts or reference-based information based on user-entered data (such as age, pregnancy status, or medication name). These outputs are derived from publicly available drug labeling, clinical guidelines, or expert-reviewed references.",
        "The platform does not independently diagnose, prescribe, recommend specific treatments, or replace professional clinical judgment.",
        "Any alerts, contraindication notices, or medication-related information must be independently verified against official prescribing information and evaluated by a licensed healthcare professional before any clinical action is taken.",
        "The platform is not an autonomous clinical decision-making system and is not intended to direct or control patient treatment.",
        "Patients must consult a qualified healthcare professional before starting, stopping, or modifying any medication.",
        "Do not enter protected health information.",
        "This platform must not be used in emergency medical situations.",
        "This platform is end-to-end encrypted and Addis-Med does not have access to patient data."
    ];

    const companyAgreement = [
        "This digital health platform provides educational, informational, and supportive clinical reference content only.",
        "The platform may generate alerts or reference-based information based on user-entered data (such as age, pregnancy status, or medication name). These outputs are derived from publicly available drug labeling, clinical guidelines, or expert-reviewed references.",
        "The platform does not independently diagnose, prescribe, recommend specific treatments, or replace professional clinical judgment.",
        "Any alerts, contraindication notices, or medication-related information must be independently verified against official prescribing information and evaluated by a licensed healthcare professional before any clinical action is taken.",
        "The platform is not an autonomous clinical decision-making system and is not intended to direct or control patient treatment.",
        "Do not enter identifiable patient information.",
        "This platform must not be used in emergency medical situations.",
        "This platform is end-to-end encrypted and Addis-Med does not have access to patient data."
    ];

    const [checked, setChecked] = React.useState(false);
    const agreementText = isIndividual ? individualAgreement : companyAgreement;

    return (
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 max-w-4xl mx-auto my-8">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
                    <FaFileContract className="text-blue-600 text-3xl" />
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    User Agreement for {isIndividual ? 'Individual' : 'Company'}
                </h1>
                <p className="text-gray-600">Please read and accept the following terms to continue</p>
            </div>

            <div className="space-y-6 bg-gray-50 p-6 md:p-8 rounded-2xl border-2 border-gray-100 max-h-[400px] overflow-y-auto mb-8 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                {agreementText.map((paragraph, index) => (
                    <div key={index} className="flex gap-4 items-start">
                        <div className="mt-1 flex-shrink-0 w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 text-xs font-bold">{index + 1}</span>
                        </div>
                        <p className="text-gray-700 leading-relaxed text-sm md:text-base">{paragraph}</p>
                    </div>
                ))}
            </div>

            <div className="flex flex-col gap-6">
                <div
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${checked ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'}`}
                    onClick={() => setChecked(!checked)}
                >
                    <div className="flex items-start gap-4">
                        <div className="mt-1">
                            <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => { }} // Handled by div onClick
                                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex items-start gap-3">
                            <FaExclamationTriangle className={`${checked ? 'text-blue-500' : 'text-amber-500'} mt-1 flex-shrink-0`} />
                            <p className={`text-sm md:text-base font-medium italic ${checked ? 'text-blue-800' : 'text-amber-800'}`}>
                                "I understand that this platform provides educational and supportive clinical information only and does not replace professional medical advice."
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <button
                        onClick={onBack}
                        className="w-full md:w-1/3 py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all duration-300"
                    >
                        Back
                    </button>
                    <button
                        onClick={onAgree}
                        disabled={!checked}
                        className={`w-full md:w-2/3 py-4 px-6 font-bold rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2 ${checked
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white hover:shadow-xl'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        <FaCheck />
                        I Agree & Continue
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserAgreement;
