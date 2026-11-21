const $ = (seletor) => document.querySelector(seletor);

const estado = {
  vendasMin: 500,
  comissaoMin: 5,
  ordem: 'oportunidade',
  busca: '',
  categoria: '',
  afiliadosMin: 0,
  afiliadosQtdMax: 200,
};

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const inteiro = new Intl.NumberFormat('pt-BR');
const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

// ---------- Log e status ----------

function log(mensagem, tipo = 'info') {
  const pre = $('#log');
  pre.querySelector('.log-empty')?.remove();
  const linha = document.createElement('span');
  linha.className = `log-line log-${tipo}`;
  const hora = document.createElement('span');
  hora.className = 'ts';
  hora.textContent = new Date().toLocaleTimeString('pt-BR');
  linha.append(hora, mensagem);
  pre.appendChild(linha);
  pre.scrollTop = pre.scrollHeight;
}

function definirStatus(situacao, texto) {
  const el = $('#syncStatus');
  el.dataset.state = situacao;
  el.querySelector('.status-text').textContent = texto;
}

async function chamarApi(url, opcoes) {
  const resposta = await fetch(url, opcoes);
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    if (url.startsWith('/api/config/') && [404, 405].includes(resposta.status)) {
      throw new Error('O servidor atual não reconhece esta rota. Inicie o Radar com npm run dev e abra http://localhost:3000; não use o Live Server.');
    }
    throw new Error(dados.erro || `Erro ${resposta.status}`);
  }
  return dados;
}

// ---------- Lista de produtos ----------

