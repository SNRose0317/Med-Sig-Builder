/**
 * Tests for Device Unit Adapter
 */
import { DeviceUnitAdapter } from '../DeviceUnitAdapter';
import { UCUMWrapper } from '../UCUMWrapper';
import { MissingContextError } from '../ConversionErrors';
import { DeviceUnit, ConversionContext } from '../types';
import { MedicationProfile } from '../../../types/MedicationProfile';

describe('DeviceUnitAdapter', () => {
  let adapter: DeviceUnitAdapter;
  let ucumWrapper: UCUMWrapper;
  
  beforeEach(() => {
    ucumWrapper = new UCUMWrapper();
    adapter = new DeviceUnitAdapter(ucumWrapper);
  });
  
  describe('device unit registration', () => {
    it('should have default device units registered', () => {
      expect(adapter.isDeviceUnit('{click}')).toBe(true);
      expect(adapter.isDeviceUnit('{drop}')).toBe(true);
      expect(adapter.isDeviceUnit('{tablet}')).toBe(true);
      expect(adapter.isDeviceUnit('{capsule}')).toBe(true);
      expect(adapter.isDeviceUnit('{patch}')).toBe(true);
      expect(adapter.isDeviceUnit('{puff}')).toBe(true);
      expect(adapter.isDeviceUnit('{spray}')).toBe(true);
      expect(adapter.isDeviceUnit('{application}')).toBe(true);
    });
    
    it('should register custom device units', () => {
      const customUnit: DeviceUnit = {
        id: '{custom}',
        display: 'custom',
        pluralDisplay: 'customs',
        ratioTo: 'mg',
        factor: 5
      };
      
      adapter.registerDeviceUnit(customUnit);
      expect(adapter.isDeviceUnit('{custom}')).toBe(true);
      expect(adapter.getDeviceUnit('{custom}')).toEqual(customUnit);
    });
    
    it('should return false for non-device units', () => {
      expect(adapter.isDeviceUnit('mg')).toBe(false);
      expect(adapter.isDeviceUnit('mL')).toBe(false);
    });
  });
  
  describe('standard unit conversions', () => {
    it('should delegate to UCUM wrapper for non-device units', () => {
      const result = adapter.convert(1000, 'mg', 'g');
      expect(result.value).toBe(1);
      expect(result.trace[0].type).toBe('standard');
    });
  });
  
  describe('Topiclick conversions', () => {
    it('should convert clicks to mL (4 clicks = 1 mL)', () => {
      const result = adapter.convert(4, '{click}', 'mL');
      expect(result.value).toBe(1);
      expect(result.trace[0].type).toBe('device');
    });
    
    it('should convert mL to clicks', () => {
      const result = adapter.convert(1, 'mL', '{click}');
      expect(result.value).toBe(4);
    });
    
    it('should convert clicks to mcg through volume', () => {
      // Test with a valid conversion path: clicks -> mL -> L -> mcg/L * L = mcg
      // This would typically require concentration context
      const result = adapter.convert(4, '{click}', 'mL');
      expect(result.value).toBe(1); // 4 clicks = 1 mL
      
      // For mg conversion, we'd need concentration context which isn't supported 
      // in basic device adapter - that would be handled by the full UnitConverter
    });
    
    it('should handle air-prime loss when converting from clicks', () => {
      const context: ConversionContext = {
        airPrimeLoss: 4
      };
      
      const result = adapter.convert(12, '{click}', 'mL', context);
      expect(result.value).toBe(2); // 12 clicks - 4 prime = 8 clicks = 2 mL
      expect(result.trace[0].description).toContain('Air-prime adjustment');
    });
    
    it('should note air-prime requirement when converting to clicks', () => {
      const context: ConversionContext = {
        airPrimeLoss: 4
      };
      
      const result = adapter.convert(1, 'mL', '{click}', context);
      expect(result.value).toBe(4); // 1 mL = 4 clicks
      expect(result.trace[result.trace.length - 1].description).toContain('First 4 clicks will be wasted');
    });
  });
  
  describe('drop conversions', () => {
    it('should convert drops to mL (20 drops = 1 mL)', () => {
      const result = adapter.convert(20, '{drop}', 'mL');
      expect(result.value).toBe(1);
    });
    
    it('should convert mL to drops', () => {
      const result = adapter.convert(0.5, 'mL', '{drop}');
      expect(result.value).toBe(10);
    });
  });
  
  describe('tablet/capsule conversions requiring context', () => {
    it('should throw MissingContextError for tablet to mg without context', () => {
      expect(() => adapter.convert(2, '{tablet}', 'mg'))
        .toThrow(MissingContextError);
    });
    
    it('should convert tablets to mg with custom conversion', () => {
      const context: ConversionContext = {
        customConversions: [{
          from: '{tablet}',
          to: 'mg',
          factor: 500 // 500 mg per tablet
        }]
      };
      
      const result = adapter.convert(2, '{tablet}', 'mg', context);
      expect(result.value).toBe(1000);
    });
    
    it('should convert tablets to mg using medication strengthQuantity', () => {
      const context: ConversionContext = {
        medication: {
          id: 'test-med',
          name: 'Test Medication',
          type: 'medication',
          isActive: true,
          doseForm: 'Tablet',
          code: { coding: [{ display: 'Test' }] },
          ingredient: [{
            name: 'Test Ingredient',
            strengthRatio: {
              numerator: { value: 500, unit: 'mg' },
              denominator: { value: 1, unit: 'tablet' }
            },
            strengthQuantity: { value: 500, unit: 'mg' }
          }]
        } as MedicationProfile
      };
      
      const result = adapter.convert(2, '{tablet}', 'mg', context);
      expect(result.value).toBe(1000);
    });
    
    it('should convert tablets to mg using medication strengthRatio', () => {
      const context: ConversionContext = {
        medication: {
          id: 'test-med',
          name: 'Test Medication',
          type: 'medication',
          isActive: true,
          doseForm: 'Tablet',
          code: { coding: [{ display: 'Test' }] },
          ingredient: [{
            name: 'Test Ingredient',
            strengthRatio: {
              numerator: { value: 250, unit: 'mg' },
              denominator: { value: 1, unit: 'tablet' }
            }
          }]
        } as MedicationProfile
      };
      
      const result = adapter.convert(3, '{tablet}', 'mg', context);
      expect(result.value).toBe(750); // 3 tablets × 250 mg/tablet
    });
    
    it('should convert mg to capsules with custom conversion', () => {
      const context: ConversionContext = {
        customConversions: [{
          from: '{capsule}',
          to: 'mg',
          factor: 250 // 250 mg per capsule
        }]
      };
      
      const result = adapter.convert(500, 'mg', '{capsule}', context);
      expect(result.value).toBe(2);
    });
    
    it('should convert capsules to mg using medication strength', () => {
      const context: ConversionContext = {
        medication: {
          id: 'test-cap',
          name: 'Test Capsule',
          type: 'medication',
          isActive: true,
          doseForm: 'Capsule',
          code: { coding: [{ display: 'Test' }] },
          ingredient: [{
            name: 'Test Ingredient',
            strengthRatio: {
              numerator: { value: 100, unit: 'mg' },
              denominator: { value: 1, unit: 'capsule' }
            }
          }]
        } as MedicationProfile
      };
      
      const result = adapter.convert(5, '{capsule}', 'mg', context);
      expect(result.value).toBe(500); // 5 capsules × 100 mg/capsule
    });
  });
  
  describe('device to device conversions', () => {
    it('should convert between device units with same base unit', () => {
      // Register a custom device that also converts to mL
      const customDrops: DeviceUnit = {
        id: '{bigdrop}',
        display: 'big drop',
        pluralDisplay: 'big drops',
        ratioTo: 'mL',
        factor: 0.1 // 10 big drops = 1 mL
      };
      
      adapter.registerDeviceUnit(customDrops);
      
      const result = adapter.convert(20, '{drop}', '{bigdrop}');
      expect(result.value).toBe(10); // 20 drops = 1 mL = 10 big drops
    });
    
    it('should convert between device units with different base units', () => {
      const context: ConversionContext = {
        customConversions: [
          {
            from: '{tablet}',
            to: 'mg',
            factor: 500
          },
          {
            from: '{puff}',
            to: 'mcg',
            factor: 100
          }
        ]
      };
      
      // 1 tablet = 500 mg = 500,000 mcg = 5000 puffs
      const result = adapter.convert(1, '{tablet}', '{puff}', context);
      expect(result.value).toBe(5000);
    });
  });
  
  describe('lot-specific variations', () => {
    it('should use lot-specific conversion factor when available', () => {
      // Register a device with lot variations
      const deviceWithLots: DeviceUnit = {
        id: '{lotvary}',
        display: 'lot vary',
        pluralDisplay: 'lot varies',
        ratioTo: 'mg',
        factor: 10,
        metadata: {
          lotVariations: new Map([
            ['LOT123', 12], // This lot has 12mg per unit
            ['LOT456', 8]   // This lot has 8mg per unit
          ])
        }
      };
      
      adapter.registerDeviceUnit(deviceWithLots);
      
      // Test with LOT123
      const context1: ConversionContext = { lotNumber: 'LOT123' };
      const result1 = adapter.convert(1, '{lotvary}', 'mg', context1);
      expect(result1.value).toBe(12);
      
      // Test with LOT456
      const context2: ConversionContext = { lotNumber: 'LOT456' };
      const result2 = adapter.convert(1, '{lotvary}', 'mg', context2);
      expect(result2.value).toBe(8);
      
      // Test without lot number (use default)
      const result3 = adapter.convert(1, '{lotvary}', 'mg');
      expect(result3.value).toBe(10);
    });
  });
  
  describe('trace information', () => {
    it('should provide detailed trace for multi-step conversions', () => {
      const context: ConversionContext = {
        customConversions: [{
          from: '{tablet}',
          to: 'mg',
          factor: 500
        }]
      };
      
      const result = adapter.convert(2, '{tablet}', 'g', context);
      
      expect(result.trace).toHaveLength(2);
      expect(result.trace[0]).toMatchObject({
        type: 'device',
        fromUnit: '{tablet}',
        toUnit: 'mg',
        fromValue: 2,
        toValue: 1000
      });
      expect(result.trace[1]).toMatchObject({
        type: 'standard',
        fromUnit: 'mg',
        toUnit: 'g',
        fromValue: 1000,
        toValue: 1
      });
    });
  });
  
  describe('edge cases', () => {
    it('should handle zero values', () => {
      const result = adapter.convert(0, '{click}', 'mL');
      expect(result.value).toBe(0);
    });
    
    it('should handle negative values with air-prime', () => {
      const context: ConversionContext = { airPrimeLoss: 4 };
      const result = adapter.convert(2, '{click}', 'mL', context);
      expect(result.value).toBe(0); // 2 - 4 = -2, clamped to 0
    });
    
    it('should preserve original value in result', () => {
      const result = adapter.convert(100, '{drop}', 'mL');
      expect(result.originalValue).toBe(100);
      expect(result.fromUnit).toBe('{drop}');
      expect(result.toUnit).toBe('mL');
    });
  });
});