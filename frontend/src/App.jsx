import { Routes, Route, Link } from 'react-router-dom';
import ReportForm from './ReportForm';
import Dashboard from './Dashboard';
import StatusPage from './StatusPage';
import './App.css';

function Home() {
  return (
    <div className="panic-screen" style={{ flexDirection: 'column', gap: '15px' }}>
      <Link to="/report">
        <button className="panic-button">REPORT EMERGENCY</button>
      </Link>
      <Link to="/dashboard">
        <button>View Responder Dashboard (Admin)</button>
      </Link>
      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
        <Link to="/dashboard/fire"><button>Fire Dept Dashboard</button></Link>
        <Link to="/dashboard/police"><button>Police Dashboard</button></Link>
        <Link to="/dashboard/hospital"><button>Hospital Dashboard</button></Link>
      </div>
    </div>
  );
}

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/report" element={<ReportForm />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/fire" element={<Dashboard department="fire" />} />
        <Route path="/dashboard/police" element={<Dashboard department="police" />} />
        <Route path="/dashboard/hospital" element={<Dashboard department="hospital" />} />
        <Route path="/status/:id" element={<StatusPage />} />
      </Routes>
    </div>
  );
}

export default App;