const linkSeguro = (url) => (/^https:\/\//i.test(url) ? url : null);

function criarCard(p) {
  const href = linkSeguro(p.link);
  const li = document.createElement('li');
  li.className = 'product';

  const miniatura = document.createElement(href ? 'a' : 'div');
  miniatura.className = 'thumb';
  if (href) {
    miniatura.href = href;
    miniatura.target = '_blank';
    miniatura.rel = 'noopener noreferrer sponsored';
    miniatura.setAttribute('aria-label', `Abrir ${p.nome} na Shopee`);
  }
  if (p.imagem) {
    const img = document.createElement('img');
    img.src = p.imagem;
    img.alt = '';
    img.loading = 'lazy';
    img.referrerPolicy = 'no-referrer';
    miniatura.appendChild(img);
  }

  const info = document.createElement('div');
  info.className = 'product-info';

  const titulo = document.createElement('h3');
  if (href) {
    const a = document.createElement('a');
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer sponsored';
    a.textContent = p.nome;
    titulo.appendChild(a);
  } else {
    titulo.textContent = p.nome;
  }

  const meta = document.createElement('p');
  meta.className = 'product-meta';
  meta.textContent = `${inteiro.format(p.vendas)} vendas · ${decimal.format(p.comissaoPct)}% de comissão`;

  const extra = document.createElement('p');
  extra.className = 'product-extra';
  const partes = [moeda.format(p.preco)];
  if (p.nota > 0) partes.push(`nota ${decimal.format(p.nota)}`);
  if (p.loja) partes.push(p.loja);
  if (p.categoria) partes.push(p.categoria);
  if (Number.isFinite(p.afiliadosEstimados)) {
    partes.push(`${inteiro.format(p.afiliadosEstimados)} afiliados`);
  }
  extra.textContent = partes.join(' · ');

  info.append(titulo, meta, extra);

  const lado = document.createElement('div');
  lado.className = 'product-side';
  const valor = document.createElement('strong');
  valor.textContent = moeda.format(p.comissaoReais);
  const legenda = document.createElement('span');
  legenda.textContent = 'comissão estimada por unidade';
  const score = document.createElement('span');
  score.className = 'tag tag-purple';
  score.textContent = `score ${decimal.format(p.score)}`;
  lado.append(valor, legenda, score);

  li.append(miniatura, info, lado);
  return li;
}

async function carregar() {
  const params = new URLSearchParams(estado);
  const lista = $('#lista');
  try {
    const { total, produtos } = await chamarApi(`/api/produtos?${params}`);
    lista.replaceChildren(...produtos.map(criarCard));
    $('#contagem').textContent = total
      ? `${inteiro.format(total)} produtos encontrados${total > produtos.length ? ` (mostrando ${produtos.length})` : ''}`
      : 'Nenhum produto com esses filtros. Sincronize o catálogo ou reduza os mínimos.';
  } catch (e) {
    lista.replaceChildren();
    $('#contagem').textContent = `Não foi possível carregar os produtos: ${e.message}`;
    log(e.message, 'error');
  }
}

// ---------- Filtros e categorias ----------

async function carregarCategorias() {
  const seletor = $('#categoria');
  try {
    const { categorias } = await chamarApi('/api/categorias');
    const selecionada = seletor.value;
    seletor.replaceChildren(new Option('Todas as categorias', ''));
    categorias.forEach((categoria) => {
      const option = document.createElement('option');
      option.value = categoria;
      option.textContent = categoria;
      seletor.appendChild(option);
    });
    seletor.value = categorias.includes(selecionada) ? selecionada : '';
  } catch (e) {
    log(`Não foi possível carregar categorias: ${e.message}`, 'error');
  }
}

$('#filtros').addEventListener('submit', (e) => {
  e.preventDefault();
  estado.busca = $('#busca').value.trim();
  estado.categoria = $('#categoria').value;
  estado.afiliadosMin = Number($('#afiliadosMin').value) || 0;
  estado.afiliadosQtdMax = Number($('#afiliadosQtdMax').value) || 0;
  estado.vendasMin = Number($('#vendasMin').value) || 0;
  estado.comissaoMin = Number($('#comissaoMin').value) || 0;
  estado.ordem = $('#ordem').value;
  carregar();
});

$('#filtros').addEventListener('reset', (e) => {
  e.preventDefault();
  Object.assign(estado, {
    vendasMin: 500,
    comissaoMin: 5,
    ordem: 'oportunidade',
    busca: '',
    categoria: '',
    afiliadosMin: 0,
    afiliadosQtdMax: 200,
  });
  $('#busca').value = '';
  $('#categoria').value = '';
  $('#afiliadosMin').value = '0';
  $('#afiliadosQtdMax').value = '200';
  $('#vendasMin').value = '500';
  $('#comissaoMin').value = '5';
  $('#ordem').value = 'oportunidade';
  carregar();
});

// ---------- Sincronização ----------

$('#btnSync').addEventListener('click', async () => {
  const keywords = $('#keywords').value.split(',').map((k) => k.trim()).filter(Boolean);
  if (!keywords.length) {
    definirStatus('error', 'Informe uma palavra-chave');
    return;
  }

  const botao = $('#btnSync');
  botao.disabled = true;
  definirStatus('running', 'Sincronizando…');
  log(`Buscando na Shopee: ${keywords.join(', ')}`);

  try {
    const { total } = await chamarApi('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keywords, paginas: 3 }),
    });
    definirStatus('success', `${inteiro.format(total)} produtos salvos`);
    log(`${inteiro.format(total)} produtos salvos no banco.`, 'ok');
    await carregarCategorias();
    await carregar();
  } catch (e) {
    definirStatus('error', 'Falhou');
    log(e.message, 'error');
  } finally {
    botao.disabled = false;
  }
});

$('#btnLimpar').addEventListener('click', () => {
  $('#log').innerHTML = '<span class="log-empty">Nenhuma ação executada ainda.</span>';
});

// ---------- Navegação e integração Shopee ----------

function mostrarTela(tela) {
  const configuracoes = tela === 'settings';
  const criacaoInfluencer = tela === 'influencer';
  $('#radarView').hidden = configuracoes || criacaoInfluencer;
  $('#influencerView').hidden = !criacaoInfluencer;
  $('#settingsView').hidden = !configuracoes;
  document.querySelectorAll('.nav-item[data-view]').forEach((item) => {
    const ativo = item.dataset.view === tela;
    item.classList.toggle('active', ativo);
    if (ativo) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  });
  document.title = configuracoes
    ? 'Configurações | Radar Shopee'
    : criacaoInfluencer ? 'Criar influencer | Radar Shopee' : 'Radar Shopee | Análise';
  if (configuracoes) {
    carregarStatusIntegracao('shopee');
    carregarStatusIntegracao('gemini');
    carregarStatusFirebase();
  }
  if (criacaoInfluencer) carregarHistoricoInfluencers();
}

