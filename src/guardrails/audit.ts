/**
 * Clinical Guardrails Audit Trail System
 * 
 * Provides comprehensive tracking and logging of all changes to clinical
 * guardrails, ensuring full traceability for patient safety and compliance.
 * 
 * @since 2.0.0
 */

import { GuardrailsSchema } from './types';
import * as fs from 'fs';
import * as path from 'path';
import { parse, stringify } from 'yaml';

/**
 * Represents a single change to the guardrails
 */
export interface GuardrailAuditEntry {
  /** Unique identifier for this audit entry */
  id: string;
  
  /** ISO timestamp of when the change was made */
  timestamp: string;
  
  /** Version number after this change */
  version: string;
  
  /** Type of change made */
  changeType: 'CREATE' | 'UPDATE' | 'DELETE';
  
  /** Dot-notation path to the changed field */
  path: string;
  
  /** Previous value (null for CREATE) */
  previousValue: any;
  
  /** New value (null for DELETE) */
  newValue: any;
  
  /** Person who requested the change */
  requestor: {
    name: string;
    email: string;
    role: string;
  };
  
  /** Required approvers */
  approvers: {
    clinical: {
      name: string;
      credentials: string;
      approvalDate: string;
    };
    technical: {
      name: string;
      role: string;
      approvalDate: string;
    };
  };
  
  /** Clinical justification for the change */
  justification: string;
  
  /** Reference to change request ticket */
  changeRequestId: string;
  
  /** Optional metadata */
  metadata?: {
    gitCommit?: string;
    prNumber?: number;
    deploymentDate?: string;
    rollbackCommit?: string;
  };
}

/**
 * Audit trail manager for guardrails changes
 */
export class GuardrailsAuditTrail {
  private auditLogPath: string;
  private currentLog: GuardrailAuditEntry[] = [];

  constructor(auditLogPath?: string) {
    this.auditLogPath = auditLogPath || path.join(__dirname, 'audit-log.json');
    this.loadAuditLog();
  }

