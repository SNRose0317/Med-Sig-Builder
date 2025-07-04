/**
 * Global error logger utility
 * Captures and logs all errors for debugging
 */

interface ErrorLogEntry {
  timestamp: string;
  type: 'error' | 'unhandledRejection' | 'console';
  message: string;
  stack?: string;
  source?: string;
  lineno?: number;
  colno?: number;
  error?: any;
}

class ErrorLogger {
  private logs: ErrorLogEntry[] = [];
  private maxLogs = 50;
  private originalConsoleError: typeof console.error;

  constructor() {
    this.originalConsoleError = console.error;
    this.setupErrorHandlers();
  }

  private setupErrorHandlers() {
    // Override console.error to capture all console errors
    console.error = (...args: any[]) => {
      this.logError({
        timestamp: new Date().toISOString(),
        type: 'console',
        message: args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '),
        stack: new Error().stack
      });
      
      // Call original console.error
      this.originalConsoleError.apply(console, args);
    };

    // Global error handler
    window.addEventListener('error', (event: ErrorEvent) => {
      this.logError({
        timestamp: new Date().toISOString(),
        type: 'error',
        message: event.message,
        stack: event.error?.stack,
        source: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      this.logError({
        timestamp: new Date().toISOString(),
        type: 'unhandledRejection',
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        error: event.reason
      });
    });
  }

  private logError(entry: ErrorLogEntry) {
    this.logs.push(entry);
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Save to localStorage
    try {
      localStorage.setItem('errorLogger', JSON.stringify(this.logs));
    } catch (e) {
      // Ignore localStorage errors
    }

    // Log to console for immediate visibility
    console.log('🔴 Error Logged:', entry);
  }

  public getLogs(): ErrorLogEntry[] {
    return [...this.logs];
  }

  public clearLogs() {
    this.logs = [];
    try {
      localStorage.removeItem('errorLogger');
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  public getLastError(): ErrorLogEntry | null {
    return this.logs[this.logs.length - 1] || null;
  }

  public exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  public printLogs() {
    console.log('=== ERROR LOGGER HISTORY ===');
    this.logs.forEach((log, index) => {
      console.log(`\n--- Error ${index + 1} ---`);
      console.log('Timestamp:', log.timestamp);
      console.log('Type:', log.type);
      console.log('Message:', log.message);
      if (log.source) console.log('Source:', log.source);
      if (log.lineno) console.log('Line:', log.lineno);
      if (log.colno) console.log('Column:', log.colno);
      if (log.stack) console.log('Stack:', log.stack);
      if (log.error) console.log('Error Object:', log.error);
    });
    console.log('=========================');
  }
}

// Create singleton instance
const errorLogger = new ErrorLogger();

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).errorLogger = errorLogger;
}

export default errorLogger;