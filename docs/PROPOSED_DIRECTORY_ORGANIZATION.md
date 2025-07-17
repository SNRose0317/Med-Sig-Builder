# 📁 Proposed Directory Organization for Med Sig Builder

## 🎯 Overview

This document proposes a clear, logical file and folder organization for the Med Sig Builder project. The reorganization focuses on grouping files by **purpose and user intent** rather than technical implementation, making it easier for anyone to understand what the system does and how to find what they need.

## 🧠 Organization Principles

1. **Purpose-Driven**: Group files by what they do, not how they're implemented
2. **User Mental Model**: Organize by what someone would logically look for
3. **Clear Boundaries**: Make it obvious where anything belongs
4. **Logical Hierarchy**: Each subfolder has a specific, clear purpose
5. **Based on Reality**: Uses only files and directories that actually exist

## 📂 Proposed Structure

```
Med-Sig-Builder/
├── 📋 core-business-logic/           # What the app actually does
│   ├── 🏗️ signature-building/        # Everything about building medication signatures
│   │   ├── builders/                # (from src/lib/builders/) - 8 builder types
│   │   ├── strategies/              # (from src/lib/strategies/) - Calculation strategies
│   │   ├── templates/               # (from src/lib/templates/) - Instruction templates
│   │   ├── dispatcher/              # (from src/lib/dispatcher/) - Strategy selection
│   │   ├── registry/                # (from src/lib/registry/) - Strategy management
│   │   └── signature/               # (from src/lib/signature/) - Core signature logic
│   ├── 💊 medication-data/          # Everything about medications
│   │   ├── types/                   # (from src/types/) - Medication schemas
│   │   ├── calculations/            # (from src/lib/calculations.ts) - Days supply calc
│   │   ├── reference-data/          # (from src/constants/) - Routes, frequencies, etc.
│   │   ├── static-data/             # (from src/data/) - medications.json
│   │   └── unit-conversion/         # (from src/lib/units/) - UCUM wrapper, conversions
│   ├── 🏥 clinical-compliance/       # Healthcare standards and safety
│   │   ├── guardrails/              # (from src/guardrails/) - Clinical validation
│   │   ├── confidence-scoring/      # (from src/lib/confidence/) - Quality assessment
│   │   ├── tracing/                 # (from src/lib/tracing/) - Audit trails
│   │   └── temporal/                # (from src/lib/temporal/) - FHIR timing
│   └── 🔧 utilities/                # Supporting functions
│       ├── functional/              # (from src/lib/functional/) - Functional helpers
│       ├── converters/              # (from src/lib/converters/) - Data conversion
│       └── error-handling/          # (from src/utils/) - Error logging
│
├── 🖥️ user-interface/               # Everything users see and interact with
│   ├── 📱 app-shell/                # Main application structure
│   │   ├── App.tsx                  # (from src/components/) - Main app
│   │   ├── main.tsx                 # (from src/) - App entry point
│   │   └── ErrorBoundary.tsx        # (from src/components/) - Error handling
│   ├── 📄 pages/                    # Main screens
│   │   ├── signature-builder/       # SignatureBuilder.tsx, SignatureResult.tsx
│   │   └── medication-manager/      # MedicationManager.tsx, MedicationTable.tsx
│   ├── 🧩 components/               # Reusable components
│   │   ├── medication/              # MedicationControls.tsx, RouteSelector.tsx
│   │   ├── shared/                  # ConnectionStatus.tsx, FHIRStructureViewer.tsx
│   │   ├── branding/                # MarekLogo.tsx
│   │   └── ui/                      # (from src/components/ui/) - Design system
│   ├── 🎣 hooks/                    # (from src/hooks/) - React hooks
│   └── 🎨 styling/                  # Visual design
│       ├── index.css                # (from src/) - Global styles
│       └── assets/                  # Images, icons (if any)
│
├── 🔗 system-infrastructure/         # How the app connects and runs
│   ├── 🗄️ database/                 # Data storage and management
│   │   ├── schema/                  # (from supabase/) - Database structure
│   │   ├── migrations/              # (from supabase/migrations/) - DB changes
│   │   └── scripts/                 # (from scripts/) - DB management scripts
│   ├── 🌐 api-connections/          # External integrations
│   │   ├── supabase/                # (from src/api/) - Database API
│   │   └── conversions/             # (from src/api/) - Unit conversion API
│   ├── ⚡ performance/              # Speed monitoring and testing
│   │   ├── load-testing/            # (from performance/) - Artillery configs
│   │   ├── monitoring/              # (from scripts/) - performance-gates.js
│   │   └── artillery-scenarios/     # artillery-scenarios.js, artillery.config.yml
│   └── 🚀 build-and-deploy/         # App configuration
│       ├── vite.config.ts           # Build configuration
│       ├── package.json             # Dependencies and scripts
│       ├── tsconfig files           # TypeScript configuration
│       ├── tailwind.config.js       # Styling configuration
│       ├── jest.config.js           # Testing configuration
│       └── start-dev.cjs            # Development server
│
├── 🧪 testing-and-validation/       # All testing and quality assurance
│   ├── 👩‍⚕️ clinical-testing/        # Healthcare validation
│   │   ├── golden-master/           # (from src/test/golden-master/) - Clinical approval
│   │   ├── test-data/               # (from src/test/data/) - Clinical scenarios
│   │   ├── matchers/                # (from src/test/matchers/) - Clinical matchers
│   │   └── fhir-compliance/         # (from src/test/) - FHIR compliance tests
│   ├── 🤖 automated-testing/        # All __tests__ directories from throughout src/
│   │   ├── unit-tests/              # Individual component tests
│   │   ├── integration-tests/       # System workflow tests  
│   │   └── test-utilities/          # (from src/test/utils/) - Testing helpers
│   └── 📊 test-results/             # Test outputs and coverage
│       └── coverage/                # (existing coverage/) - Test coverage reports
│
├── 📚 documentation/                # All project documentation
│   ├── 👤 user-focused/             # How to use the system
│   │   ├── medication-management/   # DEFAULT_SIGNATURE_SETTINGS.md, etc.
│   │   └── signature-building/      # FHIR_STRUCTURE_VIEWER.md, etc.
│   ├── 🔧 technical/                # How the system works
│   │   ├── architecture/            # Architecture.md, functional-architecture.md
│   │   ├── database/                # DatabaseMapping.md, DatabaseSetup.md
│   │   ├── api/                     # (from docs/api/) - API documentation
│   │   └── migrations/              # MIGRATION_GUIDE.md, FixPackageInfoColumn.md
│   ├── 🏥 clinical/                 # Healthcare-specific documentation
│   │   ├── compliance/              # FHIR-Packaging-Analysis.md
│   │   ├── workflows/               # guardrails-governance.md
│   │   └── examples/                # multi-ingredient-examples.md
│   ├── 🛠️ development/              # Developer information
│   │   ├── setup/                   # Setup and configuration guides
│   │   └── refactoring/             # (from docs/refactoring/) - Refactoring docs
│   └── 📖 reference/                # Quick lookup information
│       ├── medication-fields/       # medication-ui-fields.md
│       ├── dosage-constraints/      # DosageConstraints.md
│       ├── special-dispensers/      # TopiclickDispenser.md
│       └── route-system/            # ROUTE_SYSTEM_UPDATE.md
│
├── 🔬 research-and-prototypes/      # Experimental work
│   └── ucum-evaluation/             # (from prototypes/) - Unit conversion research
│       ├── evaluation-summary.md
│       ├── benchmark-results.json
│       └── src/                     # Complete evaluation implementation
│
└── 📋 project-management/           # Project information and metadata
    ├── README.md                    # Project overview
    ├── CHANGELOG.md                 # Version history
    ├── CLAUDE.md                    # AI context and instructions
    ├── NODE_VERSION_WARNING.md      # Environment notes
    └── DOCUMENTATION.md             # Documentation index
```

