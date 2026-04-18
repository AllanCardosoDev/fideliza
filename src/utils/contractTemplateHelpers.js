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

// ─── Gerador de PDF ───────────────────────────────────────────────────────────

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

  // Auto-calculate valor_parcela if empty or zero
  if (!valor_parcela || parseFloat(String(valor_parcela).replace(/\./g, "").replace(",", ".")) === 0) {
    const vC = parseFloat(String(valor_contratado).replace(/\./g, "").replace(",", ".")) || 0;
    const rC = (parseFloat(taxa_juros) || 0) / 100;
    const nC = parseInt(qtde_parcelas) || 0;
    if (vC > 0 && rC > 0 && nC > 0) {
       valor_parcela = calcPMT(rC, nC, vC).toFixed(2);
    }
  }

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pW = doc.internal.pageSize.getWidth();
  const pH = doc.internal.pageSize.getHeight();
  const mL = 20;
  const mR = 20;
  const cW = pW - mL - mR;

  // ── Cores: Somente Preto (Padrão MS Word)
  const BLACK = [0, 0, 0];
  const GRAY = [100, 100, 100];

  let y = 35;

  // ── Título Centralizado
  doc.setTextColor(...BLACK);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("INSTRUMENTO CONTRATUAL PARTICULAR DE MÚTUO FINANCEIRO", pW / 2, y, { align: "center" });
  
  y += 7;
  doc.text(protocol || "—", pW / 2, y, { align: "center" });

  // ── Intro
  y += 12;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const introText = `O presente contrato define as condições gerais aplicáveis ao Empréstimo, concedido por ${MUTUANTE.razaoSocial}, inscrita no CNPJ pelo número ${MUTUANTE.cnpj}, doravante denominada Mutuante, e ${(mutuaria_name || "—").toUpperCase()}, inscrita no CNPJ pelo número ${mutuaria_cnpj || "—"}, doravante denominado Mutuário, de acordo com a Lei Complementar nº 167 de 25/04/2018.`;
  const introLines = doc.splitTextToSize(introText, cW);
  doc.text(introLines, mL, y);
  y += introLines.length * 5 + 4;

  // ── Cláusulas
  const clausulas = buildClausulaTexts(contractData);

  const addPage = () => {
    doc.addPage();
    y = 35;
  };

  const checkPage = (needed = 10) => {
    if (y + needed > pH - 20) addPage();
  };

  for (const clausula of clausulas) {
    checkPage(16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(clausula.titulo, mL, y);
    y += 5;

    for (const item of clausula.itens) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const lines = doc.splitTextToSize("   " + item, cW);
      checkPage(lines.length * 5 + 2);
      doc.text(lines, mL, y);
      y += lines.length * 5 + 2;
    }
    y += 2;
  }

  // ── Data e Assinaturas
  checkPage(50);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const dataLonga = fmtDateLongLocal(data_contrato);
  // Alinhado à direita de acordo com o padrão ou centro
  doc.text(`MANAUS – AM, ${dataLonga}.`, pW - mR, y, { align: "right" });
  y += 25;

  // Assinatura Mutuário
  const sigW = (cW - 20) / 2;
  doc.setDrawColor(...BLACK);
  doc.line(mL, y, mL + sigW, y);
  doc.setFontSize(9);
  doc.text((mutuaria_name || "—").toUpperCase(), mL + sigW / 2, y + 5, { align: "center" });
  doc.text(`CNPJ: ${mutuaria_cnpj || "—"}`, mL + sigW / 2, y + 9, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.text("CONTRATANTE MUTUÁRIO", mL + sigW / 2, y + 14, { align: "center" });

  // Assinatura Mutuante
  const sigX2 = mL + sigW + 20;
  doc.setFont("helvetica", "normal");
  doc.line(sigX2, y, sigX2 + sigW, y);
  doc.text("FIDELIZACRED", sigX2 + sigW / 2, y + 5, { align: "center" });
  doc.text(`CNPJ: ${MUTUANTE.cnpj}`, sigX2 + sigW / 2, y + 9, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.text("CONTRATADA MUTUANTE", sigX2 + sigW / 2, y + 14, { align: "center" });

  // ── QUADRO RESUMO (Mantido na folha final ou contínuo se houver espaço)
  checkPage(80);
  y += 25;

  // Identificação da Mutuante
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Identificação da Mutuante:", mL, y);
  y += 1;

  const mutuanteRows = [
    ["Razão Social", MUTUANTE.razaoSocial],
    ["CNPJ", MUTUANTE.cnpj],
    ["Endereço", MUTUANTE.endereco],
  ];
  autoTable(doc, {
    startY: y,
    margin: { left: mL, right: mR },
    body: mutuanteRows,
    styles: { fontSize: 9, cellPadding: 2, textColor: BLACK, lineColor: BLACK },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 40 } },
    theme: "grid",
  });
  y = doc.lastAutoTable.finalY + 5;

  // Identificação da Mutuária
  doc.setFont("helvetica", "bold");
  doc.text("Identificação da Mutuária:", mL, y);
  y += 1;

  const mutuariaRows = [
    ["Razão Social", (mutuaria_name || "—").toUpperCase()],
    ["CNPJ", mutuaria_cnpj || "—"],
    ["Endereço", mutuaria_address || "—"],
  ];
  autoTable(doc, {
    startY: y,
    margin: { left: mL, right: mR },
    body: mutuariaRows,
    styles: { fontSize: 9, cellPadding: 2, textColor: BLACK, lineColor: BLACK },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 40 } },
    theme: "grid",
  });
  y = doc.lastAutoTable.finalY + 5;

  // Dados da Operação
  doc.setFont("helvetica", "bold");
  doc.text("Dados da Operação:", mL, y);
  y += 1;

  const operacaoRows = [
    ["Natureza da operação", "Empréstimo"],
    ["Valor total contratado", fmtNum(valor_contratado)],
    ["Data do Contrato", fmtDateBRLocal(data_contrato)],
    ["Quantidade de Parcelas", String(qtde_parcelas || "—")],
    ["Taxa de Juros", `${taxa_juros || "—"}%`],
    ["Valor da Parcela", fmtNum(valor_parcela)],
    ["Alíquota IOF", fmtNum(aliquota_iof)],
  ];
  autoTable(doc, {
    startY: y,
    margin: { left: mL, right: mR },
    body: operacaoRows,
    styles: { fontSize: 9, cellPadding: 2, textColor: BLACK, lineColor: BLACK },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 } },
    theme: "grid",
  });
  y = doc.lastAutoTable.finalY + 8;

  // Tabela de Vencimentos
  doc.setFont("helvetica", "bold");
  doc.text("Vencimento das Parcelas:", mL, y);
  y += 1;

  const installments = buildInstallmentRows(contractData);

  // Dividir em 2 colunas
  const half = Math.ceil(installments.length / 2);
  const col1 = installments.slice(0, half);
  const col2 = installments.slice(half);

  const tableBody = [];
  for (let i = 0; i < half; i++) {
    const r1 = col1[i];
    const r2 = col2[i] || { numero: "", data: "", valor: "" };
    tableBody.push([
      r1.numero, r1.data, r1.valor,
      r2.numero, r2.data, r2.valor,
    ]);
  }

  autoTable(doc, {
    startY: y,
    margin: { left: mL, right: mR },
    head: [["Parcela", "Data", "Valor", "Parcela", "Data", "Valor"]],
    body: tableBody,
    styles: { fontSize: 9, cellPadding: 2, halign: "center", textColor: BLACK, lineColor: BLACK },
    headStyles: { fillColor: [240, 240, 240], textColor: BLACK, fontStyle: "bold" },
    theme: "grid",
  });

  // ── Footer e Cabeçalho (com Logo) em todas as páginas
  try {
    const response = await fetch("/logo.jpeg");
    if (response.ok) {
      const blob = await response.blob();
      const reader = new FileReader();
      const base64data = await new Promise((res) => {
        reader.onloadend = () => res(reader.result);
        reader.readAsDataURL(blob);
      });

      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Logo (no topo, centralizado) apenas na primeira página
        if (i === 1) {
          doc.addImage(base64data, "JPEG", pW / 2 - 20, 10, 40, 16, undefined, "FAST");
        }

        // Footer
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...GRAY);
        doc.text(
          `FIDELIZACRED – ${MUTUANTE.cnpj} | Gerado em ${new Date().toLocaleString("pt-BR")} | Pg. ${i}/${pageCount}`,
          pW / 2,
          pH - 10,
          { align: "center" }
        );
      }
    }
  } catch (err) {
    console.warn("Aviso: Logo não inserida. Retornando PDF sem logo.", err);
  }

  const safeName = (mutuaria_name || "contrato").replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(
    `${protocol ? protocol.replace(/\//g, "-") : "contrato"}_${safeName}.pdf`,
  );
};

