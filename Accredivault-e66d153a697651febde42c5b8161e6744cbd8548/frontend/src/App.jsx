import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import DocumentUpload from './pages/DocumentUpload'
import { Toaster } from 'react-hot-toast'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <div className="admin-container">
        <header className="admin-header">
          <h1 className="admin-title">AccrediVault Admin</h1>
          <p className="admin-subtitle">Secure Document Management for Educational Institutions</p>
          <nav className="admin-nav">
            <Link to="/upload">📤 Upload Documents</Link>
          </nav>
        </header>
        <Routes>
          <Route path="/" element={<Navigate to="/upload" replace />} />
          <Route path="/upload" element={<DocumentUpload />} />
        </Routes>
      </div>
      <Toaster position="top-right" />
    </BrowserRouter>
  )
}

