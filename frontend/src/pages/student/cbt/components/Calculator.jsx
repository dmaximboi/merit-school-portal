import React, { useState } from 'react';
import { X, Minimize2 } from 'lucide-react';

const Calculator = ({ onClose }) => {
    const [display, setDisplay] = useState('0');
    const [memory, setMemory] = useState(0);
    const [minimized, setMinimized] = useState(false);

    const handleNumber = (num) => {
        setDisplay(display === '0' ? num : display + num);
    };

    const handleOperator = (op) => {
        setDisplay(display + ' ' + op + ' ');
    };

    const handleEquals = () => {
        try {
            const result = eval(display.replace('×', '*').replace('÷', '/'));
            setDisplay(result.toString());
        } catch {
            setDisplay('Error');
        }
    };

    const handleClear = () => setDisplay('0');
    const handleBackspace = () => setDisplay(display.length > 1 ? display.slice(0, -1) : '0');

    const handleFunction = (func) => {
        try {
            const num = parseFloat(display);
            let result;
            switch (func) {
                case 'sin': result = Math.sin(num * Math.PI / 180); break;
                case 'cos': result = Math.cos(num * Math.PI / 180); break;
                case 'tan': result = Math.tan(num * Math.PI / 180); break;
                case 'log': result = Math.log10(num); break;
                case 'ln': result = Math.log(num); break;
                case '√': result = Math.sqrt(num); break;
                case 'x²': result = num * num; break;
                case '1/x': result = 1 / num; break;
                default: return;
            }
            setDisplay(result.toString());
        } catch {
            setDisplay('Error');
        }
    };

    if (minimized) {
        return (
            <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-xl cursor-pointer"
                onClick={() => setMinimized(false)}>
                <span className="font-bold">Calculator</span>
            </div>
        );
    }

    return (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-900 rounded-2xl shadow-2xl p-4 w-80 z-50">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold">Scientific Calculator</h3>
                <div className="flex gap-2">
                    <button onClick={() => setMinimized(true)} className="text-white hover:bg-slate-700 p-1 rounded">
                        <Minimize2 size={18} />
                    </button>
                    <button onClick={onClose} className="text-white hover:bg-slate-700 p-1 rounded">
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Display */}
            <div className="bg-slate-800 p-4 rounded-lg mb-4">
                <div className="text-right text-white text-2xl font-mono break-all">
                    {display}
                </div>
            </div>

            {/* Memory Buttons */}
            <div className="grid grid-cols-4 gap-2 mb-2">
                <button onClick={() => setMemory(memory + parseFloat(display))} className="calc-btn-secondary">M+</button>
                <button onClick={() => setMemory(memory - parseFloat(display))} className="calc-btn-secondary">M-</button>
                <button onClick={() => setDisplay(memory.toString())} className="calc-btn-secondary">MR</button>
                <button onClick={() => setMemory(0)} className="calc-btn-secondary">MC</button>
            </div>

            {/* Scientific Functions */}
            <div className="grid grid-cols-4 gap-2 mb-2">
                <button onClick={() => handleFunction('sin')} className="calc-btn-secondary">sin</button>
                <button onClick={() => handleFunction('cos')} className="calc-btn-secondary">cos</button>
                <button onClick={() => handleFunction('tan')} className="calc-btn-secondary">tan</button>
                <button onClick={() => handleFunction('log')} className="calc-btn-secondary">log</button>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-2">
                <button onClick={() => handleFunction('√')} className="calc-btn-secondary">√</button>
                <button onClick={() => handleFunction('x²')} className="calc-btn-secondary">x²</button>
                <button onClick={() => handleFunction('1/x')} className="calc-btn-secondary">1/x</button>
                <button onClick={() => handleFunction('ln')} className="calc-btn-secondary">ln</button>
            </div>

            {/* Main Buttons */}
            <div className="grid grid-cols-4 gap-2">
                <button onClick={handleClear} className="calc-btn-operator">C</button>
                <button onClick={handleBackspace} className="calc-btn-operator">←</button>
                <button onClick={() => handleOperator('÷')} className="calc-btn-operator">÷</button>
                <button onClick={() => handleOperator('×')} className="calc-btn-operator">×</button>

                <button onClick={() => handleNumber('7')} className="calc-btn">7</button>
                <button onClick={() => handleNumber('8')} className="calc-btn">8</button>
                <button onClick={() => handleNumber('9')} className="calc-btn">9</button>
                <button onClick={() => handleOperator('-')} className="calc-btn-operator">-</button>

                <button onClick={() => handleNumber('4')} className="calc-btn">4</button>
                <button onClick={() => handleNumber('5')} className="calc-btn">5</button>
                <button onClick={() => handleNumber('6')} className="calc-btn">6</button>
                <button onClick={() => handleOperator('+')} className="calc-btn-operator">+</button>

                <button onClick={() => handleNumber('1')} className="calc-btn">1</button>
                <button onClick={() => handleNumber('2')} className="calc-btn">2</button>
                <button onClick={() => handleNumber('3')} className="calc-btn">3</button>
                <button onClick={handleEquals} className="calc-btn-equals row-span-2">=</button>

                <button onClick={() => handleNumber('0')} className="calc-btn col-span-2">0</button>
                <button onClick={() => handleNumber('.')} className="calc-btn">.</button>
            </div>

            <style jsx>{`
        .calc-btn {
          @apply bg-slate-700 text-white p-3 rounded-lg font-bold hover:bg-slate-600 transition;
        }
        .calc-btn-operator {
          @apply bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-500 transition;
        }
        .calc-btn-secondary {
          @apply bg-slate-600 text-white p-2 rounded-lg text-sm font-bold hover:bg-slate-500 transition;
        }
        .calc-btn-equals {
          @apply bg-green-600 text-white p-3 rounded-lg font-bold hover:bg-green-500 transition;
        }
      `}</style>
        </div>
    );
};

export default Calculator;
