// scripts/prepare-contract-template.cjs
// Prepara o contrato Word como template docxtemplater
// Substitui os campos por marcadores {CAMPO} e remove toda cor vermelha

const fs = require("fs");
const path = require("path");
const PizZip = require("pizzip");

const INPUT = path.join(
  __dirname,
  "..",
  "Contrato Fideliza_ESC_0016_ Modelo.docx",
);
const OUTPUT = path.join(__dirname, "..", "public", "contrato_template.docx");

if (!fs.existsSync(INPUT)) {
  console.error("❌ Arquivo não encontrado:", INPUT);
  process.exit(1);
}

// ── 1. Remove atributos de rastreamento (principal causa de split de runs) ───
function removeTracking(xml) {
  xml = xml.replace(/\s+w:rsid[A-Za-z0-9]*="[^"]*"/g, "");
  xml = xml.replace(/<w:proofErr\b[^/]*\/>/g, "");
  xml = xml.replace(/<w:bookmarkStart\b[^/]*\/>/g, "");
  xml = xml.replace(/<w:bookmarkEnd\b[^/]*\/>/g, "");
  return xml;
}

// ── 2. Mescla runs adjacentes com rPr idêntico dentro de cada parágrafo ──────
// Garante que texto dividido pelo Word em múltiplos <w:r> seja unificado
// para que as substituições por regex funcionem corretamente.
function mergeAdjacentRuns(xml) {
  return xml.replace(
    /(<w:p\b[^>]*>)([\s\S]*?)(<\/w:p>)/g,
    (_, pOpen, body, pClose) => {
      const RUN_RE =
        /<w:r\b[^>]*>((?:<w:rPr>[\s\S]*?<\/w:rPr>)?)<w:t(\s[^>]*)?>([^<]*)<\/w:t><\/w:r>/g;

      let result = "";
      let pending = null;
      let lastEnd = 0;
      let m;

      function flush() {
        if (!pending) return;
        const ta = pending.preserve ? ' xml:space="preserve"' : "";
        result += `<w:r>${pending.rpr}<w:t${ta}>${pending.text}</w:t></w:r>`;
        pending = null;
      }

      RUN_RE.lastIndex = 0;
      while ((m = RUN_RE.exec(body)) !== null) {
        const before = body.slice(lastEnd, m.index);
        if (before) {
          flush();
          result += before;
        }

        const rpr = m[1];
        const preserve = (m[2] || "").includes("preserve");
        const text = m[3];

        if (!pending) {
          pending = { rpr, text, preserve };
        } else if (pending.rpr === rpr) {
          pending.text += text;
          pending.preserve = pending.preserve || preserve;
        } else {
          flush();
          pending = { rpr, text, preserve };
        }
        lastEnd = m.index + m[0].length;
      }

      flush();
      result += body.slice(lastEnd);
      return pOpen + result + pClose;
    },
  );
}

// ── 3. Remove TODA cor vermelha do documento ──────────────────────────────────
// Em um contrato, texto vermelho = campo placeholder → deve virar preto.
// Texto preto padrão não precisa de tag <w:color> (já é o default do Word).
function removeRedColor(xml) {
  return xml.replace(/<w:color\b[^>]*\/>/g, (match) => {
    const v = match.match(/w:val="([0-9A-Fa-f]{6})"/i);
    if (!v) return match; // cor de tema sem w:val → manter
    const r = parseInt(v[1].slice(0, 2), 16);
    const g = parseInt(v[1].slice(2, 4), 16);
    const b = parseInt(v[1].slice(4, 6), 16);
    return r > 150 && r > g * 2 && r > b * 2 ? "" : match;
  });
}

try {
  const content = fs.readFileSync(INPUT);
  const zip = new PizZip(content);
  let xml = zip.file("word/document.xml").asText();

  // Passo 1 — limpar markup de rastreamento
  xml = removeTracking(xml);

  // Passo 2 — mesclar runs com mesma formatação (resolve split-runs)
  xml = mergeAdjacentRuns(xml);

  // Passo 3 — remover toda cor vermelha do documento
  xml = removeRedColor(xml);

  // Passo 4 — substituir campos por marcadores {CAMPO}

  xml = xml.replace(/SAMIA ZANIS DE SOUZA/g, "{MUTUARIA_NAME}");
  xml = xml.replace(/39\.770\.347\/0001-59/g, "{MUTUARIA_CNPJ}");
  xml = xml.replace(
    /Travessa Lapa, nº 01 Qd 11 Cj Canaranas I, Bairro Cidade Nova - Manaus, AM\.?/g,
    "{MUTUARIA_ADDRESS}",
  );
  xml = xml.replace(/15\.000,00/g, "{VALOR_CONTRATADO}");
  xml = xml.replace(/13\.04\.2026/g, "{DATA_CONTRATO}");
  xml = xml.replace(
    /13 de [Aa][Bb][Rr][Ii][Ll] de 2026/g,
    "{DATA_CONTRATO_EXTENSO}",
  );
  xml = xml.replace(
    /\b18\b(?=\s*(?:Taxas|taxas|parcelas|Parcelas|\(dezoito\)))/g,
    "{QTDE_PARCELAS}",
  );
  xml = xml.replace(/2[.,]8%/g, "{TAXA_JUROS}%");
  xml = xml.replace(/1\.308,00/g, "{VALOR_PARCELA}");
  xml = xml.replace(/1308,00/g, "{VALOR_PARCELA}");
  xml = xml.replace(/75,45/g, "{ALIQUOTA_IOF}");
  xml = xml.replace(/ESC_0016/g, "{PROTOCOL}");

  // Passo 5 — salvar
  zip.file("word/document.xml", xml);
  const outputBuffer = zip.generate({ type: "nodebuffer" });
  fs.writeFileSync(OUTPUT, outputBuffer);

  console.log("✅ Template criado em:", OUTPUT);
  console.log("\nMarcadores encontrados no template:");
  const campos = [
    "MUTUARIA_NAME",
    "MUTUARIA_CNPJ",
    "MUTUARIA_ADDRESS",
    "VALOR_CONTRATADO",
    "DATA_CONTRATO",
    "DATA_CONTRATO_EXTENSO",
    "QTDE_PARCELAS",
    "TAXA_JUROS",
    "VALOR_PARCELA",
    "ALIQUOTA_IOF",
    "PROTOCOL",
  ];
  campos.forEach((c) => {
    const n = (xml.match(new RegExp("\\{" + c + "\\}", "g")) || []).length;
    console.log(`  {${c}} — ${n} ocorrência(s)`);
  });
  console.log("  {PROTOCOL}              → Protocolo do contrato");
} catch (err) {
  console.error("❌ Erro:", err.message);
  process.exit(1);
}