  /**
   * Load existing audit log from file
   */
  private loadAuditLog(): void {
    try {
      if (fs.existsSync(this.auditLogPath)) {
        const data = fs.readFileSync(this.auditLogPath, 'utf8');
        this.currentLog = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load audit log:', error);
      this.currentLog = [];
    }
  }

  /**
   * Save audit log to file
   */
  private saveAuditLog(): void {
    try {
      fs.writeFileSync(
        this.auditLogPath,
        JSON.stringify(this.currentLog, null, 2),
        'utf8'
      );
    } catch (error) {
      console.error('Failed to save audit log:', error);
      throw new Error('Audit log persistence failed');
    }
  }

  /**
   * Generate unique ID for audit entry
   */
  private generateId(): string {
    return `AUDIT-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get value at path in object using dot notation
   */
  private getValueAtPath(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Log a guardrails change
   */
  logChange(
    changeType: GuardrailAuditEntry['changeType'],
    path: string,
    previousValue: any,
    newValue: any,
    context: {
      version: string;
      requestor: GuardrailAuditEntry['requestor'];
      approvers: GuardrailAuditEntry['approvers'];
      justification: string;
      changeRequestId: string;
      metadata?: GuardrailAuditEntry['metadata'];
    }
  ): GuardrailAuditEntry {
    const entry: GuardrailAuditEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      version: context.version,
      changeType,
      path,
      previousValue,
      newValue,
      requestor: context.requestor,
      approvers: context.approvers,
      justification: context.justification,
      changeRequestId: context.changeRequestId,
      metadata: context.metadata
    };

    this.currentLog.push(entry);
    this.saveAuditLog();

    return entry;
  }

  /**
   * Compare two versions of the schema and log all changes
   */
  compareAndLogChanges(
    previousSchema: GuardrailsSchema,
    newSchema: GuardrailsSchema,
    context: Omit<Parameters<typeof this.logChange>[4], 'version'>
  ): GuardrailAuditEntry[] {
    const changes: GuardrailAuditEntry[] = [];
    const version = newSchema.version;

    // Deep comparison function
    const compareObjects = (
      prev: any,
      curr: any,
      basePath: string = ''
    ): void => {
      // Check for deletions
      if (prev && typeof prev === 'object') {
        for (const key in prev) {
          const fullPath = basePath ? `${basePath}.${key}` : key;
          if (!(key in curr)) {
            changes.push(
              this.logChange('DELETE', fullPath, prev[key], null, {
                ...context,
                version
              })
            );
          }
        }
      }

      // Check for additions and updates
      if (curr && typeof curr === 'object') {
        for (const key in curr) {
          const fullPath = basePath ? `${basePath}.${key}` : key;
          
          if (!(key in prev)) {
            // Addition
            changes.push(
              this.logChange('CREATE', fullPath, null, curr[key], {
                ...context,
                version
              })
            );
          } else if (JSON.stringify(prev[key]) !== JSON.stringify(curr[key])) {
            if (typeof curr[key] === 'object' && !Array.isArray(curr[key])) {
              // Recurse into nested objects
              compareObjects(prev[key], curr[key], fullPath);
            } else {
              // Update
              changes.push(
                this.logChange('UPDATE', fullPath, prev[key], curr[key], {
                  ...context,
                  version
                })
              );
            }
          }
        }
      }
    };

    compareObjects(previousSchema, newSchema);
    return changes;
  }

  /**
   * Query audit log
   */
  query(filters: {
    startDate?: string;
    endDate?: string;
    path?: string;
    changeType?: GuardrailAuditEntry['changeType'];
    requestor?: string;
    medication?: string;
  }): GuardrailAuditEntry[] {
    return this.currentLog.filter(entry => {
      if (filters.startDate && entry.timestamp < filters.startDate) return false;
      if (filters.endDate && entry.timestamp > filters.endDate) return false;
      if (filters.path && !entry.path.includes(filters.path)) return false;
      if (filters.changeType && entry.changeType !== filters.changeType) return false;
      if (filters.requestor && !entry.requestor.email.includes(filters.requestor)) return false;
      if (filters.medication && !entry.path.includes(filters.medication)) return false;
      return true;
    });
  }

  /**
   * Get audit trail for a specific medication
   */
  getMedicationHistory(medicationName: string): GuardrailAuditEntry[] {
    return this.query({ medication: medicationName });
  }

  /**
   * Generate audit report
   */
  generateReport(
    startDate: string,
    endDate: string
  ): {
    summary: {
      totalChanges: number;
      byType: Record<GuardrailAuditEntry['changeType'], number>;
      byMedication: Record<string, number>;
      byRequestor: Record<string, number>;
    };
    entries: GuardrailAuditEntry[];
  } {
    const entries = this.query({ startDate, endDate });
    
    const summary = {
      totalChanges: entries.length,
      byType: {
        CREATE: 0,
        UPDATE: 0,
        DELETE: 0
      },
      byMedication: {} as Record<string, number>,
      byRequestor: {} as Record<string, number>
    };

    entries.forEach(entry => {
      // Count by type
      summary.byType[entry.changeType]++;

      // Extract medication name from path
      const medMatch = entry.path.match(/medications\.(\w+)/);
      if (medMatch) {
        const med = medMatch[1];
        summary.byMedication[med] = (summary.byMedication[med] || 0) + 1;
      }

      // Count by requestor
      const requestor = entry.requestor.email;
      summary.byRequestor[requestor] = (summary.byRequestor[requestor] || 0) + 1;
    });

    return { summary, entries };
  }

  /**
   * Export audit log for archival
   */
  exportForArchival(year: number): string {
    const startDate = `${year}-01-01T00:00:00.000Z`;
    const endDate = `${year}-12-31T23:59:59.999Z`;
    
    const entries = this.query({ startDate, endDate });
    
    return JSON.stringify({
      exportDate: new Date().toISOString(),
      year,
      totalEntries: entries.length,
      entries
    }, null, 2);
  }

  /**
   * Validate that all changes have required approvals
   */
  validateApprovals(entries: GuardrailAuditEntry[]): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    entries.forEach(entry => {
      if (!entry.approvers.clinical.name) {
        issues.push(`Entry ${entry.id}: Missing clinical approval`);
      }
      if (!entry.approvers.technical.name) {
        issues.push(`Entry ${entry.id}: Missing technical approval`);
      }
      if (!entry.justification) {
        issues.push(`Entry ${entry.id}: Missing justification`);
      }
      if (!entry.changeRequestId) {
        issues.push(`Entry ${entry.id}: Missing change request ID`);
      }
    });

    return {
      valid: issues.length === 0,
      issues
    };
  }
}

/**
 * Singleton instance for application use
 */
export const auditTrail = new GuardrailsAuditTrail();

/**
 * Helper function to extract changes from a git diff
 */
export function extractChangesFromDiff(
  diffOutput: string,
  schema: GuardrailsSchema
): Array<{
  path: string;
  previousValue: any;
  newValue: any;
}> {
  // This would parse git diff output and extract specific changes
  // Implementation would depend on the diff format
  // For now, returning empty array as placeholder
  return [];
}

/**
 * Generate markdown report from audit entries
 */
export function generateMarkdownReport(
  entries: GuardrailAuditEntry[],
  title: string = 'Guardrails Change Report'
): string {
  let report = `# ${title}\n\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;
  report += `Total Changes: ${entries.length}\n\n`;

  report += '## Change Summary\n\n';
  report += '| Date | Type | Path | Requestor | Justification |\n';
  report += '|------|------|------|-----------|---------------|\n';

  entries.forEach(entry => {
    const date = new Date(entry.timestamp).toLocaleDateString();
    report += `| ${date} | ${entry.changeType} | ${entry.path} | ${entry.requestor.name} | ${entry.justification.substring(0, 50)}... |\n`;
  });

  report += '\n## Detailed Changes\n\n';

  entries.forEach(entry => {
    report += `### ${entry.id}\n\n`;
    report += `- **Date**: ${entry.timestamp}\n`;
    report += `- **Type**: ${entry.changeType}\n`;
    report += `- **Path**: \`${entry.path}\`\n`;
    report += `- **Requestor**: ${entry.requestor.name} (${entry.requestor.email})\n`;
    report += `- **Clinical Approver**: ${entry.approvers.clinical.name} (${entry.approvers.clinical.credentials})\n`;
    report += `- **Technical Approver**: ${entry.approvers.technical.name}\n`;
    report += `- **Justification**: ${entry.justification}\n`;
    report += `- **Change Request**: ${entry.changeRequestId}\n`;
    
    if (entry.previousValue !== null) {
      report += `- **Previous Value**: \`${JSON.stringify(entry.previousValue)}\`\n`;
    }
    if (entry.newValue !== null) {
      report += `- **New Value**: \`${JSON.stringify(entry.newValue)}\`\n`;
    }
    
    report += '\n---\n\n';
  });

  return report;
}