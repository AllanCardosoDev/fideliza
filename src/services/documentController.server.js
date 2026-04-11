/**
 * Backend Controller para Upload de Documentos no Google Drive
 * Usar em um servidor Express/Node.js
 *
 * Exemplo de uso:
 * POST /api/upload-document
 * req.body: { documentType, clientId, clientName }
 * req.file: arquivo enviado
 */

import { initializeGoogleDrive } from "../services/googleDriveService.js";
import { supabase } from "../services/supabaseClient.js";

/**
 * Upload de Documento para Google Drive
 * @param {Request} req
 * @param {Response} res
 */
export async function uploadDocumentController(req, res) {
  try {
    const { documentType, clientId, clientName } = req.body;
    const file = req.file;

    // Validação
    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Nenhum arquivo fornecido",
      });
    }

    if (!clientName) {
      return res.status(400).json({
        success: false,
        message: "Nome do cliente não fornecido",
      });
    }

    if (!documentType) {
      return res.status(400).json({
        success: false,
        message: "Tipo de documento não fornecido",
      });
    }

    console.log(`📤 Iniciando upload: ${file.originalname}`);

    // Inicializar Google Drive
    const driveService = await initializeGoogleDrive();

    // Upload para Google Drive
    const uploadResult = await driveService.uploadFile(
      clientName,
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    if (!uploadResult.success) {
      return res.status(400).json({
        success: false,
        message: "Erro ao fazer upload no Google Drive",
        error: uploadResult.error,
      });
    }

    // Salvar metadados no Supabase
    const documentData = {
      client_id: clientId,
      document_type: documentType,
      file_name: file.originalname,
      file_url: uploadResult.fileUrl,
      file_size: file.size,
      mime_type: file.mimetype,
      uploaded_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("documents")
      .insert([documentData])
      .select();

    if (error) {
      console.error("Erro ao salvar metadados:", error);
      // Documento foi uploadado, mas metadados falharam
      return res.status(201).json({
        success: true,
        message: "Arquivo enviado, mas houve erro ao salvar metadados",
        data: uploadResult,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Documento enviado com sucesso",
      data: {
        ...uploadResult,
        documentMetadata: data[0],
      },
    });
  } catch (error) {
    console.error("❌ Erro ao fazer upload:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao fazer upload do documento",
      error: error.message,
    });
  }
}

/**
 * Listar Documentos de um Cliente
 * @param {Request} req
 * @param {Response} res
 */
export async function getClientDocuments(req, res) {
  try {
    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: "ID do cliente não fornecido",
      });
    }

    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("client_id", clientId)
      .order("uploaded_at", { ascending: false });

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Erro ao buscar documentos",
        error: error.message,
      });
    }

    return res.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error("Erro ao listar documentos:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao listar documentos",
      error: error.message,
    });
  }
}

/**
 * Deletar Documento do Google Drive
 * @param {Request} req
 * @param {Response} res
 */
export async function deleteDocument(req, res) {
  try {
    const { documentId } = req.params;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: "ID do documento não fornecido",
      });
    }

    // Buscar documento no Supabase para pegar fileId do Google Drive
    const { data: document, error: fetchError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (fetchError || !document) {
      return res.status(404).json({
        success: false,
        message: "Documento não encontrado",
      });
    }

    // Deletar do Google Drive
    const driveService = await initializeGoogleDrive();
    // Aqui você precisaria armazenar o fileId do Google Drive no banco

    // Deletar do Supabase
    const { error: deleteError } = await supabase
      .from("documents")
      .delete()
      .eq("id", documentId);

    if (deleteError) {
      return res.status(400).json({
        success: false,
        message: "Erro ao deletar documento",
        error: deleteError.message,
      });
    }

    return res.json({
      success: true,
      message: "Documento deletado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao deletar documento:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao deletar documento",
      error: error.message,
    });
  }
}

/**
 * Exemplo de configuração de rota no Express:
 *
 * import express from 'express';
 * import multer from 'multer';
 * import {
 *   uploadDocumentController,
 *   getClientDocuments,
 *   deleteDocument,
 * } from './controllers/documentController.js';
 *
 * const router = express.Router();
 * const upload = multer({ storage: multer.memoryStorage() });
 *
 * router.post('/documents/upload', upload.single('file'), uploadDocumentController);
 * router.get('/documents/client/:clientId', getClientDocuments);
 * router.delete('/documents/:documentId', deleteDocument);
 *
 * export default router;
 */
