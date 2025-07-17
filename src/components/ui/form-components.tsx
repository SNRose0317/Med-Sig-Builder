import React from 'react';

// Reusable Form Section Component
export const FormSection = ({ 
  title, 
  description, 
  children 
}: { 
  title: string; 
  description?: string; 
  children: React.ReactNode 
}) => (
  <div className="bg-card rounded-2xl p-6 border border-border shadow-lg">
    <div className="mb-6">
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      )}
    </div>
    {children}
  </div>
);

// Reusable Form Field Component
export const FormField = ({ 
  label, 
  description, 
  children 
}: { 
  label: string; 
  description?: string; 
  children: React.ReactNode 
}) => (
  <div>
    <label className="block text-sm font-medium text-secondary-foreground mb-1">{label}</label>
    {description && (
      <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{description}</p>
    )}
    {children}
  </div>
);