## 🔍 Navigation Guide: "Where Would I Look For..."

### **"What does this app actually do?"**
→ `📋 core-business-logic/`
- `signature-building/` - How medication signatures are built
- `medication-data/` - How medication information is managed
- `clinical-compliance/` - Healthcare standards and safety features

### **"How do users interact with it?"** 
→ `🖥️ user-interface/`
- `pages/` - Main application screens
- `components/` - Reusable UI elements
- `hooks/` - React state management
- `styling/` - Visual design

### **"How does it connect to external systems?"**
→ `🔗 system-infrastructure/`
- `database/` - Data storage and schema
- `api-connections/` - External service integrations
- `performance/` - Speed monitoring and optimization
- `build-and-deploy/` - Configuration and deployment

### **"How do we ensure quality and safety?"**
→ `🧪 testing-and-validation/`
- `clinical-testing/` - Healthcare professional validation
- `automated-testing/` - Computer-run test suites
- `test-results/` - Coverage reports and outputs

### **"How do I learn about or maintain this?"**
→ `📚 documentation/`
- `user-focused/` - How to use the system
- `technical/` - How the system works
- `clinical/` - Healthcare-specific information
- `development/` - Developer setup and processes
- `reference/` - Quick lookup information

### **"What experimental work has been done?"**
→ `🔬 research-and-prototypes/`
- `ucum-evaluation/` - Unit conversion library research

