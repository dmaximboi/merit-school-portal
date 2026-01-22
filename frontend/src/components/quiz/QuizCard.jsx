import React from 'react';
import { Trophy, Zap, Circle, Flame, Leaf, User, HelpCircle, Play } from 'lucide-react';

const TEMPLATES = {
    classic: {
        name: 'Classic',
        gradient: 'from-blue-500 to-indigo-600',
        accent: 'blue',
        icon: Trophy,
        shadow: 'shadow-blue-500/50'
    },
    modern: {
        name: 'Modern',
        gradient: 'from-purple-500 to-pink-600',
        accent: 'purple',
        icon: Zap,
        shadow: 'shadow-purple-500/50'
    },
    minimal: {
        name: 'Minimal',
        gradient: 'from-slate-700 to-slate-900',
        accent: 'slate',
        icon: Circle,
        shadow: 'shadow-slate-500/50'
    },
    vibrant: {
        name: 'Vibrant',
        gradient: 'from-orange-500 to-red-600',
        accent: 'orange',
        icon: Flame,
        shadow: 'shadow-orange-500/50'
    },
    nature: {
        name: 'Nature',
        gradient: 'from-green-500 to-teal-600',
        accent: 'green',
        icon: Leaf,
        shadow: 'shadow-green-500/50'
    }
};

const QuizCard = ({
    quiz,
    template = 'classic',
    customColors = null,
    onStart
}) => {
    const t = TEMPLATES[template];
    const Icon = t.icon;

    const gradient = customColors?.gradient || t.gradient;
    const shadow = customColors?.shadow || t.shadow;

    return (
        <div className="group relative">
            <div className={`bg-gradient-to-br ${gradient} p-6 rounded-2xl shadow-lg hover:shadow-2xl ${shadow} transition-all duration-300 hover:scale-[1.02]`}>
                {/* Background Icon */}
                <div className="absolute top-4 right-4 opacity-10">
                    <Icon size={80} className="text-white" />
                </div>

                <div className="relative z-10">
                    {/* Subject Badge */}
                    <span className="inline-block text-xs font-bold text-white/80 uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full mb-3">
                        {quiz.subject}
                    </span>

                    {/* Title */}
                    <h3 className="text-2xl font-black text-white mt-2 mb-3 line-clamp-2">
                        {quiz.title}
                    </h3>

                    {/* Description */}
                    <p className="text-white/90 text-sm mb-6 line-clamp-2">
                        {quiz.description || 'Test your knowledge with this quiz'}
                    </p>

                    {/* Stats & Action */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-white/80 text-xs">
                            <span className="flex items-center gap-1">
                                <User size={14} /> {quiz.creator_name || 'Anonymous'}
                            </span>
                            <span className="flex items-center gap-1">
                                <HelpCircle size={14} /> {quiz.questions?.length || 0} Qs
                            </span>
                        </div>

                        <button
                            onClick={() => onStart && onStart(quiz)}
                            className="px-6 py-2 bg-white text-slate-900 rounded-lg font-bold hover:scale-105 transition-transform flex items-center gap-2 shadow-lg"
                        >
                            <Play size={16} />
                            Start
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Template Selector Component
export const TemplateSelector = ({ selected, onChange }) => {
    return (
        <div className="flex gap-3 flex-wrap">
            {Object.entries(TEMPLATES).map(([key, template]) => {
                const Icon = template.icon;
                return (
                    <button
                        key={key}
                        onClick={() => onChange(key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${selected === key
                                ? `bg-gradient-to-r ${template.gradient} text-white shadow-lg`
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        <Icon size={18} />
                        {template.name}
                    </button>
                );
            })}
        </div>
    );
};

// Color Customizer Component
export const ColorCustomizer = ({ template, onColorChange }) => {
    const gradients = [
        { name: 'Blue', value: 'from-blue-500 to-indigo-600' },
        { name: 'Purple', value: 'from-purple-500 to-pink-600' },
        { name: 'Green', value: 'from-green-500 to-teal-600' },
        { name: 'Orange', value: 'from-orange-500 to-red-600' },
        { name: 'Slate', value: 'from-slate-700 to-slate-900' },
        { name: 'Cyan', value: 'from-cyan-500 to-blue-600' },
        { name: 'Rose', value: 'from-rose-500 to-pink-600' },
        { name: 'Emerald', value: 'from-emerald-500 to-green-600' }
    ];

    return (
        <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700">Custom Gradient</label>
            <div className="grid grid-cols-4 gap-2">
                {gradients.map(grad => (
                    <button
                        key={grad.name}
                        onClick={() => onColorChange({ gradient: grad.value })}
                        className={`h-12 rounded-lg bg-gradient-to-r ${grad.value} hover:scale-105 transition-transform shadow-md`}
                        title={grad.name}
                    />
                ))}
            </div>
        </div>
    );
};

export default QuizCard;
