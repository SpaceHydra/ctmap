import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { store } from '../services/mockStore';
import { X, Plus, MapPin, Building2, Briefcase, Check } from 'lucide-react';
import { getAllStates, getDistrictsForStates, PRODUCT_TYPES } from '../utils/statesDistrictsData';

interface EditAdvocateModalProps {
  advocate: User;
  onClose: () => void;
  onSave: (updates: AdvocateUpdates) => void;
}

export interface AdvocateUpdates {
  states?: string[];
  districts?: string[];
  hubId?: string;
  expertise?: string[];
}

export const EditAdvocateModal: React.FC<EditAdvocateModalProps> = ({
  advocate,
  onClose,
  onSave
}) => {
  const [selectedStates, setSelectedStates] = useState<string[]>(advocate.states || []);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>(advocate.districts || []);
  const [selectedHub, setSelectedHub] = useState<string>(advocate.hubId || '');
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>(advocate.expertise || []);
  const [error, setError] = useState('');

  const allStates = getAllStates();
  const availableDistricts = getDistrictsForStates(selectedStates);
  const hubs = store.getHubs();

  // Filter districts when states change
  useEffect(() => {
    // Remove districts that are no longer valid based on selected states
    if (selectedStates.length > 0) {
      const validDistricts = selectedDistricts.filter(district =>
        availableDistricts.includes(district)
      );
      if (validDistricts.length !== selectedDistricts.length) {
        setSelectedDistricts(validDistricts);
      }
    } else {
      setSelectedDistricts([]);
    }
  }, [selectedStates]);

  const handleAddState = (state: string) => {
    if (state && !selectedStates.includes(state)) {
      setSelectedStates([...selectedStates, state]);
      setError('');
    }
  };

  const handleRemoveState = (state: string) => {
    setSelectedStates(selectedStates.filter(s => s !== state));
  };

  const handleAddDistrict = (district: string) => {
    if (district && !selectedDistricts.includes(district)) {
      setSelectedDistricts([...selectedDistricts, district]);
    }
  };

  const handleRemoveDistrict = (district: string) => {
    setSelectedDistricts(selectedDistricts.filter(d => d !== district));
  };

  const handleToggleExpertise = (product: string) => {
    if (selectedExpertise.includes(product)) {
      setSelectedExpertise(selectedExpertise.filter(p => p !== product));
    } else {
      setSelectedExpertise([...selectedExpertise, product]);
    }
  };

  const handleSave = () => {
    if (selectedStates.length === 0) {
      setError('At least one state must be selected');
      return;
    }

    const updates: AdvocateUpdates = {
      states: selectedStates,
      districts: selectedDistricts,
      hubId: selectedHub || undefined,
      expertise: selectedExpertise
    };

    onSave(updates);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Edit Advocate Profile</h3>
            <p className="text-sm text-slate-600 mt-1">{advocate.firmName || advocate.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
              <p className="text-sm font-bold text-red-900">{error}</p>
            </div>
          )}

          {/* Coverage Areas */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-900">
              <MapPin className="w-5 h-5 text-brand-600" />
              <h4 className="font-bold">Coverage Areas</h4>
            </div>

            {/* States */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                States <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedStates.map(state => (
                  <span
                    key={state}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-100 text-brand-700 rounded-lg border border-brand-200 font-medium"
                  >
                    {state}
                    <button
                      onClick={() => handleRemoveState(state)}
                      className="hover:bg-brand-200 rounded p-0.5 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {selectedStates.length === 0 && (
                  <span className="text-sm text-slate-500 italic">No states selected</span>
                )}
              </div>
              <div className="flex gap-2">
                <select
                  className="flex-1 px-4 py-2 border-2 border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  onChange={(e) => {
                    handleAddState(e.target.value);
                    e.target.value = '';
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>Select state to add...</option>
                  {allStates
                    .filter(state => !selectedStates.includes(state))
                    .map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                </select>
              </div>
            </div>

            {/* Districts */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Districts
                {selectedStates.length === 0 && (
                  <span className="text-xs text-slate-500 font-normal ml-2">
                    (Select states first)
                  </span>
                )}
              </label>
              <div className="flex flex-wrap gap-2 mb-3 min-h-[2rem]">
                {selectedDistricts.map(district => (
                  <span
                    key={district}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg border border-slate-200 font-medium"
                  >
                    {district}
                    <button
                      onClick={() => handleRemoveDistrict(district)}
                      className="hover:bg-slate-200 rounded p-0.5 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {selectedDistricts.length === 0 && (
                  <span className="text-sm text-slate-500 italic">No districts selected</span>
                )}
              </div>
              {selectedStates.length > 0 && (
                <select
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  onChange={(e) => {
                    handleAddDistrict(e.target.value);
                    e.target.value = '';
                  }}
                  defaultValue=""
                  disabled={availableDistricts.length === 0}
                >
                  <option value="" disabled>
                    {availableDistricts.length > 0
                      ? 'Select district to add...'
                      : 'No districts available'}
                  </option>
                  {availableDistricts
                    .filter(district => !selectedDistricts.includes(district))
                    .map(district => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                </select>
              )}
            </div>
          </div>

          {/* Hub Assignment */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-900">
              <Building2 className="w-5 h-5 text-purple-600" />
              <h4 className="font-bold">Hub Assignment</h4>
            </div>
            <select
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              value={selectedHub}
              onChange={(e) => setSelectedHub(e.target.value)}
            >
              <option value="">No hub assigned</option>
              {hubs.map(hub => (
                <option key={hub.id} value={hub.id}>
                  {hub.code} - {hub.name} ({hub.location})
                </option>
              ))}
            </select>
            {selectedHub && (
              <p className="text-xs text-slate-600">
                ℹ️ This advocate will be prioritized for assignments from this hub
              </p>
            )}
          </div>

          {/* Expertise */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-900">
              <Briefcase className="w-5 h-5 text-emerald-600" />
              <h4 className="font-bold">Product Expertise</h4>
            </div>
            <div className="space-y-2">
              {PRODUCT_TYPES.map(product => {
                const isSelected = selectedExpertise.includes(product);
                return (
                  <button
                    key={product}
                    onClick={() => handleToggleExpertise(product)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      isSelected
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-slate-300'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="font-medium">{product}</span>
                  </button>
                );
              })}
            </div>
            {selectedExpertise.length === 0 && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                ⚠️ No expertise selected. This advocate may receive lower priority in AI allocation.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-lg text-slate-700 font-semibold hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={selectedStates.length === 0}
            className="flex-1 px-4 py-3 rounded-lg font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
