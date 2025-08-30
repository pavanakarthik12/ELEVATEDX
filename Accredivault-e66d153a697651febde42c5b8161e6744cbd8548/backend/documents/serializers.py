from rest_framework import serializers
from .models import Document, AuditLog

class DocumentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    ai = serializers.SerializerMethodField()
    hash = serializers.SerializerMethodField()
    uploaded_at = serializers.DateTimeField(source='created_at', read_only=True)
    
    class Meta:
        model = Document
        fields = [
            'doc_id', 'title', 'owner', 'status', 'file_url', 
            'ai', 'hash', 'uploaded_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['doc_id', 'created_at', 'updated_at']
    
    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            try:
                return request.build_absolute_uri(obj.file.url)
            except Exception:
                return None
        return None
    
    def get_ai(self, obj):
        return {
            'confidence': obj.ai_confidence or 0,
            'issues': obj.ai_issues or []
        }
    
    def get_hash(self, obj):
        # Prefer stored file hash; fallback to legacy computed hash
        if getattr(obj, 'file_hash', None):
            return obj.file_hash
        try:
            from .audit import make_hash
            return make_hash(f"{obj.doc_id}{obj.title}{obj.status}")
        except Exception:
            return "hash-error"

class UploadSerializer(serializers.ModelSerializer):
    file = serializers.FileField()
    title = serializers.CharField(max_length=200, required=True)
    
    class Meta:
        model = Document
        fields = ['title', 'file']
    
    def validate_title(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Title is required")
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Title must be at least 3 characters long")
        return value.strip()
    
    def validate_file(self, value):
        if not value:
            raise serializers.ValidationError("File is required")
            
        # Check file size (10MB limit)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("File size cannot exceed 10MB")
        
        if value.size == 0:
            raise serializers.ValidationError("File cannot be empty")
        
        # Check file type (PDF only)
        if not value.name.lower().endswith('.pdf'):
            raise serializers.ValidationError("Only PDF files are allowed")
        
        # Additional file name validation
        if len(value.name) > 100:
            raise serializers.ValidationError("File name is too long (max 100 characters)")
            
        return value
    
    def validate(self, attrs):
        # Cross-field validation if needed
        return attrs

class AuditSerializer(serializers.ModelSerializer):
    ts = serializers.DateTimeField(source='created_at', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = ['ts', 'action', 'actor', 'hash']
        read_only_fields = ['ts', 'action', 'actor', 'hash']

class StatusUpdateSerializer(serializers.Serializer):
    ACTION_CHOICES = [('APPROVE', 'Approve'), ('REJECT', 'Reject')]
    action = serializers.ChoiceField(choices=ACTION_CHOICES, required=True)
    
    def validate_action(self, value):
        if value not in ['APPROVE', 'REJECT']:
            raise serializers.ValidationError("Action must be either 'APPROVE' or 'REJECT'")
        return value

class DocumentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for document lists"""
    ai = serializers.SerializerMethodField()
    uploaded_at = serializers.DateTimeField(source='created_at', read_only=True)
    
    class Meta:
        model = Document
        fields = [
            'doc_id', 'title', 'owner', 'status', 
            'ai', 'uploaded_at'
        ]
    
    def get_ai(self, obj):
        return {
            'confidence': obj.ai_confidence or 0,
            'issues': obj.ai_issues or []
        }

class MultipleUploadSerializer(serializers.Serializer):
    """Serializer for multiple file uploads"""
    files = serializers.ListField(
        child=serializers.FileField(),
        min_length=1,
        max_length=4  # Limit to 4 files as requested
    )
    title_prefix = serializers.CharField(max_length=100, required=False, default="Document")
    owner = serializers.CharField(max_length=100, required=True)
    
    def validate_files(self, value):
        if not value:
            raise serializers.ValidationError("At least one file is required")
        
        if len(value) > 4:
            raise serializers.ValidationError("Maximum 4 files allowed")
        
        for file in value:
            if not file.name.lower().endswith('.pdf'):
                raise serializers.ValidationError(f"File {file.name} is not a PDF")
            
            if file.size > 10 * 1024 * 1024:
                raise serializers.ValidationError(f"File {file.name} exceeds 10MB limit")
            
            if file.size == 0:
                raise serializers.ValidationError(f"File {file.name} cannot be empty")
            
            if len(file.name) > 100:
                raise serializers.ValidationError(f"File name {file.name} is too long (max 100 characters)")
        
        return value
    
    def validate_owner(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Owner is required")
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Owner must be at least 2 characters long")
        return value.strip()
    
    def validate_title_prefix(self, value):
        if value and len(value.strip()) < 2:
            raise serializers.ValidationError("Title prefix must be at least 2 characters long")
        return value.strip() if value else "Document"