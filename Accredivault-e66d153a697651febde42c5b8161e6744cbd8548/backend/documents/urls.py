from django.urls import path
from . import views

urlpatterns = [
    path('docs/upload/', views.upload_document, name='upload-document'),
    path('docs/upload/multiple/', views.upload_multiple_documents, name='upload-multiple-documents'),
    path('docs/<str:doc_id>/', views.document_detail, name='document-detail'),
    path('docs/<str:doc_id>/download/', views.download_encrypted_document, name='download-document'),
    path('docs/', views.document_list, name='document-list'),
    path('docs/<str:doc_id>/status/', views.update_document_status, name='update-status'),
    path('audit/', views.audit_logs, name='audit-logs'),
    path('verify/', views.verify_document, name='verify-document'),
    path('verify/file/', views.verify_document_file, name='verify-document-file'),
]