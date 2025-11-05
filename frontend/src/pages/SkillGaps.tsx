import React from 'react';
import { TrendingUp, Sparkles } from 'lucide-react';

export const SkillGaps: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Skill Gap Analysis</h1>
          <p className="text-gray-600 mt-1">Identify development opportunities</p>
        </div>
        <button className="btn btn-primary flex items-center space-x-2">
          <Sparkles size={20} />
          <span>Analyze Skill Gaps</span>
        </button>
      </div>

      <div className="card text-center py-12">
        <TrendingUp className="mx-auto text-gray-400 mb-4" size={48} />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No skill gap analysis yet</h3>
        <p className="text-gray-600 mb-6">
          Compare employee skills against role requirements to identify development needs.
        </p>
        <button className="btn btn-primary inline-flex items-center space-x-2">
          <Sparkles size={20} />
          <span>Analyze with AI</span>
        </button>
      </div>
    </div>
  );
};
