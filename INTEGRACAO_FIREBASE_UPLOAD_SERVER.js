/**
 * Integração do Firebase Upload no servidor Express
 *
 * Adicione isto ao seu servidor principal (app.js ou main server file):
 */

// ============================================
// ADICIONE ISTO AO TOPO DO SEU SERVIDOR
// ============================================

import firebaseUploadRouter from "./routes/firebaseUpload.js";

// ... Seu código existente ...

// ============================================
// ADICIONE ISTO ANTES DE 'app.listen()'
// ============================================

// Rotas de upload Firebase (server-side, evita CORS)
app.use(firebaseUploadRouter);

// ============================================
// FIM DA INTEGRAÇÃO
// ============================================

/**
 * ENDPOINTS DISPONÍVEIS:
 *
 * POST /api/firebase/upload
 *   - Body: FormData com 'file', 'clientId', 'clientName', 'documentType'
 *   - Resposta: { success, fileUrl, docId, storagePath }
 *
 * DELETE /api/firebase/delete
 *   - Body: JSON com 'docId', 'storagePath'
 *   - Resposta: { success, message }
 *
 * EXEMPLOS:
 */

/**
 * Upload via JavaScript/Fetch:
 *
 * const formData = new FormData();
 * formData.append('file', fileInput.files[0]);
 * formData.append('clientId', '123');
 * formData.append('clientName', 'João Silva');
 * formData.append('documentType', 'cpf');
 *
 * const response = await fetch('/api/firebase/upload', {
 *   method: 'POST',
 *   body: formData
 * });
 *
 * const data = await response.json();
 * console.log(data.fileUrl); // URL de download
 */

/**
 * Delete via JavaScript/Fetch:
 *
 * const response = await fetch('/api/firebase/delete', {
 *   method: 'DELETE',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     docId: 'abc123',
 *     storagePath: 'documentos-clientes/...'
 *   })
 * });
 *
 * const data = await response.json();
 * console.log(data.success); // true
 */
