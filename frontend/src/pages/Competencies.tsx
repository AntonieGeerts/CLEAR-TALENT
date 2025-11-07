import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Competency } from '../types';
import { BookOpen, Plus, Sparkles, Loader, Trash2, Edit } from 'lucide-react';

export const Competencies: React.FC = () => {
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showGenerateByCategoryModal, setShowGenerateByCategoryModal] = useState(false);
  const [showAssessmentQuestionsModal, setShowAssessmentQuestionsModal] = useState(false);
  const [selectedCompetency, setSelectedCompetency] = useState<Competency | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCompetencies();
  }, []);

  const loadCompetencies = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getCompetencies();
      setCompetencies(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load competencies');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (competency: Competency) => {
    setSelectedCompetency(competency);
    setShowEditModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this competency?')) return;

    try {
      await apiService.deleteCompetency(id);
      loadCompetencies();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete competency');
    }
  };

  const handleViewAssessmentQuestions = (competency: Competency) => {
    setSelectedCompetency(competency);
    setShowAssessmentQuestionsModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Competency Library</h1>
          <p className="text-gray-600 mt-1">Manage core competencies and skills</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowGenerateByCategoryModal(true)}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <Sparkles size={20} />
            <span>Generate by Category</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>New Competency</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader className="animate-spin text-primary-600" size={32} />
        </div>
      ) : competencies.length === 0 ? (
        /* Empty State */
        <div className="card text-center py-12">
          <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No competencies yet</h3>
          <p className="text-gray-600 mb-6">
            Get started by generating competencies by category using AI or creating them manually.
          </p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={() => setShowGenerateByCategoryModal(true)}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <Sparkles size={20} />
              <span>Generate by Category</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Create Manually</span>
            </button>
          </div>
        </div>
      ) : (
        /* Competencies Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {competencies.map((competency) => (
            <div key={competency.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{competency.name}</h3>
                    {competency.aiGenerated && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800">
                        <Sparkles size={12} className="mr-1" />
                        AI
                      </span>
                    )}
                  </div>
                  <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                    {competency.type.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">{competency.description}</p>
              {competency.category && (
                <p className="text-xs text-gray-500 mb-4">Category: {competency.category}</p>
              )}
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(competency)}
                    className="flex-1 btn btn-secondary text-sm py-2"
                  >
                    <Edit size={16} className="inline mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(competency.id)}
                    className="btn btn-danger text-sm py-2"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <button
                  onClick={() => handleViewAssessmentQuestions(competency)}
                  className="w-full btn btn-secondary text-sm py-2 flex items-center justify-center space-x-1"
                >
                  <Sparkles size={16} />
                  <span>Assessment Questions</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateCompetencyModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadCompetencies();
          }}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && selectedCompetency && (
        <EditCompetencyModal
          competency={selectedCompetency}
          onClose={() => {
            setShowEditModal(false);
            setSelectedCompetency(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedCompetency(null);
            loadCompetencies();
          }}
        />
      )}

      {/* Generate by Category Modal */}
      {showGenerateByCategoryModal && (
        <GenerateByCategoryModal
          onClose={() => setShowGenerateByCategoryModal(false)}
          onSuccess={() => {
            setShowGenerateByCategoryModal(false);
            loadCompetencies();
          }}
        />
      )}

      {/* Assessment Questions Modal */}
      {showAssessmentQuestionsModal && selectedCompetency && (
        <AssessmentQuestionsModal
          competency={selectedCompetency}
          onClose={() => {
            setShowAssessmentQuestionsModal(false);
            setSelectedCompetency(null);
          }}
        />
      )}
    </div>
  );
};

// Create Competency Modal Component
const CreateCompetencyModal: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('CORE');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await apiService.createCompetency({
        name,
        description,
        type,
        category: category || undefined,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create competency');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Competency</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input"
              rows={4}
              required
            />
          </div>

          <div>
            <label className="label">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as any)} className="input">
              <option value="CORE">Core</option>
              <option value="LEADERSHIP">Leadership</option>
              <option value="FUNCTIONAL">Functional</option>
              <option value="TECHNICAL">Technical</option>
            </select>
          </div>

          <div>
            <label className="label">Category (Optional)</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input"
              placeholder="e.g., Software Development, Communication"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? 'Creating...' : 'Create Competency'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Competency Modal Component
