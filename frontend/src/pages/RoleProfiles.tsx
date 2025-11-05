import React from 'react';
import { Briefcase, Plus } from 'lucide-react';

export const RoleProfiles: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Role Profiles</h1>
          <p className="text-gray-600 mt-1">Define roles and competency requirements</p>
        </div>
        <button className="btn btn-primary flex items-center space-x-2">
          <Plus size={20} />
          <span>New Role Profile</span>
        </button>
      </div>

      <div className="card text-center py-12">
        <Briefcase className="mx-auto text-gray-400 mb-4" size={48} />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No role profiles yet</h3>
        <p className="text-gray-600 mb-6">
          Create role profiles to define competency requirements for each position.
        </p>
        <button className="btn btn-primary">Create First Role Profile</button>
      </div>
    </div>
  );
};
