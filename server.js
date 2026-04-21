#!/usr/bin/env node

/**
 * Servidor Fidelizacred - Multipla Plataforma (Vercel + Hostinger + Local)
 * Compatível com Vercel (serverless), Hostinger (Node.js), e desenvolvimento local
 */

import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";
import convert from "libreoffice-convert";

// Carregar variáveis de ambiente do .env
if (fs.existsSync(".env")) {
  const envContent = fs.readFileSync(".env", "utf-8");
  envContent.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split("=");
    if (key && !key.startsWith("#") && !process.env[key.trim()]) {
      process.env[key.trim()] = valueParts.join("=").trim();
    }
  });
  console.log("✅ Variáveis de ambiente carregadas do arquivo .env");
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT || 3000;
const DIST = path.join(__dirname, "dist");

// Detectar ambiente
const isDevelopment = process.env.NODE_ENV !== "production";

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ========================================
// Firebase Admin Setup (Múltiplos Ambientes)
// ========================================

let firebaseAdminInitialized = false;

function initializeFirebaseAdmin() {
  if (firebaseAdminInitialized) return true;

  try {
    let serviceAccount = null;

    // Tentar carregar credenciais do arquivo (desenvolvimento local)
    if (isDevelopment) {
      const credentialsPath = path.join(
        __dirname,
        "credentials",
        "documentos-87058-firebase-adminsdk-7t6zq-e4da8be629.json",
      );

      if (fs.existsSync(credentialsPath)) {
        serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));
        console.log("[FIREBASE-ADMIN] ✅ Credenciais carregadas do arquivo");
      }
    }

    // Se não encontrou arquivo, usar variáveis de ambiente (Hostinger/Vercel/Produção)
    if (!serviceAccount) {
      if (!process.env.FIREBASE_PRIVATE_KEY) {
        console.warn(
          "[FIREBASE-ADMIN] ⚠️ Variáveis de ambiente não configuradas",
        );
        return false;
      }

      serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url:
          "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
      };

      console.log(
        "[FIREBASE-ADMIN] ✅ Credenciais carregadas de variáveis de ambiente",
      );
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket:
        process.env.FIREBASE_STORAGE_BUCKET || "documentos-87058.appspot.com",
    });

    firebaseAdminInitialized = true;
    console.log(
      "[FIREBASE-ADMIN] ✅ Firebase Admin SDK inicializado com sucesso",
    );
    return true;
  } catch (error) {
    console.error("[FIREBASE-ADMIN] ❌ Erro ao inicializar:", error.message);
    return false;
  }
}

// ========================================
// Firebase Upload Routes (Server-side)
// ========================================

