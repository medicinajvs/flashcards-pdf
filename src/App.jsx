import { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ReactMarkdown from 'react-markdown';
import './App.css';

// Componente do Flashcard com design moderno em Grid
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
      // Efeito sutil ao passar o mouse (simulado com estilo inline estático para o React básico)
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)'}
    >
      {/* Cabeçalho do Card: Tag + Número */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ 
          color: flipped ? '#10b981' : '#3b82f6', 
          fontWeight: '700', 
          fontSize: '0.75rem', 
          textTransform: 'uppercase', 
          letterSpacing: '1px' 
        }}>
          {flipped ? 'Resposta' : 'Pergunta'}
        </span>
        <span style={{ color: '#cbd5e1', fontWeight: '700', fontSize: '0.85rem' }}>
          #{index + 1}
        </span>
      </div>

      {/* Corpo do Card (Gira dependendo do estado) */}
      {!flipped ? (
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ color: '#0f172a', fontSize: '1.15rem', margin: '0 0 15px 0', lineHeight: '1.5', fontWeight: '700' }}>
            {question}
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: 'auto', borderTop: '1px dashed #e2e8f0', paddingTop: '15px', textAlign: 'center' }}>
            👆 Clique para revelar
          </p>
        </div>
      ) : (
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ color: '#334155', fontSize: '1.05rem', lineHeight: '1.6', flexGrow: 1 }}>
            <ReactMarkdown
               components={{
                 p: ({node, ...props}) => <p style={{ margin: '0 0 10px 0' }} {...props} />,
                 ul: ({node, ...props}) => <ul style={{ paddingLeft: '20px', margin: '0 0 10px 0' }} {...props} />,
                 li: ({node, ...props}) => <li style={{ marginBottom: '5px' }} {...props} />,
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

function App() {
  const [apiKey, setApiKey] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [flashcards, setFlashcards] = useState([]);
  const [error, setError] = useState('');

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== "text/plain") {
      setError("Por favor, envie apenas arquivos .txt");
      return;
    }

    setFileName(file.name);
    setError('');
    setFlashcards([]); 
    
    const reader = new FileReader();
    reader.onload = (e) => setFileContent(e.target.result);
    reader.readAsText(file);
  };

  const analyzeText = async () => {
    if (!apiKey) {
      setError("Por favor, insira sua Chave de API do Gemini.");
      return;
    }
    if (!fileContent) {
      setError("Por favor, faça o upload de um arquivo .txt.");
      return;
    }

    setLoading(true);
    setError('');
    setFlashcards([]);

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const promptSistema = `
        Atue como um professor universitário e especialista em criação de Flashcards para recuperação ativa.
        Sua missão é realizar uma EXTRAÇÃO EXAUSTIVA do documento fornecido e criar o MÁXIMO POSSÍVEL de flashcards. 

        DIRETRIZES CRÍTICAS:
        1. COBERTURA TOTAL (100%): Crie flashcards para absolutamente TODOS os conceitos, sintomas, critérios diagnósticos, tratamentos e pegadinhas de prova.
        2. PRINCÍPIO DA INFORMAÇÃO MÍNIMA: Quebre informações complexas em flashcards curtos.
        3. ORDEM CRONOLÓGICA: Siga exatamente a ordem de aparição dos assuntos no texto original.

        FORMATO OBRIGATÓRIO E ESTRITO:
        Use a sigla "Q:" para a pergunta, "A:" para a resposta, e separe cada card com "===" (três sinais de igual).

        Q: [Sua pergunta aqui]
        A: [Sua resposta direta aqui]
        ===
        Q: [Sua próxima pergunta aqui]
        A: [Sua próxima resposta aqui]
        ===

        TEXTO PARA ANÁLISE:
        ${fileContent}
      `;

      const apiResult = await model.generateContent(promptSistema);
      const textResponse = apiResult.response.text();
      
      const rawCards = textResponse.split('===');
      const parsedCards = rawCards.map(cardStr => {
        const qMatch = cardStr.match(/Q:\s*([\s\S]*?)(?=A:|$)/);
        const aMatch = cardStr.match(/A:\s*([\s\S]*?)$/);
        
        if (qMatch && aMatch) {
          return {
            question: qMatch[1].trim(),
            answer: aMatch[1].trim()
          };
        }
        return null;
      }).filter(Boolean);

      if (parsedCards.length === 0) {
        throw new Error("A IA não retornou o formato de flashcards esperado.");
      }

      setFlashcards(parsedCards);
    } catch (err) {
      console.error(err);
      setError(`Falha na API: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Layout Expandido para acomodar o Grid
  const styles = {
    page: { minHeight: '100vh', width: '100vw', backgroundColor: '#f8fafc', padding: '40px 5%', fontFamily: '"Inter", "Segoe UI", sans-serif', color: '#0f172a', boxSizing: 'border-box', position: 'absolute', top: 0, left: 0 },
    container: { width: '100%', maxWidth: '1400px', margin: '0 auto', boxSizing: 'border-box' }, // MaxWidth aumentado para caber mais quadradinhos
    headerText: { textAlign: 'center', color: '#2563eb', fontSize: '2.5rem', marginBottom: '10px', fontWeight: '800' },
    subText: { textAlign: 'center', color: '#475569', fontSize: '1.1rem', marginBottom: '40px' },
    card: { backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', marginBottom: '30px', width: '100%', maxWidth: '800px', margin: '0 auto 40px auto', boxSizing: 'border-box' },
    label: { display: 'block', marginBottom: '8px', fontWeight: '600', color: '#334155', fontSize: '0.95rem' },
    input: { width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', color: '#0f172a', backgroundColor: '#f1f5f9', outline: 'none', boxSizing: 'border-box' },
    dropzone: { padding: '40px 20px', border: '2px dashed #3b82f6', borderRadius: '12px', textAlign: 'center', backgroundColor: '#eff6ff', cursor: 'pointer', marginTop: '20px' },
    dropzoneText: { color: '#2563eb', fontWeight: '600', fontSize: '1.1rem', margin: '0 0 10px 0' },
    fileNameItem: { display: 'inline-block', marginTop: '15px', padding: '8px 16px', backgroundColor: '#dcfce3', color: '#166534', borderRadius: '9999px', fontSize: '0.9rem', fontWeight: '600' },
    button: { width: '100%', padding: '14px 24px', fontSize: '1.1rem', cursor: loading ? 'not-allowed' : 'pointer', backgroundColor: loading ? '#94a3b8' : '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 'bold', boxShadow: loading ? 'none' : '0 4px 6px rgba(37, 99, 235, 0.3)', marginTop: '25px' },
    errorBox: { backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444', color: '#991b1b', padding: '16px', borderRadius: '0 8px 8px 0', marginTop: '20px' },
    // O grande segredo do visual lado a lado está aqui:
    gridContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: '24px',
      alignItems: 'stretch'
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        
        <h1 style={styles.headerText}>⚡ Flashcards Inteligentes</h1>
        <p style={styles.subText}>Extração exaustiva para recuperação ativa do seu material.</p>

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
            <p style={styles.dropzoneText}>📄 Envie seu resumo em .TXT</p>
            <input 
              type="file" 
              accept=".txt" 
              onChange={handleFileUpload} 
              style={{ display: 'block', margin: '0 auto', color: '#475569' }}
            />
            {fileName && <div style={styles.fileNameItem}>✓ {fileName}</div>}
          </div>

          {error && <div style={styles.errorBox}><b>Atenção:</b> {error}</div>}

          <button onClick={analyzeText} disabled={loading} style={styles.button}>
            {loading ? 'Minerando dados do texto... ⏳' : 'Extrair e Gerar Flashcards 🚀'}
          </button>
        </div>

        {flashcards.length > 0 && (
          <div>
            {/* Título da seção de visualização de dados parecido com a sua imagem */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px' }}>
              <span style={{ fontSize: '1.5rem', marginRight: '10px' }}>📑</span>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800' }}>Pré-visualização dos Dados</h2>
              <span style={{ marginLeft: 'auto', backgroundColor: '#dcfce3', color: '#166534', padding: '6px 16px', borderRadius: '9999px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                {flashcards.length} flashcards gerados
              </span>
            </div>
            
            {/* O Container em GRID mágico */}
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