### **"What's the project status and overview?"**
→ `📋 project-management/`
- Project documentation, changelogs, and meta-information

## ✅ Benefits of This Organization

1. **Intuitive Navigation**: Easy to find what you need based on your goal
2. **Clear Boundaries**: Obvious where any file belongs
3. **Scalable**: Easy to add new files to appropriate categories
4. **User-Friendly**: Matches how people think about the system
5. **Maintainable**: Clear separation of concerns
6. **Based on Reality**: Uses only existing files and directories

## 🚀 Implementation Notes

- This is a **reorganization proposal** - no code changes required
- All file paths reference existing files in the current structure
- The reorganization focuses purely on **logical grouping** for clarity
- Maintains all existing functionality while improving discoverability
- Can be implemented gradually or all at once

## 🔄 Safe Implementation Strategy

### **📊 Risk Analysis**

This reorganization affects a complex TypeScript/React project with extensive interdependencies:

**🚨 Critical Dependencies Identified:**
- **vite.config.ts**: Direct import `./src/api/server` + path alias `@: ./src`
- **jest.config.js**: Multiple hardcoded `src/` references (roots, setup, coverage thresholds)  
- **tsconfig.json**: Path mapping `@/*: ["./src/*"]` + include `["src"]`
- **Import patterns**: Extensive relative imports throughout codebase (`../types/index`, `./ui/button`)

### **✅ RECOMMENDED APPROACH: 5-Phase Migration with Path Aliasing Bridge**

This strategy transforms a high-risk operation into low-risk, verifiable steps.

#### **Phase 1: Comprehensive Path Alias Setup (Day 1)**
**Goal**: Create safety bridge before any file moves

1. **Update `tsconfig.json` paths section:**
```json
"paths": {
  "@/*": ["./src/*"],
  "@core-business-logic/*": ["./src/lib/*"],
  "@core-business-logic/signature-building/*": ["./src/lib/*"],
  "@core-business-logic/medication-data/types/*": ["./src/types/*"],
  "@core-business-logic/medication-data/reference-data/*": ["./src/constants/*"],
  "@core-business-logic/medication-data/static-data/*": ["./src/data/*"],
  "@core-business-logic/clinical-compliance/guardrails/*": ["./src/guardrails/*"],
  "@core-business-logic/utilities/error-handling/*": ["./src/utils/*"],
  "@user-interface/app-shell/*": ["./src/*"],
  "@user-interface/components/*": ["./src/components/*"],
  "@user-interface/hooks/*": ["./src/hooks/*"],
  "@user-interface/styling/*": ["./src/*"],
  "@system-infrastructure/api-connections/*": ["./src/api/*"],
  "@testing/clinical-testing/*": ["./src/test/*"]
}
```

2. **Update `vite.config.ts` resolve.alias:**
```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
    '@core-business-logic': path.resolve(__dirname, './src/lib'),
    '@user-interface': path.resolve(__dirname, './src/components'),
    '@system-infrastructure': path.resolve(__dirname, './src/api'),
    '@testing': path.resolve(__dirname, './src/test'),
    // ... complete alias mapping
  },
}
```