document.querySelectorAll('.nav-item[data-view]').forEach((item) => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const destino = item.dataset.view;
    const hash = {
      settings: '#configuracoes',
      influencer: '#influencer',
      radar: '#radar',
    }[destino] || '#radar';
    if (location.hash !== hash) location.hash = hash;
    else mostrarTela(destino);
  });
});

$('#createMenuToggle').addEventListener('click', () => {
  const botao = $('#createMenuToggle');
  const aberto = botao.getAttribute('aria-expanded') === 'true';
  botao.setAttribute('aria-expanded', String(!aberto));
  $('#createSubmenu').hidden = aberto;
});

window.addEventListener('hashchange', () => {
  const tela = location.hash === '#configuracoes'
    ? 'settings'
    : location.hash === '#influencer' ? 'influencer' : 'radar';
  mostrarTela(tela);
});

const integracoes = {
  shopee: {
    nome: 'Shopee',
    campos: ['shopeeAppId', 'shopeeAppSecret'],
    status: 'shopeeConfigStatus',
    resultado: 'shopeeTestResult',
    teste: 'btnTestShopee',
    salvar: 'btnSaveShopee',
    formulario: 'shopeeSettingsForm',
  },
  gemini: {
    nome: 'Gemini',
    campos: ['geminiApiKey'],
    status: 'geminiConfigStatus',
    resultado: 'geminiTestResult',
    teste: 'btnTestGemini',
    salvar: 'btnSaveGemini',
    formulario: 'geminiSettingsForm',
  },
};

function atualizarStatusIntegracao(tipo, configuracao) {
  const integracao = integracoes[tipo];
  const status = $(`#${integracao.status}`);
  if (configuracao.configurado) {
    const identificador = tipo === 'shopee'
      ? `App ID ${configuracao.appIdMascarado}`
      : `chave ${configuracao.chaveMascarada}`;
    status.textContent = `${integracao.nome} configurada · ${identificador}`;
    status.dataset.state = 'success';
  } else {
    status.textContent = `${integracao.nome} ainda não configurada neste servidor.`;
    status.dataset.state = 'idle';
  }
}

async function carregarStatusIntegracao(tipo) {
  const integracao = integracoes[tipo];
  try {
    atualizarStatusIntegracao(tipo, await chamarApi(`/api/config/${tipo}`));
  } catch (e) {
    const status = $(`#${integracao.status}`);
    status.textContent = `Não foi possível verificar a configuração: ${e.message}`;
    status.dataset.state = 'error';
  }
}

async function testarOuSalvarIntegracao(tipo, salvar) {
  const integracao = integracoes[tipo];
  const botaoTeste = $(`#${integracao.teste}`);
  const botaoSalvar = $(`#${integracao.salvar}`);
  const resultado = $(`#${integracao.resultado}`);
  const valores = integracao.campos.map((id) => $(`#${id}`).value);
  const corpo = tipo === 'shopee'
    ? { appId: valores[0].trim(), appSecret: valores[1] }
    : { apiKey: valores[0].trim() };
  const preenchidos = Object.values(corpo).every(Boolean);
  if (salvar && !preenchidos) {
    resultado.textContent = tipo === 'shopee'
      ? 'Informe o App ID e o App Secret para salvar.'
      : 'Informe a chave de API para salvar.';
    resultado.dataset.state = 'error';
    return;
  }

  botaoTeste.disabled = true;
  botaoSalvar.disabled = true;
  resultado.textContent = `Testando conexão com ${integracao.nome}…`;
  resultado.dataset.state = 'running';
  try {
    const endpoint = salvar ? `/api/config/${tipo}` : `/api/config/${tipo}/testar`;
    const resposta = await chamarApi(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
    });
    resultado.textContent = resposta.mensagem;
    resultado.dataset.state = 'success';
    atualizarStatusIntegracao(tipo, resposta.configuracao);
    if (salvar) integracao.campos.forEach((id) => { $(`#${id}`).value = ''; });
  } catch (e) {
    resultado.textContent = `Falha na conexão: ${e.message}`;
    resultado.dataset.state = 'error';
  } finally {
    botaoTeste.disabled = false;
    botaoSalvar.disabled = false;
  }
}

