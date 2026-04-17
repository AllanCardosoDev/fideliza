import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
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
  const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
  });

  // Docxtemplater logic to find tags
  // We can try to render it with a proxy to catch all accessed keys
  const tagsFound = new Set();
  const proxy = new Proxy({}, {
      get: (target, name) => {
          tagsFound.add(name);
          return "";
      }
  });

  try {
      doc.render(proxy);
  } catch (e) {
      // It might throw if it encounters a loop tag it can't handle with just a string
  }

  console.log("TAGS_DETECTED_BY_DOCXTEMPLATER:");
  Array.from(tagsFound).sort().forEach(t => console.log(t));

} catch (e) {
  console.log("❌ Erro:", e.message);
}
