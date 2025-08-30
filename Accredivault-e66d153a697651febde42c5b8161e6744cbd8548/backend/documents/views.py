from rest_framework import status, generics
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.core.paginator import Paginator
from django.http import HttpResponse

from .models import Document, AuditLog
from .serializers import DocumentSerializer, UploadSerializer, AuditSerializer, StatusUpdateSerializer
from .validators import validate_document
from .audit import log_action_db
from .utils import get_user_from_headers, validate_role, get_encryption_key_from_settings
from .email_utils import notify_admin_document_verification_failed
import logging
logger = logging.getLogger('documents')
from django.conf import settings
import base64
from io import BytesIO
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import re

@api_view(['POST'])
def upload_document(request):
    """Upload a new document"""
    try:
        user_id, user_role = get_user_from_headers(request)
    except Exception as e:
        return Response({'error': 'Missing or invalid user headers'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    # Restrict uploads to ADMIN (institution) only
    if user_role != 'ADMIN':
        return Response({'error': 'Only institutions (ADMIN) can upload documents'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    serializer = UploadSerializer(data=request.data)
    if serializer.is_valid():
        try:
            # Run AI validation (on metadata only)
            file = serializer.validated_data['file']
            ai_result = validate_document(file)
            
            # If validation fails (confidence 0), return error
            if ai_result['confidence'] == 0:
                return Response({
                    'error': 'File validation failed', 
                    'issues': ai_result['issues']
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Prepare crypto key
            key = get_encryption_key_from_settings()
            if key is None:
                return Response({'error': 'Encryption key missing on server'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            aesgcm = AESGCM(key)
            # Generate 12-byte IV for AES-GCM
            import os
            iv_bytes = os.urandom(12)
            plaintext = file.read()
            # Compute SHA-256 of plaintext
            import hashlib
            file_hash = hashlib.sha256(plaintext).hexdigest()
            # Encrypt
            ciphertext = aesgcm.encrypt(iv_bytes, plaintext, None)
            # Store encrypted content in a Django File-like object
            encrypted_file = BytesIO(ciphertext)
            encrypted_file.name = file.name  # preserve filename
            # Create and save document with encrypted bytes
            document = Document(
                title=serializer.validated_data['title'],
                owner=user_id,
                ai_confidence=ai_result['confidence'],
                ai_issues=ai_result['issues'],
            )
            # Save file field first so storage backend handles writing
            document.file.save(file.name, encrypted_file, save=False)
            # Crypto metadata
            document.file_hash = file_hash
            document.enc_iv = base64.b64encode(iv_bytes).decode('utf-8')
            document.enc_tag = ''  # AESGCM ciphertext includes tag at the end; optional to store separately
            document.enc_alg = 'AES-256-GCM'
            document.storage_backend = 'S3' if getattr(settings, 'USE_S3', False) else 'LOCAL'
            document.save()
            
            # Log upload action
            log_action_db(document, 'UPLOAD', user_id)
            
            # Return response
            response_serializer = DocumentSerializer(document, context={'request': request})
            resp = response_serializer.data
            # Include simple manifest for verification flows
            resp['manifest'] = {
                'doc_id': document.doc_id,
                'file_hash': document.file_hash,
                'algorithm': document.enc_alg,
                'issued_at': document.created_at.isoformat()
            }
            # Provide a download URL for the encrypted file via our endpoint
            resp['download_url'] = request.build_absolute_uri(f"/api/docs/{document.doc_id}/download/")
            return Response(resp, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            try:
                logger.exception("Upload failed: %s", str(e))
            except Exception:
                pass
            return Response({'error': 'Failed to process document upload'}, 
                           status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def document_detail(request, doc_id):
    """Get document details"""
    try:
        document = get_object_or_404(Document, doc_id=doc_id)
        serializer = DocumentSerializer(document, context={'request': request})
        return Response(serializer.data)
    except Document.DoesNotExist:
        return Response({'error': 'Document not found'}, 
                       status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': 'Failed to retrieve document'}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def document_list(request):
    """List documents with filtering and pagination"""
    try:
        documents = Document.objects.all().order_by('-created_at')
        
        # Apply filters
        owner = request.GET.get('owner')
        status_filter = request.GET.get('status')
        
        if owner:
            documents = documents.filter(owner=owner)
        if status_filter:
            if status_filter not in ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED']:
                return Response({'error': 'Invalid status filter'}, 
                               status=status.HTTP_400_BAD_REQUEST)
            documents = documents.filter(status=status_filter)
        
        # Pagination
        try:
            page = int(request.GET.get('page', 1))
            page_size = min(int(request.GET.get('page_size', 20)), 100)  # Max 100 per page
        except ValueError:
            return Response({'error': 'Invalid page or page_size parameter'}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        paginator = Paginator(documents, page_size)
        page_obj = paginator.get_page(page)
        
        serializer = DocumentSerializer(page_obj.object_list, many=True, context={'request': request})
        
        return Response({
            'results': serializer.data,
            'page': page,
            'pages': paginator.num_pages,
            'total': paginator.count
        })
        
    except Exception as e:
        return Response({'error': 'Failed to retrieve documents'}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PATCH'])
def update_document_status(request, doc_id):
    """Update document status (VERIFIER only)"""
    try:
        user_id, user_role = get_user_from_headers(request)
    except Exception as e:
        return Response({'error': 'Missing or invalid user headers'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    # Only verifiers can update status
    if user_role != 'VERIFIER':
        return Response({'error': 'Only verifiers can update document status'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    try:
        document = get_object_or_404(Document, doc_id=doc_id)
    except Document.DoesNotExist:
        return Response({'error': 'Document not found'}, 
                       status=status.HTTP_404_NOT_FOUND)
    
    # Check if document can be updated
    if document.status in ['APPROVED', 'REJECTED']:
        return Response({'error': f'Document already {document.status.lower()}'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    serializer = StatusUpdateSerializer(data=request.data)
    
    if serializer.is_valid():
        try:
            action = serializer.validated_data['action']
            
            # Update status
            if action == 'APPROVE':
                document.status = 'APPROVED'
            elif action == 'REJECT':
                document.status = 'REJECTED'
            else:
                return Response({'error': 'Invalid action. Use APPROVE or REJECT'}, 
                               status=status.HTTP_400_BAD_REQUEST)
            
            document.save()
            
            # Log status change
            log_action_db(document, 'STATUS_CHANGE', user_id)
            
            response_serializer = DocumentSerializer(document, context={'request': request})
            return Response(response_serializer.data)
            
        except Exception as e:
            return Response({'error': 'Failed to update document status'}, 
                           status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def verify_document(request):
    """Verify a document by doc_id and file_hash provided by verifier.
    Expected JSON: { "doc_id": "...", "file_hash": "..." }
    Returns: { valid: bool, doc: {...optional...} }
    """
    try:
        data = request.data or {}
        doc_id = data.get('doc_id')
        file_hash = data.get('file_hash')
        if not doc_id or not file_hash:
            return Response({'error': 'doc_id and file_hash are required'}, status=status.HTTP_400_BAD_REQUEST)
        document = get_object_or_404(Document, doc_id=doc_id)
        is_valid = (document.file_hash == file_hash)
        payload = {'valid': bool(is_valid)}
        if is_valid:
            payload['doc'] = DocumentSerializer(document, context={'request': request}).data
        else:
            # Send email notification to admin about verification failure
            try:
                notify_admin_document_verification_failed(
                    doc_id, 
                    f"Hash mismatch detected. Expected: {document.file_hash}, Got: {file_hash}"
                )
            except Exception as e:
                logger.error(f"Failed to send verification failure notification: {str(e)}")
        
        return Response(payload, status=status.HTTP_200_OK)
    except Document.DoesNotExist:
        return Response({'error': 'Document not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception:
        return Response({'error': 'Verification failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def download_encrypted_document(request, doc_id):
    """Return the encrypted file as a download attachment.
    Allowed roles: ADMIN (institution) and VERIFIER.
    """
    try:
        user_id, user_role = get_user_from_headers(request)
    except Exception:
        return Response({'error': 'Missing or invalid user headers'}, status=status.HTTP_400_BAD_REQUEST)
    if user_role not in ['ADMIN', 'VERIFIER']:
        return Response({'error': 'Not authorized to download document'}, status=status.HTTP_403_FORBIDDEN)
    try:
        document = get_object_or_404(Document, doc_id=doc_id)
        document.file.open('rb')
        data = document.file.read()
        response = HttpResponse(data, content_type='application/octet-stream')
        response['Content-Disposition'] = f'attachment; filename="{document.file.name.split("/")[-1]}"'
        return response
    except Document.DoesNotExist:
        return Response({'error': 'Document not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception:
        return Response({'error': 'Failed to download document'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def verify_document_file(request):
    """Verify by accepting an uploaded file and a doc_id.
    - Expects multipart/form-data with fields: file, doc_id
    - Attempts to decrypt using stored IV and server key; if decrypt fails, treats file as plaintext
    - Computes SHA-256 over plaintext and compares with stored file_hash
    """
    try:
        doc_id = request.data.get('doc_id')
        upload = request.FILES.get('file')
        if not doc_id or not upload:
            return Response({'error': 'doc_id and file are required'}, status=status.HTTP_400_BAD_REQUEST)
        document = get_object_or_404(Document, doc_id=doc_id)
        key = get_encryption_key_from_settings()
        if key is None:
            return Response({'error': 'Encryption key missing on server'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        payload = upload.read()
        # 1) Try to extract embedded hash from stamped PDF comments tail
        embedded_hash = None
        try:
            tail_text = payload[-4096:].decode('utf-8', errors='ignore') if payload else ''
            m = re.search(r"%%ACREDIVAULT-HASH:([0-9a-fA-F]{64})", tail_text)
            if m:
                embedded_hash = m.group(1).lower()
        except Exception:
            embedded_hash = None

        if embedded_hash:
            calc_hash = embedded_hash
        else:
            # 2) Fall back to decrypting (if ours) then hash plaintext
            plaintext = None
            try:
                iv_bytes = base64.b64decode(document.enc_iv) if document.enc_iv else None
                if iv_bytes:
                    aesgcm = AESGCM(key)
                    plaintext = aesgcm.decrypt(iv_bytes, payload, None)
            except Exception:
                plaintext = None
            if plaintext is None:
                plaintext = payload
            import hashlib
            calc_hash = hashlib.sha256(plaintext).hexdigest()
        is_valid = (calc_hash == document.file_hash)
        result = {'valid': bool(is_valid), 'doc_id': doc_id}
        if is_valid:
            result['doc'] = DocumentSerializer(document, context={'request': request}).data
        else:
            result['reason'] = 'hash-mismatch'
            # Send email notification to admin about verification failure
            try:
                notify_admin_document_verification_failed(
                    doc_id, 
                    f"Hash mismatch detected. Expected: {document.file_hash}, Got: {calc_hash}"
                )
            except Exception as e:
                logger.error(f"Failed to send verification failure notification: {str(e)}")
        
        return Response(result, status=status.HTTP_200_OK)
    except Document.DoesNotExist:
        return Response({'error': 'Document not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception:
        return Response({'error': 'Verification failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def audit_logs(request):
    """Get audit logs with optional document filtering"""
    doc_id = request.GET.get('doc_id')
    
    try:
        if doc_id:
            # Get audit logs for a specific document
            try:
                document = get_object_or_404(Document, doc_id=doc_id)
                logs = AuditLog.objects.filter(doc=document).order_by('-created_at')
            except Document.DoesNotExist:
                return Response({'error': 'Document not found'}, 
                               status=status.HTTP_404_NOT_FOUND)
        else:
            # Get all audit logs
            logs = AuditLog.objects.all().order_by('-created_at')
        
        # Apply pagination
        try:
            page = int(request.GET.get('page', 1))
            page_size = min(int(request.GET.get('page_size', 20)), 100)  # Max 100 per page
        except ValueError:
            return Response({'error': 'Invalid page or page_size parameter'}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        paginator = Paginator(logs, page_size)
        page_obj = paginator.get_page(page)
        
        serializer = AuditSerializer(page_obj.object_list, many=True)
        
        return Response({
            'results': serializer.data,
            'page': page,
            'pages': paginator.num_pages,
            'total': paginator.count
        })
        
    except Exception as e:
        return Response({'error': 'Failed to retrieve audit logs'}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)