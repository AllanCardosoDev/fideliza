import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  const docxPath = path.join(
    __dirname,
    "public",
    "contrato_template.docx",
  );

  const content = fs.readFileSync(docxPath);
  const zip = new PizZip(content);
  const xmlContent = zip.file("word/document.xml").asText();
  
  const tags = [];
  const regex = /\{([^}]+)\}/g;
  let match;
  while ((match = regex.exec(xmlContent)) !== null) {
      // Clean XML tags inside the match
      const cleanTag = match[1].replace(/<[^>]+>/g, "");
      tags.push(cleanTag);
  }
  
  const uniqueTags = [...new Set(tags)];
  console.log("TAGS_FOUND:");
  uniqueTags.sort().forEach(t => console.log(t));

} catch (e) {
  console.log("❌ Erro:", e.message);
}
