import React, { useEffect, useMemo, useState } from "react";

// --- ÍCONES SEGUROS (Componentes Individuais) ---
const IconUpload = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);
const IconFile = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
    <polyline points="13 2 13 9 20 9" />
  </svg>
);
const IconCheck = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconDownload = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
const IconRefresh = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);
const IconBrain = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
  </svg>
);
const IconList = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);
const IconAlertTriangle = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);
const IconX = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

// ======================================================
// CONFIG: API KEY (NÃO EMBUTIR CHAVE NO CÓDIGO)
// - Vite: crie .env com VITE_GEMINI_API_KEY=...
// - Também aceita window.__GEMINI_API_KEY__ (se seu ambiente injetar)
// ======================================================
function getAutoApiKey() {
  const winKey =
    typeof window !== "undefined"
      ? (window.__GEMINI_API_KEY__ || window.GEMINI_API_KEY || window.apiKey || "")
      : "";

  const viteKey =
    typeof import.meta !== "undefined" && import.meta?.env?.VITE_GEMINI_API_KEY
      ? import.meta.env.VITE_GEMINI_API_KEY
      : "";

  return String(winKey || viteKey || "").trim();
}

// ======================================================
// JSON parser robusto (aceita JSON puro, ```json```, texto+JSON,
// array [..] ou objeto {..})
// ======================================================
function tryParseJsonFlexible(text) {
  if (!text || typeof text !== "string") return null;

  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch (_) {}

  const a0 = cleaned.indexOf("[");
  const a1 = cleaned.lastIndexOf("]");
  if (a0 !== -1 && a1 !== -1 && a1 > a0) {
    try {
      return JSON.parse(cleaned.slice(a0, a1 + 1));
    } catch (_) {}
  }

  const o0 = cleaned.indexOf("{");
  const o1 = cleaned.lastIndexOf("}");
  if (o0 !== -1 && o1 !== -1 && o1 > o0) {
    try {
      return JSON.parse(cleaned.slice(o0, o1 + 1));
    } catch (_) {}
  }

  return null;
}

