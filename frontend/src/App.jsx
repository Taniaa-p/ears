import { Routes, Route, Link } from 'react-router-dom';
import ReportForm from './ReportForm';
import Dashboard from './Dashboard';
import './App.css';

function Home() {
  return (
    <div className="panic-screen">
      <Link to="/report">
        <button className="panic-button">REPORT EMERGENCY</button>
      </Link>
      <Link to="/dashboard">
        <button style={{ marginTop: 20 }}>View Responder Dashboard</button>
      </Link>
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
      </Routes>
    </div>
  );
}

export default App;