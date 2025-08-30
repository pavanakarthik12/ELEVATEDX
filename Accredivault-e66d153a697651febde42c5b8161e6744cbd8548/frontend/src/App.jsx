import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import DocumentUpload from './pages/DocumentUpload'
import MultipleDocumentUpload from './pages/MultipleDocumentUpload'
import { Toaster } from 'react-hot-toast'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <div className="admin-container">
        <header className="admin-header">
          <h1 className="admin-title">AccrediVault</h1>
          <p className="admin-subtitle">Enterprise Document Management & Verification System</p>
          <nav className="admin-nav">
            <Link to="/upload">Single Upload</Link>
            <Link to="/upload/multiple">Multiple Upload</Link>
          </nav>
        </header>
        <Routes>
          <Route path="/" element={<Navigate to="/upload" replace />} />
          <Route path="/upload" element={<DocumentUpload />} />
          <Route path="/upload/multiple" element={<MultipleDocumentUpload />} />
        </Routes>
      </div>
      <Toaster position="top-right" />
    </BrowserRouter>
  )
}

