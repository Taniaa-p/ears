

import { useState } from 'react';
import ReportForm from './ReportForm';
import './App.css';

function App() {
  const [step, setStep] = useState('idle');

  return (
    <div className="app">
      {step === 'idle' && (
        <div className="panic-screen">
          <button className="panic-button" onClick={() => setStep('reporting')}>
            REPORT EMERGENCY
          </button>
        </div>
      )}

      {step === 'reporting' && <ReportForm onBack={() => setStep('idle')} />}
    </div>
  );
}

export default App;