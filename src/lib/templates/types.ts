export interface TemplateData {
  // Core instruction components
  verb: string;
  doseValue?: number;
  doseUnit?: string;
  doseText?: string;
  route: string;
  frequency?: string;
  frequencyText?: string;
  
  // Additional dose information
  dualDose?: string;
  doseRange?: string;
  frequencyRange?: string;
  
  // Location and application
  site?: string;
  
  // Special instructions and modifiers
  specialInstructions?: string;
  indication?: string;
  technique?: string;
  
  // PRN and safety limits
  maxDose?: string;
  
  // Gender-aware formatting (for future i18n)
  gender?: 'male' | 'female' | 'other';
  
  // List formatting (e.g., ingredients)
  ingredients?: string[];

  // Index signature to allow for dynamic properties for template rendering
  [key: string]: unknown;
}

export interface TemplateConfig {
  locale: string;
  cacheSize?: number;
  enablePerformanceLogging?: boolean;
}

export interface TemplatePerformanceMetrics {
  renderTime: number;
  cacheHits: number;
  cacheMisses: number;
  templatesLoaded: number;
}

export type TemplateKey = 
  | 'ORAL_TABLET_TEMPLATE'
  | 'LIQUID_DOSE_TEMPLATE'
  | 'TOPICAL_APPLICATION_TEMPLATE'
  | 'INJECTION_TEMPLATE'
  | 'PRN_INSTRUCTION_TEMPLATE'
  | 'DEFAULT_TEMPLATE';

export interface LocaleTemplates {
  [key: string]: string;
}

export type TemplateLibrary = Map<string, Map<string, string>>;

export interface TemplateEngine {
  render(templateKey: TemplateKey, data: TemplateData): string;
  setLocale(locale: string): void;
  getPerformanceMetrics(): TemplatePerformanceMetrics;
  clearCache(): void;
}