const EditCompetencyModal: React.FC<{
  competency: Competency;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ competency, onClose, onSuccess }) => {
  const [name, setName] = useState(competency.name);
  const [description, setDescription] = useState(competency.description);
  const [type, setType] = useState(competency.type);
  const [category, setCategory] = useState(competency.category || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await apiService.updateCompetency(competency.id, {
        name,
        description,
        type,
        category: category || undefined,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update competency');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Competency</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input"
              rows={4}
              required
            />
          </div>

          <div>
            <label className="label">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as any)} className="input">
              <option value="CORE">Core</option>
              <option value="LEADERSHIP">Leadership</option>
              <option value="FUNCTIONAL">Functional</option>
              <option value="TECHNICAL">Technical</option>
            </select>
          </div>

          <div>
            <label className="label">Category (Optional)</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input"
              placeholder="e.g., Software Development, Communication"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Generate by Category Modal Component
const GenerateByCategoryModal: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({
  onClose,
  onSuccess,
}) => {
  const [category, setCategory] = useState<'CORE' | 'LEADERSHIP' | 'FUNCTIONAL'>('CORE');
  const [count, setCount] = useState(5);
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [companyValues, setCompanyValues] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [generatedCompetencies, setGeneratedCompetencies] = useState<any[]>([]);
  const [selectedCompetencies, setSelectedCompetencies] = useState<Set<number>>(new Set());

  const categoryDescriptions = {
    CORE: 'Core competencies are fundamental skills and behaviors essential for all employees across the organization, such as Customer Orientation, Personal Accountability, Work Standard Compliance, Communication, and Teamwork.',
    LEADERSHIP: 'Leadership competencies are skills required for managing and leading teams, including Strategic Thinking, Business Acumen, Managing Performance, and Empowering Others.',
    FUNCTIONAL: 'Functional competencies are role-specific technical skills and knowledge required to perform specific job functions effectively.',
  };

  const handleGenerate = async () => {
    setError('');

    // Validate required fields
    if (!companyName.trim()) {
      setError('Company name is required');
      return;
    }
    if (!industry.trim()) {
      setError('Industry is required');
      return;
    }

    setIsGenerating(true);
    setGeneratedCompetencies([]);

    try {
      const response = await apiService.generateCompetenciesByCategory({
        category,
        count,
        companyContext: {
          companyName: companyName.trim(),
          industry: industry.trim(),
          companySize: companySize || undefined,
          companyValues: companyValues.trim() || undefined,
          companyDescription: companyDescription.trim() || undefined,
        },
      });
      setGeneratedCompetencies(response.data || []);
      setSelectedCompetencies(new Set(response.data?.map((_: any, i: number) => i) || []));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate competencies');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSelection = (index: number) => {
    const newSelected = new Set(selectedCompetencies);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedCompetencies(newSelected);
  };

  const handleSave = async () => {
    setError('');
    setIsSaving(true);

    try {
      const competenciesToSave = generatedCompetencies.filter((_, i) =>
        selectedCompetencies.has(i)
      );

      for (const comp of competenciesToSave) {
        await apiService.createCompetency({
          name: comp.name,
          description: comp.description,
          type: comp.type,
          category: comp.category,
        });
      }

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save competencies');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center space-x-3 mb-6">
          <Sparkles className="text-primary-600" size={28} />
          <h2 className="text-2xl font-bold text-gray-900">Generate Competencies by Category</h2>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>About Company Context:</strong> Providing your company information helps AI generate competencies tailored to your organization's specific industry, values, and culture.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="input"
                placeholder="e.g., Acme Corporation"
                disabled={isGenerating || generatedCompetencies.length > 0}
                required
              />
            </div>

            <div>
              <label className="label">
                Industry <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="input"
                placeholder="e.g., Technology, Healthcare, Retail"
                disabled={isGenerating || generatedCompetencies.length > 0}
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Company Size (Optional)</label>
            <select
              value={companySize}
              onChange={(e) => setCompanySize(e.target.value)}
              className="input"
              disabled={isGenerating || generatedCompetencies.length > 0}
            >
              <option value="">Select size...</option>
              <option value="Small">Small (1-50 employees)</option>
              <option value="Medium">Medium (51-200 employees)</option>
              <option value="Large">Large (201-1000 employees)</option>
              <option value="Enterprise">Enterprise (1000+ employees)</option>
            </select>
          </div>

          <div>
            <label className="label">Company Values (Optional)</label>
            <textarea
              value={companyValues}
              onChange={(e) => setCompanyValues(e.target.value)}
              className="input"
              rows={2}
              placeholder="e.g., Innovation, Customer First, Integrity, Teamwork"
              disabled={isGenerating || generatedCompetencies.length > 0}
            />
            <p className="text-xs text-gray-500 mt-1">
              List your core values to help AI align competencies with your culture
            </p>
          </div>

          <div>
            <label className="label">Company Description (Optional)</label>
            <textarea
              value={companyDescription}
              onChange={(e) => setCompanyDescription(e.target.value)}
              className="input"
              rows={3}
              placeholder="Brief description of your company, products/services, and what makes you unique"
              disabled={isGenerating || generatedCompetencies.length > 0}
            />
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div>
              <label className="label">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="input"
                disabled={isGenerating || generatedCompetencies.length > 0}
              >
                <option value="CORE">Core Competencies</option>
                <option value="LEADERSHIP">Leadership Competencies</option>
                <option value="FUNCTIONAL">Functional Competencies</option>
              </select>
              <p className="text-sm text-gray-600 mt-2">{categoryDescriptions[category]}</p>
            </div>
          </div>

          <div>
            <label className="label">Number of Competencies</label>
            <input
              type="number"
              min="1"
              max="20"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 5)}
              className="input"
              disabled={isGenerating || generatedCompetencies.length > 0}
            />
          </div>

          {generatedCompetencies.length === 0 && (
            <div className="flex justify-end space-x-3">
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="btn btn-primary"
              >
                {isGenerating ? (
                  <>
                    <Loader className="animate-spin mr-2" size={16} />
                    Generating...
                  </>
                ) : (
                  'Generate Competencies'
                )}
              </button>
            </div>
          )}
        </div>

        {generatedCompetencies.length > 0 && (
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Generated Competencies ({selectedCompetencies.size} selected)
              </h3>
              <button
                onClick={() => {
                  setGeneratedCompetencies([]);
                  setSelectedCompetencies(new Set());
                  setError('');
                }}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Start Over
              </button>
            </div>

            <div className="space-y-3 mb-6">
              {generatedCompetencies.map((comp, index) => (
                <div
                  key={index}
                  className={`card cursor-pointer border-2 transition-colors ${
                    selectedCompetencies.has(index)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleSelection(index)}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedCompetencies.has(index)}
                      onChange={() => toggleSelection(index)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{comp.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{comp.description}</p>
                      <div className="mt-2 flex items-center space-x-2">
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded">{comp.type}</span>
                        {comp.category && (
                          <span className="text-xs px-2 py-1 bg-primary-50 text-primary-700 rounded">
                            {comp.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3">
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || selectedCompetencies.size === 0}
                className="btn btn-primary"
              >
                {isSaving ? (
                  <>
                    <Loader className="animate-spin mr-2" size={16} />
                    Saving...
                  </>
                ) : (
                  `Save Selected (${selectedCompetencies.size})`
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Assessment Questions Modal Component
const AssessmentQuestionsModal: React.FC<{
  competency: Competency;
  onClose: () => void;
}> = ({ competency, onClose }) => {
  const [count, setCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [scoringSystems, setScoringSystems] = useState<any[]>([]);
  const [selectedScoringSystem, setSelectedScoringSystem] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    statement: '',
    type: 'BEHAVIORAL' as 'BEHAVIORAL' | 'SITUATIONAL' | 'TECHNICAL' | 'KNOWLEDGE',
    examples: [''],
    weight: 1.0,
    scoreMin: 1,
    scoreMax: 5,
  });

  // Load existing questions and scoring systems on mount
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([loadQuestions(), loadScoringSystems()]);
    };
    loadData();
  }, []);

  const loadQuestions = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getCompetencyQuestions(competency.id);
      setQuestions(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load questions');
    } finally {
      setIsLoading(false);
    }
  };

  const loadScoringSystems = async () => {
    try {
      const response = await apiService.getScoringSystems();
      setScoringSystems(response.data || []);

      // Set default scoring system as selected
      const defaultSystem = response.data?.find((s: any) => s.isDefault);
      if (defaultSystem) {
        setSelectedScoringSystem(defaultSystem);
      } else if (response.data && response.data.length > 0) {
        setSelectedScoringSystem(response.data[0]);
      }
    } catch (err: any) {
      console.error('Failed to load scoring systems:', err);
    }
  };

  const handleGenerate = async () => {
    setError('');
    setIsGenerating(true);

    try {
      await apiService.generateAssessmentQuestions(competency.id, count, true);
      await loadQuestions(); // Reload to show saved questions
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate assessment questions');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.statement.trim()) {
      setError('Question statement is required');
      return;
    }

    try {
      await apiService.createCompetencyQuestion(competency.id, {
        statement: newQuestion.statement,
        type: newQuestion.type,
        examples: newQuestion.examples.filter((ex) => ex.trim()),
      });
      setNewQuestion({
        statement: '',
        type: 'BEHAVIORAL',
        examples: [''],
        weight: 1.0,
        scoreMin: 1,
        scoreMax: 5,
      });
      setShowAddForm(false);
      await loadQuestions();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add question');
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      await apiService.deleteCompetencyQuestion(questionId);
      await loadQuestions();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete question');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Sparkles className="text-primary-600" size={28} />
            <h2 className="text-2xl font-bold text-gray-900">Assessment Questions</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">{competency.name}</h3>
          <p className="text-sm text-gray-600 mb-2">{competency.description}</p>
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2 py-1 bg-gray-100 rounded">{competency.type}</span>
            {competency.category && (
              <span className="text-xs px-2 py-1 bg-primary-50 text-primary-700 rounded">
                {competency.category}
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Existing Questions */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="animate-spin text-primary-600" size={32} />
          </div>
        ) : (
          <>
            {questions.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Existing Questions ({questions.length})
                </h3>
                <div className="space-y-3">
                  {questions.map((q, index) => (
                    <div key={q.id} className="card">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-sm">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <p className="text-gray-900 mb-2">{q.statement}</p>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs px-2 py-1 bg-gray-100 rounded capitalize">
                                {q.type.toLowerCase()}
                              </span>
                              {q.aiGenerated && (
                                <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded flex items-center">
                                  <Sparkles size={12} className="mr-1" />
                                  AI
                                </span>
                              )}
                            </div>
                            {q.examples && q.examples.length > 0 && (
                              <div className="mt-3 pl-3 border-l-2 border-gray-200">
                                <p className="text-xs font-semibold text-gray-700 mb-1">
                                  Examples:
                                </p>
                                <ul className="text-xs text-gray-600 space-y-1">
                                  {q.examples.map((ex: string, i: number) => (
                                    <li key={i}>• {ex}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="ml-2 text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Question Form */}
            {showAddForm && (
              <div className="border border-gray-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Add New Question</h3>
                <div className="space-y-4">
                  <div>
                    <label className="label">Question Statement</label>
                    <textarea
                      value={newQuestion.statement}
                      onChange={(e) =>
                        setNewQuestion({ ...newQuestion, statement: e.target.value })
                      }
                      className="input"
                      rows={3}
                      placeholder="Enter the assessment question..."
                    />
                  </div>
                  <div>
                    <label className="label">Question Type</label>
                    <select
                      value={newQuestion.type}
                      onChange={(e) =>
                        setNewQuestion({
                          ...newQuestion,
                          type: e.target.value as any,
                        })
                      }
                      className="input"
                    >
                      <option value="BEHAVIORAL">Behavioral</option>
                      <option value="SITUATIONAL">Situational</option>
                      <option value="TECHNICAL">Technical</option>
                      <option value="KNOWLEDGE">Knowledge</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Examples (Optional)</label>
                    {newQuestion.examples.map((ex, i) => (
                      <div key={i} className="flex items-center space-x-2 mb-2">
                        <input
                          type="text"
                          value={ex}
                          onChange={(e) => {
                            const updated = [...newQuestion.examples];
                            updated[i] = e.target.value;
                            setNewQuestion({ ...newQuestion, examples: updated });
                          }}
                          className="input flex-1"
                          placeholder="Example answer or scenario..."
                        />
                        {i > 0 && (
                          <button
                            onClick={() => {
                              const updated = newQuestion.examples.filter((_, idx) => idx !== i);
                              setNewQuestion({ ...newQuestion, examples: updated });
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() =>
                        setNewQuestion({
                          ...newQuestion,
                          examples: [...newQuestion.examples, ''],
                        })
                      }
                      className="text-sm text-primary-600 hover:text-primary-800"
                    >
                      + Add Example
                    </button>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        setNewQuestion({
                          statement: '',
                          type: 'BEHAVIORAL',
                          examples: [''],
                          weight: 1.0,
                          scoreMin: 1,
                          scoreMax: 5,
                        });
                      }}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button onClick={handleAddQuestion} className="btn btn-primary">
                      Add Question
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* AI Generate Section */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">AI Generation</h3>
                {!showAddForm && (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="btn btn-secondary text-sm"
                  >
                    <Plus size={16} className="inline mr-1" />
                    Add Manual Question
                  </button>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <label className="label">Scoring System</label>
                  <select
                    value={selectedScoringSystem?.id || ''}
                    onChange={(e) => {
                      const system = scoringSystems.find((s) => s.id === e.target.value);
                      setSelectedScoringSystem(system);
                    }}
                    className="input"
                    disabled={isGenerating}
                  >
                    {scoringSystems.map((system) => (
                      <option key={system.id} value={system.id}>
                        {system.name}
                        {system.isDefault ? ' (Default)' : ''}
                      </option>
                    ))}
                  </select>
                  {selectedScoringSystem && (
                    <p className="text-xs text-gray-600 mt-1">
                      {selectedScoringSystem.description}
                    </p>
                  )}
                </div>
                <div>
                  <label className="label">Number of Questions to Generate</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={count}
                    onChange={(e) => setCount(parseInt(e.target.value) || 5)}
                    className="input"
                    disabled={isGenerating}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button type="button" onClick={onClose} className="btn btn-secondary">
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="btn btn-primary"
                  >
                    {isGenerating ? (
                      <>
                        <Loader className="animate-spin mr-2" size={16} />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} className="inline mr-1" />
                        Generate with AI
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
