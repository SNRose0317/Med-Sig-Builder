/**
 * Artillery Load Test Scenarios
 * Custom functions for realistic medication signature testing
 * SNR-125: Artillery Load Testing Setup
 */

/**
 * Random frequency selector from common prescription frequencies
 */
function frequency() {
  const frequencies = [
    'Once Daily',
    'Twice Daily',
    'Three Times Daily',
    'Four Times Daily',
    'Every 6 Hours',
    'Every 8 Hours',
    'Every 12 Hours',
    'Once Weekly',
    'Twice Weekly'
  ];
  return frequencies[Math.floor(Math.random() * frequencies.length)];
}

/**
 * Liquid medication dose ranges
 */
function liquidDose() {
  const doses = [2.5, 5, 7.5, 10, 15, 20, 250, 500]; // mL or mg values
  return doses[Math.floor(Math.random() * doses.length)];
}

/**
 * Liquid medication units
 */
function liquidUnit() {
  const units = ['mL', 'mg'];
  return units[Math.floor(Math.random() * units.length)];
}

/**
 * Testosterone dose ranges for TRT
 */
function testosteroneDose() {
  const doses = [50, 100, 150, 200, 250];
  return doses[Math.floor(Math.random() * doses.length)];
}

/**
 * Injection frequencies
 */
function injectionFrequency() {
  const frequencies = [
    'Once Weekly',
    'Every 2 Weeks',
    'Twice Weekly',
    'Every 10 Days'
  ];
  return frequencies[Math.floor(Math.random() * frequencies.length)];
}

/**
 * Topiclick dose ranges (clicks)
 */
function topiclickDose() {
  const doses = [2, 4, 6, 8, 10, 12];
  return doses[Math.floor(Math.random() * doses.length)];
}

/**
 * Topical application frequencies
 */
function topicalFrequency() {
  const frequencies = [
    'Once Daily',
    'Twice Daily',
    'Every Other Day',
    'Three Times Weekly'
  ];
  return frequencies[Math.floor(Math.random() * frequencies.length)];
}

/**
 * Generate realistic patient ages by medication type
 */
function patientAge(medicationType) {
  switch (medicationType) {
    case 'pediatric':
      return Math.floor(Math.random() * 17) + 1; // 1-17 years
    case 'adult':
      return Math.floor(Math.random() * 47) + 18; // 18-64 years
    case 'geriatric':
      return Math.floor(Math.random() * 25) + 65; // 65-89 years
    default:
      return Math.floor(Math.random() * 70) + 18; // 18-87 years
  }
}

/**
 * Generate timestamp variations for testing
 */
function randomTimestamp() {
  const now = new Date();
  const variation = Math.floor(Math.random() * 1000 * 60 * 60 * 24); // 24 hours
  return new Date(now.getTime() - variation).toISOString();
}

/**
 * Memory stress test data generator
 */
function generateLargeContext() {
  const largeInstructions = Array(100).fill().map((_, i) => 
    `Additional instruction ${i + 1} for comprehensive testing scenarios`
  );
  
  return {
    specialInstructions: largeInstructions.join(', '),
    metadata: {
      testType: 'memory-stress',
      generatedAt: new Date().toISOString(),
      size: largeInstructions.length
    }
  };
}

/**
 * Performance benchmark context variations
 */
function createVariedContext(baseContext, variation) {
  const contexts = {
    'simple': baseContext,
    'complex': {
      ...baseContext,
      ...generateLargeContext()
    },
    'concurrent': {
      ...baseContext,
      id: `concurrent-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: randomTimestamp()
    }
  };
  
  return contexts[variation] || contexts.simple;
}

/**
 * Export functions for Artillery to use
 */
module.exports = {
  frequency,
  liquidDose,
  liquidUnit,
  testosteroneDose,
  injectionFrequency,
  topiclickDose,
  topicalFrequency,
  patientAge,
  randomTimestamp,
  generateLargeContext,
  createVariedContext
};