import React from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { PersonalData } from '../types';
import { Activity, User, Weight, Ruler, Target } from 'lucide-react';

export default function PersonalDataForm({ 
  onSubmit 
}: { 
  onSubmit: (data: PersonalData) => void 
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<PersonalData>();

  const formFields = [
    {
      name: 'age',
      label: 'Age',
      type: 'number',
      icon: User,
      validation: { required: true, min: 15, max: 100 },
      error: errors.age && 'Age must be between 15 and 100'
    },
    {
      name: 'weight',
      label: 'Weight (kg)',
      type: 'number',
      icon: Weight,
      validation: { required: true, min: 30, max: 300 },
      error: errors.weight && 'Weight must be between 30 and 300 kg'
    },
    {
      name: 'height',
      label: 'Height (cm)',
      type: 'number',
      icon: Ruler,
      validation: { required: true, min: 100, max: 250 },
      error: errors.height && 'Height must be between 100 and 250 cm'
    }
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {formFields.map((field, index) => (
          <motion.div
            key={field.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="form-control"
          >
            <label className="label">
              <span className="label-text flex items-center gap-2">
                <field.icon className="w-4 h-4" />
                {field.label}
              </span>
            </label>
            <input
              type={field.type}
              {...register(field.name as keyof PersonalData, field.validation)}
              className="input input-bordered w-full focus:input-primary"
            />
            {field.error && (
              <label className="label">
                <span className="label-text-alt text-error">{field.error}</span>
              </label>
            )}
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="form-control"
        >
          <label className="label">
            <span className="label-text flex items-center gap-2">
              <User className="w-4 h-4" />
              Gender
            </span>
          </label>
          <select
            {...register('gender', { required: true })}
            className="select select-bordered w-full focus:select-primary"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="form-control"
        >
          <label className="label">
            <span className="label-text flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Activity Level
            </span>
          </label>
          <select
            {...register('activityLevel', { required: true })}
            className="select select-bordered w-full focus:select-primary"
          >
            <option value="sedentary">Sedentary (office job)</option>
            <option value="light">Light Exercise (1-2 days/week)</option>
            <option value="moderate">Moderate Exercise (3-5 days/week)</option>
            <option value="active">Active (6-7 days/week)</option>
            <option value="very-active">Very Active (athlete)</option>
          </select>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="form-control"
        >
          <label className="label">
            <span className="label-text flex items-center gap-2">
              <Target className="w-4 h-4" />
              Goal
            </span>
          </label>
          <select
            {...register('goal', { required: true })}
            className="select select-bordered w-full focus:select-primary"
          >
            <option value="weight-loss">Weight Loss</option>
            <option value="weight-gain">Weight Gain</option>
            <option value="muscle-gain">Muscle Gain</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex justify-center"
      >
        <button
          type="submit"
          className="btn btn-primary btn-wide"
        >
          Generate Plan
        </button>
      </motion.div>
    </form>
  );
}