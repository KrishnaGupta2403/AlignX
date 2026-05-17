"use client";

import React, { useState, useEffect } from 'react';
import { Target, AlignLeft, Flag, Type, Percent, AlertCircle } from 'lucide-react';

const UOM_TYPES = ['MIN', 'MAX', 'ZERO', 'TIMELINE'];

export default function GoalForm({ 
  onSubmit, 
  existingGoals = [], 
  currentEditingGoal = null, 
  onCancel 
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [target, setTarget] = useState('');
  const [uomType, setUomType] = useState('MAX');
  const [weightage, setWeightage] = useState('');
  const [error, setError] = useState('');

  // Populate form if editing
  useEffect(() => {
    if (currentEditingGoal) {
      setTitle(currentEditingGoal.title || '');
      setDescription(currentEditingGoal.description || '');
      setTarget(currentEditingGoal.target || '');
      setUomType(currentEditingGoal.uom_type || 'MAX');
      setWeightage(currentEditingGoal.weightage || '');
    } else {
      // Reset form
      setTitle('');
      setDescription('');
      setTarget('');
      setUomType('MAX');
      setWeightage('');
    }
    setError('');
  }, [currentEditingGoal]);

  // Calculate current total weightage from existing goals (excluding the one being edited)
  const otherGoalsWeightage = existingGoals.reduce((total, goal) => {
    if (currentEditingGoal && goal.id === currentEditingGoal.id) {
      return total;
    }
    return total + (Number(goal.weightage) || 0);
  }, 0);

  const currentInputWeightage = Number(weightage) || 0;
  const projectedTotal = otherGoalsWeightage + currentInputWeightage;
  const remainingWeightage = Math.max(0, 100 - projectedTotal);
  const isOverweight = projectedTotal > 100;

  // Max 8 goals logic
  const isMaxGoalsReached = !currentEditingGoal && existingGoals.length >= 8;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validation 1: Max goals
    if (isMaxGoalsReached) {
      setError('Maximum of 8 goals allowed per sheet.');
      return;
    }

    // Validation 2: Empty fields
    if (!title || !description || target === '' || !uomType || weightage === '') {
      setError('All fields are required.');
      return;
    }

    // Validation 3: Weightage limits (1-100)
    const weightVal = Number(weightage);
    if (isNaN(weightVal) || weightVal < 1 || weightVal > 100) {
      setError('Weightage must be a number between 1 and 100.');
      return;
    }

    // Validation 4: Running total
    if (projectedTotal > 100) {
      setError(`Total weightage cannot exceed 100%. You only have ${100 - otherGoalsWeightage}% left.`);
      return;
    }

    // Pass data back up
    onSubmit({
      title,
      description,
      target: Number(target),
      uom_type: uomType,
      weightage: weightVal,
    });

    // Clear form if not editing
    if (!currentEditingGoal) {
      setTitle('');
      setDescription('');
      setTarget('');
      setWeightage('');
      setUomType('MAX');
    }
  };

  return (
    <div className="bg-[#0A0510]/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl w-full max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          {currentEditingGoal ? 'Edit Goal' : 'Create New Goal'}
        </h2>
        <p className="text-white/60 text-sm">
          Define clear, measurable goals for your performance tracking.
        </p>
      </div>

      {/* Live Weightage Counter */}
      <div className="mb-8 bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="flex justify-between items-end mb-2">
          <h3 className="text-sm font-semibold text-white/80">Weightage Distribution</h3>
          <span className={`text-xs font-bold px-2 py-1 rounded-md ${isOverweight ? 'bg-red-500/20 text-red-400' : 'bg-[#A855F7]/20 text-[#A855F7]'}`}>
            {isOverweight ? 'Over 100%' : `${remainingWeightage}% Remaining`}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden flex">
          <div 
            className="h-full bg-white/20 transition-all duration-300" 
            style={{ width: `${Math.min(100, otherGoalsWeightage)}%` }}
            title={`Used: ${otherGoalsWeightage}%`}
          />
          <div 
            className={`h-full transition-all duration-300 ${isOverweight ? 'bg-red-500' : 'bg-[#A855F7]'}`}
            style={{ width: `${Math.min(100 - otherGoalsWeightage, currentInputWeightage)}%` }}
            title={`Current: ${currentInputWeightage}%`}
          />
        </div>
        
        <div className="flex justify-between text-xs mt-2 font-medium">
          <span className="text-white/40">Used: {otherGoalsWeightage}%</span>
          <span className={isOverweight ? 'text-red-400' : 'text-white/80'}>
            Projected Total: {projectedTotal}%
          </span>
        </div>
      </div>

      {/* Form Error */}
      {error && (
        <div className="mb-6 flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
          <AlertCircle size={18} />
          <p>{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5 flex items-center gap-2">
            <Target size={16} className="text-[#A855F7]" /> Goal Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#A855F7]/50 focus:border-transparent transition-all"
            placeholder="e.g. Increase Q3 Sales Revenue"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5 flex items-center gap-2">
            <AlignLeft size={16} className="text-[#A855F7]" /> Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#A855F7]/50 focus:border-transparent transition-all resize-none"
            placeholder="Describe the objective and key results expected..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Target */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5 flex items-center gap-2">
              <Flag size={16} className="text-[#A855F7]" /> Target Value
            </label>
            <input
              type="number"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#A855F7]/50 focus:border-transparent transition-all"
              placeholder="e.g. 50000"
            />
          </div>

          {/* UoM Type */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5 flex items-center gap-2">
              <Type size={16} className="text-[#A855F7]" /> UoM Type
            </label>
            <div className="relative">
              <select
                value={uomType}
                onChange={(e) => setUomType(e.target.value)}
                className="w-full bg-[#1A1423] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-[#A855F7]/50 focus:border-transparent transition-all appearance-none"
              >
                {UOM_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-white/40">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
              </div>
            </div>
          </div>

          {/* Weightage */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5 flex items-center gap-2">
              <Percent size={16} className="text-[#A855F7]" /> Weightage
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={weightage}
              onChange={(e) => setWeightage(e.target.value)}
              className={`w-full bg-white/5 border rounded-xl py-3 px-4 text-white placeholder-white/20 focus:outline-none focus:ring-2 transition-all ${
                isOverweight 
                  ? 'border-red-500/50 focus:ring-red-500/50' 
                  : 'border-white/10 focus:ring-[#A855F7]/50 focus:border-transparent'
              }`}
              placeholder="1 - 100"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4 border-t border-white/5 mt-6">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-3 rounded-xl transition-colors border border-white/10"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isMaxGoalsReached || isOverweight}
            className="flex-[2] relative overflow-hidden group bg-gradient-to-r from-[#A855F7] to-[#8a3fd6] text-white font-semibold py-3 rounded-xl shadow-lg shadow-[#A855F7]/25 hover:shadow-[#A855F7]/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
            <span className="relative z-10">
              {currentEditingGoal ? 'Save Changes' : isMaxGoalsReached ? 'Limit Reached (8/8)' : 'Add Goal'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
