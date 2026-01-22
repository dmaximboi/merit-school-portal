import React, { useRef, useState, useEffect } from 'react';
import { X, Minimize2, Trash2 } from 'lucide-react';

const Whiteboard = ({ onClose }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#000000');
    const [lineWidth, setLineWidth] = useState(2);
    const [tool, setTool] = useState('pen'); // 'pen' or 'eraser'
    const [minimized, setMinimized] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        }
    }, []);

    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
        ctx.lineWidth = tool === 'eraser' ? 20 : lineWidth;
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    if (minimized) {
        return (
            <div className="fixed bottom-20 right-4 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-xl cursor-pointer"
                onClick={() => setMinimized(false)}>
                <span className="font-bold">Whiteboard</span>
            </div>
        );
    }

    return (
        <div className="fixed top-1/2 right-4 transform -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-4 w-96 z-50">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800">Rough Work</h3>
                <div className="flex gap-2">
                    <button onClick={() => setMinimized(true)} className="text-slate-600 hover:bg-slate-100 p-1 rounded">
                        <Minimize2 size={18} />
                    </button>
                    <button onClick={onClose} className="text-slate-600 hover:bg-slate-100 p-1 rounded">
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Tools */}
            <div className="flex items-center gap-2 mb-4 p-3 bg-slate-50 rounded-lg">
                <button
                    onClick={() => setTool('pen')}
                    className={`px-3 py-1 rounded font-bold text-sm ${tool === 'pen' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600'
                        }`}
                >
                    Pen
                </button>
                <button
                    onClick={() => setTool('eraser')}
                    className={`px-3 py-1 rounded font-bold text-sm ${tool === 'eraser' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600'
                        }`}
                >
                    Eraser
                </button>

                <div className="flex gap-1 ml-auto">
                    {['#000000', '#0000ff', '#ff0000', '#00ff00'].map(c => (
                        <button
                            key={c}
                            onClick={() => setColor(c)}
                            className={`w-6 h-6 rounded border-2 ${color === c ? 'border-slate-900' : 'border-slate-300'}`}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                </div>

                <button
                    onClick={clearCanvas}
                    className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                    title="Clear All"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            {/* Canvas */}
            <canvas
                ref={canvasRef}
                width={352}
                height={400}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="border-2 border-slate-200 rounded-lg cursor-crosshair bg-white"
            />

            <p className="text-xs text-slate-500 mt-2 text-center">
                Draw your calculations and rough work here
            </p>
        </div>
    );
};

export default Whiteboard;