// POST /api/firebase/upload - Fazer upload via servidor (evita CORS)
app.post("/api/firebase/upload", upload.single("file"), async (req, res) => {
  try {
    if (!initializeFirebaseAdmin()) {
      return res.status(500).json({
        success: false,
        error: "Firebase Admin SDK não configurado",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Arquivo não fornecido",
      });
    }

    const { clientId, clientName, documentType } = req.body;

    if (!clientId || !clientName || !documentType) {
      return res.status(400).json({
        success: false,
        error: "clientId, clientName e documentType são obrigatórios",
      });
    }

    console.log(`[FIREBASE-UPLOAD] Iniciando upload: ${req.file.originalname}`);

    // Criar caminho no Storage
    const timestamp = Date.now();
    const sanitizedName = req.file.originalname
      .replace(/[^a-z0-9.]/gi, "_")
      .toLowerCase();
    const storagePath = `documentos-clientes/${clientId}/${clientName.replace(/[^a-z0-9]/gi, "_")}/${documentType}/${timestamp}_${sanitizedName}`;

    // Upload para Cloud Storage
    const bucket = admin.storage().bucket();
    const file = bucket.file(storagePath);

    await file.save(req.file.buffer, {
      metadata: {
        contentType: req.file.mimetype,
        cacheControl: "public, max-age=3600",
      },
    });

    console.log(`[FIREBASE-UPLOAD] ✅ Upload concluído: ${storagePath}`);

    // URL de download
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/documentos-87058.appspot.com/o/${encodeURIComponent(storagePath)}?alt=media`;

    // Salvar metadados no Firestore
    const firestore = admin.firestore();
    const docRef = await firestore.collection("documentos").add({
      clientId: String(clientId),
      clientName,
      documentType,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      storagePath,
      downloadUrl,
      createdAt: new Date(),
      uploadedBy: "servidor",
    });

    console.log(`[FIREBASE-UPLOAD] ✅ Metadata salvo: ${docRef.id}`);

    res.json({
      success: true,
      fileUrl: downloadUrl,
      docId: docRef.id,
      storagePath,
      fileName: req.file.originalname,
    });
  } catch (error) {
    console.error("[FIREBASE-UPLOAD] ❌ Erro:", error.message);
    res.status(500).json({
      success: false,
      error: error.message || "Erro ao fazer upload",
    });
  }
});

// DELETE /api/firebase/delete - Deletar documento
app.delete("/api/firebase/delete", async (req, res) => {
  try {
    if (!initializeFirebaseAdmin()) {
      return res.status(500).json({
        success: false,
        error: "Firebase Admin SDK não configurado",
      });
    }

    const { docId, storagePath } = req.body;

    if (!docId || !storagePath) {
      return res.status(400).json({
        success: false,
        error: "docId e storagePath são obrigatórios",
      });
    }

    // Deletar arquivo do Storage
    const bucket = admin.storage().bucket();
    const file = bucket.file(storagePath);

    try {
      await file.delete();
      console.log(`[FIREBASE-DELETE] ✅ Arquivo deletado`);
    } catch (storageError) {
      console.warn(`[FIREBASE-DELETE] ⚠️ Erro ao deletar arquivo`);
    }

    // Deletar metadata do Firestore
    const firestore = admin.firestore();
    await firestore.collection("documentos").doc(docId).delete();

    console.log(`[FIREBASE-DELETE] ✅ Metadata deletado`);

    res.json({
      success: true,
      message: "Documento deletado com sucesso",
    });
  } catch (error) {
    console.error("[FIREBASE-DELETE] ❌ Erro:", error.message);
    res.status(500).json({
      success: false,
      error: error.message || "Erro ao deletar documento",
    });
  }
});

// ========================================
// LOCAL FILE UPLOAD - Configuração
// ========================================

const UPLOADS_DIR = path.join(__dirname, "uploads");

// Criar pasta se não existir
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log("📁 Pasta uploads criada");
}

// Configurar multer para salvar em disco
const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Usar diretório temporário - não temos acesso a req.body aqui ainda
    const tempDir = path.join(UPLOADS_DIR, ".temp");
    try {
      fs.mkdirSync(tempDir, { recursive: true });
      cb(null, tempDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Usar um nome único temporário
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const safeFilename = file.originalname
      .replace(/[^a-z0-9.]/gi, "_")
      .toLowerCase();
    cb(null, `${timestamp}_${random}_${safeFilename}`);
  },
});

const uploadLocal = multer({
  storage: uploadStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// ========================================
// Middleware de Verificação
// ========================================

// Verificar/criar diretório de uploads antes de processar requisições
app.use((req, res, next) => {
  // Garantir que a pasta uploads existe
  if (!fs.existsSync(UPLOADS_DIR)) {
    try {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      console.log("✅ Pasta uploads criada");
    } catch (error) {
      console.error("❌ Erro ao criar pasta uploads:", error);
      return res.status(500).json({
        success: false,
        error: "Não foi possível criar pasta de uploads",
      });
    }
  }
  next();
});

// ========================================
// ROTAS - Upload Local
// ========================================

// POST /api/documentos/upload - Fazer upload
app.post(
  "/api/documentos/upload",
  // Wrapper para capturar erros do multer
  (req, res, next) => {
    uploadLocal.single("file")(req, res, (err) => {
      if (err) {
        console.error("❌ Erro do Multer na rota:", err);
        return res.status(400).json({
          success: false,
          error: `Erro ao processar arquivo: ${err.message}`,
        });
      }
      next();
    });
  },
  // Handler da rota
  (req, res) => {
    try {
      console.log("\n📤 [UPLOAD] Iniciado");
      console.log("=".repeat(50));
      console.log("Body recebido:", req.body);
      console.log("File temporário:", req.file ? req.file.path : "❌ Nenhum");

      if (!req.file) {
        console.error("❌ Arquivo não fornecido");
        return res.status(400).json({
          success: false,
          error: "Arquivo não fornecido",
        });
      }

      // Extrair e validar dados
      const clientId = String(req.body.clientId || "").trim();
      const clientName = String(req.body.clientName || "").trim();
      const documentType = String(req.body.documentType || "").trim();

      console.log("✅ Dados extraídos:", {
        clientId,
        clientName,
        documentType,
      });

      if (!clientId || !clientName || !documentType) {
        console.error("❌ Dados faltando:", {
          clientId,
          clientName,
          documentType,
        });
        fs.unlinkSync(req.file.path); // Remover temp
        return res.status(400).json({
          success: false,
          error: "clientId, clientName e documentType são obrigatórios",
        });
      }

      // Sanitizar e criar diretório final
      const safeClientId = clientId.replace(/[^0-9]/g, "");
      const safeDocType = documentType.replace(/[^a-z0-9-]/gi, "_");
      const finalDir = path.join(
        UPLOADS_DIR,
        `cliente-${safeClientId}`,
        safeDocType,
      );

      fs.mkdirSync(finalDir, { recursive: true });
      console.log(`📁 Diretório criado: ${finalDir}`);

      // Mover arquivo do temp para o local correto
      const finalPath = path.join(finalDir, req.file.filename);
      fs.renameSync(req.file.path, finalPath);
      console.log(
        `✅ [UPLOAD] ${req.file.originalname} movido para ${finalPath}`,
      );
      console.log(`📊 Tamanho: ${(req.file.size / 1024 / 1024).toFixed(2)}MB`);
      console.log("=".repeat(50));

      res.json({
        success: true,
        fileId: req.file.filename,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        documentType: documentType,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("❌ [UPLOAD] Erro:", error.message);
      // Limpar arquivo temporário se houver erro
      if (req.file && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (e) {
          console.error("❌ Erro ao limpar temp:", e.message);
        }
      }
      res.status(500).json({
        success: false,
        error: error.message || "Erro desconhecido no upload",
      });
    }
  },
);

// ========================================
// ROTAS - Listar Documentos
// ========================================

// GET /api/documentos/:clientId - Listar todos os documentos do cliente
app.get("/api/documentos/:clientId", (req, res) => {
  try {
    const { clientId } = req.params;
    const clientDir = path.join(UPLOADS_DIR, `cliente-${clientId}`);

    // Verificar se pasta existe
    if (!fs.existsSync(clientDir)) {
      return res.json({
        success: true,
        documentos: [],
      });
    }

    // Ler todas as pastas de tipos
    const documentos = [];
    const tipos = fs.readdirSync(clientDir);

    tipos.forEach((tipo) => {
      const tipoDir = path.join(clientDir, tipo);

      if (!fs.statSync(tipoDir).isDirectory()) return;

      const files = fs.readdirSync(tipoDir);

      files.forEach((file) => {
        const filePath = path.join(tipoDir, file);
        const stats = fs.statSync(filePath);

        documentos.push({
          id: file,
          name: file.split("_").slice(1).join("_"),
          type: tipo,
          size: stats.size,
          sizeKB: Math.round(stats.size / 1024),
          createdAt: stats.birthtime,
          path: `cliente-${clientId}/${tipo}/${file}`,
        });
      });
    });

    res.json({
      success: true,
      documentos: documentos.sort((a, b) => b.createdAt - a.createdAt),
    });
  } catch (error) {
    console.error("❌ [LIST] Erro:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ========================================
// ROTAS - Download e Deletar
// ========================================

// GET /api/documentos/:clientId/:tipo/:fileId - Download
app.get("/api/documentos/:clientId/:tipo/:fileId", (req, res) => {
  try {
    const { clientId, tipo, fileId } = req.params;
    const filePath = path.join(
      UPLOADS_DIR,
      `cliente-${clientId}`,
      tipo,
      fileId,
    );

    // Validação de segurança
    const realPath = path.resolve(filePath);
    const uploadsPath = path.resolve(UPLOADS_DIR);

    if (!realPath.startsWith(uploadsPath)) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Arquivo não encontrado" });
    }

    res.download(filePath);
  } catch (error) {
    console.error("❌ [DOWNLOAD] Erro:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/documentos/:clientId/:tipo/:fileId - Deletar
app.delete("/api/documentos/:clientId/:tipo/:fileId", (req, res) => {
  try {
    const { clientId, tipo, fileId } = req.params;
    const filePath = path.join(
      UPLOADS_DIR,
      `cliente-${clientId}`,
      tipo,
      fileId,
    );

    // Validação de segurança
    const realPath = path.resolve(filePath);
    const uploadsPath = path.resolve(UPLOADS_DIR);

    if (!realPath.startsWith(uploadsPath)) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️  [DELETE] ${fileId}`);

      res.json({
        success: true,
        message: "Documento deletado",
      });
    } else {
      res.status(404).json({
        success: false,
        error: "Arquivo não encontrado",
      });
    }
  } catch (error) {
    console.error("❌ [DELETE] Erro:", error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// Migração: Adicionar coluna first_installment_day
// ========================================
app.post("/api/migrations/run-first-installment-day", async (req, res) => {
  console.log("\n🚀 [MIGRATION] Iniciando migração first_installment_day...");

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(400).json({
        success: false,
        error: "Variáveis de ambiente do Supabase não configuradas",
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Ler arquivo SQL
    const migrationPath = path.join(
      process.cwd(),
      "migrations/2026-04-11_add_first_installment_day.sql",
    );

    if (!fs.existsSync(migrationPath)) {
      return res.status(404).json({ error: "Arquivo SQL não encontrado" });
    }

    const sqlContent = fs.readFileSync(migrationPath, "utf-8");
    const statements = sqlContent
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith("--"));

    console.log(`📝 Executando ${statements.length} statement(s)...`);

    let successCount = 0;
    let errors = [];

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      try {
        // Tentar com RPC se disponível
        const { data, error } = await supabase.rpc("exec_sql", {
          sql: statement,
        });

        if (error) {
          console.warn(`   ⚠️  RPC error: ${error.message}`);
          // Continua mesmo com erro de RPC
          successCount++;
        } else {
          console.log(`[${i + 1}/${statements.length}] ✅ Executado`);
          successCount++;
        }
      } catch (err) {
        console.error(`[${i + 1}/${statements.length}] ❌ ${err.message}`);
        errors.push(err.message);
      }
    }

    if (errors.length === 0) {
      console.log("\n✨ Migração concluída com sucesso!");
      return res.json({
        success: true,
        message: "Migração executada com sucesso!",
        executedStatements: successCount,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: `${errors.length} erro(s) durante a migração`,
        executedStatements: successCount,
        errors: errors,
      });
    }
  } catch (err) {
    console.error("❌ [MIGRATION] Erro geral:", err.message);
    return res.status(500).json({
      success: false,
      error: "Erro ao executar migração: " + err.message,
    });
  }
});

// ========================================
// Converter DOCX → PDF (usando LibreOffice)
// ========================================

app.post("/api/convert-docx-pdf", upload.single("docx"), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: "Arquivo DOCX não fornecido" });
    }

    console.log(
      `📄 [CONVERT] Convertendo DOCX para PDF: ${req.file.originalname}`,
    );

    // Converter DOCX para PDF
    const pdfBuffer = await new Promise((resolve, reject) => {
      convert(req.file.buffer, ".pdf", undefined, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    if (!pdfBuffer) {
      throw new Error("Conversão retornou vazio");
    }

    // Gerar nome do arquivo
    const fileName = req.file.originalname.replace(".docx", ".pdf");

    // Enviar PDF como response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.send(pdfBuffer);

    console.log(`✅ [CONVERT] PDF convertido com sucesso: ${fileName}`);
  } catch (err) {
    console.error("❌ [CONVERT] Erro na conversão:", err.message);
    res.status(500).json({
      success: false,
      error: "Erro ao converter DOCX para PDF: " + err.message,
    });
  }
});

