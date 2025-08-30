import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { verifyAPI } from '../services/api';

// Professional Icons
const Icons = {
  Verify: '🔍',
  File: '📄',
  Success: '✓',
  Error: '✕',
  Remove: '✕',
  Upload: '📤',
  Check: '✓',
  Info: 'ℹ'
};

export default function VerifyFile() {
  const [docId, setDocId] = useState('');
  const [file, setFile] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);

  const onDrop = (accepted) => {
    if (accepted?.length) {
      const f = accepted[0];
      if (!f.type.includes('pdf')) return toast.error('Only PDF files are allowed');
      if (f.size > 20 * 1024 * 1024) return toast.error('Maximum file size is 20MB');
      setFile(f);
      toast.success('File selected successfully');
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
    if (!docId.trim()) return toast.error('Please enter a document ID');
    if (!file) return toast.error('Please select a PDF file to verify');
    
    try {
      setVerifying(true);
      const resp = await verifyAPI.byFile(docId.trim(), file);
      setResult(resp);
      if (resp.valid) {
        toast.success('Document verified successfully');
      } else {
        toast.error('Document verification failed - possible tampering detected');
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
        <h2 className="verify-title">Document Verification</h2>
        <p className="verify-description">
          Upload the student's PDF document and enter the provided document ID for secure verification
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
          <label>Document File</label>
          <div
            {...getRootProps()}
            className={`dropzone ${isDragActive ? 'active' : ''}`}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="file-info">
                <div className="file-header">
                  <div className="file-icon">{Icons.File}</div>
                  <div className="file-details">
                    <div className="file-name">{file.name}</div>
                    <div className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="remove-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                >
                  {Icons.Remove} Remove File
                </button>
              </div>
            ) : (
              <div className="dropzone-content">
                <div className="dropzone-icon">{Icons.Upload}</div>
                <div className="dropzone-text">Drop your PDF document here</div>
                <div className="dropzone-subtext">or click to browse files</div>
                <div className="dropzone-requirements">
                  <span className="requirement">PDF files only</span>
                  <span className="requirement">Maximum 20MB</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <button 
          type="submit" 
          className="verify-btn"
          disabled={verifying || !file}
        >
          {verifying ? (
            <>
              <span className="loading-spinner"></span>
              Verifying Document...
            </>
          ) : (
            <>
              {Icons.Check} Verify Document
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
                <div className="result-title">Document Verified Successfully!</div>
              </div>
              <div className="result-description">
                This document has been verified and is authentic. No tampering has been detected.
              </div>
              <div className="result-info">
                <div className="result-item">
                  <span className="result-label">Document ID:</span>
                  <span className="result-value">{result.doc_id || docId}</span>
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
                <div className="error-title">Document Verification Failed</div>
              </div>
              <div className="error-description">
                This document could not be verified. It may have been tampered with or the document ID is incorrect.
              </div>
              <div className="result-info">
                <div className="result-item">
                  <span className="result-label">Document ID:</span>
                  <span className="result-value">{result.doc_id || docId}</span>
                </div>
                {result.reason && (
                  <div className="result-item">
                    <span className="result-label">Reason:</span>
                    <span className="result-value">{result.reason}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
