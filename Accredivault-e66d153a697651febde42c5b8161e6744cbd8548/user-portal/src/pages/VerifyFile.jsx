import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { verifyAPI } from '../services/api';

export default function VerifyFile() {
  const [docId, setDocId] = useState('');
  const [file, setFile] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);

  const onDrop = (accepted) => {
    if (accepted?.length) {
      const f = accepted[0];
      if (!f.type.includes('pdf')) return toast.error('Only PDF files are allowed');
      if (f.size > 20 * 1024 * 1024) return toast.error('Max size 20MB');
      setFile(f);
      toast.success('File selected');
    }
  };
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
  });

  async function handleVerify(e) {
    e.preventDefault();
    if (!docId.trim()) return toast.error('Enter doc_id');
    if (!file) return toast.error('Select a PDF');
    try {
      setVerifying(true);
      const resp = await verifyAPI.byFile(docId.trim(), file);
      setResult(resp);
      if (resp.valid) toast.success('Verified'); else toast.error('Invalid / Tampered');
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="verify-container">
      <h2 className="verify-title">🔍 Verify by File</h2>
      <p className="verify-description">Upload the student's PDF and enter the provided doc_id for verification</p>
      
      <form onSubmit={handleVerify} className="verify-form">
        <div className="form-group">
          <label>Document ID</label>
          <input 
            value={docId} 
            onChange={(e) => setDocId(e.target.value)} 
            placeholder="Enter doc-xxxx format" 
          />
        </div>
        
        <div
          {...getRootProps()}
          className={`dropzone ${isDragActive ? 'active' : ''}`}
        >
          <input {...getInputProps()} />
          {file ? (
            <div className="file-info">
              <div className="file-name">📎 {file.name}</div>
              <div className="file-size">📏 {(file.size / 1024 / 1024).toFixed(2)} MB</div>
              <button 
                type="button" 
                className="remove-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
              >
                ❌ Remove File
              </button>
            </div>
          ) : (
            <div>
              <div className="dropzone-text">📁 Drop your PDF here</div>
              <div className="dropzone-subtext">or click to browse files</div>
              <div className="dropzone-subtext">Only PDF files, max 20MB</div>
            </div>
          )}
        </div>
        
        <button 
          type="submit" 
          className="verify-btn"
          disabled={verifying || !file}
        >
          {verifying ? '🔍 Verifying...' : '✅ Verify Document'}
        </button>
      </form>

      {result && (
        <div className={`result-container ${result.valid ? 'result-valid' : 'result-invalid'}`}>
          <div className="result-title">
            {result.valid ? '✅ Document Verified Successfully!' : '❌ Document Verification Failed'}
          </div>
          <div className="result-info">
            <div className="result-item">Document ID: {result.doc_id || docId}</div>
            {result.doc && (
              <div className="document-details">
                <div><strong>Title:</strong> {result.doc.title}</div>
                <div><strong>Owner:</strong> {result.doc.owner}</div>
                <div><strong>Status:</strong> {result.doc.status}</div>
                <div><strong>Uploaded:</strong> {new Date(result.doc.uploaded_at || result.doc.created_at).toLocaleString()}</div>
              </div>
            )}
          </div>
          {!result.valid && result.reason && (
            <div style={{ marginTop: 15, opacity: 0.9 }}>
              <strong>Reason:</strong> {result.reason}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
