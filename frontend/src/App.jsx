import { useState } from 'react';
import ReportForm from './ReportForm';
import Dashboard from './Dashboard';
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
          <button onClick={() => setStep('dashboard')} style={{ marginTop: 20 }}>
            View Responder Dashboard
          </button>
        </div>
      )}

      {step === 'reporting' && <ReportForm onBack={() => setStep('idle')} />}
      {step === 'dashboard' && <Dashboard />}
    </div>
  );
}

export default App;
// import { useState } from 'react';
// import ReportForm from './ReportForm';
// import './App.css';

// function App() {
//   const [step, setStep] = useState('idle');

//   return (
//     <div className="app">
//       {step === 'idle' && (
//         <div className="panic-screen">
//           <button className="panic-button" onClick={() => setStep('reporting')}>
//             REPORT EMERGENCY
//           </button>
//         </div>
//       )}

//       {step === 'reporting' && <ReportForm onBack={() => setStep('idle')} />}
//     </div>
//   );
// }

// export default App;