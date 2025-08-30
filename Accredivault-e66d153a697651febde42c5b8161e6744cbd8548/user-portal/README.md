# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

### User Portal Setup (AccrediVault)

#### Quick start

1. Configure backend URL (optional):
```
VITE_API_URL=http://localhost:8000/api
```

2. Install & run
```bash
npm i
npm run dev
```

3. Set verifier headers in browser console
```js
localStorage.setItem('userId', 'verifier-001');
localStorage.setItem('userRole', 'VERIFIER');
```

#### Verify documents
- Verify by File: Upload PDF + enter doc_id → backend auto-extracts embedded hash if present, else hashes plaintext
- Verify by Hash: Enter doc_id + SHA-256 (from PDF footer/QR)

Result shows Valid/Invalid with document metadata when valid.