**✅ Phase 1 Verification Checklist:**
```bash
# 1. TypeScript compilation check
npm run typecheck
# Expected: No new TypeScript errors

# 2. Build process check  
npm run build
# Expected: Successful build, no new errors

# 3. Test suite check
npm run test
# Expected: All existing tests pass, same pass/fail count as before

# 4. Lint check
npm run lint  
# Expected: No new linting errors

# 5. Dev server check
npm run dev
# Expected: Server starts successfully, app loads in browser

# 6. Verify aliases work (optional test)
# Create temporary test file to verify path aliases resolve correctly
echo 'import { Medication } from "@core-business-logic/medication-data/types";' > temp-alias-test.ts
npx tsc --noEmit temp-alias-test.ts
rm temp-alias-test.ts
# Expected: No TypeScript errors
```

**🚨 Phase 1 Failure Indicators:**
- New TypeScript errors about path resolution
- Build failures related to module resolution
- Tests failing due to import issues
- Dev server failing to start

#### **Phase 2: Convert Imports to Aliases (Days 2-4)**
**Goal**: Decouple all imports from physical file locations

**Systematic conversion of import statements:**
```typescript
// Before: import { Medication } from '../types/index'
// After:  import { Medication } from '@core-business-logic/medication-data/types'

// Before: import { Button } from './ui/button'  
// After:  import { Button } from '@user-interface/components/ui/button'

// Before: import { useMedications } from '../hooks/useMedications'
// After:  import { useMedications } from '@user-interface/hooks/useMedications'
```

**File-by-file approach:**
1. Start with leaf nodes (files with no imports from project)
2. Work up dependency tree
3. Test each file individually: `npm run typecheck`

**✅ Phase 2 Verification Strategy:**

**Per-File Testing (After Each Import Conversion):**
```bash
# 1. TypeScript check for specific file
npx tsc --noEmit [filename].tsx
# Expected: No TypeScript errors for that file

# 2. Quick build check (catches import errors fast)
npm run typecheck
# Expected: No new errors, file compiles successfully

# 3. If file has tests, run specific test
npm run test -- --testPathPattern=[filename]
# Expected: All tests for that file still pass
```

**Batch Testing (After Converting 5-10 files):**
```bash
# 1. Full TypeScript compilation
npm run typecheck
# Expected: No TypeScript errors

# 2. Build verification  
npm run build
# Expected: Successful build

# 3. Test suite verification
npm run test
# Expected: Same test results as Phase 1

# 4. Runtime verification (quick check)
npm run dev
# Open app in browser, click through main features
# Expected: No console errors, app functions normally
```

**End-of-Phase 2 Verification:**
```bash
# 1. Complete test suite
npm run test:coverage
# Expected: Same or better coverage, all tests pass

# 2. Performance test (if applicable)
npm run test:performance
# Expected: Performance tests pass

# 3. Golden master test
npm run test:golden
# Expected: All golden master tests pass

# 4. Lint check
npm run lint
# Expected: No new linting errors

# 5. Full functional test
npm run dev
# Test complete user workflows:
# - Load medication list
# - Create new medication  
# - Generate signature
# - Edit medication
# Expected: All functionality works without errors
```

**🚨 Phase 2 Failure Indicators:**
- Import resolution errors in TypeScript
- Build failures due to missing modules
- Test failures from broken imports
- Runtime errors in browser console
- App features not working (buttons, forms, etc.)

#### **Phase 3: Physical Directory Migration (Days 5-6)**
**Goal**: Move directories while preserving git history

**Create new directory structure:**
```bash
mkdir -p core-business-logic/signature-building
mkdir -p core-business-logic/medication-data/{types,reference-data,static-data,unit-conversion}
mkdir -p core-business-logic/clinical-compliance/{guardrails,confidence-scoring,tracing,temporal}
mkdir -p core-business-logic/utilities/{functional,converters,error-handling}
mkdir -p user-interface/{app-shell,pages,components,hooks,styling}
mkdir -p system-infrastructure/{database,api-connections,performance,build-and-deploy}
mkdir -p testing-and-validation/{clinical-testing,automated-testing,test-results}
```