Object.keys(integracoes).forEach((tipo) => {
  const integracao = integracoes[tipo];
  $(`#${integracao.teste}`).addEventListener('click', () => testarOuSalvarIntegracao(tipo, false));
  $(`#${integracao.formulario}`).addEventListener('submit', (e) => {
    e.preventDefault();
    testarOuSalvarIntegracao(tipo, true);
  });
});

async function carregarStatusFirebase() {
  const status = $('#firebaseConfigStatus');
  try {
    const configuracao = await chamarApi('/api/config/firebase');
    if (configuracao.configurado) {
      status.textContent = `Credencial carregada · ${configuracao.databaseUrl}`;
      status.dataset.state = 'success';
    } else {
      status.textContent = 'Credencial não encontrada no servidor local.';
      status.dataset.state = 'error';
    }
  } catch (e) {
    status.textContent = `Não foi possível verificar a configuração: ${e.message}`;
    status.dataset.state = 'error';
  }
}

$('#btnTestFirebase').addEventListener('click', async () => {
  const botao = $('#btnTestFirebase');
  const resultado = $('#firebaseTestResult');
  botao.disabled = true;
  resultado.textContent = 'Testando conexão com o Realtime Database…';
  resultado.dataset.state = 'running';
  try {
    const resposta = await chamarApi('/api/config/firebase/testar', { method: 'POST' });
    resultado.textContent = resposta.mensagem;
    resultado.dataset.state = 'success';
  } catch (e) {
    resultado.textContent = e.message;
    resultado.dataset.state = 'error';
  } finally {
    botao.disabled = false;
  }
});

const camposInfluencer = [
  'nome',
  'sexo',
  'idade',
  'altura',
  'peso',
  'tipoCorpo',
  'tipoPele',
  'tamanhoCabelo',
  'tipoCabelo',
  'corCabelo',
  'corOlhos',
  'sobrancelha',
  'nariz',
  'maquiagem',
  'estiloRoupa',
  'roupaSuperior',
  'roupaInferior',
  'calcados',
  'coresPredominantes',
  'acessorios',
];

const regrasNumericasInfluencer = {
  idade: { minimo: 18, maximo: 50, inteiro: true, nome: 'idade' },
  altura: { minimo: 1.5, maximo: 2.2, inteiro: false, nome: 'altura' },
  peso: { minimo: 45, maximo: 150, inteiro: true, nome: 'peso' },
};

const camposComValidacao = [...camposInfluencer, 'barba'];
const tiposImagemAceitos = ['image/jpeg', 'image/png', 'image/webp'];
const tamanhoMaximoArquivoOrigem = 20 * 1024 * 1024;
const tamanhoMaximoImagemSalva = 2 * 1024 * 1024;
let origemSelecionada = 'zero';
let slotHistoricoSelecionado = 1;
let idHistoricoSelecionado = null;
let opcaoPersonagemSelecionada = 'history-1';
let historicoInfluencers = [];
let registroSomenteLeitura = false;
let urlPreviewOrigem = null;

function configurarValidacaoInfluencer() {
  camposComValidacao.forEach((campo) => {
    const input = $('#influencerForm').elements.namedItem(campo);
    const erro = document.createElement('small');
    erro.id = `${input.id}Error`;
    erro.className = 'field-error';
    erro.hidden = true;
    input.insertAdjacentElement('afterend', erro);
    input.setAttribute('aria-describedby', erro.id);
    input.addEventListener('input', () => validarCampoInfluencer(campo));
    input.addEventListener('change', () => validarCampoInfluencer(campo));
  });
}

function definirErroCampoInfluencer(campo, mensagem) {
  const input = $('#influencerForm').elements.namedItem(campo);
  const erro = document.getElementById(`${input.id}Error`);
  erro.textContent = mensagem;
  erro.hidden = !mensagem;
  input.setAttribute('aria-invalid', String(Boolean(mensagem)));
  return !mensagem;
}

