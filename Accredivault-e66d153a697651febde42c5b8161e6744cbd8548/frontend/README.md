### Admin Portal Setup (AccrediVault)

#### Quick start

1. Configure backend URL (optional):
```
VITE_API_URL=http://localhost:8000/api
```

2. Install and run
```bash
npm i
npm run dev
```

3. Set admin headers in browser console
```js
localStorage.setItem('userId', 'institution-123');
localStorage.setItem('userRole', 'ADMIN');
```

#### Upload flow
- Upload a PDF (< 10MB). Backend encrypts and stores it, returns `doc_id` and `file_hash`.
- App stamps your original PDF with footer and QR, then downloads it automatically.

#### Verify APIs for user portal
- POST `/api/verify/` with `{ doc_id, file_hash }`
- POST `/api/verify/file/` with multipart `{ doc_id, file }`
