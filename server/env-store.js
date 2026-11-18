const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const caminhoEnv = path.resolve(__dirname, '..', '.env');

function salvarVariaveisEnv(variaveis) {
  const entradas = Object.entries(variaveis);
  if (entradas.some(([chave, valor]) => !/^[A-Z][A-Z0-9_]*$/.test(chave)
    || typeof valor !== 'string'
    || /[\r\n]/.test(valor))) {
    throw new Error('Não foi possível salvar as configurações informadas.');
  }

  const chaves = entradas.map(([chave]) => chave);
  const filtro = new RegExp(`^\\uFEFF?\\s*(?:${chaves.join('|')})\\s*=`);
  const conteudoAtual = fs.existsSync(caminhoEnv) ? fs.readFileSync(caminhoEnv, 'utf8') : '';
  const linhas = conteudoAtual.split(/\r?\n/).filter((linha) => !filtro.test(linha));
  const linhasNovas = entradas.map(([chave, valor]) => `${chave}=${JSON.stringify(valor)}`);
  const conteudo = `${linhas.join('\n').replace(/\n+$/, '')}\n${linhasNovas.join('\n')}\n`;
  const temporario = `${caminhoEnv}.${process.pid}.${crypto.randomBytes(6).toString('hex')}.tmp`;

  try {
    fs.writeFileSync(temporario, conteudo, { encoding: 'utf8', mode: 0o600 });
    fs.renameSync(temporario, caminhoEnv);
  } catch (erro) {
    if (fs.existsSync(temporario)) fs.unlinkSync(temporario);
    throw erro;
  }
}

module.exports = { salvarVariaveisEnv };