**Move files with git history preservation:**
```bash
# Core business logic
git mv src/lib/builders core-business-logic/signature-building/
git mv src/lib/strategies core-business-logic/signature-building/
git mv src/lib/templates core-business-logic/signature-building/
git mv src/lib/dispatcher core-business-logic/signature-building/
git mv src/lib/registry core-business-logic/signature-building/
git mv src/lib/signature core-business-logic/signature-building/

git mv src/types core-business-logic/medication-data/types
git mv src/constants core-business-logic/medication-data/reference-data
git mv src/data core-business-logic/medication-data/static-data
git mv src/lib/units core-business-logic/medication-data/unit-conversion
git mv src/lib/calculations.ts core-business-logic/medication-data/

git mv src/guardrails core-business-logic/clinical-compliance/guardrails
git mv src/lib/confidence core-business-logic/clinical-compliance/confidence-scoring
git mv src/lib/tracing core-business-logic/clinical-compliance/tracing
git mv src/lib/temporal core-business-logic/clinical-compliance/temporal

git mv src/lib/functional core-business-logic/utilities/functional
git mv src/lib/converters core-business-logic/utilities/converters
git mv src/utils core-business-logic/utilities/error-handling

# User interface  
git mv src/main.tsx user-interface/app-shell/
git mv src/components/App.tsx user-interface/app-shell/
git mv src/components/ErrorBoundary.tsx user-interface/app-shell/

git mv src/components/SignatureBuilder.tsx user-interface/pages/signature-builder/
git mv src/components/SignatureResult.tsx user-interface/pages/signature-builder/
git mv src/components/MedicationManager.tsx user-interface/pages/medication-manager/
git mv src/components/MedicationTable.tsx user-interface/pages/medication-manager/

git mv src/components user-interface/components
git mv src/hooks user-interface/hooks
git mv src/index.css user-interface/styling/

# System infrastructure
git mv src/api system-infrastructure/api-connections/supabase
git mv scripts system-infrastructure/database/scripts
git mv supabase system-infrastructure/database/schema
git mv performance system-infrastructure/performance/load-testing

# Testing
git mv src/test testing-and-validation/clinical-testing
git mv coverage testing-and-validation/test-results/coverage
```

**Update path aliases after each major move:**
```json
"@core-business-logic/signature-building/*": ["./core-business-logic/signature-building/*"]
```

**✅ Phase 3 Verification Strategy:**

**Pre-Move Safety Check:**
```bash
# 1. Commit all changes from Phase 2
git add -A
git commit -m "Phase 2 complete: All imports converted to aliases"

# 2. Create backup branch
git checkout -b backup-before-phase3
git checkout simplify-refact-epic3-framework

# 3. Document current test baseline
npm run test:coverage > phase3-baseline-tests.log
npm run typecheck > phase3-baseline-typecheck.log
```

