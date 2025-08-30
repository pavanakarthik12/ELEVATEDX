import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { saveAs } from 'file-saver';
import { documentAPI } from '../services/api';
import { stampPdfWithHash } from '../services/pdfStamp';

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
      toast.success('File selected');
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
    if (!formData.title.trim()) return toast.error('Enter title');
    if (!formData.owner.trim()) return toast.error('Enter owner');
    if (!formData.file) return toast.error('Select a file');

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

      toast.success('Uploaded');
      const docId = resp?.doc_id || resp?.manifest?.doc_id;
      const fileHash = resp?.manifest?.file_hash || resp?.hash;
      if (docId && fileHash) {
        const stamped = await stampPdfWithHash(formData.file, { docId, fileHash });
        const name = formData.file.name.replace(/\.pdf$/i, '') + `__AccrediVault_${docId}.pdf`;
        saveAs(stamped, name);
        setResult({ docId, fileHash });
        toast.success('Stamped PDF downloaded');
      } else {
        toast.error('Missing doc_id or hash');
      }
      setFormData({ title: '', owner: '', file: null });
      setTimeout(() => setProgress(0), 1500);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="upload-container">
      <h2 className="upload-title">📄 Upload Document</h2>
      <p className="upload-description">Secure document upload with AI validation and encryption</p>

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label>Document Title</label>
          <input 
            value={formData.title} 
            onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))} 
            placeholder="Enter document title" 
          />
        </div>
        
        <div className="form-group">
          <label>Owner/Student Name</label>
          <input 
            value={formData.owner} 
            onChange={(e) => setFormData((p) => ({ ...p, owner: e.target.value }))} 
            placeholder="Enter student or owner name" 
          />
        </div>

        <div
          {...getRootProps()}
          className={`dropzone ${isDragActive ? 'active' : ''}`}
        >
          <input {...getInputProps()} />
          {formData.file ? (
            <div className="file-info">
              <div className="file-name">📎 {formData.file.name}</div>
              <div className="file-size">📏 {(formData.file.size / 1024 / 1024).toFixed(2)} MB</div>
              <button 
                type="button" 
                className="remove-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setFormData((p) => ({ ...p, file: null }));
                }}
              >
                ❌ Remove File
              </button>
            </div>
          ) : (
            <div>
              <div className="dropzone-text">📁 Drop your PDF here</div>
              <div className="dropzone-subtext">or click to browse files</div>
              <div className="dropzone-subtext">Only PDF files, max 10MB</div>
            </div>
          )}
        </div>

        <button 
          type="submit" 
          className="upload-btn"
          disabled={uploading || !formData.file}
        >
          {uploading ? '🔒 Encrypting & Uploading...' : '🚀 Upload Document'}
        </button>

        {uploading && (
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        )}
      </form>

      {result && (
        <div className="result-container">
          <div className="result-title">✅ Document Successfully Uploaded!</div>
          <div className="result-info">
            <div className="result-item">Document ID: {result.docId}</div>
            <div className="result-item">File Hash: {result.fileHash}</div>
          </div>
          <p style={{ marginTop: 15, opacity: 0.9 }}>
            Your stamped PDF has been downloaded. Share this document with the student.
          </p>
        </div>
      )}
    </div>
  );
}


