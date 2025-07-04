import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorStack: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorStack: null
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { 
      hasError: true, 
      error,
      errorStack: error.stack || 'No stack trace available'
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('=== ERROR BOUNDARY CAUGHT ERROR ===');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Error Stack:', error.stack);
    console.error('=================================');
    
    // Update state with error info
    this.setState({
      errorInfo,
      errorStack: error.stack || 'No stack trace available'
    });
    
    // Log to localStorage for debugging
    const errorLog = {
      timestamp: new Date().toISOString(),
      message: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    try {
      const existingLogs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
      existingLogs.push(errorLog);
      // Keep only last 10 errors
      if (existingLogs.length > 10) {
        existingLogs.shift();
      }
      localStorage.setItem('errorLogs', JSON.stringify(existingLogs));
    } catch (e) {
      console.error('Failed to save error log:', e);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, errorStack: null });
    // Clear any cached data that might be causing issues
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  private handleCopyError = () => {
    try {
      const errorDetails = {
        error: this.state.error?.toString(),
        stack: this.state.errorStack,
        componentStack: this.state.errorInfo?.componentStack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        storedLogs: JSON.parse(localStorage.getItem('errorLogs') || '[]'),
        globalLogs: (window as any).errorLogger?.getLogs() || []
      };
      
      const errorText = JSON.stringify(errorDetails, null, 2);
      
      // Copy to clipboard
      navigator.clipboard.writeText(errorText).then(() => {
        alert('Error details copied to clipboard! You can now paste them in a bug report.');
      }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = errorText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Error details copied to clipboard!');
      });
    } catch (e) {
      console.error('Failed to copy error:', e);
      alert('Failed to copy error details. Check the console.');
    }
  };

  private handleViewLogs = () => {
    try {
      // Get logs from both sources
      const storedLogs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
      const errorLoggerLogs = (window as any).errorLogger?.getLogs() || [];
      
      // Open console first
      console.log('%c=== ERROR LOGS ===', 'color: red; font-weight: bold; font-size: 16px');
      
      if (storedLogs.length > 0) {
        console.log('%c📁 Stored Error Logs:', 'color: blue; font-weight: bold');
        storedLogs.forEach((log: any, index: number) => {
          console.group(`Error ${index + 1} (${log.timestamp})`);
          console.log('Message:', log.message);
          console.log('URL:', log.url);
          console.log('Stack:', log.stack);
          console.log('Component Stack:', log.componentStack);
          console.groupEnd();
        });
      }
      
      if (errorLoggerLogs.length > 0) {
        console.log('%c🔍 Global Error Logger:', 'color: green; font-weight: bold');
        errorLoggerLogs.forEach((log: any, index: number) => {
          console.group(`Error ${index + 1} (${log.timestamp})`);
          console.log('Type:', log.type);
          console.log('Message:', log.message);
          if (log.source) console.log('Source:', log.source);
          if (log.lineno) console.log('Line:', log.lineno);
          if (log.stack) console.log('Stack:', log.stack);
          console.groupEnd();
        });
      }
      
      if (storedLogs.length === 0 && errorLoggerLogs.length === 0) {
        console.log('No error logs found.');
      }
      
      console.log('%c=================', 'color: red; font-weight: bold');
      console.log('💡 Tip: You can also use window.errorLogger.printLogs() anytime');
      
      // Also alert the user to check console
      alert('Error logs have been printed to the browser console. Press F12 to open DevTools and view the Console tab.');
    } catch (e) {
      console.error('Failed to read error logs:', e);
      alert('Failed to read error logs. Check the console for details.');
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container">
          <div className="error-content">
            <h1>Something went wrong</h1>
            <p>The application encountered an error. This might be due to a connection issue.</p>
            {this.state.error && (
              <details className="error-details" open>
                <summary>Error details</summary>
                <div className="error-info">
                  <h4>Error Message:</h4>
                  <pre>{this.state.error.toString()}</pre>
                  
                  <h4>Stack Trace:</h4>
                  <pre className="stack-trace">{this.state.errorStack}</pre>
                  
                  {this.state.errorInfo && (
                    <>
                      <h4>Component Stack:</h4>
                      <pre className="component-stack">{this.state.errorInfo.componentStack}</pre>
                    </>
                  )}
                  
                  <h4>Debug Info:</h4>
                  <pre>{JSON.stringify({
                    url: window.location.href,
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString()
                  }, null, 2)}</pre>
                </div>
              </details>
            )}
            <div className="mt-3">
              <button onClick={this.handleReset} className="btn btn-primary">
                Reload Application
              </button>
              <button onClick={this.handleViewLogs} className="btn btn-secondary ms-2">
                View Console Logs
              </button>
              <button onClick={this.handleCopyError} className="btn btn-outline-secondary ms-2">
                Copy Error Details
              </button>
            </div>
          </div>
          <style>{`
            .error-boundary-container {
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              padding: 2rem;
              background-color: #f8f9fa;
            }
            .error-content {
              max-width: 600px;
              text-align: center;
              background: white;
              padding: 2rem;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .error-content h1 {
              color: #dc3545;
              margin-bottom: 1rem;
            }
            .error-details {
              margin-top: 1rem;
              text-align: left;
              background: #f8f9fa;
              padding: 1rem;
              border-radius: 4px;
            }
            .error-details summary {
              cursor: pointer;
              font-weight: 500;
            }
            .error-details pre {
              margin-top: 0.5rem;
              white-space: pre-wrap;
              word-break: break-word;
              max-height: 300px;
              overflow-y: auto;
              font-size: 0.875rem;
            }
            .error-info h4 {
              margin-top: 1rem;
              margin-bottom: 0.5rem;
              font-size: 1rem;
              color: #495057;
            }
            .stack-trace, .component-stack {
              background: #fff;
              border: 1px solid #dee2e6;
              padding: 0.5rem;
              border-radius: 4px;
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;