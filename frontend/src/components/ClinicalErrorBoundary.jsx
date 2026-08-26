import React, { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ClinicalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      errorType: null,
      errorMessage: ''
    };
  }

  static getDerivedStateFromError(error) {
    const msg = error.message || '';
    if (msg.includes('NotAllowedError') || msg.includes('PermissionDeniedError') || msg.includes('getUserMedia')) {
      return { hasError: true, errorType: 'HARDWARE', errorMessage: 'Camera or Microphone permission was denied.' };
    }
    if (msg.includes('WebGL') || msg.includes('context lost') || msg.includes('GPU')) {
      return { hasError: true, errorType: 'WEBGL', errorMessage: 'Hardware acceleration (WebGL) context was lost.' };
    }
    if (msg.includes('NetworkError') || msg.includes('Failed to fetch') || msg.includes('WebSocket')) {
      return { hasError: true, errorType: 'NETWORK', errorMessage: 'Clinical backend connection was interrupted.' };
    }
    return { hasError: true, errorType: 'RUNTIME', errorMessage: msg || 'An unexpected client diagnostic exception occurred.' };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Clinical Error Boundary]', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorType: null, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-panel p-8 max-w-lg mx-auto my-8 border-red-500/50 bg-red-950/40 rounded-2xl text-red-200">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-8 h-8 text-red-400 animate-pulse" />
            <h3 className="text-xl font-bold text-white">
              {this.props.fallbackTitle || 'Clinical Sensor Interface Interrupted'}
            </h3>
          </div>
          <p className="text-sm text-red-300 mb-4">{this.state.errorMessage}</p>

          <div className="p-3 bg-black/40 rounded-lg text-xs font-mono text-gray-300 border border-white/10 mb-6">
            <strong>Diagnostic Guidance:</strong>
            {this.state.errorType === 'HARDWARE' && ' Ensure camera/microphone permissions are allowed in your browser settings.'}
            {this.state.errorType === 'WEBGL' && ' Reload the browser tab to restore GPU rendering pipeline for MediaPipe.'}
            {this.state.errorType === 'NETWORK' && ' Ensure the NeuroCheck API backend is active and reachable.'}
            {this.state.errorType === 'RUNTIME' && ' Contact clinical operations if the error recurs.'}
          </div>

          <button
            onClick={this.handleReset}
            className="glass-btn !bg-red-600 hover:!bg-red-700 !text-white flex items-center gap-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" /> Re-initialize Sensor Interface
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ClinicalErrorBoundary;
