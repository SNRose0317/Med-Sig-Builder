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
export { GuardrailsValidator, PatientContext, guardrailsValidator } from './validator';