import uuid
import hashlib
from django.db import models
from django.utils import timezone

class Document(models.Model):
    STATUS_CHOICES = [
        ('SUBMITTED', 'Submitted'),
        ('UNDER_REVIEW', 'Under Review'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]
    
    doc_id = models.CharField(max_length=50, primary_key=True, editable=False)
    title = models.CharField(max_length=255)
    owner = models.CharField(max_length=100)
    file = models.FileField(upload_to='documents/')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SUBMITTED')
    ai_confidence = models.IntegerField(default=0)
    ai_issues = models.JSONField(default=list)
    # Crypto & storage metadata
    file_hash = models.CharField(max_length=64, blank=True, default='')  # SHA-256 hex of plaintext
    enc_iv = models.CharField(max_length=24, blank=True, default='')  # base64 12 bytes
    enc_tag = models.CharField(max_length=24, blank=True, default='')  # base64 16 bytes (truncated ok)
    enc_alg = models.CharField(max_length=20, default='AES-256-GCM')
    storage_backend = models.CharField(max_length=10, default='LOCAL')  # LOCAL or S3
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        if not self.doc_id:
            self.doc_id = f"doc-{uuid.uuid4().hex[:8]}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.doc_id} - {self.title}"
    
    class Meta:
        ordering = ['-created_at']

class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('UPLOAD', 'Upload'),
        ('VALIDATE', 'Validate'),
        ('STATUS_CHANGE', 'Status Change'),
    ]
    
    doc = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='audit_logs')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    actor = models.CharField(max_length=100)
    hash = models.CharField(max_length=64)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.doc.doc_id} - {self.action} by {self.actor}"
    
    class Meta:
        ordering = ['-created_at']