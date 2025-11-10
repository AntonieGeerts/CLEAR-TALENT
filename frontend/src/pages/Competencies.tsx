import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '../services/api';
import { Competency } from '../types';
import { BookOpen, Plus, Sparkles, Loader, Trash2, Edit, ClipboardList, CheckCircle, Info } from 'lucide-react';
import {
  cloneDefaultRatingOptions,
  MAX_RATING_OPTIONS,
  MIN_RATING_OPTIONS,
  normalizeRatingOptionFields,
  RatingOptionField,
  serializeRatingOptionFields,
} from '../utils/ratingOptions';
import { SelfAssessmentExperience } from '../components/SelfAssessmentExperience';

type TabType = 'competencies' | 'questions' | 'assessment';

type CategoryType = 'CORE' | 'LEADERSHIP' | 'FUNCTIONAL';
type CategorySelection = {
  id: string;
  category: CategoryType;
  categoryName: string;
  count: number;
};

const CATEGORY_CONFIG: Record<CategoryType, { label: string; description: string }> = {
  CORE: {
    label: 'Core Competencies',
    description:
      'Core competencies are fundamental skills and behaviors essential for all employees across the organization, such as Customer Orientation, Personal Accountability, Work Standard Compliance, Communication, and Teamwork.',
  },
  LEADERSHIP: {
    label: 'Leadership Competencies',
    description:
      'Leadership competencies are skills required for managing and leading teams, including Strategic Thinking, Business Acumen, Managing Performance, and Empowering Others.',
  },
  FUNCTIONAL: {
    label: 'Functional Competencies',
    description:
      'Functional competencies are role-specific technical skills and knowledge required to perform specific job functions effectively.',
  },
};

const createSelectionId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const buildCategorySelection = (category: CategoryType = 'CORE'): CategorySelection => ({
  id: createSelectionId(),
  category,
  categoryName: CATEGORY_CONFIG[category].label,
  count: 5,
});


