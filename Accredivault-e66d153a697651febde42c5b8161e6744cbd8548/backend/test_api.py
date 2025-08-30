import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"

def test_document_list():
    """Test getting document list"""
    response = requests.get(f"{BASE_URL}/docs/")
    print("📋 Document List Test:")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print("-" * 50)

def test_document_upload():
    """Test uploading a document"""
    headers = {
        'x-user-id': 'sai',
        'x-user-role': 'STUDENT'
    }
    
    # Create a dummy PDF-like file for testing
    files = {'file': ('test.pdf', b'%PDF-1.4 dummy content', 'application/pdf')}
    data = {'title': 'Test Certificate'}
    
    response = requests.post(f"{BASE_URL}/docs/upload/", 
                           headers=headers, 
                           files=files, 
                           data=data)
    
    print("📤 Document Upload Test:")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print("-" * 50)
    
    return response.json() if response.status_code == 201 else None

def test_document_detail(doc_id):
    """Test getting document details"""
    response = requests.get(f"{BASE_URL}/docs/{doc_id}/")
    print(f"📄 Document Detail Test (ID: {doc_id}):")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print("-" * 50)

def test_status_update(doc_id):
    """Test updating document status"""
    headers = {
        'x-user-id': 'verifier1',
        'x-user-role': 'VERIFIER',
        'Content-Type': 'application/json'
    }
    
    data = {'action': 'APPROVE'}
    
    response = requests.patch(f"{BASE_URL}/docs/{doc_id}/status/", 
                             headers=headers, 
                             data=json.dumps(data))
    
    print(f"✅ Status Update Test (ID: {doc_id}):")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print("-" * 50)

def test_audit_logs(doc_id):
    """Test getting audit logs"""
    response = requests.get(f"{BASE_URL}/audit/?doc_id={doc_id}")
    print(f"📊 Audit Logs Test (ID: {doc_id}):")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print("-" * 50)

if __name__ == "__main__":
    print("🚀 AccrediVault API Testing Started!")
    print("=" * 50)
    
    # Test 1: List documents (should be empty initially)
    test_document_list()
    
    # Test 2: Upload a document
    uploaded_doc = test_document_upload()
    
    if uploaded_doc and 'doc_id' in uploaded_doc:
        doc_id = uploaded_doc['doc_id']
        
        # Test 3: Get document details
        test_document_detail(doc_id)
        
        # Test 4: Update document status
        test_status_update(doc_id)
        
        # Test 5: Get audit logs
        test_audit_logs(doc_id)
        
        # Test 6: List documents again (should show our uploaded doc)
        test_document_list()
    
    print("🎉 Testing Complete!")