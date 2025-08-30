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
  Info: 'ℹ',
  Multiple: '📚'
};

export default function MultipleDocumentUpload() {
  const [formData, setFormData] = useState({ 
    titlePrefix: 'Document', 
    owner: '', 
    files: [] 
  });
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);

  const onDrop = (accepted) => {
    if (accepted?.length) {
      // Filter out non-PDF files and files that are too large
      const validFiles = accepted.filter(f => {
        if (!f.type.includes('pdf')) {
          toast.error(`${f.name} is not a PDF file`);
          return false;
        }
        if (f.size > 10 * 1024 * 1024) {
          toast.error(`${f.name} exceeds 10MB limit`);
          return false;
        }
        return true;
      });

      // Limit to 4 files
      if (validFiles.length > 4) {
        toast.error('Maximum 4 files allowed');
        validFiles.splice(4);
      }

      setFormData(prev => ({ 
        ...prev, 
        files: [...prev.files, ...validFiles].slice(0, 4) 
      }));
      
      if (validFiles.length > 0) {
        toast.success(`${validFiles.length} file(s) selected successfully`);
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 10 * 1024 * 1024,
    multiple: true,
  });

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const clearAllFiles = () => {
    setFormData(prev => ({ ...prev, files: [] }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.titlePrefix.trim()) return toast.error('Please enter a title prefix');
    if (!formData.owner.trim()) return toast.error('Please enter the owner/student name');
    if (formData.files.length === 0) return toast.error('Please select at least one file to upload');

    try {
      setUploading(true);
      setProgress(0);
      
      const fd = new FormData();
      fd.append('title_prefix', formData.titlePrefix);
      fd.append('owner', formData.owner);
      
      formData.files.forEach((file, index) => {
        fd.append('files', file);
      });

      const timer = setInterval(() => setProgress((p) => (p >= 90 ? 90 : p + 10)), 200);
      const resp = await documentAPI.uploadMultiple(fd);
      clearInterval(timer);
      setProgress(100);

      toast.success(resp.message || 'Documents uploaded successfully');
      
      // Process successful uploads and download stamped PDFs
      if (resp.uploaded_documents && resp.uploaded_documents.length > 0) {
        const downloadPromises = resp.uploaded_documents.map(async (doc, index) => {
          try {
            const originalFile = formData.files[index];
            const stamped = await stampPdfWithHash(originalFile, { 
              docId: doc.doc_id, 
              fileHash: doc.file_hash 
            });
            const name = originalFile.name.replace(/\.pdf$/i, '') + `__AccrediVault_${doc.doc_id}.pdf`;
            saveAs(stamped, name);
            return { success: true, filename: originalFile.name, docId: doc.doc_id };
          } catch (error) {
            console.error(`Failed to stamp PDF for ${doc.doc_id}:`, error);
            return { success: false, filename: formData.files[index]?.name, docId: doc.doc_id, error: error.message };
          }
        });

        const downloadResults = await Promise.all(downloadPromises);
        const successfulDownloads = downloadResults.filter(r => r.success).length;
        
        if (successfulDownloads > 0) {
          toast.success(`${successfulDownloads} stamped PDF(s) downloaded successfully`);
        }
        
        setResult({
          totalFiles: resp.total_files,
          successfulUploads: resp.successful_uploads,
          failedUploads: resp.failed_uploads,
          documents: resp.uploaded_documents,
          downloadResults
        });
      }

      // Reset form
      setFormData({ titlePrefix: 'Document', owner: '', files: [] });
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
        <h2 className="upload-title">
          {Icons.Multiple} Multiple Document Upload
        </h2>
        <p className="upload-description">
          Upload up to 4 PDF documents at once with batch encryption and AI validation
        </p>
      </div>

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="titlePrefix">Title Prefix</label>
            <input 
              id="titlePrefix"
              type="text"
              value={formData.titlePrefix} 
              onChange={(e) => setFormData((p) => ({ ...p, titlePrefix: e.target.value }))} 
              placeholder="e.g., Certificate, Transcript, etc." 
              required
            />
            <small>Files will be named: {formData.titlePrefix} 1, {formData.titlePrefix} 2, etc.</small>
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
          <label>Document Files (Max 4 PDFs)</label>
          <div
            {...getRootProps()}
            className={`dropzone ${isDragActive ? 'active' : ''}`}
          >
            <input {...getInputProps()} />
            {formData.files.length > 0 ? (
              <div className="files-list">
                {formData.files.map((file, index) => (
                  <div key={index} className="file-info">
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
                        removeFile(index);
                      }}
                    >
                      {Icons.Remove}
                    </button>
                  </div>
                ))}
                <div className="files-actions">
                  <button 
                    type="button" 
                    className="clear-all-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearAllFiles();
                    }}
                  >
                    Clear All Files
                  </button>
                  <span className="files-count">
                    {formData.files.length}/4 files selected
                  </span>
                </div>
              </div>
            ) : (
              <div className="dropzone-content">
                <div className="dropzone-icon">{Icons.Upload}</div>
                <div className="dropzone-text">Drop your PDF documents here</div>
                <div className="dropzone-subtext">or click to browse files</div>
                <div className="dropzone-requirements">
                  <span className="requirement">PDF files only</span>
                  <span className="requirement">Maximum 10MB per file</span>
                  <span className="requirement">Up to 4 files at once</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="upload-btn"
            disabled={uploading || formData.files.length === 0}
          >
            {uploading ? (
              <>
                <span className="loading-spinner"></span>
                Processing {formData.files.length} Document(s)...
              </>
            ) : (
              <>
                {Icons.Lock} Upload & Encrypt {formData.files.length} Document(s)
              </>
            )}
          </button>
        </div>

        {uploading && (
          <div className="progress-container">
            <div className="progress-label">Processing documents...</div>
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
            <div className="result-title">Batch Upload Complete!</div>
          </div>
          <div className="result-description">
            {result.successfulUploads} out of {result.totalFiles} documents were successfully uploaded and encrypted.
          </div>
          
          <div className="result-summary">
            <div className="summary-item">
              <span className="summary-label">Total Files:</span>
              <span className="summary-value">{result.totalFiles}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Successful:</span>
              <span className="summary-value success">{result.successfulUploads}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Failed:</span>
              <span className="summary-value error">{result.failedUploads}</span>
            </div>
          </div>

          {result.documents && result.documents.length > 0 && (
            <div className="documents-list">
              <h4>Uploaded Documents:</h4>
              {result.documents.map((doc, index) => (
                <div key={doc.doc_id} className="document-item">
                  <div className="doc-info">
                    <span className="doc-title">{doc.title}</span>
                    <span className="doc-id">ID: {doc.doc_id}</span>
                  </div>
                  <div className="doc-status">
                    <span className="file-hash">Hash: {doc.file_hash}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="result-actions">
            <button 
              className="download-btn"
              onClick={() => {
                toast.success('All stamped PDFs have been downloaded automatically');
              }}
            >
              {Icons.Download} Download All Stamped PDFs
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
