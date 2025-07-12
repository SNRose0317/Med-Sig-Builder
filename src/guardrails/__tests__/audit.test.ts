import { GuardrailsAuditTrail, GuardrailAuditEntry, generateMarkdownReport } from '../audit';
import { GuardrailsSchema } from '../types';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
jest.mock('fs');

describe('GuardrailsAuditTrail', () => {
  let auditTrail: GuardrailsAuditTrail;
  const mockAuditLogPath = '/tmp/test-audit.json';
  
  beforeEach(() => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    auditTrail = new GuardrailsAuditTrail(mockAuditLogPath);
  });

  describe('logChange', () => {
    it('should log a change entry', () => {
      const context = {
        version: '1.1.0',
        requestor: {
          name: 'Dr. Smith',
          email: 'dr.smith@hospital.org',
          role: 'Clinical Pharmacist'
        },
        approvers: {
          clinical: {
            name: 'Dr. Johnson',
            credentials: 'MD License #12345',
            approvalDate: '2024-01-15'
          },
          technical: {
            name: 'Sarah Chen',
            role: 'Senior Developer',
            approvalDate: '2024-01-15'
          }
        },
        justification: 'Updated per new FDA guidelines',
        changeRequestId: 'GCR-2024-001'
      };

      const entry = auditTrail.logChange(
        'UPDATE',
        'medications.metformin.maxDailyDose.value',
        2000,
        2550,
        context
      );

      expect(entry).toMatchObject({
        changeType: 'UPDATE',
        path: 'medications.metformin.maxDailyDose.value',
        previousValue: 2000,
        newValue: 2550,
        version: '1.1.0',
        requestor: context.requestor,
        approvers: context.approvers,
        justification: context.justification,
        changeRequestId: context.changeRequestId
      });

      expect(entry.id).toMatch(/^AUDIT-\d+-\w+$/);
      expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should save audit log to file', () => {
      const context = {
        version: '1.1.0',
        requestor: {
          name: 'Dr. Smith',
          email: 'dr.smith@hospital.org',
          role: 'Clinical Pharmacist'
        },
        approvers: {
          clinical: {
            name: 'Dr. Johnson',
            credentials: 'MD',
            approvalDate: '2024-01-15'
          },
          technical: {
            name: 'Sarah Chen',
            role: 'Senior Developer',
            approvalDate: '2024-01-15'
          }
        },
        justification: 'Test change',
        changeRequestId: 'TEST-001'
      };

      auditTrail.logChange('CREATE', 'test.path', null, 'value', context);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        mockAuditLogPath,
        expect.any(String),
        'utf8'
      );
    });
  });

  describe('compareAndLogChanges', () => {
    it('should detect and log additions', () => {
      const previousSchema = {
        version: '1.0.0',
        medications: {
          metformin: {
            maxDailyDose: { value: 2000, unit: 'mg' }
          }
        }
      } as any;

      const newSchema = {
        version: '1.1.0',
        medications: {
          metformin: {
            maxDailyDose: { value: 2000, unit: 'mg' },
            minSingleDose: { value: 500, unit: 'mg' }
          }
        }
      } as any;

      const context = {
        requestor: {
          name: 'Dr. Smith',
          email: 'dr.smith@hospital.org',
          role: 'Clinical Pharmacist'
        },
        approvers: {
          clinical: {
            name: 'Dr. Johnson',
            credentials: 'MD',
            approvalDate: '2024-01-15'
          },
          technical: {
            name: 'Sarah Chen',
            role: 'Senior Developer',
            approvalDate: '2024-01-15'
          }
        },
        justification: 'Added minimum dose constraint',
        changeRequestId: 'GCR-2024-002'
      };

      const changes = auditTrail.compareAndLogChanges(
        previousSchema,
        newSchema,
        context
      );

      expect(changes.length).toBeGreaterThan(0);
      const minDoseChange = changes.find(c => c.path === 'medications.metformin.minSingleDose');
      expect(minDoseChange).toBeDefined();
      expect(minDoseChange).toMatchObject({
        changeType: 'CREATE',
        path: 'medications.metformin.minSingleDose',
        previousValue: null,
        newValue: { value: 500, unit: 'mg' }
      });
    });

    it('should detect and log updates', () => {
      const previousSchema = {
        version: '1.0.0',
        medications: {
          metformin: {
            maxDailyDose: { value: 2000, unit: 'mg' }
          }
        }
      } as any;

      const newSchema = {
        version: '1.1.0',
        medications: {
          metformin: {
            maxDailyDose: { value: 2550, unit: 'mg' }
          }
        }
      } as any;

      const context = {
        requestor: {
          name: 'Dr. Smith',
          email: 'dr.smith@hospital.org',
          role: 'Clinical Pharmacist'
        },
        approvers: {
          clinical: {
            name: 'Dr. Johnson',
            credentials: 'MD',
            approvalDate: '2024-01-15'
          },
          technical: {
            name: 'Sarah Chen',
            role: 'Senior Developer',
            approvalDate: '2024-01-15'
          }
        },
        justification: 'Updated max dose',
        changeRequestId: 'GCR-2024-003'
      };

      const changes = auditTrail.compareAndLogChanges(
        previousSchema,
        newSchema,
        context
      );

      expect(changes.length).toBeGreaterThan(0);
      const maxDoseChange = changes.find(c => c.path.includes('maxDailyDose'));
      expect(maxDoseChange).toBeDefined();
    });

    it('should detect and log deletions', () => {
      const previousSchema = {
        version: '1.0.0',
        medications: {
          metformin: {
            maxDailyDose: { value: 2000, unit: 'mg' },
            minSingleDose: { value: 500, unit: 'mg' }
          }
        }
      } as any;

      const newSchema = {
        version: '1.1.0',
        medications: {
          metformin: {
            maxDailyDose: { value: 2000, unit: 'mg' }
          }
        }
      } as any;

      const context = {
        requestor: {
          name: 'Dr. Smith',
          email: 'dr.smith@hospital.org',
          role: 'Clinical Pharmacist'
        },
        approvers: {
          clinical: {
            name: 'Dr. Johnson',
            credentials: 'MD',
            approvalDate: '2024-01-15'
          },
          technical: {
            name: 'Sarah Chen',
            role: 'Senior Developer',
            approvalDate: '2024-01-15'
          }
        },
        justification: 'Removed minimum dose constraint',
        changeRequestId: 'GCR-2024-004'
      };

      const changes = auditTrail.compareAndLogChanges(
        previousSchema,
        newSchema,
        context
      );

      expect(changes.length).toBeGreaterThan(0);
      const deletionChange = changes.find(c => c.path === 'medications.metformin.minSingleDose');
      expect(deletionChange).toBeDefined();
      expect(deletionChange).toMatchObject({
        changeType: 'DELETE',
        path: 'medications.metformin.minSingleDose',
        previousValue: { value: 500, unit: 'mg' },
        newValue: null
      });
    });
  });

  describe('query', () => {
    beforeEach(() => {
      // Set up some test entries
      const context = {
        version: '1.0.0',
        requestor: {
          name: 'Dr. Smith',
          email: 'dr.smith@hospital.org',
          role: 'Clinical Pharmacist'
        },
        approvers: {
          clinical: {
            name: 'Dr. Johnson',
            credentials: 'MD',
            approvalDate: '2024-01-15'
          },
          technical: {
            name: 'Sarah Chen',
            role: 'Senior Developer',
            approvalDate: '2024-01-15'
          }
        },
        justification: 'Test',
        changeRequestId: 'TEST-001'
      };

      // Add multiple entries
      auditTrail.logChange('CREATE', 'medications.aspirin.maxDailyDose', null, { value: 4000, unit: 'mg' }, context);
      auditTrail.logChange('UPDATE', 'medications.metformin.maxDailyDose.value', 2000, 2550, context);
      auditTrail.logChange('DELETE', 'medications.ibuprofen.contraindications', ['test'], null, context);
    });

    it('should filter by path', () => {
      const results = auditTrail.query({ path: 'metformin' });
      expect(results).toHaveLength(1);
      expect(results[0].path).toContain('metformin');
    });

    it('should filter by change type', () => {
      const results = auditTrail.query({ changeType: 'CREATE' });
      expect(results).toHaveLength(1);
      expect(results[0].changeType).toBe('CREATE');
    });

    it('should filter by medication', () => {
      const results = auditTrail.query({ medication: 'aspirin' });
      expect(results).toHaveLength(1);
      expect(results[0].path).toContain('aspirin');
    });
  });

  describe('generateReport', () => {
    beforeEach(() => {
      const context = {
        version: '1.0.0',
        requestor: {
          name: 'Dr. Smith',
          email: 'dr.smith@hospital.org',
          role: 'Clinical Pharmacist'
        },
        approvers: {
          clinical: {
            name: 'Dr. Johnson',
            credentials: 'MD',
            approvalDate: '2024-01-15'
          },
          technical: {
            name: 'Sarah Chen',
            role: 'Senior Developer',
            approvalDate: '2024-01-15'
          }
        },
        justification: 'Test',
        changeRequestId: 'TEST-001'
      };

      auditTrail.logChange('CREATE', 'medications.aspirin.maxDailyDose', null, { value: 4000, unit: 'mg' }, context);
      auditTrail.logChange('UPDATE', 'medications.metformin.maxDailyDose.value', 2000, 2550, context);
    });

    it('should generate summary report', () => {
      const startDate = new Date(Date.now() - 86400000).toISOString(); // Yesterday
      const endDate = new Date(Date.now() + 86400000).toISOString(); // Tomorrow

      const report = auditTrail.generateReport(startDate, endDate);

      expect(report.summary.totalChanges).toBe(2);
      expect(report.summary.byType.CREATE).toBe(1);
      expect(report.summary.byType.UPDATE).toBe(1);
      expect(report.summary.byType.DELETE).toBe(0);
      expect(report.summary.byMedication.aspirin).toBe(1);
      expect(report.summary.byMedication.metformin).toBe(1);
      expect(report.entries).toHaveLength(2);
    });
  });

  describe('validateApprovals', () => {
    it('should validate complete approvals', () => {
      const validEntry: GuardrailAuditEntry = {
        id: 'TEST-001',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        changeType: 'UPDATE',
        path: 'test.path',
        previousValue: 1,
        newValue: 2,
        requestor: {
          name: 'Dr. Smith',
          email: 'dr.smith@hospital.org',
          role: 'Clinical Pharmacist'
        },
        approvers: {
          clinical: {
            name: 'Dr. Johnson',
            credentials: 'MD',
            approvalDate: '2024-01-15'
          },
          technical: {
            name: 'Sarah Chen',
            role: 'Senior Developer',
            approvalDate: '2024-01-15'
          }
        },
        justification: 'Valid justification',
        changeRequestId: 'GCR-001'
      };

      const result = auditTrail.validateApprovals([validEntry]);
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect missing approvals', () => {
      const invalidEntry: GuardrailAuditEntry = {
        id: 'TEST-002',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        changeType: 'UPDATE',
        path: 'test.path',
        previousValue: 1,
        newValue: 2,
        requestor: {
          name: 'Dr. Smith',
          email: 'dr.smith@hospital.org',
          role: 'Clinical Pharmacist'
        },
        approvers: {
          clinical: {
            name: '',
            credentials: '',
            approvalDate: ''
          },
          technical: {
            name: 'Sarah Chen',
            role: 'Senior Developer',
            approvalDate: '2024-01-15'
          }
        },
        justification: '',
        changeRequestId: ''
      };

      const result = auditTrail.validateApprovals([invalidEntry]);
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Entry TEST-002: Missing clinical approval');
      expect(result.issues).toContain('Entry TEST-002: Missing justification');
      expect(result.issues).toContain('Entry TEST-002: Missing change request ID');
    });
  });
});

