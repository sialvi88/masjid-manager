import * as React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<any, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    window.location.reload();
  };

  public render() {
    const { children } = (this as any).props;
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      let isFirestoreError = false;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.operationType) {
            errorMessage = `Firestore Error: ${parsed.error} (Operation: ${parsed.operationType})`;
            isFirestoreError = true;
          }
        }
      } catch (e) {
        // Not a JSON error message
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-red-100">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isFirestoreError ? 'سیکیورٹی ایرر' : 'کچھ غلط ہو گیا'}
            </h1>
            
            <p className="text-gray-600 mb-8 leading-relaxed">
              {isFirestoreError 
                ? 'ڈیٹا تک رسائی میں مسئلہ پیش آیا ہے۔ براہ کرم ایڈمن سے رابطہ کریں یا دوبارہ کوشش کریں۔'
                : 'ایپلی کیشن میں ایک غیر متوقع خرابی پیش آئی ہے۔'}
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-8 text-left overflow-auto max-h-32">
              <code className="text-xs text-red-600 font-mono">
                {errorMessage}
              </code>
            </div>

            <button
              onClick={this.handleReset}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
            >
              <RefreshCw className="w-5 h-5" />
              دوبارہ لوڈ کریں
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
