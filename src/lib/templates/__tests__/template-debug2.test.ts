import { TemplateEngine } from '../TemplateEngine';
import { TEMPLATES } from '../templates';

describe('Template Debug 2', () => {
  it('should test actual template syntax', () => {
    const engine = new TemplateEngine({ locale: 'en-US' });
    
    // Get the actual template string
    const oralTemplate = TEMPLATES['en-US'].ORAL_TABLET_TEMPLATE;
    console.log('Oral tablet template:', oralTemplate);
    
    // Register the template
    engine.registerTemplate('en-US', 'ORAL_TABLET_TEMPLATE', oralTemplate);
    
    // Test with simple data
    const data = {
      verb: 'Take',
      doseValue: 1,
      doseUnit: 'tablet',
      route: 'by mouth',
      frequency: 'daily'
    };
    
    try {
      const result = engine.render('ORAL_TABLET_TEMPLATE', data);
      console.log('Template result:', result);
    } catch (error) {
      console.error('Template error:', error);
    }
  });
});