import { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ReactMarkdown from 'react-markdown';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import './App.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

// --- COMPONENTE DO FLASHCARD ---
function Flashcard({ question, answer, index }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div 
      onClick={() => setFlipped(!flipped)}
      style={{
        backgroundColor: '#ffffff',
        border: flipped ? '1px solid #10b981' : '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '24px',
        cursor: 'pointer',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '200px',
        position: 'relative'
      }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ color: flipped ? '#10b981' : '#3b82f6', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {flipped ? 'Resposta' : 'Pergunta'}
        </span>
        <span style={{ color: '#cbd5e1', fontWeight: '700', fontSize: '0.85rem' }}>
          #{index + 1}
        </span>
      </div>

      {!flipped ? (
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ color: '#0f172a', fontSize: '1.15rem', margin: '0 0 15px 0', lineHeight: '1.5', fontWeight: '700' }}>
            <ReactMarkdown
               components={{
                 p: ({node, ...props}) => <p style={{ margin: 0 }} {...props} />,
                 strong: ({node, ...props}) => <strong style={{ color: '#8b5cf6' }} {...props} /> 
               }}
            >
              {question}
            </ReactMarkdown>
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: 'auto', borderTop: '1px dashed #e2e8f0', paddingTop: '15px', textAlign: 'center' }}>
            👆 Clique para revelar
          </p>
        </div>
      ) : (
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ color: '#334155', fontSize: '1.2rem', lineHeight: '1.5', textAlign: 'center', fontWeight: '500' }}>
            <ReactMarkdown
               components={{
                 p: ({node, ...props}) => <p style={{ margin: 0 }} {...props} />,
                 strong: ({node, ...props}) => <strong style={{ color: '#0f172a', fontWeight: '800', backgroundColor: '#fef08a', padding: '2px 4px', borderRadius: '4px' }} {...props} />,
               }}
            >
              {answer}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

