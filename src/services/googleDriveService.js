import { google } from "googleapis";
import fs from "fs";
import path from "path";

export class GoogleDriveService {
  constructor() {
    this.auth = null;
    this.drive = null;
    this.parentFolderId = process.env.VITE_GOOGLE_DRIVE_FOLDER_ID;
  }

  async initialize() {
    try {
      const credentialsPath = path.join(
        process.cwd(),
        "credentials",
        "google-service-account.json",
      );

      const keyFile = require(credentialsPath);

      this.auth = new google.auth.GoogleAuth({
        keyFile: credentialsPath,
        scopes: ["https://www.googleapis.com/auth/drive"],
      });

      this.drive = google.drive({ version: "v3", auth: this.auth });
      console.log("✅ Google Drive Service inicializado");
      return true;
    } catch (error) {
      console.error("❌ Erro ao inicializar Google Drive:", error);
      return false;
    }
  }

  async getOrCreateClientFolder(clientName) {
    try {
      // Procurar por pasta existente
      const response = await this.drive.files.list({
        q: `name='${clientName}' and mimeType='application/vnd.google-apps.folder' and '${this.parentFolderId}' in parents and trashed=false`,
        spaces: "drive",
        fields: "files(id, name)",
        pageSize: 1,
      });

      if (response.data.files.length > 0) {
        console.log(`📁 Pasta do cliente encontrada: ${clientName}`);
        return response.data.files[0].id;
      }

      // Criar nova pasta se não existir
      const fileMetadata = {
        name: clientName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [this.parentFolderId],
      };

      const file = await this.drive.files.create({
        resource: fileMetadata,
        fields: "id",
      });

      console.log(`✅ Nova pasta criada: ${clientName}`);
      return file.data.id;
    } catch (error) {
      console.error("❌ Erro ao criar/obter pasta:", error);
      throw error;
    }
  }

  async uploadFile(clientName, fileBuffer, fileName, mimeType) {
    try {
      const clientFolderId = await this.getOrCreateClientFolder(clientName);

      const fileMetadata = {
        name: fileName,
        parents: [clientFolderId],
      };

      const media = {
        mimeType: mimeType,
        body: fileBuffer,
      };

      const file = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: "id, webViewLink",
      });

      console.log(`✅ Arquivo enviado: ${fileName}`);
      return {
        success: true,
        fileId: file.data.id,
        fileUrl: file.data.webViewLink,
        fileName: fileName,
      };
    } catch (error) {
      console.error("❌ Erro ao fazer upload:", error);
      throw error;
    }
  }

  async deleteFile(fileId) {
    try {
      await this.drive.files.delete({
        fileId: fileId,
      });
      console.log(`✅ Arquivo deletado: ${fileId}`);
      return true;
    } catch (error) {
      console.error("❌ Erro ao deletar arquivo:", error);
      throw error;
    }
  }
}

let driveService = null;

export async function initializeGoogleDrive() {
  if (!driveService) {
    driveService = new GoogleDriveService();
    await driveService.initialize();
  }
  return driveService;
}

export function getGoogleDriveService() {
  return driveService;
}
