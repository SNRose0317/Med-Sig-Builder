# Epic 2: UCUM Library Evaluation (SNR-92)

## Overview

This document evaluates TypeScript/JavaScript libraries for implementing a UCUM-compliant unit conversion system for the Medication Signature Builder. The selected library must support medical units, provide reliable conversions, and integrate well with our TypeScript codebase.

## Evaluation Criteria

1. **UCUM Standard Compliance** - Full support for Unified Code for Units of Measure
2. **FHIR R4 Alignment** - Compatible with healthcare standards
3. **TypeScript Support** - Native or high-quality type definitions
4. **Active Maintenance** - Recent updates and community support
5. **Bundle Size** - Reasonable size for client-side use
6. **Performance** - Fast conversion operations
7. **License Compatibility** - Compatible with our project
8. **Error Handling** - Robust error reporting
9. **Medical Unit Support** - Specific support for pharmaceutical units

## Library Comparison

### 1. @lhncbc/ucum-lhc ⭐ RECOMMENDED

**Pros:**
- ✅ Full UCUM compliance - purpose-built for UCUM standard
- ✅ FHIR-aligned - used by healthcare organizations
- ✅ Medical focus - developed by NIH's Lister Hill National Center
- ✅ Active maintenance - updated 2 months ago
- ✅ Good adoption - 25,721 weekly downloads
- ✅ Comprehensive features:
  - Unit validation
  - Unit conversion
  - Commensurable units detection
  - Suggestions for invalid units
- ✅ Both server and client support
- ✅ ES6 modules with CommonJS compatibility

**Cons:**
- ❌ Larger bundle size (2.06 MB unpacked)
- ❌ No native TypeScript (would need type definitions)
- ❌ 9 runtime dependencies

**Key Features:**
```javascript
// Validation
const parseResp = ucumUtils.validateUnitString('mg/mL', true);

// Conversion
const result = ucumUtils.convertUnitTo('100', 'mg', 'g');

// Find commensurable units
const units = ucumUtils.commensurablesList('mg');
```

### 2. unitmath

**Pros:**
- ✅ Native TypeScript support
- ✅ Lightweight (smaller bundle)
- ✅ Good API design
- ✅ Active maintenance (updated 9 months ago)
- ✅ Apache-2.0 license

**Cons:**
- ❌ No UCUM compliance mentioned
- ❌ Low adoption (208 weekly downloads)
- ❌ No specific medical unit support
- ❌ Would require custom implementation for UCUM

### 3. js-quantities

**Pros:**
- ✅ TypeScript support via @types
- ✅ High adoption (87,619 weekly downloads)
- ✅ No dependencies
- ✅ Good performance
- ✅ Mature library

**Cons:**
- ❌ No UCUM compliance
- ❌ Not updated in 2 years
- ❌ No medical-specific features
- ❌ Would require extensive customization

### 4. convert-units

**Pros:**
- ✅ TypeScript support
- ✅ Simple API
- ✅ Lightweight
- ✅ Good documentation

**Cons:**
- ❌ No UCUM support
- ❌ Limited medical units
- ❌ Not suitable for complex conversions

## Recommendation

**Selected Library: @lhncbc/ucum-lhc**

### Justification:

1. **UCUM Compliance**: This is the only library that provides full UCUM standard compliance out-of-the-box, which is critical for medical applications.

2. **Medical Domain Expertise**: Developed by NIH's Lister Hill National Center specifically for healthcare applications.

3. **FHIR Compatibility**: Aligns with our FHIR R4 requirements from Epic 1.

4. **Feature Completeness**: Provides all required features:
   - Unit validation with error messages
   - Bidirectional conversions
   - Commensurable unit detection
   - Suggestions for typos/errors

5. **Production Ready**: Used by major healthcare organizations and LOINC.

### Mitigation Strategies:

1. **Bundle Size**: 
   - Use tree-shaking to reduce size
   - Consider server-side conversion API for complex operations
   - Lazy load for non-critical paths

2. **TypeScript Support**:
   - Create comprehensive type definitions
   - Wrap in a type-safe service layer
   - Generate types from library documentation

3. **Dependencies**:
   - Audit dependencies for security
   - Consider bundling to reduce HTTP requests
   - Monitor for vulnerabilities

## Implementation Plan

1. **Phase 1: Type Definitions**
   - Create TypeScript definitions for core UCUM functions
   - Define interfaces for our use cases

2. **Phase 2: Service Wrapper**
   - Build type-safe wrapper service
   - Add medication-specific helpers
   - Implement error handling

3. **Phase 3: Performance Testing**
   - Benchmark conversion operations
   - Optimize critical paths
   - Implement caching if needed

## Performance Benchmarks

To be completed after prototype implementation:
- Single unit conversion: Target < 1ms
- Batch conversions (100 units): Target < 10ms
- Memory footprint: Target < 50MB
- Startup time: Target < 100ms

## Risk Assessment

- **Low Risk**: Library is stable and well-tested in production
- **Medium Risk**: Bundle size may impact initial load time
- **Mitigation**: Can fall back to server-side conversion if needed

## Decision

Proceed with @lhncbc/ucum-lhc as the foundation for our unit conversion system, with a type-safe wrapper layer to ensure integration with our TypeScript codebase.

## Next Steps

1. Install @lhncbc/ucum-lhc
2. Create TypeScript definitions
3. Build prototype service
4. Benchmark performance
5. Implement medication-specific conversions