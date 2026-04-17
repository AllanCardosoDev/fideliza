const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");

try {
  const docxPath = path.join(
    __dirname,
    "Contrato Fideliza_ESC_0016_ Modelo.docx",
  );

  // Verificar se arquivo existe
  if (!fs.existsSync(docxPath)) {
    console.log("❌ Arquivo não encontrado:", docxPath);
    process.exit(1);
  }

  console.log("📂 Abrindo arquivo:", docxPath);

  // Tentar usando adm-zip
  try {
    const zip = new AdmZip(docxPath);
    const xmlEntry = zip.getEntry("word/document.xml");

    if (!xmlEntry) {
      console.log("❌ Arquivo document.xml não encontrado no .docx");
      process.exit(1);
    }

    const xmlContent = zip.readAsText(xmlEntry);

    // Extrair texto usando regex simples
    const textMatches = xmlContent.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
    const fullText = textMatches
      .map((m) => m.replace(/<w:t[^>]*>/, "").replace(/<\/w:t>/, ""))
      .join("");

    console.log("\n" + "=".repeat(100));
    console.log("CONTRATO EXTRAÍDO COM SUCESSO");
    console.log("=".repeat(100) + "\n");
    console.log(fullText);
    console.log("\n" + "=".repeat(100));

    // Salvar em arquivo
    fs.writeFileSync("contratos_conteudo_extraido.txt", fullText, "utf-8");
    console.log("\n✅ Salvo em: contratos_conteudo_extraido.txt");
  } catch (e) {
    console.log("❌ Erro ao processar com adm-zip:", e.message);
    process.exit(1);
  }
} catch (e) {
  console.log("❌ Erro:", e.message);
  process.exit(1);
}
