import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { verifyAPI } from '../services/api';

// Professional Icons
const Icons = {
  Verify: '🔍',
  Hash: '🔐',
  Success: '✓',
  Error: '✕',
  Check: '✓',
  Info: 'ℹ'
};

export default function VerifyHash() {
  const [docId, setDocId] = useState('');
  const [fileHash, setFileHash] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);

  async function handleVerify(e) {
    e.preventDefault();
    if (!docId.trim()) return toast.error('Please enter a document ID');
    if (!fileHash.trim()) return toast.error('Please enter a file hash');
    
    try {
      setVerifying(true);
      const resp = await verifyAPI.byHash({ doc_id: docId.trim(), file_hash: fileHash.trim() });
      setResult(resp);
      if (resp.valid) {
        toast.success('Hash verification successful');
      } else {
        toast.error('Hash verification failed - possible tampering detected');
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || 'Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="verify-container">
      <div className="verify-header">
        <h2 className="verify-title">Hash Verification</h2>
        <p className="verify-description">
          Enter the document ID and the cryptographic hash printed or embedded in the PDF for verification
        </p>
      </div>
      
      <form onSubmit={handleVerify} className="verify-form">
        <div className="form-group">
          <label htmlFor="docId">Document ID</label>
          <input 
            id="docId"
            type="text"
            value={docId} 
            onChange={(e) => setDocId(e.target.value)} 
            placeholder="Enter document ID (e.g., doc-xxxx)" 
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="fileHash">File Hash (SHA-256)</label>
          <input 
            id="fileHash"
            type="text"
            value={fileHash} 
            onChange={(e) => setFileHash(e.target.value)} 
            placeholder="Enter 64-character hexadecimal hash" 
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="verify-btn"
          disabled={verifying}
        >
          {verifying ? (
            <>
              <span className="loading-spinner"></span>
              Verifying Hash...
            </>
          ) : (
            <>
              {Icons.Check} Verify Hash
            </>
          )}
        </button>
      </form>

      {result && (
        <div className={result.valid ? "result-container" : "error-container"}>
          {result.valid ? (
            <>
              <div className="result-header">
                <div className="result-icon">{Icons.Success}</div>
                <div className="result-title">Hash Verification Successful!</div>
              </div>
              <div className="result-description">
                The cryptographic hash matches the stored document hash. This document is authentic and has not been tampered with.
              </div>
              <div className="result-info">
                <div className="result-item">
                  <span className="result-label">Document ID:</span>
                  <span className="result-value">{docId}</span>
                </div>
                {result.doc && (
                  <>
                    <div className="result-item">
                      <span className="result-label">Title:</span>
                      <span className="result-value">{result.doc.title}</span>
                    </div>
                    <div className="result-item">
                      <span className="result-label">Owner:</span>
                      <span className="result-value">{result.doc.owner}</span>
                    </div>
                    <div className="result-item">
                      <span className="result-label">Status:</span>
                      <span className="result-value">{result.doc.status}</span>
                    </div>
                    <div className="result-item">
                      <span className="result-label">Uploaded:</span>
                      <span className="result-value">
                        {new Date(result.doc.uploaded_at || result.doc.created_at).toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="error-header">
                <div className="error-icon">{Icons.Error}</div>
                <div className="error-title">Hash Verification Failed</div>
              </div>
              <div className="error-description">
                The cryptographic hash does not match the stored document hash. This document may have been tampered with or the hash is incorrect.
              </div>
              <div className="result-info">
                <div className="result-item">
                  <span className="result-label">Document ID:</span>
                  <span className="result-value">{docId}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">Provided Hash:</span>
                  <span className="result-value">{fileHash}</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