// --- APP PRINCIPAL ---
function App() {
  const [apiKey, setApiKey] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState(''); 
  const [error, setError] = useState('');
  
  const [viewMode, setViewMode] = useState('none'); 
  const [mnemonicsResult, setMnemonicsResult] = useState('');
  const [flashcards, setFlashcards] = useState([]);
  const [copied, setCopied] = useState(false);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileType = file.type;
    if (fileType !== "text/plain" && fileType !== "application/pdf") {
      setError("Por favor, envie apenas arquivos .TXT ou .PDF");
      return;
    }

    setFileName(file.name);
    setError('');
    setMnemonicsResult('');
    setFlashcards([]);
    setViewMode('none');
    
    try {
      if (fileType === "application/pdf") {
        setLoading(true);
        setLoadingType('pdf_reading'); 
        
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str).join(' ');
          fullText += pageText + '\n\n';
        }
        
        setFileContent(fullText); 
        setLoading(false);
        setLoadingType('');
      } else {
        const reader = new FileReader();
        reader.onload = (e) => setFileContent(e.target.result);
        reader.readAsText(file);
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao processar o arquivo: " + err.message);
      setLoading(false);
      setLoadingType('');
    }
  };

  const checkPreRequisites = () => {
    if (!apiKey) {
      setError("Por favor, insira sua Chave de API do Gemini.");
      return false;
    }
    if (!fileContent) {
      setError("Por favor, faça o upload de um arquivo primeiro.");
      return false;
    }
    return true;
  };

  const generateMnemonics = async () => {
    if (!checkPreRequisites()) return;
    
    setLoading(true);
    setLoadingType('mnemonics');
    setError('');
    setCopied(false);

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const promptSistema = `
        Atue como um especialista em neuroeducação e caçador de mnemônicos.
        Extraia truques, macetes, associações e mnemônicos escondidos na ortografia, gatilhos de exclusão e associações visuais bizarras.
        Categorize em: 1. Siglas, 2. Associações Visuais, 3. Raciocínio, 4. Pegadinhas.
        NÃO USE TABELAS. Use listas em bullet points.
        TEXTO: ${fileContent}
      `;

      const apiResult = await model.generateContent(promptSistema);
      setMnemonicsResult(apiResult.response.text());
      setViewMode('mnemonics');
    } catch (err) {
      console.error(err);
      setError(`Falha na API: ${err.message}`);
    } finally {
      setLoading(false);
      setLoadingType('');
    }
  };

  const generateFlashcards = async () => {
    if (!checkPreRequisites()) return;

    setLoading(true);
    setLoadingType('flashcards');
    setError('');

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      // O NOVO PROMPT ATÔMICO COM REGRAS DE OURO + MNEMÔNICOS
      const promptSistema = `
        Atue como um especialista em aprendizagem baseada em flashcards (Active Recall) e criador de questões para provas médicas.
        Sua tarefa é ler o documento fornecido e gerar flashcards curtos, objetivos e ideais para revisão rápida.

        REGRAS OBRIGATÓRIAS (CRÍTICAS):
        1. UM CONCEITO POR CARTA: Cada flashcard deve abordar APENAS UM conceito.
        2. RESPOSTAS CURTAS: Cada resposta deve ter NO MÁXIMO 1 frase curta ou até 15 palavras. Foco na resposta instintiva.
        3. PROIBIDO PERGUNTAS AMPLAS: NÃO crie perguntas do tipo "descreva", "explique", "compare" ou "fale sobre".
        4. PERGUNTAS FECHADAS: Prefira perguntas diretas ("Qual é o...", "Qual o pH...", "Qual o tratamento...").
        5. FRAGMENTAÇÃO INTELIGENTE: Se um tema tiver múltiplos pontos, gere múltiplos flashcards curtos (um para pH, um para microscopia, etc). Não faça cartas com respostas em formato de lista longa.
        6. MNEMÔNICOS OBRIGATÓRIOS: Você DEVE identificar macetes, dicas de prova, associações de letras ou visuais do texto e criar flashcards específicos para eles. (Exemplo: "Q: **Mnemônico:** Como lembrar a associação de Clamídia com os remédios? A: Letras D e A (Doxiciclina e Azitromicina)").
        7. PENSE: "Isso cabe em 5 a 10 segundos de resposta?" Se sim, a carta está boa.

        FORMATO OBRIGATÓRIO (Siga exatamente este padrão, separando as cartas com "==="):
        Q: [Pergunta direta e curta]
        A: [Resposta de até 15 palavras]
        ===

        TEXTO PARA ANÁLISE:
        ${fileContent}
      `;

      const apiResult = await model.generateContent(promptSistema);
      const textResponse = apiResult.response.text();
      
      const rawCards = textResponse.split('===');
      const uniqueCards = [];
      const seenQuestions = new Set(); 

      rawCards.forEach(cardStr => {
        const qMatch = cardStr.match(/Q:\s*([\s\S]*?)(?=A:|$)/);
        const aMatch = cardStr.match(/A:\s*([\s\S]*?)$/);
        
        if (qMatch && aMatch) {
          const rawQuestion = qMatch[1].trim();
          const answer = aMatch[1].trim();
          
          const normalizedQuestion = rawQuestion.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/gi, '').trim();

          // Mantemos a trava para evitar 5 perguntas 100% idênticas, mas como as perguntas agora são específicas (ex: "Qual o pH da VB?"), elas vão passar normalmente.
          if (!seenQuestions.has(normalizedQuestion) && rawQuestion.length > 5) {
            seenQuestions.add(normalizedQuestion);
            uniqueCards.push({ question: rawQuestion, answer: answer });
          }
        }
      });

      if (uniqueCards.length === 0) throw new Error("A IA não retornou o formato esperado. Tente analisar novamente.");
      
      setFlashcards(uniqueCards);
      setViewMode('flashcards');
    } catch (err) {
      console.error(err);
      setError(`Falha na API: ${err.message}`);
    } finally {
      setLoading(false);
      setLoadingType('');
    }
  };

  const copyMnemonics = () => {
    navigator.clipboard.writeText(mnemonicsResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const downloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(flashcards, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "flashcards_estudos.json");
    document.body.appendChild(downloadAnchorNode); 
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const downloadCSVForAnki = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; 
    flashcards.forEach(card => {
       let q = card.question.replace(/"/g, '""'); 
       let a = card.answer.replace(/"/g, '""').replace(/\n/g, "<br>"); 
       csvContent += `"${q}";"${a}"\r\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "anki_flashcards.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const styles = {
    page: { minHeight: '100vh', width: '100vw', backgroundColor: '#f4f4f5', padding: '40px 5%', fontFamily: '"Inter", "Segoe UI", sans-serif', color: '#0f172a', boxSizing: 'border-box', position: 'absolute', top: 0, left: 0 },
    container: { width: '100%', maxWidth: '1400px', margin: '0 auto', boxSizing: 'border-box' },
    headerText: { textAlign: 'center', color: '#1e1b4b', fontSize: '2.5rem', marginBottom: '10px', fontWeight: '800' },
    subText: { textAlign: 'center', color: '#64748b', fontSize: '1.1rem', marginBottom: '40px' },
    card: { backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', marginBottom: '40px', width: '100%', maxWidth: '800px', margin: '0 auto 40px auto', boxSizing: 'border-box' },
    label: { display: 'block', marginBottom: '8px', fontWeight: '600', color: '#334155', fontSize: '0.95rem' },
    input: { width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', color: '#0f172a', backgroundColor: '#f8fafc', outline: 'none', boxSizing: 'border-box' },
    dropzone: { padding: '40px 20px', border: '2px dashed #8b5cf6', borderRadius: '12px', textAlign: 'center', backgroundColor: '#f5f3ff', cursor: 'pointer', marginTop: '20px' },
    dropzoneText: { color: '#7c3aed', fontWeight: '600', fontSize: '1.1rem', margin: '0 0 10px 0' },
    fileNameItem: { display: 'inline-block', marginTop: '15px', padding: '8px 16px', backgroundColor: '#dcfce3', color: '#166534', borderRadius: '9999px', fontSize: '0.9rem', fontWeight: '600' },
    buttonRow: { display: 'flex', gap: '15px', marginTop: '25px', flexWrap: 'wrap' },
    btnMnemonic: { flex: 1, padding: '14px 20px', fontSize: '1.05rem', cursor: loading ? 'not-allowed' : 'pointer', backgroundColor: loading ? '#cbd5e1' : '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', minWidth: '200px', transition: '0.2s' },
    btnFlashcard: { flex: 1, padding: '14px 20px', fontSize: '1.05rem', cursor: loading ? 'not-allowed' : 'pointer', backgroundColor: loading ? '#cbd5e1' : '#0ea5e9', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', minWidth: '200px', transition: '0.2s' },
    errorBox: { backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444', color: '#991b1b', padding: '16px', borderRadius: '0 8px 8px 0', marginTop: '20px' },
    gridContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px', alignItems: 'stretch' },
    resultsCard: { backgroundColor: '#ffffff', borderRadius: '16px', padding: '40px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', borderTop: '6px solid #6366f1', width: '100%', maxWidth: '1000px', margin: '0 auto', boxSizing: 'border-box' },
    actionBtnRow: { display: 'flex', gap: '10px' }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        
        <h1 style={styles.headerText}>🧠 Central de Estudos IA</h1>
        <p style={styles.subText}>Extração de PDF: Flashcards Atômicos e Mnemônicos sem enrolação.</p>

        <div style={styles.card}>
          <div>
            <label style={styles.label}>🔑 Chave de API do Google Gemini</label>
            <input 
              type="password" 
              value={apiKey} 
              onChange={(e) => setApiKey(e.target.value)} 
              placeholder="Cole sua chave aqui (sk-...)"
              style={styles.input}
            />
          </div>

          <div style={styles.dropzone}>
            <p style={styles.dropzoneText}>📄 Envie seu arquivo em .PDF ou .TXT</p>
            <input 
              type="file" 
              accept=".txt, .pdf, application/pdf" 
              onChange={handleFileUpload} 
              style={{ display: 'block', margin: '0 auto', color: '#475569' }}
            />
            {loadingType === 'pdf_reading' && <div style={{marginTop: '15px', color: '#8b5cf6', fontWeight: 'bold'}}>Lendo e convertendo PDF... ⏳</div>}
            {fileName && loadingType !== 'pdf_reading' && <div style={styles.fileNameItem}>✓ {fileName} carregado</div>}
          </div>

          {error && <div style={styles.errorBox}><b>Atenção:</b> {error}</div>}

          <div style={styles.buttonRow}>
            <button onClick={generateMnemonics} disabled={loading} style={styles.btnMnemonic}>
              {loadingType === 'mnemonics' ? 'Procurando... ⏳' : '🔍 Caçar Mnemônicos'}
            </button>
            <button onClick={generateFlashcards} disabled={loading} style={styles.btnFlashcard}>
              {loadingType === 'flashcards' ? 'Minerando cartas... ⏳' : '⚡ Gerar Flashcards Clínicos'}
            </button>
          </div>
        </div>

        {viewMode === 'mnemonics' && mnemonicsResult && (
          <div style={styles.resultsCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '20px', marginBottom: '30px' }}>
              <h2 style={{ margin: 0, color: '#1e1b4b', fontSize: '1.8rem', fontWeight: 'bold' }}>🔍 Mnemônicos Encontrados</h2>
              <button onClick={copyMnemonics} style={{ padding: '8px 16px', backgroundColor: copied ? '#10b981' : '#f1f5f9', color: copied ? '#fff' : '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                {copied ? '✓ Copiado!' : '📋 Copiar Resumo'}
              </button>
            </div>
            
            <div style={{ color: '#1e293b', width: '100%' }}>
              <ReactMarkdown
                components={{
                  h2: ({node, ...props}) => <h2 style={{ color: '#ffffff', backgroundColor: '#6366f1', padding: '10px 20px', borderRadius: '8px', fontSize: '1.4rem', marginTop: '40px', marginBottom: '20px', display: 'inline-block' }} {...props} />,
                  h3: ({node, ...props}) => <h3 style={{ color: '#0f172a', fontSize: '1.2rem', marginTop: '20px', marginBottom: '10px' }} {...props} />,
                  ul: ({node, ...props}) => <ul style={{ paddingLeft: '20px', marginBottom: '30px' }} {...props} />,
                  li: ({node, ...props}) => <li style={{ marginBottom: '12px', lineHeight: '1.7', color: '#334155' }} {...props} />,
                  strong: ({node, ...props}) => <strong style={{ color: '#0f172a', fontWeight: '800', borderBottom: '2px solid #fcd34d' }} {...props} />,
                  p:  ({node, ...props}) => <p style={{ color: '#1e293b', lineHeight: '1.8', fontSize: '1.1rem', marginBottom: '16px' }} {...props} />,
                }}
              >
                {mnemonicsResult}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {viewMode === 'flashcards' && flashcards.length > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px', flexWrap: 'wrap', gap: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '1.5rem', marginRight: '10px' }}>⚡</span>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800' }}>Flashcards para Revisão</h2>
                <span style={{ marginLeft: '15px', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '6px 16px', borderRadius: '9999px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  {flashcards.length} cartas curtas
                </span>
              </div>
              
              <div style={styles.actionBtnRow}>
                <button onClick={downloadJSON} style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📥 Descarregar JSON
                </button>
                <button onClick={downloadCSVForAnki} style={{ padding: '10px 20px', backgroundColor: '#f97316', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ⭐ Exportar p/ Anki (.csv)
                </button>
              </div>
            </div>
            
            <div style={styles.gridContainer}>
              {flashcards.map((card, index) => (
                <Flashcard key={index} index={index} question={card.question} answer={card.answer} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;