describe('generateMarkdownReport', () => {
  it('should generate formatted markdown report', () => {
    const entries: GuardrailAuditEntry[] = [
      {
        id: 'AUDIT-001',
        timestamp: '2024-01-15T10:00:00Z',
        version: '1.1.0',
        changeType: 'UPDATE',
        path: 'medications.metformin.maxDailyDose.value',
        previousValue: 2000,
        newValue: 2550,
        requestor: {
          name: 'Dr. Smith',
          email: 'dr.smith@hospital.org',
          role: 'Clinical Pharmacist'
        },
        approvers: {
          clinical: {
            name: 'Dr. Johnson',
            credentials: 'MD License #12345',
            approvalDate: '2024-01-15'
          },
          technical: {
            name: 'Sarah Chen',
            role: 'Senior Developer',
            approvalDate: '2024-01-15'
          }
        },
        justification: 'Updated per new FDA guidelines for metformin maximum daily dose',
        changeRequestId: 'GCR-2024-001'
      }
    ];

    const report = generateMarkdownReport(entries, 'Test Report');

    expect(report).toContain('# Test Report');
    expect(report).toContain('Total Changes: 1');
    expect(report).toContain('| Date | Type | Path | Requestor | Justification |');
    expect(report).toContain('UPDATE');
    expect(report).toContain('medications.metformin.maxDailyDose.value');
    expect(report).toContain('Dr. Smith');
    expect(report).toContain('- **Previous Value**: `2000`');
    expect(report).toContain('- **New Value**: `2550`');
  });
});