function validarCampoInfluencer(campo) {
  const input = $('#influencerForm').elements.namedItem(campo);
  if (campo === 'sexo') {
    const sexo = input.value.trim().toLowerCase();
    return definirErroCampoInfluencer(
      campo,
      ['masculino', 'feminino'].includes(sexo) ? '' : 'Digite Masculino ou Feminino.',
    );
  }

  const regra = regrasNumericasInfluencer[campo];
  if (regra) {
    if (input.validity.badInput) return definirErroCampoInfluencer(campo, 'Digite um número válido.');
    if (input.value === '') return definirErroCampoInfluencer(campo, '');
    const numero = Number(input.value);
    if (!Number.isFinite(numero)) return definirErroCampoInfluencer(campo, 'Digite um número válido.');
    if (numero < regra.minimo || numero > regra.maximo) {
      return definirErroCampoInfluencer(campo, `Informe ${regra.nome} entre ${regra.minimo} e ${regra.maximo}${campo === 'altura' ? ' m' : ''}.`);
    }
    if (regra.inteiro && !Number.isInteger(numero)) {
      return definirErroCampoInfluencer(campo, 'Informe um número inteiro.');
    }
    if (!regra.inteiro && input.validity.stepMismatch) {
      return definirErroCampoInfluencer(campo, 'Use no máximo duas casas decimais.');
    }
    return definirErroCampoInfluencer(campo, '');
  }

  if (input.maxLength > 0 && input.value.length > input.maxLength) {
    return definirErroCampoInfluencer(campo, `Use no máximo ${input.maxLength} caracteres.`);
  }
  return definirErroCampoInfluencer(campo, '');
}

function validarFormularioInfluencer() {
  const campos = $('#influencerSexo').value.trim().toLowerCase() === 'masculino'
    ? camposComValidacao
    : camposInfluencer;
  let primeiroCampoInvalido = null;
  campos.forEach((campo) => {
    if (!validarCampoInfluencer(campo) && !primeiroCampoInvalido) {
      primeiroCampoInvalido = $('#influencerForm').elements.namedItem(campo);
    }
  });
  if (primeiroCampoInvalido) primeiroCampoInvalido.focus();
  return !primeiroCampoInvalido;
}

function limparErrosValidacaoInfluencer() {
  camposComValidacao.forEach((campo) => definirErroCampoInfluencer(campo, ''));
}

function atualizarCampoBarba() {
  const masculino = $('#influencerSexo').value.trim().toLowerCase() === 'masculino';
  $('#beardField').hidden = !masculino;
  $('#barba').disabled = !masculino || registroSomenteLeitura;
}

function atualizarBloqueioFormulario(bloqueado) {
  registroSomenteLeitura = bloqueado;
  camposInfluencer.forEach((campo) => {
    $('#influencerForm').elements.namedItem(campo).disabled = bloqueado;
  });
  $('#barba').disabled = bloqueado || $('#influencerSexo').value !== 'masculino';
  $('#originPhotoFile').disabled = bloqueado;
  $('#chooseOriginPhoto').disabled = bloqueado;
  $('#saveInfluencerButton').disabled = bloqueado;
}

function atualizarSelecaoRetangulos() {
    document.querySelectorAll('.history-image-card').forEach((botao) => {
      botao.setAttribute('aria-pressed', String(opcaoPersonagemSelecionada === `history-${botao.dataset.slot}`));
    });
    $('#originZeroChoice').setAttribute('aria-pressed', String(opcaoPersonagemSelecionada === 'zero'));
    $('#originPhotoChoice').setAttribute('aria-pressed', String(opcaoPersonagemSelecionada === 'foto'));
    if (opcaoPersonagemSelecionada.startsWith('history-')) {
      $('#historySelectionStatus').textContent = `Imagem influencer ${opcaoPersonagemSelecionada.slice('history-'.length)} selecionada.`;
    } else {
      $('#historySelectionStatus').textContent = `Origem "${opcaoPersonagemSelecionada === 'zero' ? 'Do zero' : 'A partir de foto'}" selecionada.`;
    }
}

