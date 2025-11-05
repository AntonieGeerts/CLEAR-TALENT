import React from 'react';
import { Target, Sparkles, Plus } from 'lucide-react';

export const Goals: React.FC = () => {

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Goals & OKRs</h1>
          <p className="text-gray-600 mt-1">Manage and generate employee goals</p>
        </div>
        <div className="flex space-x-3">
          <button className="btn btn-primary flex items-center space-x-2">
            <Sparkles size={20} />
            <span>AI Generate Goals</span>
          </button>
          <button className="btn btn-secondary flex items-center space-x-2">
            <Plus size={20} />
            <span>Manual Goal</span>
          </button>
        </div>
      </div>

      <div className="card text-center py-12">
        <Target className="mx-auto text-gray-400 mb-4" size={48} />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No goals yet</h3>
        <p className="text-gray-600 mb-6">
          Use AI to generate personalized SMART goals and OKRs for employees based on their role.
        </p>
        <button className="btn btn-primary inline-flex items-center space-x-2">
          <Sparkles size={20} />
          <span>Generate Goals with AI</span>
        </button>
      </div>
    </div>
  );
};