// ========================================
// Static Files (React App)
// ========================================

app.use(express.static(DIST));

// ========================================
// Error Handler Middleware (DEVE vir DEPOIS das rotas)
// ========================================

app.use((err, req, res, next) => {
  console.error("❌ [ERROR HANDLER] Erro capturado:", err);
  console.error("Tipo:", err.constructor.name);
  console.error("Mensagem:", err.message);
  console.error("Stack:", err.stack);

  // Erro do Multer
  if (err.name === "MulterError") {
    console.error("📤 Erro do Multer:", err.field, err.code);
    return res.status(400).json({
      success: false,
      error: `Erro no upload: ${err.message}`,
      code: err.code,
    });
  }

  // Erro customizado
  if (err.message) {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }

  // Erro genérico
  res.status(500).json({
    success: false,
    error: "Erro interno do servidor",
    message: err.message || "Erro desconhecido",
  });
});

// SPA - Serve index.html para todas as rotas desconhecidas (APENAS GET)
app.get(/.*/, (req, res) => {
  const indexPath = path.join(DIST, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("Not found - Build the app first with: npm run build");
  }
});

// ========================================
// Start Server
// ========================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║  🚀 Fidelizacred - Servidor Integrado         ║
║  Rodando em http://localhost:${PORT}           ║
║  Frontend: React + Vite (porta 5173/5174)    ║
║  Backend: Express + Node.js (porta 3000)     ║
║  Upload: Sistema Local (pasta /uploads)      ║
║  Banco: Supabase                             ║
╚════════════════════════════════════════════════╝
  `);
});