export const Competencies: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('competencies');
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [allQuestions, setAllQuestions] = useState<any[]>([]);
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

  useEffect(() => {
    if (activeTab === 'questions' || activeTab === 'assessment') {
      loadAllQuestions();
    }
  }, [activeTab, competencies]);

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

  const loadAllQuestions = async () => {
    try {
      const allQs: any[] = [];
      for (const comp of competencies) {
        const response = await apiService.getCompetencyQuestions(comp.id);
        const questions = (response.data || []).map((q: any) => ({
          ...q,
          competency: comp,
        }));
        allQs.push(...questions);
      }
      setAllQuestions(allQs);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load questions');
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
          <p className="text-gray-600 mt-1">Manage competencies, questions, and assessments</p>
        </div>
        {activeTab === 'competencies' && (
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
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('competencies')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'competencies'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BookOpen className="inline-block mr-2" size={18} />
            Competencies
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'questions'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ClipboardList className="inline-block mr-2" size={18} />
            Questions ({allQuestions.length})
          </button>
          <button
            onClick={() => setActiveTab('assessment')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'assessment'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <CheckCircle className="inline-block mr-2" size={18} />
            Take Assessment
          </button>
        </nav>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'competencies' && (
        <>
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
        </>
      )}

      {/* Questions Tab */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          {allQuestions.length === 0 ? (
            <div className="card text-center py-12">
              <ClipboardList className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No questions yet</h3>
              <p className="text-gray-600 mb-6">
                Generate assessment questions for your competencies to get started.
              </p>
              <button
                onClick={() => setActiveTab('competencies')}
                className="btn btn-primary"
              >
                Go to Competencies
              </button>
            </div>
          ) : (
            <>
              <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  All Assessment Questions ({allQuestions.length})
                </h2>
                <p className="text-gray-600 text-sm mb-4">
                  View and manage all generated assessment questions across your competencies.
                </p>
              </div>

              <div className="space-y-6">
                {Object.entries(
                  allQuestions.reduce((acc: any, q) => {
                    const compName = q.competency.name;
                    if (!acc[compName]) acc[compName] = [];
                    acc[compName].push(q);
                    return acc;
                  }, {})
                ).map(([compName, questions]: [string, any]) => (
                  <div key={compName} className="card">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{compName}</h3>
                      <span className="text-sm text-gray-500">{questions.length} questions</span>
                    </div>
                    <div className="space-y-3">
                      {questions.map((q: any, index: number) => (
                        <div key={q.id} className="border-l-4 border-primary-200 pl-4 py-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-gray-900 mb-2">
                                <span className="font-semibold text-primary-600 mr-2">
                                  Q{index + 1}.
                                </span>
                                {q.statement}
                              </p>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs px-2 py-1 bg-gray-100 rounded capitalize">
                                  {q.type.toLowerCase()}
                                </span>
                                {q.aiGenerated && (
                                  <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded flex items-center">
                                    <Sparkles size={12} className="mr-1" />
                                    AI Generated
                                  </span>
                                )}
                              </div>
                              {q.examples && q.examples.length > 0 && (
                                <div className="mt-2 pl-3 border-l-2 border-gray-200">
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
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Assessment Tab */}
      {activeTab === 'assessment' && (
        <SelfAssessmentExperience competencies={competencies} />
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
  const [categorySelections, setCategorySelections] = useState<CategorySelection[]>([
    buildCategorySelection(),
  ]);
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

  const canEditSelections = !isGenerating && generatedCompetencies.length === 0;
  const totalRequested = useMemo(
    () => categorySelections.reduce((sum, selection) => sum + (selection.count || 0), 0),
    [categorySelections]
  );

  const groupedCompetencies = useMemo<Record<string, { type?: string; items: Array<{ comp: any; index: number }> }>>(
    () =>
      generatedCompetencies.reduce((groups, comp, index) => {
        const key = comp._categoryName || comp.category || 'Uncategorized';
        if (!groups[key]) {
          groups[key] = { type: comp._categoryType || comp.type, items: [] };
        }
        groups[key].items.push({ comp, index });
        return groups;
      }, {} as Record<string, { type?: string; items: Array<{ comp: any; index: number }> }>),
    [generatedCompetencies]
  );

  const updateSelection = (id: string, updates: Partial<CategorySelection>) => {
    setCategorySelections((prev) =>
      prev.map((selection) => (selection.id === id ? { ...selection, ...updates } : selection))
    );
  };

  const handleCategoryTypeChange = (id: string, newCategory: CategoryType) => {
    const defaultLabel = CATEGORY_CONFIG[newCategory].label;
    updateSelection(id, {
      category: newCategory,
      categoryName: defaultLabel,
    });
  };

  const addCategorySelection = () => {
    setCategorySelections((prev) => [...prev, buildCategorySelection()]);
  };

  const removeCategorySelection = (id: string) => {
    setCategorySelections((prev) => (prev.length === 1 ? prev : prev.filter((selection) => selection.id !== id)));
  };

  const handleGenerate = async () => {
    setError('');

    if (!companyName.trim()) {
      setError('Company name is required');
      return;
    }
    if (!industry.trim()) {
      setError('Industry is required');
      return;
    }
    if (categorySelections.length === 0) {
      setError('Add at least one category to generate competencies.');
      return;
    }

    for (const selection of categorySelections) {
      if (!selection.categoryName.trim()) {
        setError('Each category selection must include a name.');
        return;
      }
      if (selection.count < 1 || selection.count > 20) {
        setError('Number of competencies per category must be between 1 and 20.');
        return;
      }
    }

    setIsGenerating(true);
    setGeneratedCompetencies([]);

    try {
      const aggregated: any[] = [];

      for (const selection of categorySelections) {
        const normalizedName = selection.categoryName.trim() || CATEGORY_CONFIG[selection.category].label;
        const response = await apiService.generateCompetenciesByCategory({
          category: selection.category,
          categoryName: normalizedName,
          categoryDescription: CATEGORY_CONFIG[selection.category].description,
          count: selection.count,
          companyContext: {
            companyName: companyName.trim(),
            industry: industry.trim(),
            companySize: companySize || undefined,
            companyValues: companyValues.trim() || undefined,
            companyDescription: companyDescription.trim() || undefined,
          },
        });

        const generatedForSelection = (response.data || []).map((comp: any) => ({
          ...comp,
          type: selection.category,
          category: normalizedName,
          _categoryName: normalizedName,
          _categoryType: selection.category,
        }));

        aggregated.push(...generatedForSelection);
      }

      if (aggregated.length === 0) {
        setError('No competencies were generated. Try adjusting your inputs and run again.');
        return;
      }

      setGeneratedCompetencies(aggregated);
      setSelectedCompetencies(new Set(aggregated.map((_, index) => index)));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate competencies');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSelection = (index: number) => {
    const updated = new Set(selectedCompetencies);
    if (updated.has(index)) {
      updated.delete(index);
    } else {
      updated.add(index);
    }
    setSelectedCompetencies(updated);
  };

  const handleSave = async () => {
    setError('');
    setIsSaving(true);

    try {
      const competenciesToSave = generatedCompetencies.filter((_, index) =>
        selectedCompetencies.has(index)
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
                disabled={!canEditSelections}
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
                disabled={!canEditSelections}
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
              disabled={!canEditSelections}
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
              disabled={!canEditSelections}
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
              disabled={!canEditSelections}
            />
          </div>

          <div className="border-t border-gray-200 pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Category Selections</h3>
              <button
                type="button"
                onClick={addCategorySelection}
                className="btn btn-secondary text-sm"
                disabled={!canEditSelections}
              >
                <Plus size={14} className="inline mr-1" /> Add Category
              </button>
            </div>
            {categorySelections.map((selection, index) => (
              <div key={selection.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900">Category {index + 1}</p>
                  {categorySelections.length > 1 && canEditSelections && (
                    <button
                      type="button"
                      onClick={() => removeCategorySelection(selection.id)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="label">Category Type</label>
                    <select
                      value={selection.category}
                      onChange={(e) => handleCategoryTypeChange(selection.id, e.target.value as CategoryType)}
                      className="input"
                      disabled={!canEditSelections}
                    >
                      <option value="CORE">Core</option>
                      <option value="LEADERSHIP">Leadership</option>
                      <option value="FUNCTIONAL">Functional</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {CATEGORY_CONFIG[selection.category].description}
                    </p>
                  </div>
                  <div>
                    <label className="label">Category Name</label>
                    <input
                      type="text"
                      value={selection.categoryName}
                      onChange={(e) => updateSelection(selection.id, { categoryName: e.target.value })}
                      className="input"
                      placeholder="e.g., Core Competencies"
                      disabled={!canEditSelections}
                    />
                  </div>
                  <div>
                    <label className="label"># of Competencies</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={selection.count}
                      onChange={(e) => updateSelection(selection.id, { count: parseInt(e.target.value) || 1 })}
                      className="input"
                      disabled={!canEditSelections}
                    />
                  </div>
                </div>
              </div>
            ))}
            <p className="text-sm text-gray-600">
              Total requested: <span className="font-semibold text-gray-900">{totalRequested}</span> competencies across {categorySelections.length}{' '}
              category{categorySelections.length === 1 ? '' : 'ies'}.
            </p>
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

            <div className="space-y-4 mb-6">
              {Object.entries(groupedCompetencies).map(([groupName, group]) => (
                <div key={groupName} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">{groupName}</h4>
                      <p className="text-xs text-gray-600">
                        {group.items.length} competencies · {group.type || 'Custom'}
                      </p>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {group.items.map(({ comp, index }) => (
                      <div
                        key={`${groupName}-${index}`}
                        className={`px-4 py-3 cursor-pointer transition-colors ${
                          selectedCompetencies.has(index)
                            ? 'bg-primary-50 border-l-4 border-primary-500'
                            : 'hover:bg-gray-50'
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
                          <div>
                            <h5 className="font-semibold text-gray-900">{comp.name}</h5>
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
  const [generatedAssessment, setGeneratedAssessment] = useState<any | null>(null);
  const [scoringSystems, setScoringSystems] = useState<any[]>([]);
  const [selectedScoringSystem, setSelectedScoringSystem] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const defaultLevelId = competency.proficiencyLevels?.[0]?.id || '';
  const [newQuestion, setNewQuestion] = useState({
    statement: '',
    type: 'BEHAVIORAL' as 'BEHAVIORAL' | 'SITUATIONAL' | 'TECHNICAL' | 'KNOWLEDGE',
    examples: [''],
    weight: 1.0,
    scoreMin: 1,
    scoreMax: 5,
    proficiencyLevelId: defaultLevelId,
    ratingOptions: cloneDefaultRatingOptions(),
  });

  // Load existing questions and scoring systems on mount
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([loadQuestions(), loadScoringSystems()]);
    };
    loadData();
  }, []);

  useEffect(() => {
    setGeneratedAssessment(null);
    setEditingQuestion(null);
    setShowAddForm(false);
    setNewQuestion({
      statement: '',
      type: 'BEHAVIORAL',
      examples: [''],
      weight: 1.0,
      scoreMin: 1,
      scoreMax: 5,
      proficiencyLevelId: defaultLevelId,
      ratingOptions: cloneDefaultRatingOptions(),
    });
  }, [competency.id, defaultLevelId]);

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
      const result = await apiService.generateAssessmentQuestions(competency.id, count, true);
      setGeneratedAssessment(result?.data || null);
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
        proficiencyLevelId: newQuestion.proficiencyLevelId || null,
        ratingOptions: serializeRatingOptionFields(newQuestion.ratingOptions),
        weight: newQuestion.weight,
        scoreMin: newQuestion.scoreMin,
        scoreMax: newQuestion.scoreMax,
      });
      setNewQuestion({
        statement: '',
        type: 'BEHAVIORAL',
        examples: [''],
        weight: 1.0,
        scoreMin: 1,
        scoreMax: 5,
        proficiencyLevelId: defaultLevelId,
        ratingOptions: cloneDefaultRatingOptions(),
      });
      setShowAddForm(false);
      await loadQuestions();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add question');
    }
  };

  const handleEditQuestion = (question: any) => {
    setEditingQuestion({
      ...question,
      examples: question.examples?.length ? question.examples : [''],
      ratingOptions: normalizeRatingOptionFields(question.ratingOptions),
      proficiencyLevelId: question.proficiencyLevelId || '',
    });
    setShowAddForm(false);
  };

  const handleUpdateQuestion = async () => {
    if (!editingQuestion || !editingQuestion.statement.trim()) {
      setError('Question statement is required');
      return;
    }

    try {
      await apiService.updateCompetencyQuestion(editingQuestion.id, {
        statement: editingQuestion.statement,
        type: editingQuestion.type,
        examples: editingQuestion.examples.filter((ex: string) => ex.trim()),
        proficiencyLevelId: editingQuestion.proficiencyLevelId || null,
        ratingOptions: serializeRatingOptionFields(editingQuestion.ratingOptions || []),
        weight: editingQuestion.weight,
        scoreMin: editingQuestion.scoreMin,
        scoreMax: editingQuestion.scoreMax,
      });
      setEditingQuestion(null);
      await loadQuestions();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update question');
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

      {generatedAssessment && (
        <div className="card bg-primary-50 border border-primary-100 mb-6">
          <h3 className="text-lg font-semibold text-primary-900 mb-2">
            Latest AI Assessment Structure
          </h3>
          <p className="text-sm text-primary-800 mb-4">
            {generatedAssessment.competency}: {generatedAssessment.description}
          </p>
          <div className="space-y-4">
            {generatedAssessment.levels?.map((level: any) => (
              <div key={level.proficiencyLevelId} className="bg-white rounded-lg border border-primary-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm uppercase text-primary-600 font-semibold">
                      {level.level_name}
                    </p>
                    <p className="text-gray-700 text-sm">{level.level_description}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {level.behavioral_indicators?.length || 0} indicators
                  </span>
                </div>
                <div className="space-y-2">
                  {level.behavioral_indicators?.map((indicator: any, idx: number) => (
                    <div key={idx} className="p-3 rounded border border-primary-50 bg-primary-25">
                      <p className="text-sm text-gray-900 mb-2">{indicator.statement}</p>
                      <ol className="list-decimal list-inside text-xs text-gray-700 space-y-1">
                        {indicator.answer_options?.map((option: string, optionIdx: number) => (
                          <li key={optionIdx}>{option}</li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
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
                  {questions.map((q, index) => {
                    const ratingScale = normalizeRatingOptionFields(q.ratingOptions);
                    return (
                      <div key={q.id} className="card">
                      {editingQuestion?.id === q.id ? (
                        /* Edit Form */
                        <div className="space-y-4">
                          <div>
                            <label className="label">Question Statement</label>
                            <textarea
                              value={editingQuestion.statement}
                              onChange={(e) =>
                                setEditingQuestion({ ...editingQuestion, statement: e.target.value })
                              }
                              className="input min-h-[80px]"
                              placeholder="Enter the assessment question..."
                            />
                          </div>
                      <div>
                        <label className="label">Question Type</label>
                        <select
                          value={editingQuestion.type}
                          onChange={(e) =>
                            setEditingQuestion({ ...editingQuestion, type: e.target.value })
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
                        <label className="label">Proficiency Level</label>
                        <select
                          value={editingQuestion.proficiencyLevelId || ''}
                          onChange={(e) =>
                            setEditingQuestion({
                              ...editingQuestion,
                              proficiencyLevelId: e.target.value,
                            })
                          }
                          className="input"
                        >
                          <option value="">Applies to All Levels</option>
                          {(competency.proficiencyLevels || []).map((level: any) => (
                            <option key={level.id} value={level.id}>
                              {level.name}
                              {level.numericLevel ? ` (Level ${level.numericLevel})` : ''}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          Linking a level helps assessments stay aligned with skill expectations.
                        </p>
                      </div>
                      <div>
                        <label className="label">Rating Scale Labels</label>
                        {editingQuestion.ratingOptions?.map((option: RatingOptionField, i: number) => (
                          <div key={`${option.key}-${i}`} className="flex items-center space-x-2 mb-2">
                            <span className="text-xs font-semibold text-gray-600 w-6">{i + 1}.</span>
                            <input
                              type="text"
                              value={option.label}
                              onChange={(e) => {
                                const updated = [...editingQuestion.ratingOptions];
                                updated[i] = { ...updated[i], label: e.target.value };
                                setEditingQuestion({ ...editingQuestion, ratingOptions: updated });
                              }}
                              className="input flex-1"
                              placeholder="Describe what this rating means..."
                            />
                            {editingQuestion.ratingOptions.length > MIN_RATING_OPTIONS && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = editingQuestion.ratingOptions.filter(
                                    (_: RatingOptionField, idx: number) => idx !== i
                                  );
                                  setEditingQuestion({ ...editingQuestion, ratingOptions: updated });
                                }}
                                className="btn btn-secondary"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            if (editingQuestion.ratingOptions.length >= MAX_RATING_OPTIONS) return;
                            setEditingQuestion({
                              ...editingQuestion,
                              ratingOptions: [
                                ...editingQuestion.ratingOptions,
                                { key: String(editingQuestion.ratingOptions.length + 1), label: '' },
                              ],
                            });
                          }}
                          className="btn btn-secondary text-sm"
                          disabled={editingQuestion.ratingOptions.length >= MAX_RATING_OPTIONS}
                        >
                          <Plus size={14} className="inline mr-1" />
                          Add Scale Point
                        </button>
                      </div>
                      <div>
                        <label className="label">Examples (Optional)</label>
                        {editingQuestion.examples.map((ex: string, i: number) => (
                              <div key={i} className="flex space-x-2 mb-2">
                                <input
                                  type="text"
                                  value={ex}
                                  onChange={(e) => {
                                    const newExamples = [...editingQuestion.examples];
                                    newExamples[i] = e.target.value;
                                    setEditingQuestion({ ...editingQuestion, examples: newExamples });
                                  }}
                                  className="input flex-1"
                                  placeholder="Example..."
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newExamples = editingQuestion.examples.filter(
                                      (_: any, idx: number) => idx !== i
                                    );
                                    setEditingQuestion({ ...editingQuestion, examples: newExamples });
                                  }}
                                  className="btn btn-secondary"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingQuestion({
                                  ...editingQuestion,
                                  examples: [...editingQuestion.examples, ''],
                                });
                              }}
                              className="btn btn-secondary text-sm"
                            >
                              <Plus size={14} className="inline mr-1" />
                              Add Example
                            </button>
                          </div>
                          <div className="flex justify-end space-x-3">
                            <button
                              onClick={() => setEditingQuestion(null)}
                              className="btn btn-secondary"
                            >
                              Cancel
                            </button>
                            <button onClick={handleUpdateQuestion} className="btn btn-primary">
                              Update Question
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Display Mode */
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-sm">
                              {index + 1}
                            </span>
                            <div className="flex-1">
                              <p
                                className="text-gray-900 mb-2"
                                title={q.examples?.[0] || undefined}
                              >
                                {q.statement}
                              </p>
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="text-xs px-2 py-1 bg-gray-100 rounded capitalize">
                                  {q.type.toLowerCase()}
                                </span>
                                {q.aiGenerated && (
                                  <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded flex items-center">
                                    <Sparkles size={12} className="mr-1" />
                                    AI
                                  </span>
                                )}
                                {q.proficiencyLevel?.name && (
                                  <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded">
                                    {q.proficiencyLevel.name}
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
                              {ratingScale.length > 0 && (
                                <div className="mt-3 pl-3 border-l-2 border-primary-100">
                                  <p className="text-xs font-semibold text-gray-700 mb-1">
                                    Rating Scale
                                  </p>
                                  <ol className="text-xs text-gray-600 space-y-1 list-decimal ml-4">
                                    {ratingScale.map((option, idx) => (
                                      <li key={`${q.id}-rating-${idx}`}>
                                        <span className="font-semibold text-primary-600 mr-1">
                                          {idx + 1}.
                                        </span>
                                        {option.label}
                                      </li>
                                    ))}
                                  </ol>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditQuestion(q)}
                              className="text-primary-600 hover:text-primary-800"
                              title="Edit question"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete question"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                      </div>
                    );
                  })}
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
                    <label className="label">Proficiency Level</label>
                    <select
                      value={newQuestion.proficiencyLevelId || ''}
                      onChange={(e) =>
                        setNewQuestion({
                          ...newQuestion,
                          proficiencyLevelId: e.target.value,
                        })
                      }
                      className="input"
                    >
                      <option value="">Applies to All Levels</option>
                      {(competency.proficiencyLevels || []).map((level: any) => (
                        <option key={level.id} value={level.id}>
                          {level.name}
                          {level.numericLevel ? ` (Level ${level.numericLevel})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Rating Scale Labels</label>
                    {newQuestion.ratingOptions.map((option, i) => (
                      <div key={`${option.key}-${i}`} className="flex items-center space-x-2 mb-2">
                        <span className="text-xs font-semibold text-gray-600 w-6">{i + 1}.</span>
                        <input
                          type="text"
                          value={option.label}
                          onChange={(e) => {
                            const updated = [...newQuestion.ratingOptions];
                            updated[i] = { ...updated[i], label: e.target.value };
                            setNewQuestion({ ...newQuestion, ratingOptions: updated });
                          }}
                          className="input flex-1"
                          placeholder="Describe what this rating represents..."
                        />
                        {newQuestion.ratingOptions.length > MIN_RATING_OPTIONS && (
                          <button
                            onClick={() => {
                              const updated = newQuestion.ratingOptions.filter((_, idx) => idx !== i);
                              setNewQuestion({ ...newQuestion, ratingOptions: updated });
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        if (newQuestion.ratingOptions.length >= MAX_RATING_OPTIONS) return;
                        setNewQuestion({
                          ...newQuestion,
                          ratingOptions: [
                            ...newQuestion.ratingOptions,
                            { key: String(newQuestion.ratingOptions.length + 1), label: '' },
                          ],
                        });
                      }}
                      className="text-sm text-primary-600 hover:text-primary-800"
                      disabled={newQuestion.ratingOptions.length >= MAX_RATING_OPTIONS}
                    >
                      + Add Scale Point
                    </button>
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
                          proficiencyLevelId: defaultLevelId,
                          ratingOptions: cloneDefaultRatingOptions(),
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
