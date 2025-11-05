import React from 'react';
import { GraduationCap, Sparkles, Plus } from 'lucide-react';

export const IDPs: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Individual Development Plans</h1>
          <p className="text-gray-600 mt-1">AI-powered development planning</p>
        </div>
        <div className="flex space-x-3">
          <button className="btn btn-primary flex items-center space-x-2">
            <Sparkles size={20} />
            <span>Generate IDP</span>
          </button>
          <button className="btn btn-secondary flex items-center space-x-2">
            <Plus size={20} />
            <span>Manual IDP</span>
          </button>
        </div>
      </div>

      <div className="card text-center py-12">
        <GraduationCap className="mx-auto text-gray-400 mb-4" size={48} />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No IDPs yet</h3>
        <p className="text-gray-600 mb-6">
          Create comprehensive Individual Development Plans with AI assistance based on skill gaps.
        </p>
        <button className="btn btn-primary inline-flex items-center space-x-2">
          <Sparkles size={20} />
          <span>Generate IDP with AI</span>
        </button>
      </div>
    </div>
  );
};
