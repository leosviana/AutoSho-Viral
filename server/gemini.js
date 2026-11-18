const { salvarVariaveisEnv } = require('./env-store');

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

function obterChave(configuracao) {
  const apiKey = configuracao?.apiKey || process.env.GEMINI_API_KEY;
  if (typeof apiKey !== 'string' || !apiKey || /[\r\n]/.test(apiKey)) {
    throw new Error('Informe uma chave de API do Gemini válida.');
  }
  return apiKey;
}

async function testarConexao(configuracao) {
  const apiKey = obterChave(configuracao);
  const resposta = await fetch(ENDPOINT, {
    headers: { 'x-goog-api-key': apiKey },
  });
  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    throw new Error(dados.error?.message || `Erro HTTP ${resposta.status}`);
  }
  if (!Array.isArray(dados.models)) {
    throw new Error('A resposta do Gemini não confirmou o acesso aos modelos.');
  }
}

function salvarChave(apiKey) {
  const chave = typeof apiKey === 'string' ? apiKey.trim() : '';
  if (!chave || /[\r\n]/.test(chave)) {
    throw new Error('Informe uma chave de API do Gemini válida.');
  }

  salvarVariaveisEnv({ GEMINI_API_KEY: chave });
  process.env.GEMINI_API_KEY = chave;
  return obterStatus();
}

function obterStatus() {
  const apiKey = process.env.GEMINI_API_KEY || '';
  return {
    configurado: Boolean(apiKey),
    chaveMascarada: apiKey ? `${apiKey.slice(0, 4)}${'*'.repeat(Math.max(4, apiKey.length - 4))}` : '',
  };
}

module.exports = { obterStatus, salvarChave, testarConexao };
