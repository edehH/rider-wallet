
import React from 'react';

interface KeypadProps {
  onInput: (val: string) => void;
  onClear: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  value: string;
}

const Keypad: React.FC<KeypadProps> = ({ onInput, onClear, onConfirm, onCancel, title, value }) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '✓'];

  return (
    <div className="bg-white p-6 rounded-t-[3rem] shadow-2xl fixed bottom-0 left-0 right-0 z-50 border-t-8 border-gray-100">
      <div className="flex justify-between items-center mb-4 px-2">
        <button 
          onClick={onCancel}
          className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl font-bold text-sm active:bg-gray-200"
        >
          إلغاء ✕
        </button>
        <h3 className="text-xl font-black text-gray-800">{title}</h3>
      </div>
      
      <div className="text-center mb-6">
        <div className="text-5xl font-black text-blue-700 bg-blue-50 py-4 rounded-2xl tracking-tighter">
          {value || '0'} <span className="text-sm font-bold text-blue-400">أوقية</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {keys.map((key) => (
          <button
            key={key}
            onClick={() => {
              if (key === 'C') onClear();
              else if (key === '✓') onConfirm();
              else onInput(key);
            }}
            className={`
              h-20 flex items-center justify-center text-3xl font-black rounded-2xl active:scale-95 transition-all
              ${key === 'C' ? 'bg-orange-100 text-orange-600 border-b-4 border-orange-200' : 
                key === '✓' ? 'bg-green-600 text-white border-b-4 border-green-800' : 
                'bg-gray-100 text-gray-900 border-b-4 border-gray-300'}
            `}
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Keypad;