// ─── Gerador de Word via template original (.docx) ──────────────────────────

export const generateContractWord = async (contractData) => {
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
  if (!valor_parcela || parseFloat(String(valor_parcela).replace(/\./g, "").replace(",", ".")) === 0) {
    const vC = parseFloat(String(valor_contratado).replace(/\./g, "").replace(",", ".")) || 0;
    const rC = (parseFloat(taxa_juros) || 0) / 100;
    const nC = parseInt(qtde_parcelas) || 0;
    if (vC > 0 && rC > 0 && nC > 0) {
       valor_parcela = calcPMT(rC, nC, vC).toFixed(2);
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
    // Ex: {MU</w:t></w:r><w:r><w:t>TUARIA_NAME} → {MUTUARIA_NAME}
    const campos = [
      "MUTUARIA_NAME", "MUTUARIA_CNPJ", "MUTUARIA_ADDRESS",
      "VALOR_CONTRATADO", "DATA_CONTRATO", "DATA_CONTRATO_EXTENSO",
      "QTDE_PARCELAS", "TAXA_JUROS", "VALOR_PARCELA", "ALIQUOTA_IOF",
      "PROTOCOL", "START_DATE", "VALOR_TOTAL", "JUROS",
    ];
    // Regex genérica: chave abre, letras intercaladas com tags XML opcionais, chave fecha
    campos.forEach((campo) => {
      const chars = campo.split("");
      let pat = "\\{";
      for (let i = 0; i < chars.length; i++) {
        if (i > 0) pat += "(?:<[^>]*>)*"; // tags XML opcionais entre letras
        pat += chars[i];
      }
      pat += "(?:<[^>]*>)*\\}";
      xmlContent = xmlContent.replace(new RegExp(pat, "g"), `{${campo}}`);
    });

    // PASSO 2: Substituir textos hardcoded do template
    // Protocolo no cabeçalho
    xmlContent = xmlContent.replace(/04\.13\/0016\/2026/g, protocol || "—");

    // Data por extenso ("13 de Abril de 2026" ou similar com tolerância a tags xml)
    xmlContent = xmlContent.replace(
      /13(?:<[^>]*>|\s)*de(?:<[^>]*>|\s)*[Aa]bril(?:<[^>]*>|\s)*de(?:<[^>]*>|\s)*2026/g,
      fmtDateLongLocal(data_contrato).replace(" ", " "),
    );
    // Data curta 13.04.2026 (com tolerância)
    xmlContent = xmlContent.replace(/13(?:\.|<[^>]*>)*04(?:\.|<[^>]*>)*2026/g, fmtDateBRLocal(data_contrato));

    // Quantidade de parcelas (18 hardcoded no template — sem tag)
    // Cuidadoso: só trocar >18< se seguido de </w:t> (campo de texto, não layout)
    xmlContent = xmlContent.replace(/>18<\/w:t>/g, `>${qtde_parcelas || "—"}</w:t>`);

    // Nomes antigos de mutuárias que podem estar no template
    xmlContent = xmlContent.replace(/ELAINE MEIRELES GUIMARAES OLIVEIRA VEREADOR/g, (mutuaria_name || "—").toUpperCase());
    xmlContent = xmlContent.replace(/SAMIA ZANIS DE SOUZA/g, (mutuaria_name || "—").toUpperCase());
    xmlContent = xmlContent.replace(/25380152000198/g, mutuaria_cnpj || "—");
    xmlContent = xmlContent.replace(/39\.770\.347\/0001-59/g, mutuaria_cnpj || "—");
    xmlContent = xmlContent.replace(
      /Travessa Lapa[^<]*/g,
      mutuaria_address || "—",
    );

    // PASSO 3: Vermelho → Preto
    xmlContent = xmlContent.replace(/w:val="EE0000"/g, 'w:val="000000"');

    zip.file(xmlPath, xmlContent);
  } catch (err) {
    console.error("Erro ao pré-processar XML do Word:", err);
  }

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  // Tabela de parcelas para o Word (caso o template suporte loops {#installments})
  const installments = buildInstallmentRows(contractData);

  // Dados para renderização
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
    // Fallbacks para nomes alternativos
    VALOR_TOTAL: fmtNum(valor_contratado),
    JUROS: String(taxa_juros || "—"),
  };

  try {
    doc.render(renderData);
  } catch (err) {
    console.warn("Aviso ao renderizar template:", err.message);
    // Continuar mesmo com erro - pode ser que nem todos os marcadores existam
  }

  const out = doc.getZip().generate({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  const url = URL.createObjectURL(out);
  const a = document.createElement("a");
  a.href = url;
  const safeName = (mutuaria_name || "contrato").replace(/[^a-zA-Z0-9]/g, "_");
  a.download = `${protocol ? protocol.replace(/\//g, "-") : "contrato"}_${safeName}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