**After Each Major Directory Move (e.g., after moving all src/lib/*):**
```bash
# 1. Update corresponding path aliases immediately
# Edit tsconfig.json and vite.config.ts to point to new locations

# 2. Quick TypeScript check
npm run typecheck
# Expected: No new TypeScript errors

# 3. Quick build test
npm run build
# Expected: Successful build

# 4. If any errors, stop and debug before continuing
```

**After Each Complete Section (Core Business Logic, User Interface, etc.):**
```bash
# 1. Full compilation check
npm run typecheck
# Expected: No TypeScript errors

# 2. Build verification
npm run build
# Expected: Clean build

# 3. Test suite verification  
npm run test
# Expected: All tests pass (same count as baseline)

# 4. Git status check
git status
# Expected: Shows moved files, no unexpected changes

# 5. Git history verification (spot check)
git log --follow core-business-logic/signature-building/builders/SimpleTabletBuilder.ts
# Expected: Shows full history from original src/lib/builders/ location
```

**End-of-Phase 3 Complete Verification:**
```bash
# 1. Full test suite
npm run test:coverage
# Expected: Same results as phase3-baseline-tests.log

# 2. All npm scripts test
npm run typecheck && \
npm run lint && \
npm run build && \
npm run test:golden && \
npm run test:performance
# Expected: All pass

# 3. Directory structure verification
ls -la core-business-logic/
ls -la user-interface/
ls -la system-infrastructure/
ls -la testing-and-validation/
# Expected: All directories exist with expected subdirectories

# 4. Git history spot checks
git log --follow --oneline core-business-logic/medication-data/types/MedicationProfile.ts
git log --follow --oneline user-interface/components/ui/button.tsx
# Expected: Full history preserved

# 5. Functional app test
npm run dev
# Complete user workflow test:
# - App loads without console errors
# - Can navigate between medication manager and signature builder
# - Can create/edit medications
# - Can generate signatures
# - All UI components render correctly
# Expected: Full functionality preserved
```

**🚨 Phase 3 Critical Failure Indicators:**
- TypeScript cannot resolve modules after path alias updates
- Build process fails to find moved files
- Tests fail with module resolution errors
- Git history lost (files show as new instead of moved)
- Missing directories or files after moves
- Application fails to start or load

**Phase 3 Recovery Procedure (if needed):**
```bash
# If critical failures occur:
git checkout backup-before-phase3
# Analyze what went wrong, fix path aliases, retry specific moves
```

#### **Phase 4: Configuration File Updates (Day 7)**
**Goal**: Update all build and test configurations

1. **Update `vite.config.ts`:**
```typescript
import { apiPlugin } from './system-infrastructure/api-connections/supabase/server';
// Update all path references
```

2. **Update `jest.config.js`:**
```javascript
roots: ['<rootDir>/core-business-logic', '<rootDir>/user-interface', '<rootDir>/testing-and-validation'],
setupFilesAfterEnv: ['<rootDir>/testing-and-validation/clinical-testing/setup.ts'],
collectCoverageFrom: [
  'core-business-logic/**/*.{ts,tsx}',
  'user-interface/**/*.{ts,tsx}',
  '!user-interface/app-shell/main.tsx'
],
coverageThreshold: {
  './core-business-logic/medication-data/types/**': {
    branches: 100, functions: 100, lines: 100, statements: 100
  }
}
```

3. **Update `package.json` scripts:**
```json
"setup-db": "node system-infrastructure/database/scripts/setup-database.js",
"perf:gates": "node system-infrastructure/performance/monitoring/performance-gates.js"
```

**✅ Phase 4 Verification Strategy:**

**After Each Configuration File Update:**
```bash
# After updating vite.config.ts:
npm run build
# Expected: Build succeeds with new import path

npm run dev
# Expected: Dev server starts, API plugin loads correctly

# After updating jest.config.js:
npm run test
# Expected: All tests discovered and pass with new paths

npm run test:coverage
# Expected: Coverage collection works with new file locations

# After updating package.json scripts:
npm run setup-db
npm run verify-migration
npm run check-supabase
# Expected: Database scripts work with new paths
```

**Complete npm Script Verification (All 34 Scripts):**
```bash
# Test every script systematically
echo "Testing all npm scripts..."

# Core development scripts
npm run typecheck && echo "✅ typecheck" || echo "❌ typecheck"
npm run lint && echo "✅ lint" || echo "❌ lint"  
npm run build && echo "✅ build" || echo "❌ build"

# Test scripts
npm run test && echo "✅ test" || echo "❌ test"
npm run test:coverage && echo "✅ test:coverage" || echo "❌ test:coverage"
npm run test:golden && echo "✅ test:golden" || echo "❌ test:golden"
npm run test:performance && echo "✅ test:performance" || echo "❌ test:performance"

# Database scripts  
npm run setup-db && echo "✅ setup-db" || echo "❌ setup-db"
npm run verify-migration && echo "✅ verify-migration" || echo "❌ verify-migration"
npm run check-supabase && echo "✅ check-supabase" || echo "❌ check-supabase"

# Performance scripts (requires artillery installed)
npm run perf:gates && echo "✅ perf:gates" || echo "❌ perf:gates"
npm run perf:gates:jest && echo "✅ perf:gates:jest" || echo "❌ perf:gates:jest"

# Artillery scripts (if artillery installed globally)
# npm run artillery:load && echo "✅ artillery:load" || echo "❌ artillery:load"

# Development scripts
npm run dev & DEV_PID=$!
sleep 5
curl -f http://localhost:5173 && echo "✅ dev server" || echo "❌ dev server"
kill $DEV_PID

echo "✅ All critical npm scripts verified"
```

**Configuration File Syntax Verification:**
```bash
# 1. TypeScript config validation
npx tsc --showConfig
# Expected: Valid JSON output, no syntax errors

# 2. Jest config validation  
npx jest --showConfig
# Expected: Valid configuration object

# 3. Vite config validation
npx vite --help
# Expected: No config parsing errors