function aplicarOrigemFormulario(origem, abrirSeletor = false) {
  origemSelecionada = origem;
  $('#originPhotoGroup').hidden = origem !== 'foto';
    if (origem !== 'foto') limparPreviewOrigem();
  invalidarPromptAoEditar();
  if (abrirSeletor) $('#originPhotoFile').click();
}

function selecionarOrigem(origem, abrirSeletor = false) {
    if (registroSomenteLeitura) limparFormularioInfluencer();
    slotHistoricoSelecionado = null;
    idHistoricoSelecionado = null;
    opcaoPersonagemSelecionada = origem;
    atualizarSelecaoRetangulos();
    aplicarOrigemFormulario(origem, abrirSeletor);
}

function validarArquivoImagem(arquivo) {
  if (!tiposImagemAceitos.includes(arquivo.type)) {
    throw new Error('Use uma imagem JPEG, PNG ou WebP.');
  }
  if (arquivo.size > tamanhoMaximoArquivoOrigem) {
    throw new Error('A imagem original deve ter no máximo 20 MB.');
  }
}

async function criarBlobImagem(canvas, qualidade) {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', qualidade));
}

function blobParaDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.addEventListener('load', () => resolve(leitor.result));
    leitor.addEventListener('error', () => reject(new Error('Não foi possível preparar a imagem para salvar.')));
    leitor.readAsDataURL(blob);
  });
}