function forceJsonArrayRecovery(text) {
  if (!text || typeof text !== "string") return null;

  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();

  // tenta achar o primeiro '[' e ir até o último '}' válido e fechar ']'
  const start = cleaned.indexOf("[");
  if (start === -1) return null;

  let end = cleaned.lastIndexOf("}");
  if (end === -1 || end <= start) return null;

  const candidate = cleaned.slice(start, end + 1) + "]";
  try {
    const parsed = JSON.parse(candidate);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function splitChunkInHalf(text) {
  const t = (text || "").trim();
  if (t.length < 2000) return [t]; // pequeno demais

  const mid = Math.floor(t.length / 2);
  // tenta quebrar em quebra de linha/frase perto do meio
  const window = 2000;
  const from = Math.max(0, mid - window);
  const to = Math.min(t.length, mid + window);
  const slice = t.slice(from, to);

  const breakPos =
    Math.max(
      slice.lastIndexOf("\n\n"),
      slice.lastIndexOf("\n"),
      slice.lastIndexOf(". "),
      slice.lastIndexOf("; "),
      slice.lastIndexOf(": ")
    );

  if (breakPos > 100) {
    const cut = from + breakPos + 1;
    return [t.slice(0, cut).trim(), t.slice(cut).trim()].filter(Boolean);
  }

  return [t.slice(0, mid).trim(), t.slice(mid).trim()].filter(Boolean);
}

// ======================================================
// Chunking do texto (pra não “estourar” e não truncar JSON)
// ======================================================
function chunkText(text, maxChars = 12000, overlap = 600) {
  const t = (text || "").trim();
  if (!t) return [];
  if (t.length <= maxChars) return [t];

  const chunks = [];
  let start = 0;

  while (start < t.length) {
    let end = Math.min(start + maxChars, t.length);

    const slice = t.slice(start, end);
    const lastBreak = Math.max(
      slice.lastIndexOf("\n\n"),
      slice.lastIndexOf("\n"),
      slice.lastIndexOf(". "),
      slice.lastIndexOf("; "),
      slice.lastIndexOf(": ")
    );

    // tenta quebrar em ponto "natural" sem encurtar demais
    if (lastBreak > 2000 && end !== t.length) {
      end = start + lastBreak + 1;
    }

    const chunk = t.slice(start, end).trim();
    if (chunk) chunks.push(chunk);

    if (end === t.length) break;

    // overlap para não perder contexto entre trechos
    start = Math.max(0, end - overlap);

    // segurança anti-loop
    if (start >= end) start = end;
  }

  return chunks;
}

//
// ======================================================
// Deduplicação simples (pergunta normalizada)
// ======================================================
function normalizeQuestion(q) {
  return String(q || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[“”‘’]/g, "'")
    .trim();
}

// ======================================================
// LÓGICA PRINCIPAL
// ======================================================
function FlashcardApp() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pdfLibLoaded, setPdfLibLoaded] = useState(false);

  const [fileName, setFileName] = useState("flashcards");
  const [statusMsg, setStatusMsg] = useState("");
  const [finalData, setFinalData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // API key: tenta auto (env/window). Se não tiver, usuário cola.
  const [apiKey, setApiKey] = useState(() => getAutoApiKey());
  const hasKey = useMemo(() => (apiKey || "").trim().length > 0, [apiKey]);

  // Inicialização do leitor de PDF (com worker correto)
  useEffect(() => {
    if (window.pdfjsLib) {
      setPdfLibLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.async = true;

    script.onload = () => {
      try {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        setPdfLibLoaded(true);
      } catch (e) {
        console.error(e);
        setErrorMsg("Falha ao configurar o worker do PDF.js.");
      }
    };

    script.onerror = () => setErrorMsg("Falha ao carregar a biblioteca de PDF. Verifique a sua ligação à internet.");
    document.body.appendChild(script);
  }, []);

  // --- IA (Gemini) robusta: limite + retries reduzindo quantidade ---
  const generateFlashcardsWithAI = async (text, opts = {}) => {
  const key = String(apiKey || "").trim();
  if (!key) throw new Error("Nenhuma API Key foi encontrada.");

  const PRIMARY_MODEL = 'gemini-3.1-pro-preview';
  const STRONG_FALLBACK_MODEL = 'gemini-2.5-pro';
  const FAST_FALLBACK_MODEL = 'gemini-2.5-flash';
  // Ordem: mais forte -> mais rápido/estável (em caso de limites)
  const MODELS = [PRIMARY_MODEL, STRONG_FALLBACK_MODEL, FAST_FALLBACK_MODEL];

  const {
    maxCards = 60,
    maxOutputTokens = 4096,
    temperature = 0.3,
    minChars = 400,
    depth = 0, // usado internamente
  } = opts;

  const cleanedText = String(text || "").trim();
  if (cleanedText.length < minChars) return [];

  const makeUrl = (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

  const makePrompt = (n, t) => `
Você é um especialista em educação e criação de flashcards.
Tarefa: gere ATÉ ${n} flashcards (mire em ${n}) (pergunta/resposta) baseados APENAS no texto abaixo.

Regras importantes:
- NÃO faça resumo e NÃO “priorize só o central”. A ideia é COBRIR o trecho inteiro.
- NÃO invente informação. Use somente o que está no texto.
- Varie os tipos de pergunta para cobrir o conteúdo: definição, comparação, causa/efeito, etapas/procedimento, exceções, números/dados, aplicações.
- Evite duplicatas e perguntas vagas.
- Respostas diretas e completas (uma a três frases, quando fizer sentido).

RETORNE APENAS JSON VÁLIDO exatamente neste formato:
[
  {"pergunta":"...","resposta":"..."}
]

TEXTO:
${t}
`.trim();

  const makePayload = (n, outTok, t) => ({
    contents: [{ parts: [{ text: makePrompt(n, t) }] }],
    generationConfig: {
      temperature,
      maxOutputTokens: outTok,
      responseMimeType: "application/json",
      responseSchema: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            pergunta: { type: "STRING" },
            resposta: { type: "STRING" },
          },
          required: ["pergunta", "resposta"],
        },
      },
    },
  });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const getRetryDelayMs = (rawBody) => {
  try {
    const j = JSON.parse(rawBody);
    const delay = j?.error?.details?.find?.((d) => String(d?.["@type"] || "").includes("RetryInfo"))?.retryDelay;
    if (typeof delay === "string") {
      const num = parseFloat(delay.replace("s", ""));
      if (!Number.isNaN(num)) return Math.max(0, Math.round(num * 1000));
    }
  } catch (_) {}
  return null;
};


async function callOnce(n, outTok, t) {
  let lastErr = null;

  // Retentativas por modelo (ajuda a lidar com 429 e instabilidades pontuais)
  const MAX_RETRIES_PER_MODEL = 4;

  for (const model of MODELS) {
    for (let attempt = 0; attempt < MAX_RETRIES_PER_MODEL; attempt++) {
      try {
        const url = makeUrl(model);

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(makePayload(n, outTok, t)),
        });

        if (!res.ok) {
          const body = await res.text().catch(() => "");

          // Modelo não existe/indisponível: tenta o próximo modelo
          if (res.status === 404 || res.status === 400) {
            lastErr = new Error(`Modelo ${model} indisponível: ${res.status}${body ? ` - ${body}` : ""}`);
            break; // troca de modelo
          }

          // 429: respeita retryDelay quando vier e aplica backoff com jitter
          if (res.status === 429) {
            const retryMsFromServer = getRetryDelayMs(body);
            const base = retryMsFromServer ?? 800 * (2 ** attempt); // 0.8s, 1.6s, 3.2s, 6.4s...
            const jitter = Math.floor(Math.random() * 250);
            const waitMs = Math.min(15000, base + jitter);

            lastErr = new Error(
              `Erro da API: 429 (rate limit). Aguardando ${Math.round(waitMs / 1000)}s e tentando novamente...`
            );
            await sleep(waitMs);
            continue; // tenta de novo no mesmo modelo
          }

          // Outros erros: não adianta insistir nesse modelo
          throw new Error(`Erro da API: ${res.status}${body ? ` - ${body}` : ""}`);
        }

        const result = await res.json();
        const jsonText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!jsonText) throw new Error("A IA devolveu uma resposta vazia.");

        let parsed = tryParseJsonFlexible(jsonText);
        if (!parsed) {
          const recovered = forceJsonArrayRecovery(jsonText);
          if (recovered) parsed = recovered;
        }
        if (!parsed) throw new Error("JSON inválido/truncado (parse falhou).");

        const arr = Array.isArray(parsed)
          ? parsed
          : (parsed.flashcards || parsed.items || parsed.perguntas || parsed.cards || []);

        if (!Array.isArray(arr)) throw new Error("Formato inesperado: não é array.");

        return arr
          .map((c) => ({
            pergunta: typeof c?.pergunta === "string" ? c.pergunta.trim() : "",
            resposta: typeof c?.resposta === "string" ? c.resposta.trim() : "",
          }))
          .filter((c) => c.pergunta && c.resposta);
      } catch (e) {
        lastErr = e;

        // Em erro de rede/parse, faz backoff leve e tenta novamente
        if (attempt < MAX_RETRIES_PER_MODEL - 1) {
          const waitMs = Math.min(6000, 600 * (2 ** attempt));
          await sleep(waitMs);
          continue;
        }

        break; // troca de modelo
      }
    }
  }

  throw lastErr || new Error("Falha ao chamar a IA (nenhum modelo funcionou).");
}

