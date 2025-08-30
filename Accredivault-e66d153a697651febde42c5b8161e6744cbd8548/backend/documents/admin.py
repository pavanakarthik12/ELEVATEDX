from django.contrib import admin
from .models import Document, AuditLog

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['doc_id', 'title', 'owner', 'status', 'ai_confidence', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['doc_id', 'title', 'owner']
    readonly_fields = ['doc_id', 'created_at', 'updated_at']

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['doc', 'action', 'actor', 'hash', 'created_at']
    list_filter = ['action', 'created_at']
    search_fields = ['doc__doc_id', 'actor', 'hash']
    readonly_fields = ['created_at']