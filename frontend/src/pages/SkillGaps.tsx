import React, { useState } from 'react';
import { apiService } from '../services/api';
import { TrendingUp, Sparkles, Loader } from 'lucide-react';

interface SkillGap {
  competency: string;
  currentLevel: number;
  requiredLevel: number;
  gap: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendations?: string[];
}

export const SkillGaps: React.FC = () => {
  const [showAnalyzeModal, setShowAnalyzeModal] = useState(false);
  const [gaps, setGaps] = useState<SkillGap[]>([]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-700';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700';
      case 'LOW': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Skill Gap Analysis</h1>
          <p className="text-gray-600 mt-1">Identify development opportunities</p>
        </div>
        <button
          onClick={() => setShowAnalyzeModal(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Sparkles size={20} />
          <span>Analyze Skill Gaps</span>
        </button>
      </div>

      {gaps.length === 0 ? (
        <div className="card text-center py-12">
          <TrendingUp className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No skill gap analysis yet</h3>
          <p className="text-gray-600 mb-6">
            Compare employee skills against role requirements to identify development needs.
          </p>
          <button
            onClick={() => setShowAnalyzeModal(true)}
            className="btn btn-primary inline-flex items-center space-x-2"
          >
            <Sparkles size={20} />
            <span>Analyze with AI</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {gaps.map((gap, index) => (
            <div key={index} className="card">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{gap.competency}</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(gap.priority)}`}>
                  {gap.priority}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Current Level:</span>
                  <span className="font-medium">{gap.currentLevel}/5</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Required Level:</span>
                  <span className="font-medium">{gap.requiredLevel}/5</span>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-gray-900">Gap:</span>
                  <span className="text-red-600">{gap.gap} levels</span>
                </div>
              </div>

              {gap.recommendations && gap.recommendations.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Recommendations:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {gap.recommendations.map((rec, i) => (
                      <li key={i}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAnalyzeModal && (
        <AnalyzeModal
          onClose={() => setShowAnalyzeModal(false)}
          onSuccess={(results) => {
            setGaps(results);
            setShowAnalyzeModal(false);
          }}
        />
      )}
    </div>
  );
};

const AnalyzeModal: React.FC<{
  onClose: () => void;
  onSuccess: (gaps: SkillGap[]) => void;
}> = ({ onClose, onSuccess }) => {
  const [context, setContext] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsAnalyzing(true);

    try {
      const response = await apiService.analyzeSkillGaps({
        employeeId: 'current',
        context,
      });
      onSuccess(response.data?.gaps || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to analyze skill gaps');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Sparkles className="text-primary-600" size={28} />
          <h2 className="text-2xl font-bold text-gray-900">AI Skill Gap Analysis</h2>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleAnalyze} className="space-y-4">
          <div>
            <label className="label">Employee & Role Context</label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="input"
              rows={6}
              placeholder="Describe the employee's current role, skills, and target role..."
              required
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isAnalyzing} className="btn btn-primary">
              {isAnalyzing ? (
                <>
                  <Loader className="animate-spin mr-2" size={16} />
                  Analyzing...
                </>
              ) : (
                'Analyze'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
