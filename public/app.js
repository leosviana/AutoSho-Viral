const $ = (seletor) => document.querySelector(seletor);

const estado = { vendasMin: 500, comissaoMin: 5, ordem: 'oportunidade', busca: '' };

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
  if (!resposta.ok) throw new Error(dados.erro || `Erro ${resposta.status}`);
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

// ---------- Filtros ----------

document.querySelectorAll('.chips').forEach((grupo) => {
  grupo.addEventListener('click', (evento) => {
    const chip = evento.target.closest('.chip');
    if (!chip) return;
    grupo.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
    estado[grupo.dataset.filtro] = Number(chip.dataset.valor);
    carregar();
  });
});

$('#ordem').addEventListener('change', (e) => {
  estado.ordem = e.target.value;
  carregar();
});

let espera;
$('#busca').addEventListener('input', (e) => {
  clearTimeout(espera);
  espera = setTimeout(() => {
    estado.busca = e.target.value.trim();
    carregar();
  }, 350);
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

carregar();
