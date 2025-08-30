import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import VerifyFile from './pages/VerifyFile';
import VerifyHash from './pages/VerifyHash';
import { Toaster } from 'react-hot-toast';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className="verifier-container">
        <header className="verifier-header">
          <h1 className="verifier-title">AccrediVault Verifier</h1>
          <p className="verifier-subtitle">Professional Document Verification for Companies</p>
          <nav className="verifier-nav">
            <Link to="/verify/file">🔍 Verify by File</Link>
            <Link to="/verify/hash">🔐 Verify by Hash</Link>
          </nav>
        </header>
        <Routes>
          <Route path="/" element={<Navigate to="/verify/file" replace />} />
          <Route path="/verify/file" element={<VerifyFile />} />
          <Route path="/verify/hash" element={<VerifyHash />} />
        </Routes>
      </div>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}
