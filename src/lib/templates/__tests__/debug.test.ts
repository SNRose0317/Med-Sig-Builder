import { TemplateEngine } from '../TemplateEngine';
import { createTemplateEngine, TEMPLATES } from '../templates';

describe('Template Debug', () => {
  it('should debug template registration', () => {
    console.log('TEMPLATES structure:', Object.keys(TEMPLATES));
    console.log('en-US templates:', Object.keys(TEMPLATES['en-US']));
    
    const engine = createTemplateEngine('en-US');
    
    // Test simple registration
    engine.registerTemplate('en-US', 'ORAL_TABLET_TEMPLATE', 'Take {doseValue} {doseUnit} {route} {frequency}.');
    
    const result = engine.render('ORAL_TABLET_TEMPLATE', {
      verb: 'Take',
      doseValue: 1,
      doseUnit: 'tablet',
      route: 'by mouth',
      frequency: 'daily'
    });
    
    console.log('Simple template result:', result);
    expect(result).toBe('Take 1 tablet by mouth daily.');
  });
});