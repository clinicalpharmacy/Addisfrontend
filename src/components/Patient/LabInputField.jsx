import React from 'react';

const LabInputField = React.memo(({
    label,
    value,
    field,
    unit,
    placeholder,
    isEditing,
    handleChange,
    normalRange,
    readOnly = false,
    type = "number"
}) => {
    const handleInputChange = (e) => {
        handleChange(field, e.target.value);
    };

    return (
        <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
                {label}
                {normalRange && (
                    <span className="text-xs text-gray-500 ml-1">({normalRange})</span>
                )}
            </label>
            {isEditing ? (
                <div className="flex items-center">
                    <input
                        type={type}
                        step={type === "number" ? "0.01" : undefined}
                        value={value || ''}
                        onChange={handleInputChange}
                        className="flex-1 border border-gray-300 rounded-l-lg p-3 text-sm"
                        placeholder={placeholder}
                        readOnly={readOnly}
                    />
                    <div className="w-16 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg p-3 text-center text-sm text-gray-700">
                        {unit}
                    </div>
                </div>
            ) : (
                <div className="flex items-center">
                    <div className="flex-1 bg-blue-50 border border-blue-200 rounded-l-lg p-3 text-sm">
                        <span className="font-medium text-gray-800">
                            {value || '--'}
                        </span>
                    </div>
                    <div className="w-16 bg-blue-100 border border-l-0 border-blue-200 rounded-r-lg p-3 text-center text-sm text-gray-700">
                        {unit}
                    </div>
                </div>
            )}
        </div>
    );
});

LabInputField.displayName = 'LabInputField';

export default LabInputField;
