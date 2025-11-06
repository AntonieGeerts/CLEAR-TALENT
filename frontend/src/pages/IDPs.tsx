import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { GraduationCap, Sparkles, Plus, Trash2, Loader, CheckCircle } from 'lucide-react';

interface IDP {
  id: string;
  title: string;
  employeeId: string;
  employee?: {
    firstName: string;
    lastName: string;
  };
  status: 'ACTIVE' | 'COMPLETED' | 'DRAFT';
  startDate: string;
  targetDate?: string;
  objectives: {
    id: string;
    description: string;
    status: string;
    completed: boolean;
  }[];
}

export const IDPs: React.FC = () => {
  const [idps, setIdps] = useState<IDP[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadIDPs();
  }, []);

  const loadIDPs = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getIDPs();
      setIdps(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load IDPs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this IDP?')) return;

    try {
      await apiService.deleteIDP(id);
      loadIDPs();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete IDP');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-700';
      case 'ACTIVE': return 'bg-blue-100 text-blue-700';
      case 'DRAFT': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Individual Development Plans</h1>
          <p className="text-gray-600 mt-1">AI-powered development planning</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAIModal(true)}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <Sparkles size={20} />
            <span>Generate IDP</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Manual IDP</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader className="animate-spin text-primary-600" size={32} />
        </div>
      ) : idps.length === 0 ? (
        <div className="card text-center py-12">
          <GraduationCap className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No IDPs yet</h3>
          <p className="text-gray-600 mb-6">
            Create comprehensive Individual Development Plans with AI assistance based on skill gaps.
          </p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={() => setShowAIModal(true)}
              className="btn btn-secondary inline-flex items-center space-x-2"
            >
              <Sparkles size={20} />
              <span>Generate with AI</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary inline-flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Create Manually</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {idps.map((idp) => (
            <div key={idp.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{idp.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(idp.status)}`}>
                      {idp.status}
                    </span>
                  </div>
                  {idp.employee && (
                    <p className="text-sm text-gray-600">
                      {idp.employee.firstName} {idp.employee.lastName}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(idp.id)}
                  className="p-2 hover:bg-red-50 rounded text-red-600"
                  title="Delete IDP"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-600">Start Date:</span>
                  <span className="ml-2 font-medium">{new Date(idp.startDate).toLocaleDateString()}</span>
                </div>
                {idp.targetDate && (
                  <div>
                    <span className="text-gray-600">Target Date:</span>
                    <span className="ml-2 font-medium">{new Date(idp.targetDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {idp.objectives && idp.objectives.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Development Objectives ({idp.objectives.filter(o => o.completed).length}/{idp.objectives.length} completed)
                  </h4>
                  <div className="space-y-2">
                    {idp.objectives.map((obj) => (
                      <div key={obj.id} className="flex items-start space-x-3">
                        <CheckCircle
                          size={18}
                          className={obj.completed ? 'text-green-600' : 'text-gray-300'}
                        />
                        <p className={`text-sm flex-1 ${obj.completed ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                          {obj.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <IDPModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadIDPs();
          }}
        />
      )}

      {showAIModal && (
        <AIGenerateIDPModal
          onClose={() => setShowAIModal(false)}
          onSuccess={() => {
            setShowAIModal(false);
            loadIDPs();
          }}
        />
      )}
    </div>
  );
};

const IDPModal: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({ onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await apiService.createIDP({
        title,
        startDate,
        targetDate: targetDate || undefined,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create IDP');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Individual Development Plan</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">IDP Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              placeholder="e.g., Leadership Development Plan 2024"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input"
                required
              />
            </div>

            <div>
              <label className="label">Target Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="input"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? 'Creating...' : 'Create IDP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AIGenerateIDPModal: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({
  onClose,
  onSuccess,
}) => {
  const [context, setContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsGenerating(true);

    try {
      const response = await apiService.generateIDP({
        employeeId: 'current',
        context,
      });
      setGeneratedPlan(response.data?.plan || null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate IDP');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center space-x-3 mb-6">
          <Sparkles className="text-primary-600" size={28} />
          <h2 className="text-2xl font-bold text-gray-900">AI IDP Generation</h2>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleGenerate} className="space-y-4 mb-6">
          <div>
            <label className="label">Development Context</label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="input"
              rows={6}
              placeholder="Describe skill gaps, career goals, and development areas..."
              required
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isGenerating} className="btn btn-primary">
              {isGenerating ? (
                <>
                  <Loader className="animate-spin mr-2" size={16} />
                  Generating...
                </>
              ) : (
                'Generate IDP'
              )}
            </button>
          </div>
        </form>

        {generatedPlan && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Generated Development Plan</h3>
            <div className="card bg-green-50 border-green-200">
              <h4 className="font-semibold text-gray-900 mb-3">{generatedPlan.title}</h4>
              {generatedPlan.objectives && (
                <div className="space-y-2">
                  {generatedPlan.objectives.map((obj: string, i: number) => (
                    <div key={i} className="flex items-start space-x-2 text-sm text-gray-700">
                      <span className="font-medium">{i + 1}.</span>
                      <span>{obj}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={onSuccess} className="btn btn-primary">
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