async function prepararImagemUpload(arquivo) {
  validarArquivoImagem(arquivo);
  const url = URL.createObjectURL(arquivo);
  const imagem = new Image();
  try {
    await new Promise((resolve, reject) => {
      imagem.addEventListener('load', resolve, { once: true });
      imagem.addEventListener('error', () => reject(new Error('Não foi possível abrir a imagem selecionada.')), { once: true });
      imagem.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }

  const maiorLado = Math.max(imagem.naturalWidth, imagem.naturalHeight);
  const escala = Math.min(1, 1600 / maiorLado);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(imagem.naturalWidth * escala));
  canvas.height = Math.max(1, Math.round(imagem.naturalHeight * escala));
  const contexto = canvas.getContext('2d');
  if (!contexto) throw new Error('Não foi possível processar a imagem selecionada.');
  contexto.fillStyle = '#fff';
  contexto.fillRect(0, 0, canvas.width, canvas.height);
  contexto.drawImage(imagem, 0, 0, canvas.width, canvas.height);

  let blob = await criarBlobImagem(canvas, 0.82);
  if (!blob) throw new Error('Não foi possível preparar a imagem para salvar.');
  if (blob.size > tamanhoMaximoImagemSalva) blob = await criarBlobImagem(canvas, 0.64);
  if (!blob || blob.size > tamanhoMaximoImagemSalva) {
    throw new Error('A imagem continua muito grande após a compressão. Escolha uma imagem menor.');
  }
  return blobParaDataUrl(blob);
}

function coletarDadosInfluencer() {
  const dados = Object.fromEntries(camposInfluencer.map((campo) => [campo, $('#influencerForm').elements.namedItem(campo).value]));
  dados.sexo = dados.sexo.trim().toLowerCase();
  dados.origem = origemSelecionada;
  dados.fotoOrigemAnexada = dados.origem === 'foto' && Boolean($('#originPhotoFile').files[0]);
  if (dados.sexo === 'masculino') dados.barba = $('#barba').value;
  return dados;
}

function limparPreviewOrigem() {
  if (urlPreviewOrigem) URL.revokeObjectURL(urlPreviewOrigem);
  urlPreviewOrigem = null;
  $('#originPhotoFile').value = '';
  $('#originPhotoPreview').removeAttribute('src');
  $('#originPhotoPreview').hidden = true;
  $('#originUploadIcon').hidden = false;
  $('#originPhotoName').textContent = 'Escolha uma foto de referência.';
}

function limparFormularioInfluencer() {
  atualizarBloqueioFormulario(false);
  limparErrosValidacaoInfluencer();
  camposInfluencer.forEach((campo) => {
    $('#influencerForm').elements.namedItem(campo).value = '';
  });
  $('#barba').value = '';
  limparPreviewOrigem();
  aplicarOrigemFormulario('zero');
  $('#promptPanel').hidden = true;
  $('#influencerSaveStatus').textContent = '';
  atualizarCampoBarba();
}

function carregarRegistroInfluencer(influencer) {
  atualizarBloqueioFormulario(false);
  limparErrosValidacaoInfluencer();
  camposInfluencer.forEach((campo) => {
    $('#influencerForm').elements.namedItem(campo).value = influencer[campo] ?? '';
  });
  $('#barba').value = influencer.barba || '';
  limparPreviewOrigem();
  aplicarOrigemFormulario(influencer.origem === 'foto' ? 'foto' : 'zero');
  if (influencer.imagem_upload) {
    $('#originPhotoPreview').src = influencer.imagem_upload;
    $('#originPhotoPreview').hidden = false;
    $('#originUploadIcon').hidden = true;
    $('#originPhotoName').textContent = 'Foto salva no cadastro.';
  }
  $('#promptInfluencer').value = influencer.promptInfluencer || criarPromptInfluencer({
    ...influencer,
    fotoOrigemAnexada: Boolean(influencer.imagem_upload || influencer.fotoOrigemAnexada),
  });
  $('#promptPanel').hidden = false;
  atualizarCampoBarba();
  atualizarBloqueioFormulario(true);
  $('#influencerSaveStatus').textContent = `Cadastro ${influencer.nome || influencer.id} carregado em modo somente leitura.`;
  $('#influencerSaveStatus').dataset.state = 'success';
}

async function carregarHistoricoInfluencers(idSelecionado) {
  $('#saveInfluencerButton').disabled = true;
  try {
    const { influencers } = await chamarApi('/api/influencers');
    historicoInfluencers = influencers;
    if (idSelecionado) {
      const indice = influencers.findIndex((influencer) => influencer.id === idSelecionado);
      slotHistoricoSelecionado = indice >= 0 ? indice + 1 : null;
      if (slotHistoricoSelecionado) opcaoPersonagemSelecionada = `history-${slotHistoricoSelecionado}`;
    } else if (idHistoricoSelecionado) {
      const indice = influencers.findIndex((influencer) => influencer.id === idHistoricoSelecionado);
      if (indice >= 0) {
        slotHistoricoSelecionado = indice + 1;
        opcaoPersonagemSelecionada = `history-${slotHistoricoSelecionado}`;
      }
    }

    document.querySelectorAll('.history-image-card').forEach((botao) => {
      const slot = Number(botao.dataset.slot);
      const influencer = influencers[slot - 1];
      const imagem = botao.querySelector('.history-image');
      const avatar = botao.querySelector('.avatar-placeholder');
      botao.dataset.influencerId = influencer?.id || '';
      botao.querySelector('.history-image-name').textContent = influencer
        ? influencer.nome || 'Sem nome'
        : 'Ainda vazio';
      if (influencer?.imagem_upload) {
        imagem.src = influencer.imagem_upload;
        imagem.alt = `Imagem de ${influencer.nome}`;
        imagem.hidden = false;
        avatar.hidden = true;
      } else {
        imagem.removeAttribute('src');
        imagem.alt = '';
        imagem.hidden = true;
        avatar.hidden = false;
      }
    });
    idHistoricoSelecionado = slotHistoricoSelecionado
      ? influencers[slotHistoricoSelecionado - 1]?.id || null
      : null;
    atualizarSelecaoRetangulos();
    const selecionado = slotHistoricoSelecionado
      ? influencers[slotHistoricoSelecionado - 1]
      : null;
    if (selecionado) carregarRegistroInfluencer(selecionado);
    else if (registroSomenteLeitura) limparFormularioInfluencer();
    else atualizarBloqueioFormulario(false);
  } catch (erro) {
    $('#historySelectionStatus').textContent = `Não foi possível carregar o histórico: ${erro.message}`;
    $('#historySelectionStatus').dataset.state = 'error';
    $('#influencerSaveStatus').textContent = 'O histórico não foi carregado; salve apenas após verificar a conexão com o Firebase.';
    $('#influencerSaveStatus').dataset.state = 'error';
  }
}

document.querySelectorAll('.history-image-card').forEach((botao) => {
  botao.addEventListener('click', () => {
    slotHistoricoSelecionado = Number(botao.dataset.slot);
    opcaoPersonagemSelecionada = `history-${slotHistoricoSelecionado}`;
    const selecionado = historicoInfluencers[slotHistoricoSelecionado - 1];
    idHistoricoSelecionado = selecionado?.id || null;
    atualizarSelecaoRetangulos();
    if (selecionado) carregarRegistroInfluencer(selecionado);
    else limparFormularioInfluencer();
  });
});

$('#originZeroChoice').addEventListener('click', () => selecionarOrigem('zero'));
$('#originPhotoChoice').addEventListener('click', () => selecionarOrigem('foto', true));
$('#chooseOriginPhoto').addEventListener('click', () => $('#originPhotoFile').click());
$('#originPhotoFile').addEventListener('change', (evento) => {
  const arquivo = evento.target.files[0];
  if (!arquivo) return;
  try {
    validarArquivoImagem(arquivo);
    if (urlPreviewOrigem) URL.revokeObjectURL(urlPreviewOrigem);
    urlPreviewOrigem = URL.createObjectURL(arquivo);
    $('#originPhotoPreview').src = urlPreviewOrigem;
    $('#originPhotoPreview').hidden = false;
    $('#originUploadIcon').hidden = true;
    $('#originPhotoName').textContent = arquivo.name;
    $('#influencerSaveStatus').textContent = '';
    invalidarPromptAoEditar();
  } catch (erro) {
    evento.target.value = '';
    $('#influencerSaveStatus').textContent = erro.message;
    $('#influencerSaveStatus').dataset.state = 'error';
  }
});

$('#influencerSexo').addEventListener('change', atualizarCampoBarba);

function invalidarPromptAoEditar() {
  if ($('#promptPanel').hidden) return;
  $('#promptPanel').hidden = true;
  $('#influencerSaveStatus').textContent = 'Formulário alterado. Salve novamente para gravar as mudanças e atualizar o prompt.';
  $('#influencerSaveStatus').dataset.state = 'idle';
}

$('#influencerForm').addEventListener('input', invalidarPromptAoEditar);
$('#influencerForm').addEventListener('change', invalidarPromptAoEditar);

$('#influencerForm').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  if (!validarFormularioInfluencer()) return;
  const botao = $('#saveInfluencerButton');
  const status = $('#influencerSaveStatus');
  const corpo = coletarDadosInfluencer();
  const arquivoOrigem = $('#originPhotoFile').files[0];
  if (corpo.origem === 'foto' && !arquivoOrigem) {
    status.textContent = 'Selecione uma foto para usar esta origem.';
    status.dataset.state = 'error';
    $('#originPhotoGroup').hidden = false;
    return;
  }

  botao.disabled = true;
  status.textContent = 'Salvando influencer…';
  status.dataset.state = 'running';
  $('#promptPanel').hidden = true;

  try {
    const imagemUpload = corpo.origem === 'foto' ? await prepararImagemUpload(arquivoOrigem) : '';
    const resposta = await chamarApi('/api/influencers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...corpo, imagem_upload: imagemUpload }),
    });

    const influencer = resposta.influencer;
    await carregarHistoricoInfluencers(influencer.id);
    status.textContent = `Influencer salvo com sucesso · ID ${influencer.id}`;
    status.dataset.state = 'success';
  } catch (erro) {
    status.textContent = `Não foi possível salvar o influencer: ${erro.message}`;
    status.dataset.state = 'error';
  } finally {
    botao.disabled = registroSomenteLeitura;
  }
});

configurarValidacaoInfluencer();
atualizarCampoBarba();
aplicarOrigemFormulario('zero');
atualizarSelecaoRetangulos();

mostrarTela(location.hash === '#configuracoes' ? 'settings' : location.hash === '#influencer' ? 'influencer' : 'radar');
carregarCategorias();
carregar();
