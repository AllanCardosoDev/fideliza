import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  const docxPath = path.join(
    __dirname,
    "Contrato Fideliza_ESC_0016_ Modelo.docx",
  );

  const content = fs.readFileSync(docxPath);
  const zip = new PizZip(content);
  const xmlContent = zip.file("word/document.xml").asText();
  
  const tags = [];
  const regex = /\{([^}]+)\}/g;
  let match;
  while ((match = regex.exec(xmlContent)) !== null) {
      const cleanTag = match[1].replace(/<[^>]+>/g, "");
      tags.push(cleanTag);
  }
  
  const uniqueTags = [...new Set(tags)];
  console.log("TAGS_FOUND_IN_ROOT_MODEL:");
  uniqueTags.sort().forEach(t => console.log(t));

} catch (e) {
  console.log("❌ Erro:", e.message);
}
