/**
 * Clinical Guardrails Module
 * 
 * Exports types and utilities for clinical constraint validation.
 * 
 * @since 2.0.0
 */

// Export types
export * from './types';

// Export validator
export { GuardrailsValidator, guardrailsValidator } from './validator';
export type { PatientContext } from './validator';