const test = require('node:test');
const assert = require('node:assert/strict');
const { gerarIdInfluencer, normalizarInfluencer } = require('./influencer');
const criarPromptInfluencer = require('../public/prompt-influencer');

test('exige o sexo antes de criar um influencer', () => {
  assert.throws(() => normalizarInfluencer({}), {
    message: 'Selecione o sexo do influencer.',
    status: 400,
  });
});

test('mantém o nome vazio e sorteia os demais campos opcionais dentro das faixas definidas', () => {
  const influencer = normalizarInfluencer({ sexo: 'feminino' });

  assert.equal(influencer.nome, '');
  assert.ok(influencer.idade >= 18 && influencer.idade <= 50);
  assert.ok(influencer.altura >= 1.5 && influencer.altura <= 2.2);
  assert.ok(influencer.peso >= 45 && influencer.peso <= 150);
  assert.ok(influencer.tipoCorpo);
  assert.equal(Object.hasOwn(influencer, 'barba'), false);
});

test('preserva valores informados e inclui barba somente para masculino', () => {
  const influencer = normalizarInfluencer({
    sexo: 'masculino',
    nome: '  João Silva  ',
    idade: '30',
    altura: '1.78',
    peso: '82',
    barba: 'Cavanhaque',
    origem: 'foto',
    fotoOrigemAnexada: true,
  });

  assert.equal(influencer.nome, 'João Silva');
  assert.equal(influencer.idade, 30);
  assert.equal(influencer.altura, 1.78);
  assert.equal(influencer.peso, 82);
  assert.equal(influencer.barba, 'Cavanhaque');
});

test('rejeita origem por foto sem anexo', () => {
  assert.throws(() => normalizarInfluencer({ sexo: 'feminino', origem: 'foto' }), {
    message: 'Anexe uma foto para usar a origem “A partir de foto”.',
    status: 400,
  });
});

test('rejeita medidas fora das faixas permitidas', () => {
  assert.throws(() => normalizarInfluencer({ sexo: 'feminino', idade: 17 }), {
    message: 'Informe um valor válido para idade, entre 18 e 50.',
    status: 400,
  });
  assert.throws(() => normalizarInfluencer({ sexo: 'feminino', altura: 2.21 }), {
    message: 'Informe um valor válido para altura, entre 1.5 e 2.2, com até duas casas decimais.',
    status: 400,
  });
  assert.throws(() => normalizarInfluencer({ sexo: 'feminino', peso: 151 }), {
    message: 'Informe um valor válido para peso, entre 45 e 150.',
    status: 400,
  });
});

test('formata o ID como dia, mês, ano, hora, minuto e segundo', () => {
  const data = new Date(2026, 10, 20, 23, 21, 24);
  assert.equal(gerarIdInfluencer(data), '20112026232124');
});

test('inclui as seções de fidelidade e vestimenta no prompt persistido', () => {
  const influencer = normalizarInfluencer({ sexo: 'feminino', origem: 'zero' });
  const prompt = criarPromptInfluencer(influencer);

  assert.match(prompt, /### 3\. FIDELIDADE VISUAL/);
  assert.match(prompt, /### 4\. REGRAS DE VESTIMENTA/);
  assert.match(prompt, /### RESULTADO ESPERADO/);
  assert.match(prompt, /Nome: \n/);
});
