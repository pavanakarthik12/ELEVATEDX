import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { verifyAPI } from '../services/api';

export default function VerifyHash() {
  const [docId, setDocId] = useState('');
  const [fileHash, setFileHash] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);

  async function handleVerify(e) {
    e.preventDefault();
    if (!docId.trim()) return toast.error('Enter doc_id');
    if (!fileHash.trim()) return toast.error('Enter file hash');
    try {
      setVerifying(true);
      const resp = await verifyAPI.byHash({ doc_id: docId.trim(), file_hash: fileHash.trim() });
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
      <h2 className="verify-title">🔐 Verify by Hash</h2>
      <p className="verify-description">Enter the document ID and the hash printed/embedded in the PDF</p>
      
      <form onSubmit={handleVerify} className="verify-form">
        <div className="form-group">
          <label>Document ID</label>
          <input 
            value={docId} 
            onChange={(e) => setDocId(e.target.value)} 
            placeholder="Enter doc-xxxx format" 
          />
        </div>
        
        <div className="form-group">
          <label>File Hash (SHA-256)</label>
          <input 
            value={fileHash} 
            onChange={(e) => setFileHash(e.target.value)} 
            placeholder="Enter 64-character hexadecimal hash" 
          />
        </div>
        
        <button 
          type="submit" 
          className="verify-btn"
          disabled={verifying}
        >
          {verifying ? '🔍 Verifying...' : '✅ Verify Hash'}
        </button>
      </form>

      {result && (
        <div className={`result-container ${result.valid ? 'result-valid' : 'result-invalid'}`}>
          <div className="result-title">
            {result.valid ? '✅ Hash Verification Successful!' : '❌ Hash Verification Failed'}
          </div>
          <div className="result-info">
            <div className="result-item">Document ID: {docId}</div>
            {result.doc && (
              <div className="document-details">
                <div><strong>Title:</strong> {result.doc.title}</div>
                <div><strong>Owner:</strong> {result.doc.owner}</div>
                <div><strong>Status:</strong> {result.doc.status}</div>
                <div><strong>Uploaded:</strong> {new Date(result.doc.uploaded_at || result.doc.created_at).toLocaleString()}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
