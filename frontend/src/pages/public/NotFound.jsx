import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen flex items-center justify-center bg-background flex-col">
            <h1 className="text-6xl font-bold text-primary-900 mb-4">404</h1>
            <p className="text-xl text-slate-600 mb-8">Page not found</p>
            <button onClick={() => navigate('/')} className="btn-primary">Go Home</button>
        </div>
    );
};
export default NotFound;