// Tentativas “comportadas” (reduzindo tamanho)
  try {
    return await callOnce(maxCards, maxOutputTokens, cleanedText);
  } catch (e1) {
    // tenta menor
    try {
      return await callOnce(Math.max(30, Math.floor(maxCards * 0.6)), 2048, cleanedText);
    } catch (e2) {
      // última: dividir texto (evita saída gigante)
      if (depth >= 1) throw e2; // evita recursão infinita

      const halves = splitChunkInHalf(cleanedText);
      if (halves.length < 2) throw e2;

      const out = [];
      for (let i = 0; i < halves.length; i++) {
        const partCards = await generateFlashcardsWithAI(halves[i], {
          maxCards: Math.max(20, Math.floor(maxCards / 2)),
          maxOutputTokens: 2048,
          temperature,
          minChars,
          depth: depth + 1,
        });
        out.push(...partCards);
      }
      return out;
    }
  }
};

  // --- PROCESSAMENTO DO FICHEIRO ---
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setErrorMsg("");
    setFinalData(null);

    if (!pdfLibLoaded) {
      setErrorMsg("O leitor de PDFs ainda está a carregar. Aguarde alguns segundos.");
      return;
    }

    if (!hasKey) {
      setErrorMsg("Cole a sua API Key do Gemini para habilitar a extração.");
      return;
    }

    setLoading(true);
    setStep(2);
    setFileName(file.name.replace(/\.pdf$/i, ""));

    try {
      setStatusMsg("A ler e a converter o ficheiro PDF...");

      const arrayBuffer = await file.arrayBuffer();
      const typedArray = new Uint8Array(arrayBuffer);
      const pdf = await window.pdfjsLib.getDocument({ data: typedArray }).promise;

      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(" ");
        fullText += pageText + "\n";
      }

      if (fullText.trim().length < 50) {
        throw new Error("Não foi encontrado texto suficiente. O seu PDF pode ser apenas imagens (documento digitalizado).");
      }

      // chunk + lotes para não quebrar
      const chunks = chunkText(fullText, 12000, 600);
      setStatusMsg(`IA a processar (${chunks.length} parte(s))...`);

      const allCards = [];
      const seen = new Set();

      // meta: garantir pelo menos 50 (sem duplicar)
      const TARGET_TOTAL = 50;

      // limite total (pra não virar infinito)
      const MAX_TOTAL = 500;

      // Faz até 3 "passagens" pelos chunks para tentar atingir o TARGET_TOTAL
      const MAX_PASSES = 3;
      let pass = 0;

      while (allCards.length < TARGET_TOTAL && pass < MAX_PASSES) {
        for (let i = 0; i < chunks.length; i++) {
          if (allCards.length >= MAX_TOTAL || allCards.length >= TARGET_TOTAL) break;

          const remaining = TARGET_TOTAL - allCards.length;
          // distribui o restante pelos chunks que faltam nesta passagem
          const chunksLeft = Math.max(1, chunks.length - i);
          const perChunk = Math.min(
            20,
            Math.max(6, Math.ceil(remaining / chunksLeft))
          );

          setStatusMsg(
            `IA a processar parte ${i + 1}/${chunks.length} (passo ${pass + 1}/${MAX_PASSES})...`
          );

          const cards = await generateFlashcardsWithAI(chunks[i], {
            maxCards: perChunk,
            maxOutputTokens: 4096,
            temperature: 0.3,
          });

          for (const c of cards) {
            const k = normalizeQuestion(c.pergunta);
            if (!k) continue;
            if (!seen.has(k)) {
              seen.add(k);
              allCards.push(c);
            }
          }

          if (allCards.length >= MAX_TOTAL) break;
        }

        pass += 1;
      }

      if (!allCards.length) throw new Error("Nenhuma pergunta válida foi extraída do documento.");

      // Se ainda não bateu 50, segue com o que conseguiu (sem inventar)
      setFinalData(allCards);
      setStep(3);
    } catch (error) {
      console.error(error);
      setErrorMsg(error?.message || "Ocorreu um erro desconhecido durante o processamento.");
      setStep(1);
    } finally {
      setLoading(false);
      setStatusMsg("");
      if (event.target) event.target.value = null;
    }
  };

  const handleDownload = () => {
    if (!finalData || !Array.isArray(finalData)) return;
    const blob = new Blob([JSON.stringify(finalData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${fileName}_flashcards.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-4xl bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-200">
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <IconFile /> Extrator de Flashcards
          </h1>
          <span className="text-xs font-bold bg-blue-600 px-3 py-1 rounded-full uppercase tracking-widest shadow-inner">
            Apenas Texto
          </span>
        </div>

        <div className="p-8">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-5 py-4 rounded-xl relative mb-8 flex items-start gap-4 shadow-sm">
              <div className="mt-0.5 text-red-600"><IconAlertTriangle /></div>
              <div className="flex-1">
                <strong className="font-bold block mb-1">Aviso do Sistema</strong>
                <span className="block text-sm whitespace-pre-wrap leading-relaxed">{errorMsg}</span>
              </div>
              <button onClick={() => setErrorMsg("")} className="text-red-400 hover:text-red-700 transition-colors bg-white/50 rounded-lg p-1" aria-label="Fechar">
                <IconX />
              </button>
            </div>
          )}

          {/* API KEY UI (se não vier do env/window) */}
          {!hasKey && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 px-5 py-4 rounded-xl mb-8">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-amber-700"><IconAlertTriangle /></div>
                <div className="flex-1">
                  <strong className="font-bold block mb-1">Chave Gemini necessária</strong>
                  <p className="text-sm leading-relaxed mb-3">
                    Para funcionar no navegador, você precisa configurar a API Key do Gemini no <code className="px-1 py-0.5 bg-white/70 rounded">.env</code> (Vite)
                    ou colar aqui (fica só no seu navegador).
                  </p>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-amber-800">
                      Cole a sua API Key
                    </label>
                    <input
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="AIza..."
                      className="w-full px-4 py-3 rounded-xl border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
                    />
                    <p className="text-xs text-amber-800/90">
                      Recomendado: criar <code className="px-1 py-0.5 bg-white/70 rounded">.env</code> com{" "}
                      <code className="px-1 py-0.5 bg-white/70 rounded">VITE_GEMINI_API_KEY=...</code> e reiniciar o dev server.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="text-center py-10">
              <div className="mx-auto w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6">
                <IconUpload />
              </div>
              <h2 className="text-3xl font-bold mb-4">Envie o seu ficheiro PDF</h2>
              <p className="text-slate-500 mb-10 max-w-md mx-auto text-lg">
                O motor de IA vai analisar o documento e extrair automaticamente <strong>perguntas e respostas</strong> formatadas num ficheiro JSON leve.
              </p>

              {!pdfLibLoaded ? (
                <div className="text-amber-600 bg-amber-50 px-4 py-2 rounded-lg inline-block font-medium animate-pulse">
                  A carregar motor de PDF...
                </div>
              ) : (
                <label
                  className={`inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-bold text-white text-lg cursor-pointer transition-all ${
                    hasKey ? "bg-blue-600 hover:bg-blue-700 hover:shadow-xl hover:-translate-y-1" : "bg-slate-400 cursor-not-allowed"
                  }`}
                  title={!hasKey ? "Cole uma API Key do Gemini para habilitar a extração." : ""}
                >
                  Selecionar PDF e Extrair
                  <input type="file" accept=".pdf" className="hidden" onChange={hasKey ? handleFileUpload : undefined} disabled={!hasKey} />
                </label>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="text-center py-20 space-y-6">
              <div className="mx-auto w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center animate-pulse">
                <IconBrain />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-slate-800">A processar o documento...</h3>
                <p className="text-blue-600 font-medium text-lg mt-4 animate-pulse">{statusMsg}</p>
              </div>
            </div>
          )}

          {step === 3 && finalData && Array.isArray(finalData) && (
            <div>
              <div className="text-center pb-8 border-b border-slate-200">
                <div className="mx-auto w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                  <IconCheck />
                </div>
                <h2 className="text-3xl font-bold text-slate-800">Extração Concluída!</h2>
                <p className="text-slate-600 mt-2 text-lg">
                  Foram extraídos <strong>{finalData.length} flashcards</strong> com sucesso.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                  <button
                    onClick={() => {
                      setStep(1);
                      setFinalData(null);
                      setErrorMsg("");
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-xl font-bold transition-all"
                  >
                    <IconRefresh /> Analisar Outro
                  </button>
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg hover:-translate-y-1 transition-all text-lg"
                  >
                    <IconDownload /> Descarregar JSON
                  </button>
                </div>
              </div>

              <div className="pt-10">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <IconList /> Pré-visualização dos Dados
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 pb-4">
                  {finalData.map((card, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col relative">
                      <div className="absolute top-4 right-4 text-xs font-bold text-slate-300">#{idx + 1}</div>
                      <div className="mb-4 pr-6">
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block mb-1">Pergunta</span>
                        <p className="font-bold text-slate-800 text-base">{card.pergunta}</p>
                      </div>
                      <div className="mt-auto pt-3 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block mb-1">Resposta</span>
                        <p className="text-slate-600 text-sm leading-relaxed">{card.resposta}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-slate-400 mt-4">
                  Nota: para evitar “quebrar” por respostas gigantes, o app gera em lotes (chunks) e limita o total a 500 flashcards.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- ESCUDO CONTRA FALHAS (Error Boundary) ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorInfo: error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 font-sans">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl w-full border border-red-200">
            <h1 className="text-2xl font-bold text-red-600 mb-4 flex items-center gap-2">
              <IconAlertTriangle /> Erro de Sistema
            </h1>
            <p className="text-slate-700 mb-6">Ocorreu um erro técnico inesperado. Por favor, reinicie a aplicação.</p>
            <button onClick={() => window.location.reload()} className="px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors">
              Recarregar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// OBRIGATÓRIO: O componente principal exportado TEM de se chamar "App"
export default function App() {
  return (
    <ErrorBoundary>
      <FlashcardApp />
    </ErrorBoundary>
  );
}