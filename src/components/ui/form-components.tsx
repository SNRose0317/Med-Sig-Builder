import React from 'react';

// Reusable Form Section Component
export const FormSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-card rounded-2xl p-6 border border-border shadow-lg">
    <h3 className="text-lg font-bold text-foreground mb-6">{title}</h3>
    {children}
  </div>
);

// Reusable Form Field Component
export const FormField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-sm font-medium text-secondary-foreground mb-2">{label}</label>
    {children}
  </div>
);