# 4. Package.json validation
npm run --silent
# Expected: Lists all scripts without syntax errors
```

**Critical Path Testing:**
```bash
# 1. End-to-end build pipeline
npm run typecheck && npm run lint && npm run build && npm run test
# Expected: Complete pipeline passes

# 2. Performance monitoring works
npm run benchmark
# Expected: Performance tests and artillery tests complete

# 3. Database operations work
npm run setup-db && npm run verify-migration
# Expected: Database scripts find and execute correctly

# 4. Coverage thresholds work
npm run test:coverage
# Check that coverage thresholds in jest.config.js are applied correctly
# Expected: Coverage reports generated for new file locations
```

**🚨 Phase 4 Critical Failure Indicators:**
- npm scripts fail with "file not found" errors
- Build configuration cannot find imported modules
- Test configuration cannot discover test files
- Coverage collection fails or reports wrong files
- Dev server fails to start due to config errors
- Performance gates cannot find monitoring scripts

**Phase 4 Recovery Checklist:**
```bash
# If scripts fail, verify these paths exist:
ls -la system-infrastructure/api-connections/supabase/server.ts
ls -la testing-and-validation/clinical-testing/setup.ts
ls -la system-infrastructure/database/scripts/
ls -la system-infrastructure/performance/monitoring/performance-gates.js

# Check configuration syntax:
node -c vite.config.ts
node -c jest.config.js
npm run --silent > /dev/null
```

#### **Phase 5: Final Verification & Cleanup (Day 8)**
**Goal**: Comprehensive testing and optional cleanup

**✅ Phase 5 Complete Verification Protocol:**

**1. Comprehensive Automated Testing:**
```bash
# Create final verification script
cat > final-verification.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Phase 5 Final Verification..."

# Track results
PASSED=0
FAILED=0

run_test() {
    echo "Testing: $1"
    if $2; then
        echo "✅ PASS: $1"
        ((PASSED++))
    else
        echo "❌ FAIL: $1"
        ((FAILED++))
    fi
    echo ""
}

# Core build pipeline
run_test "TypeScript compilation" "npm run typecheck"
run_test "Linting" "npm run lint"
run_test "Build process" "npm run build"
run_test "Test suite" "npm run test"
run_test "Test coverage" "npm run test:coverage"

# Specialized tests
run_test "Golden master tests" "npm run test:golden"
run_test "Performance tests" "npm run test:performance"

# Database operations
run_test "Database setup" "npm run setup-db"
run_test "Migration verification" "npm run verify-migration"
run_test "Supabase connection" "npm run check-supabase"

# Performance monitoring
run_test "Performance gates (Jest)" "npm run perf:gates:jest"
run_test "Benchmark suite" "npm run benchmark"

# Development server
echo "Testing development server..."
npm run dev & DEV_PID=$!
sleep 10
if curl -f http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ PASS: Development server"
    ((PASSED++))
else
    echo "❌ FAIL: Development server"
    ((FAILED++))
fi
kill $DEV_PID 2>/dev/null
echo ""

echo "📊 FINAL RESULTS:"
echo "✅ Passed: $PASSED"
echo "❌ Failed: $FAILED"

if [ $FAILED -eq 0 ]; then
    echo "🎉 ALL TESTS PASSED - REORGANIZATION SUCCESSFUL!"
    exit 0
else
    echo "⚠️  Some tests failed - investigate before proceeding"
    exit 1
fi
EOF

chmod +x final-verification.sh
./final-verification.sh
```

**2. Manual Functional Testing Checklist:**
```bash
# Start dev server for manual testing
npm run dev

# Open http://localhost:5173 and test:
```

**Manual Test Scenarios:**
- [ ] **App Loads**: No console errors, clean load
- [ ] **Navigation**: Can switch between Signature Builder and Medication Manager
- [ ] **Medication List**: Medications load and display correctly
- [ ] **Create Medication**: Form opens, can fill fields, save works
- [ ] **Edit Medication**: Can select medication, edit form opens, changes save
- [ ] **Delete Medication**: Delete functionality works, confirmation dialog appears
- [ ] **Signature Building**: Can select medication, configure dose/frequency/route
- [ ] **Signature Generation**: Signature generates correctly and displays
- [ ] **Days Supply**: Days supply calculates correctly for different medications
- [ ] **Special Dispensers**: Topiclick and other special dispensers work
- [ ] **Form Validation**: Required fields are validated, error messages show
- [ ] **Search/Filter**: If present, search and filter functionality works
- [ ] **Responsive Design**: UI works properly at different screen sizes

**3. Performance Verification:**
```bash
# Performance baseline check
echo "🏃‍♂️ Performance Verification..."

