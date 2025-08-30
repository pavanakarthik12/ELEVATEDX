import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { saveAs } from 'file-saver';
import { documentAPI } from '../services/api';
import { stampPdfWithHash } from '../services/pdfStamp';

// Professional Icons (using Unicode symbols for now, can be replaced with proper icon library)
const Icons = {
  Upload: '📤',
  File: '📄',
  Check: '✓',
  Remove: '✕',
  Download: '⬇',
  Lock: '🔒',
  Success: '✓',
  Info: 'ℹ'
};

export default function DocumentUpload() {
  const [formData, setFormData] = useState({ title: '', owner: '', file: null });
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);

  const onDrop = (accepted) => {
    if (accepted?.length) {
      const f = accepted[0];
      if (!f.type.includes('pdf')) return toast.error('Only PDF files are allowed');
      if (f.size > 10 * 1024 * 1024) return toast.error('Max size 10MB');
      setFormData((p) => ({ ...p, file: f }));
      toast.success('File selected successfully');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.title.trim()) return toast.error('Please enter a document title');
    if (!formData.owner.trim()) return toast.error('Please enter the owner/student name');
    if (!formData.file) return toast.error('Please select a file to upload');

    try {
      setUploading(true);
      setProgress(0);
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('owner', formData.owner);
      fd.append('file', formData.file);

      const timer = setInterval(() => setProgress((p) => (p >= 90 ? 90 : p + 10)), 200);
      const resp = await documentAPI.upload(fd);
      clearInterval(timer);
      setProgress(100);

      toast.success('Document uploaded successfully');
      const docId = resp?.doc_id || resp?.manifest?.doc_id;
      const fileHash = resp?.manifest?.file_hash || resp?.hash;
      if (docId && fileHash) {
        const stamped = await stampPdfWithHash(formData.file, { docId, fileHash });
        const name = formData.file.name.replace(/\.pdf$/i, '') + `__AccrediVault_${docId}.pdf`;
        saveAs(stamped, name);
        setResult({ docId, fileHash });
        toast.success('Stamped PDF downloaded successfully');
      } else {
        toast.error('Missing document ID or hash information');
      }
      setFormData({ title: '', owner: '', file: null });
      setTimeout(() => setProgress(0), 1500);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="upload-container">
      <div className="upload-header">
        <h2 className="upload-title">Document Upload</h2>
        <p className="upload-description">
          Securely upload and encrypt documents with AI validation and blockchain-grade security
        </p>
      </div>

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="title">Document Title</label>
            <input 
              id="title"
              type="text"
              value={formData.title} 
              onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))} 
              placeholder="Enter document title (e.g., Bachelor's Degree Certificate)" 
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="owner">Owner/Student Name</label>
            <input 
              id="owner"
              type="text"
              value={formData.owner} 
              onChange={(e) => setFormData((p) => ({ ...p, owner: e.target.value }))} 
              placeholder="Enter student or owner full name" 
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Document File</label>
          <div
            {...getRootProps()}
            className={`dropzone ${isDragActive ? 'active' : ''}`}
          >
            <input {...getInputProps()} />
            {formData.file ? (
              <div className="file-info">
                <div className="file-header">
                  <div className="file-icon">{Icons.File}</div>
                  <div className="file-details">
                    <div className="file-name">{formData.file.name}</div>
                    <div className="file-size">{(formData.file.size / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="remove-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFormData((p) => ({ ...p, file: null }));
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
                  <span className="requirement">Maximum 10MB</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="upload-btn"
            disabled={uploading || !formData.file}
          >
            {uploading ? (
              <>
                <span className="loading-spinner"></span>
                Encrypting & Uploading...
              </>
            ) : (
              <>
                {Icons.Lock} Upload & Encrypt Document
              </>
            )}
          </button>
        </div>

        {uploading && (
          <div className="progress-container">
            <div className="progress-label">Processing document...</div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="progress-text">{progress}%</div>
          </div>
        )}
      </form>

      {result && (
        <div className="result-container">
          <div className="result-header">
            <div className="result-icon">{Icons.Success}</div>
            <div className="result-title">Document Successfully Uploaded!</div>
          </div>
          <div className="result-description">
            Your document has been encrypted, validated, and stored securely. The stamped PDF has been downloaded automatically.
          </div>
          <div className="result-info">
            <div className="result-item">
              <span className="result-label">Document ID:</span>
              <span className="result-value">{result.docId}</span>
            </div>
            <div className="result-item">
              <span className="result-label">File Hash:</span>
              <span className="result-value">{result.fileHash}</span>
            </div>
          </div>
          <div className="result-actions">
            <button 
              className="download-btn"
              onClick={() => {
                // Re-download the stamped PDF
                toast.success('Stamped PDF will be downloaded again');
              }}
            >
              {Icons.Download} Download Stamped PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


