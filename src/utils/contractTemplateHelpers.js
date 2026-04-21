// src/utils/contractTemplateHelpers.js
// Gerador completo de Contrato de Empréstimo — FidelizaCred
// Produz Word editando o template original + PDF via jsPDF

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { calcPMT } from "./helpers";

// ─── Constants ────────────────────────────────────────────────────────────────

const MUTUANTE = {
  razaoSocial: "FIDELIZACRED – Empresa Simples de Crédito",
  cnpj: "63.611.352/0001-01",
  endereco: "Rua Ouro Preto nº 484 – Coroado – Manaus, Amazonas",
};

const FORO = "Manaus – AM";

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const fmtDateBRLocal = (d) => {
  if (!d) return "—";
  const p = String(d).split("-");
  return p.length === 3 ? `${p[2]}.${p[1]}.${p[0]}` : d;
};

export const fmtDateLongLocal = (d) => {
  if (!d) return "—";
  try {
    return new Date(d + "T12:00:00").toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch (e) {
    return d;
  }
};

const fmtBRL = (v) =>
  Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const fmtNum = (v) => {
  if (typeof v === "string") {
    // Remove pontos de milhar e troca vírgula por ponto para o Number() entender
    const clean = v.replace(/\./g, "").replace(",", ".");
    const n = parseFloat(clean);
    v = isNaN(n) ? 0 : n;
  }
  return Number(v || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const fmtDateBR = (dateStr) => {
  if (!dateStr) return "—";
  const parts = String(dateStr).split("-");
  if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
  return dateStr;
};

const fmtDateLong = (dateStr) => {
  if (!dateStr) return "—";
  try {
    const dt = new Date(dateStr + "T12:00:00");
    return dt.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch (e) {
    return dateStr;
  }
};

/**
 * Protocolo: MM.DD/NNNN/YYYY
 * Ex.: 04.15/0001/2026
 */
export const generateContractProtocol = (sequenceNumber, date = new Date()) => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  const seq = String(sequenceNumber).padStart(4, "0");
  return `${month}.${day}/${seq}/${year}`;
};

export const getNextContractProtocolNumber = (
  contracts = [],
  date = new Date(),
) => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const prefix = `${month}.${day}/`;
  const todaysContracts = contracts.filter(
    (c) => c.protocol && c.protocol.startsWith(prefix),
  );
  return todaysContracts.length + 1;
};

/**
 * Gera tabela de parcelas a partir dos dados do contrato
 */
export const buildInstallmentRows = (contractData) => {
  const { start_date, qtde_parcelas, valor_parcela } = contractData;
  if (!start_date || !qtde_parcelas || !valor_parcela) return [];

  const rows = [];
  for (let i = 0; i < Number(qtde_parcelas); i++) {
    const dt = new Date(start_date + "T12:00:00");
    dt.setMonth(dt.getMonth() + i);
    const day = String(dt.getDate()).padStart(2, "0");
    const month = String(dt.getMonth() + 1).padStart(2, "0");
    const year = dt.getFullYear();
    rows.push({
      numero: String(i + 1).padStart(2, "0"),
      data: `${day}.${month}.${year}`,
      valor: fmtNum(valor_parcela),
    });
  }
  return rows;
};

// ─── Texto das Cláusulas (conforme modelo) ────────────────────────────────────

const buildClausulaTexts = (contractData) => {
  const { mutuaria_name, mutuaria_cnpj } = contractData;

  return [
    {
      titulo: "CLÁUSULA PRIMEIRA: DEFINIÇÕES",
      itens: [
        "a) TAXA DE JUROS TOTAL - É a remuneração da FIDELIZACRED - ESC.",
        "b) COAF – é o Conselho de Controle de Atividades Financeiras.",
        "c) CONTRATO – é o presente Instrumento, que regula a operação de crédito com suas descrições do Quadro Resumo e anexos discriminadores das garantias.",
        "d) CONTRATANTE MUTUÁRIA – é o microempreendedor individual, microempresa ou empresa de pequeno porte tomador do Empréstimo.",
        "e) IOF – É o Imposto de Operação Financeira, conforme estabelecido na legislação aplicável, incidente sobre o Empréstimo.",
        "f) CONTRATADA MUTUANTE – é a Empresa Simples de Crédito, empresa que fornece o Empréstimo a este contrato.",
        "g) DEVEDOR SOLIDÁRIO – É pessoa física interveniente garantidora do empréstimo contraído pela Contratante Mutuária.",
        "h) QUADRO RESUMO – são as descrições exatas dos termos do Empréstimo disponibilizada a Contratante Mutuária no momento da contratação, contendo valor solicitado, quantidade de parcelas, datas dos vencimentos das parcelas, juros totais, total a pagar, IOF incidente e opção das garantias acessórias.",
      ],
    },
    {
      titulo: "CLÁUSULA SEGUNDA: O EMPRÉSTIMO",
      itens: [
        "a) A Contratada Mutuante concedeu a Contratante Mutuária um Empréstimo no valor mutuado e de acordo com as demais condições indicadas no Quadro Resumo, cujo montante líquido, deduzida a remuneração da ESC, o IOF e eventuais pendências financeiras relativas a contratos anteriores, foi liberado por meio de crédito na conta da Contratante Mutuária.",
        "b) A Contratante Mutuária se obriga a restituir a Contratada Mutuante o valor total devido indicado no Quadro Resumo, sendo que os juros do Empréstimo serão calculados de forma exponencial e capitalizados diariamente, com base em um ano de 365 (trezentos e sessenta e cinco) dias.",
        "c) Fica ajustado que qualquer tolerância por parte da Contratada Mutuante, assim como a não exigência imediata de qualquer crédito, ou o recebimento após o vencimento, antecipado ou tempestivo, de qualquer débito, não constituirá novação, nem modificação do ajuste, nem qualquer precedente ou expectativa de direito da Contratada Mutuante de execução imediata.",
      ],
    },
    {
      titulo: "CLÁUSULA TERCEIRA: TARIFAS",
      itens: [
        "a) A Contratada Mutuante não cobrará qualquer valor a título de tarifa de originação do Empréstimo.",
      ],
    },
    {
      titulo: "CLÁUSULA QUARTA: O PAGAMENTO DO EMPRÉSTIMO",
      itens: [
        "a) As parcelas do empréstimo poderão ou não estar representadas por Notas Promissórias, emitidas pela Contratante e avalizadas pelo Devedor Solidário e deverão ser quitadas nos respectivos vencimentos, mediante opção no Quadro Resumo.",
        "b) As parcelas poderão, ainda, estar garantidas pela cessão Fiduciária de Direitos Creditórios, de titularidade da Contratante Mutuária, mediante opção no Quadro Resumo, sendo que as cláusulas da garantia fiduciária e a relação dos direitos creditórios com seus respectivos valores, devedores e vencimentos, constarão de um anexo específico, parte integrante do Contrato.",
        "c) Caso a data de vencimento de qualquer das parcelas indicadas no Quadro Resumo não seja Dia Útil, o valor devido deverá ser quitado no dia útil subsequente, sem a incidência de juros moratórios.",
      ],
    },
    {
      titulo: "CLÁUSULA QUINTA: PAGAMENTO ANTECIPADO DO EMPRÉSTIMO",
      itens: [
        "a) O Empréstimo poderá ser pago antecipadamente para a Contratada Mutuante por opção do Contratante Mutuante aplicando-se a redução proporcional da taxa de juros contratada.",
      ],
    },
    {
      titulo: "CLÁUSULA SEXTA: ATRASO DA CONTRATANTE MUTUÁRIA",
      itens: [
        "a) Para efeitos deste Contrato, entende-se por atraso o não pagamento no prazo e pela forma devida, de qualquer quantia de valor da parcela devida, ou qualquer outra obrigação, contraída junto a Contratada Mutuante em decorrência deste Contrato.",
        "b) A configuração de atraso ocorrerá independentemente de qualquer aviso ou notificação, resultando do simples descumprimento das obrigações assumidas neste contrato.",
        "c) O atraso no pagamento de quaisquer valores devidos, vencidos e não pagos na época em que forem exigíveis por força do disposto neste Contrato configurará a situação de atraso, ficando a dívida sujeita, do vencimento ao efetivo pagamento, aos seguintes encargos:\n    – Juros moratórios, cuja taxa se encontra indicada no Quadro Resumo e que incidirá sobre o valor da parcela em atraso;\n    – Multa moratória de 2% (dois por cento) que incidirá sobre o valor da parcela em atraso.",
      ],
    },
    {
      titulo: "CLÁUSULA SÉTIMA: VENCIMENTO ANTECIPADO DO EMPRÉSTIMO",
      itens: [
        "a) No caso de apuração de falsidade, fraude ou inexatidão de qualquer declaração, informação ou documento que houverem sido prestados pela Contratante Mutuária, seus representantes legais e/ou garantidores, ocorrerá o vencimento antecipado da totalidade do empréstimo em aberto.",
      ],
    },
    {
      titulo: "CLÁUSULA OITAVA: DISPOSIÇÕES GERAIS",
      itens: [
        "a) A Contratante Mutuária, seus representantes legais e/ou garantidores declaram que todas as informações fornecidas no momento da solicitação do Empréstimo são verdadeiras, especialmente acerca da licitude da origem da renda e patrimônio, bem como estarem cientes das disposições previstas na Lei nº 9.613/96 com as alterações introduzidas, inclusive pela Lei nº 12.683/12, devendo ainda informar à Contratada Mutuante sobre eventuais alterações nos dados cadastrais, sendo de sua responsabilidade todas as consequências decorrentes do descumprimento dessa obrigação.",
        "b) A Contratante Mutuária autoriza a Contratada Mutuante, em caráter irrevogável e irretratável e na forma da regulamentação aplicável, a (i) transmitir e consultar informações sobre o Contratante e/ou relativas a esta operação de Empréstimos às Centrais de Risco de Crédito, utilizando tais informações, inclusive para análise de capacidade de crédito do Contratante, bem como fornecer tais informações a terceiros que sejam contratados para prestar serviços de controle e cobrança por quaisquer meios das obrigações assumidas pela Contratante Mutuária com relação a este Contrato; (ii) levar a registro este Contrato em entidade Registradora autorizada pelo Banco Central; e (iii) em caso de inadimplemento, inserir o nome da Contratante Mutuária e de seus garantidores em bancos públicos ou privados de restrição cadastral.",
        "c) A Contratante Mutuária está ciente de que a Contratada Mutuante está sujeita a mecanismos de controle para fins de prevenção à lavagem de dinheiro e sobre o dever de comunicação ao COAF de operações que possam estar configuradas na Lei 9.613/98 (que dispõe sobre os crimes de lavagem ou ocultação de bens, direitos e valores) e demais disposições legais pertinentes à matéria.",
        "d) Independentemente das garantias acessórias ofertadas, o presente contrato, assinado por 2 (duas) testemunhas, é título executivo extrajudicial para a cobrança executiva das obrigações assumidas.",
        "e) O presente contrato é firmado em 3 (três) vias, assinado pelas partes e testemunhas, sendo que uma das vias é nesse ato entregue à Contratante Mutuária.",
        `f) Fica eleito o foro na cidade de ${FORO}, para resolver quaisquer questões relativas ao presente Contrato.`,
      ],
    },
  ];
};

// ─── Gerador de PDF (usa o template contratop.pdf com pdf-lib) ──────────────

export const generateContractPDF = async (contractData) => {
  const {
    protocol,
    mutuaria_name,
    mutuaria_cnpj,
    mutuaria_address,
    valor_contratado,
    taxa_juros,
    qtde_parcelas,
    aliquota_iof,
    data_contrato,
    start_date,
  } = contractData;

  let valor_parcela = contractData.valor_parcela;

  // Parse valor_parcela para detectar se é inválido
  const parsedVP = valor_parcela
    ? parseFloat(String(valor_parcela).replace(/\./g, "").replace(",", "."))
    : 0;

  // Auto-calculate valor_parcela if empty, zero, or NaN
  if (!valor_parcela || !parsedVP || isNaN(parsedVP) || parsedVP <= 0) {
    const vC =
      parseFloat(
        String(valor_contratado).replace(/\./g, "").replace(",", "."),
      ) || 0;
    const rC = (parseFloat(taxa_juros) || 0) / 100;
    const nC = parseInt(qtde_parcelas) || 0;
    console.log("   PMT inputs: principal=", vC, "rate=", rC, "n=", nC);
    if (vC > 0 && rC > 0 && nC > 0) {
      valor_parcela = calcPMT(vC, rC, nC).toFixed(2);
    } else if (vC > 0 && nC > 0) {
      // Se não tem juros, divide simples
      valor_parcela = (vC / nC).toFixed(2);
    }
  }

  console.log("📄 Carregando template contratop.pdf...");
  console.log("   valor_parcela final:", valor_parcela);

  const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");

  const templateResponse = await fetch("/contratop.pdf");
  if (!templateResponse.ok) {
    throw new Error("Template contratop.pdf não encontrado em /contratop.pdf");
  }
  const templateBytes = await templateResponse.arrayBuffer();
  const pdfDoc = await PDFDocument.load(templateBytes);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pages = pdfDoc.getPages();
  const page1 = pages[0];
  const page3 = pages.length > 2 ? pages[2] : null;

  const W = rgb(1, 1, 1); // branco
  const K = rgb(0, 0, 0); // preto

  // Função utilitária: primeiro apaga TODA a área com retângulo branco,
  // depois escreve o texto novo. O retângulo deve ser generoso para garantir
  // que nenhum fragmento do texto original do template fique visível.
  const whiteOut = (pg, rx, ry, rw, rh) => {
    pg.drawRectangle({ x: rx, y: ry, width: rw, height: rh, color: W });
  };

  const writeText = (pg, text, tx, ty, opts = {}) => {
    const sz = opts.size || 9;
    const f = opts.bold ? fontBold : font;
    pg.drawText(String(text ?? "—"), { x: tx, y: ty, size: sz, font: f, color: K });
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // PÁGINA 1: Protocolo + Bloco de dados do cliente no parágrafo introdutório
  //
  // ESTRATÉGIA: O template PDF original contém dados de outro cliente
  // (nome, CNPJ, endereço, data). Em vez de cobrir campo a campo, cobrimos
  // TODO o bloco de linhas onde esses dados aparecem no parágrafo introdutório
  // e reescrevemos o trecho completo — incluindo frases de ligação — para
  // que não reste nenhum fragmento do texto antigo.
  // ══════════════════════════════════════════════════════════════════════════════

  const { width: pageWidth } = page1.getSize();
  const ML = 62;                                    // margem esquerda
  const CW = Math.min(pageWidth - ML - 30, 490);   // largura de conteúdo

  const name  = (mutuaria_name || "—").toUpperCase();
  const cnpj  = mutuaria_cnpj || "—";
  const addr  = mutuaria_address || "—";

  // ── Protocolo ──
  whiteOut(page1, 185, 686, 370, 28);
  writeText(page1, protocol || "—", 259, 698, { size: 10, bold: true });

  // ── Bloco do cliente no parágrafo introdutório ──
  // O template original contém ~4 linhas com: nome antigo (possivelmente
  // longo, quebrando em 2 linhas), CNPJ antigo, endereço antigo e texto
  // de ligação ("inscrita no CNPJ/CPF sob o nº ..., com sede na ...,
  // doravante denominada CONTRATANTE MUTUÁRIA, celebram ...").
  // Cobrimos tudo de uma vez (y:593 → y:650 = 57pt, ~5 linhas de texto)
  // e reescrevemos com os dados do novo cliente.
  whiteOut(page1, ML, 593, CW, 57);

  writeText(page1, `${name}, inscrita no CNPJ/CPF`, ML + 4, 641, { size: 9 });
  writeText(page1, `sob o nº ${cnpj}, com sede na`, ML + 4, 629, { size: 9 });
  writeText(page1, `${addr}, doravante denominada CONTRATANTE`, ML + 4, 617, { size: 9 });
  writeText(page1, `MUTUÁRIA, celebram o presente contrato nos termos das cláusulas abaixo:`, ML + 4, 605, { size: 9 });

  // ══════════════════════════════════════════════════════════════════════════════
  // PÁGINA 3: Assinaturas + Quadro Resumo + Parcelas
  // ══════════════════════════════════════════════════════════════════════════════

  if (page3) {
    const dataLonga = fmtDateLongLocal(data_contrato);

    // ── Data por extenso ──
    whiteOut(page3, ML, 716, CW, 28);
    writeText(page3, `MANAUS – AM, ${dataLonga}.`, 310, 727, { size: 10 });

    // ── Assinatura Mutuário: nome + CNPJ + rótulo ──
    // Cobrir a área inteira incluindo o rótulo "CONTRATANTE MUTUÁRIO" abaixo
    whiteOut(page3, ML, 664, CW, 38);
    writeText(page3,
      `${name} - CNPJ: ${cnpj}`,
      71, 690,
      { size: 10 }
    );
    writeText(page3, "CONTRATANTE MUTUÁRIO", 71, 675, { size: 9, bold: true });

    // ── Identificação da Mutuária (Quadro Resumo) ──

    // Razão Social
    whiteOut(page3, 152, 504, 398, 26);
    writeText(page3, name, 162, 516);

    // CNPJ
    whiteOut(page3, 152, 491, 398, 26);
    writeText(page3, cnpj, 162, 503);

    // Endereço
    whiteOut(page3, 152, 478, 398, 26);
    writeText(page3, addr, 162, 491);

    // ── Dados da Operação ──
    // Cada campo: retângulo 24px de altura, começando 10pt abaixo da baseline
    const opFields = [
      { baseline: 453, value: fmtNum(valor_contratado) },
      { baseline: 440, value: fmtDateBRLocal(data_contrato) },
      { baseline: 427, value: String(qtde_parcelas || "—") },
      { baseline: 414, value: `${taxa_juros || "—"}%` },
      { baseline: 401, value: fmtNum(valor_parcela) },
      { baseline: 388, value: fmtNum(aliquota_iof) },
    ];
    for (const f of opFields) {
      whiteOut(page3, 208, f.baseline - 10, 342, 24);
      writeText(page3, f.value, 218, f.baseline);
    }

    // ── Tabela de Parcelas ──
    // Cobrir TODA a área da tabela — INCLUSIVE o header original do template
    // para evitar cabeçalho duplicado.

    const installments = buildInstallmentRows({ ...contractData, valor_parcela });
    const half = Math.ceil(installments.length / 2);

    // Cobrir: do topo da tabela (y≈370, acima do header original)
    // até bem abaixo da última linha de dados
    const maxRows = Math.max(half, 9);
    const covTop = 370;
    const covBot = 340 - (maxRows * 12) - 15;
    whiteOut(page3, 68, covBot, 460, covTop - covBot);

    // Redesenhar header da tabela
    const headerY = 356;
    writeText(page3, "Parcela", 77, headerY, { size: 8, bold: true });
    writeText(page3, "Data", 130, headerY, { size: 8, bold: true });
    writeText(page3, "Valor (R$)", 218, headerY, { size: 8, bold: true });
    writeText(page3, "Parcela", 310, headerY, { size: 8, bold: true });
    writeText(page3, "Data", 364, headerY, { size: 8, bold: true });
    writeText(page3, "Valor (R$)", 452, headerY, { size: 8, bold: true });

    // Coordenadas das colunas de dados
    const c = {
      n1: 77,  d1: 130, v1: 218,
      n2: 310, d2: 364, v2: 452,
    };

    const startY = 341;
    const rH = 12;

    for (let i = 0; i < half; i++) {
      const y = startY - (i * rH);
      const L = installments[i];
      const R = installments[i + half];

      page3.drawText(L.numero, { x: c.n1, y, size: 9, font, color: K });
      page3.drawText(L.data,   { x: c.d1, y, size: 9, font, color: K });
      page3.drawText(L.valor,  { x: c.v1, y, size: 9, font, color: K });

      if (R) {
        page3.drawText(R.numero, { x: c.n2, y, size: 9, font, color: K });
        page3.drawText(R.data,   { x: c.d2, y, size: 9, font, color: K });
        page3.drawText(R.valor,  { x: c.v2, y, size: 9, font, color: K });
      }
    }

    // Grade da tabela
    const gK = rgb(0.4, 0.4, 0.4);
    const gTop = headerY + 10;
    const gBot = startY - ((half - 1) * rH) - 4;

    // Horizontais
    page3.drawLine({
      start: { x: 74, y: gTop }, end: { x: 522, y: gTop },
      thickness: 0.5, color: gK,
    });
    page3.drawLine({
      start: { x: 74, y: headerY - 4 }, end: { x: 522, y: headerY - 4 },
      thickness: 0.5, color: gK,
    });
    for (let i = 0; i <= half; i++) {
      const ly = startY - (i * rH) + 10;
      page3.drawLine({
        start: { x: 74, y: ly }, end: { x: 522, y: ly },
        thickness: 0.5, color: gK,
      });
    }
    // Verticais
    for (const vx of [74, 122, 212, 302, 354, 446, 522]) {
      page3.drawLine({
        start: { x: vx, y: gTop }, end: { x: vx, y: gBot },
        thickness: 0.5, color: gK,
      });
    }
  }

  // ── Salvar e fazer download ──
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const safeName = (mutuaria_name || "contrato").replace(/[^a-zA-Z0-9]/g, "_");
  const fileName = `${protocol ? protocol.replace(/\//g, "-") : "contrato"}_${safeName}.pdf`;

  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log(`✅ PDF gerado a partir do template contratop.pdf: ${fileName}`);
};

// ─── Gerador de DOCX Blob (lógica compartilhada PDF ↔ Word) ─────────────────

const generateContractDocxBlob = async (contractData) => {
  const {
    protocol,
    mutuaria_name,
    mutuaria_cnpj,
    mutuaria_address,
    valor_contratado,
    taxa_juros,
    qtde_parcelas,
    aliquota_iof,
    data_contrato,
    start_date,
  } = contractData;

  let valor_parcela = contractData.valor_parcela;

  // Auto-calculate valor_parcela if empty or zero
  if (
    !valor_parcela ||
    parseFloat(String(valor_parcela).replace(/\./g, "").replace(",", ".")) === 0
  ) {
    const vC =
      parseFloat(
        String(valor_contratado).replace(/\./g, "").replace(",", "."),
      ) || 0;
    const rC = (parseFloat(taxa_juros) || 0) / 100;
    const nC = parseInt(qtde_parcelas) || 0;
    if (vC > 0 && rC > 0 && nC > 0) {
      valor_parcela = calcPMT(vC, rC, nC).toFixed(2);
    }
  }

  // Carregar template .docx do public/
  const response = await fetch("/contrato_template.docx");
  if (!response.ok) {
    throw new Error(
      "Template não encontrado em /contrato_template.docx. Verifique se o arquivo foi copiado para a pasta public/.",
    );
  }
  const arrayBuffer = await response.arrayBuffer();

  const zip = new PizZip(arrayBuffer);

  // ─── PÓS-PROCESSAMENTO DO XML ───
  try {
    const xmlPath = "word/document.xml";
    let xmlContent = zip.file(xmlPath).asText();

    // PASSO 1: Desfragmentar tags {CAMPO} que o Word pode ter quebrado
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
      "START_DATE",
      "VALOR_TOTAL",
      "JUROS",
    ];
    campos.forEach((campo) => {
      const chars = campo.split("");
      let pat = "\\{";
      for (let i = 0; i < chars.length; i++) {
        if (i > 0) pat += "(?:<[^>]*>)*";
        pat += chars[i];
      }
      pat += "(?:<[^>]*>)*\\}";
      xmlContent = xmlContent.replace(new RegExp(pat, "g"), `{${campo}}`);
    });

    // PASSO 2: Substituir textos hardcoded do template
    xmlContent = xmlContent.replace(/04\.13\/0016\/2026/g, protocol || "—");

    xmlContent = xmlContent.replace(
      /13(?:<[^>]*>|\s)*de(?:<[^>]*>|\s)*[Aa]bril(?:<[^>]*>|\s)*de(?:<[^>]*>|\s)*2026/g,
      fmtDateLongLocal(data_contrato).replace(" ", " "),
    );
    xmlContent = xmlContent.replace(
      /13(?:\.|\<[^>]*\>)*04(?:\.|\<[^>]*\>)*2026/g,
      fmtDateBRLocal(data_contrato),
    );

    xmlContent = xmlContent.replace(/>18<\/w:t>/, `>${qtde_parcelas || "—"}</w:t>`);
    xmlContent = xmlContent.replace(
      /ELAINE MEIRELES GUIMARAES OLIVEIRA VEREADOR/g,
      (mutuaria_name || "—").toUpperCase(),
    );
    xmlContent = xmlContent.replace(
      /SAMIA ZANIS DE SOUZA/g,
      (mutuaria_name || "—").toUpperCase(),
    );
    xmlContent = xmlContent.replace(/25380152000198/g, mutuaria_cnpj || "—");
    xmlContent = xmlContent.replace(
      /39\.770\.347\/0001-59/g,
      mutuaria_cnpj || "—",
    );
    xmlContent = xmlContent.replace(
      /Travessa Lapa[^<]*/g,
      mutuaria_address || "—",
    );

    // PASSO 3: Vermelho → Preto
    xmlContent = xmlContent.replace(/w:val="EE0000"/g, 'w:val="000000"');

    // PASSO 4: Reconstruir a tabela de parcelas dinamicamente
    try {
      const xmlDoc = new DOMParser().parseFromString(xmlContent, "text/xml");
      const xmlSerializer = new XMLSerializer();
      const allTables = xmlDoc.getElementsByTagName("w:tbl");

      let installmentTable = null;
      for (let t = 0; t < allTables.length; t++) {
        const txt = allTables[t].textContent;
        if (txt.includes("Parcela") && txt.includes("Data") && txt.includes("Valor") && txt.includes("20.0")) {
          installmentTable = allTables[t];
          break;
        }
      }

      if (installmentTable) {
        const tblRows = installmentTable.getElementsByTagName("w:tr");
        const headerRow = tblRows[0];
        const templateRow = tblRows[1];

        const installments = buildInstallmentRows({ ...contractData, valor_parcela });
        const half = Math.ceil(installments.length / 2);

        const makeCell = (templateCell, text, widthDxa) => {
          const cell = templateCell.cloneNode(true);
          const tcW = cell.getElementsByTagName("w:tcW")[0];
          if (tcW && widthDxa) tcW.setAttribute("w:w", String(widthDxa));
          const wts = cell.getElementsByTagName("w:t");
          if (wts.length > 0) {
            wts[0].textContent = text;
            while (wts.length > 1) {
              wts[1].parentNode.removeChild(wts[1]);
            }
          }
          const paras = cell.getElementsByTagName("w:p");
          for (let p = 0; p < paras.length; p++) {
            if (paras[p].getAttributeNS) {
              paras[p].setAttribute("w14:paraId", Math.random().toString(16).substr(2, 8).toUpperCase());
              paras[p].setAttribute("w14:textId", Math.random().toString(16).substr(2, 8).toUpperCase());
            }
          }
          return cell;
        };

        const templateCells = templateRow.getElementsByTagName("w:tc");
        const cellTemplates = [];
        for (let c = 0; c < 6; c++) {
          cellTemplates.push(templateCells[c]);
        }

        const widths = [988, 1842, 1843, 996, 1843, 1843];

        const rowsToRemove = [];
        for (let r = tblRows.length - 1; r >= 1; r--) {
          rowsToRemove.push(tblRows[r]);
        }
        rowsToRemove.forEach(row => installmentTable.removeChild(row));

        for (let i = 0; i < half; i++) {
          const leftItem = installments[i];
          const rightItem = installments[i + half];

          const newRow = xmlDoc.createElementNS("http://schemas.openxmlformats.org/wordprocessingml/2006/main", "w:tr");
          newRow.setAttribute("w14:paraId", Math.random().toString(16).substr(2, 8).toUpperCase());
          newRow.setAttribute("w14:textId", "77777777");

          newRow.appendChild(makeCell(cellTemplates[0], leftItem.numero, widths[0]));
          newRow.appendChild(makeCell(cellTemplates[1], leftItem.data, widths[1]));
          newRow.appendChild(makeCell(cellTemplates[2], leftItem.valor, widths[2]));

          if (rightItem) {
            newRow.appendChild(makeCell(cellTemplates[3], rightItem.numero, widths[3]));
            newRow.appendChild(makeCell(cellTemplates[4], rightItem.data, widths[4]));
            newRow.appendChild(makeCell(cellTemplates[5], rightItem.valor, widths[5]));
          } else {
            newRow.appendChild(makeCell(cellTemplates[3], "", widths[3]));
            newRow.appendChild(makeCell(cellTemplates[4], "", widths[4]));
            newRow.appendChild(makeCell(cellTemplates[5], "", widths[5]));
          }

          installmentTable.appendChild(newRow);
        }

        xmlContent = xmlSerializer.serializeToString(xmlDoc);
      }
    } catch (rebuildErr) {
      console.warn("Aviso: Não foi possível reconstruir a tabela de parcelas:", rebuildErr);
    }

    zip.file(xmlPath, xmlContent);
  } catch (err) {
    console.error("Erro ao pré-processar XML do Word:", err);
  }

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  const installments = buildInstallmentRows(contractData);

  const renderData = {
    MUTUARIA_NAME: (mutuaria_name || "—").toUpperCase(),
    MUTUARIA_CNPJ: mutuaria_cnpj || "—",
    MUTUARIA_ADDRESS: mutuaria_address || "—",
    VALOR_CONTRATADO: fmtNum(valor_contratado),
    DATA_CONTRATO: fmtDateBRLocal(data_contrato),
    DATA_CONTRATO_EXTENSO: fmtDateLongLocal(data_contrato),
    QTDE_PARCELAS: String(qtde_parcelas || "—"),
    TAXA_JUROS: String(taxa_juros || "—"),
    VALOR_PARCELA: fmtNum(valor_parcela),
    ALIQUOTA_IOF: fmtNum(aliquota_iof),
    PROTOCOL: protocol || "—",
    START_DATE: fmtDateBRLocal(start_date),
    INSTALLMENTS: installments,
    VALOR_TOTAL: fmtNum(valor_contratado),
    JUROS: String(taxa_juros || "—"),
  };

  try {
    doc.render(renderData);
  } catch (err) {
    console.warn("Aviso ao renderizar template:", err.message);
  }

  return doc.getZip().generate({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
};

// ─── Gerador de Word via template original (.docx) ──────────────────────────

export const generateContractWord = async (contractData) => {
  const {
    protocol,
    mutuaria_name,
  } = contractData;

  const out = await generateContractDocxBlob(contractData);

  // ─── ENVIAR PARA SERVIDOR PARA CONVERTER PARA PDF ───
  const safeName = (mutuaria_name || "contrato").replace(/[^a-zA-Z0-9]/g, "_");
  const docxFileName = `${protocol ? protocol.replace(/\//g, "-") : "contrato"}_${safeName}.docx`;

  try {
    const formData = new FormData();
    formData.append("docx", out, docxFileName);

    console.log("📄 Enviando DOCX para conversão para PDF...");
    const convertResponse = await fetch("/api/convert-docx-pdf", {
      method: "POST",
      body: formData,
    });

    if (!convertResponse.ok) {
      throw new Error(`Erro na conversão: ${convertResponse.statusText}`);
    }

    // Receber PDF e fazer download
    const pdfBlob = await convertResponse.blob();
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const pdfFileName = docxFileName.replace(".docx", ".pdf");

    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = pdfFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(pdfUrl);

    console.log(`✅ PDF gerado e baixado: ${pdfFileName}`);
  } catch (err) {
    console.warn(
      "⚠️ Erro ao converter para PDF via servidor, fazendo download do DOCX em vez disso:",
      err.message,
    );

    // Fallback: Download DOCX se conversão falhar
    const url = URL.createObjectURL(out);
    const a = document.createElement("a");
    a.href = url;
    a.download = docxFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};