# Check build performance
time npm run build
# Expected: Build completes in reasonable time (< 2 minutes)

# Check test performance  
time npm run test
# Expected: Tests complete in reasonable time

# Check bundle size
npm run build
ls -lh dist/assets/
# Expected: Bundle sizes similar to before reorganization

# If artillery is available
if command -v artillery &> /dev/null; then
    npm run artillery:quick
    # Expected: Basic load test passes
fi
```

**4. Git History Verification:**
```bash
# Verify git history preserved for key files
echo "📚 Git History Verification..."

echo "Checking git history for moved files..."
git log --follow --oneline core-business-logic/signature-building/builders/SimpleTabletBuilder.ts | head -5
git log --follow --oneline user-interface/components/ui/button.tsx | head -5  
git log --follow --oneline core-business-logic/medication-data/types/MedicationProfile.ts | head -5

# Expected: Each should show history from original locations
```

**5. Documentation Verification:**
```bash
# Check that documentation still references correct paths
echo "📖 Documentation Verification..."

# Check if any docs reference old paths (should be minimal)
grep -r "src/lib" docs/ || echo "No old src/lib references found ✅"
grep -r "src/components" docs/ || echo "No old src/components references found ✅"
grep -r "src/types" docs/ || echo "No old src/types references found ✅"

# Update CLAUDE.md to reflect new structure
echo "📝 Update CLAUDE.md with new directory structure"
```

**6. Final Cleanup (Optional):**
```bash
# Remove temporary files
rm -f phase3-baseline-tests.log
rm -f phase3-baseline-typecheck.log
rm -f final-verification.sh

# Optimize path aliases (optional)
echo "Consider consolidating these path aliases for cleaner imports:"
echo "- Combine similar aliases"
echo "- Remove unused aliases"
echo "- Create shorter aliases for frequently used paths"

# Remove any empty directories
find . -type d -empty -delete
```

**7. Final Commit:**
```bash
# Create final commit for reorganization
git add -A
git commit -m "Complete: Phase 5 verification and cleanup

- All 34 npm scripts verified working
- Complete test suite passes
- Manual functional testing completed  
- Git history preserved for all moved files
- Performance verified stable
- Directory reorganization successfully completed

✅ Project reorganized with crystal clear logical structure"
```

**🚨 Phase 5 Success Criteria:**
- [ ] All automated tests pass (final-verification.sh exits 0)
- [ ] All manual test scenarios completed successfully
- [ ] No console errors in browser during functional testing
- [ ] Build performance maintained or improved
- [ ] Git history preserved for all moved files
- [ ] All 34 npm scripts work correctly
- [ ] Documentation updated to reflect new structure

**Phase 5 Failure Recovery:**
If any critical failures are discovered:
```bash
# Emergency rollback to backup
git checkout backup-before-phase3
# Or selective fixes for specific issues
# Document what failed and create fix plan
```

### **🛡️ Risk Mitigation & Rollback**

**Per-Phase Rollback:**
- **Phase 1**: Remove added aliases, revert config files
- **Phase 2**: Revert import statements to original relative paths
- **Phase 3**: Use `git mv` in reverse to restore original structure
- **Phase 4**: Revert configuration file changes
- **Phase 5**: No rollback needed (verification only)

**Emergency Rollback:**
```bash
git reset --hard <commit-before-reorganization>
```

**Safety Features:**
- Each phase is independently verifiable
- Git history preserved throughout
- Incremental testing prevents cascade failures
- Path aliases provide safety bridge during moves

### **⚠️ Alternative Approaches (NOT Recommended)**

- **Fresh Branch Approach**: Loses git history, breaks blame/log functionality
- **All-at-Once Move**: Too many variables, difficult to debug failures  
- **Manual Find/Replace**: Error-prone, misses complex import relationships

### **📝 Current Status**

This is a **proposal document** with complete implementation strategy. The current file structure remains unchanged until this reorganization is approved and executed using the phased approach above.