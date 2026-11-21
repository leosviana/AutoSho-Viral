const crypto = require('crypto');

const opcoes = {
  tipoCorpo: ['Magro', 'Médio', 'Atlético', 'Musculoso', 'Gordo'],
  tipoPele: ['Clara', 'Média', 'Escura', 'Muito escura', 'Oliva'],
  tamanhoCabelo: ['Curto', 'Médio', 'Longo'],
  tipoCabelo: ['Liso', 'Ondulado', 'Cacheado', 'Crespo'],
  corCabelo: ['Preto', 'Castanho', 'Loiro', 'Ruivo', 'Grisalho'],
  corOlhos: ['Castanhos', 'Azuis', 'Verdes', 'Mel', 'Cinza'],
  sobrancelha: ['Naturais e médias', 'Grossas', 'Finas', 'Com um risco em um lado'],
  nariz: ['Pequeno', 'Médio', 'Grande', 'Fino', 'Largo'],
  maquiagem: ['Natural', 'Sardas', 'Blush leve', 'Base natural', 'Maquiagem marcante'],
  barba: ['Sem barba', 'Raspada', 'Média', 'Grande', 'Cavanhaque', 'Bigode'],
  estiloRoupa: ['Casual', 'Esportivo', 'Elegante', 'Streetwear', 'Social'],
  roupaSuperior: ['Camisa gola V', 'Camisa casual', 'Blusa básica', 'Jaqueta leve', 'Camisa social'],
  roupaInferior: ['Calça jeans comum', 'Calça casual', 'Calça esportiva', 'Saia casual', 'Bermuda jeans'],
  calcados: ['Tênis sem marca comum', 'Tênis casual', 'Sapato casual', 'Sandália simples', 'Bota casual'],
  coresPredominantes: ['Tons de azul', 'Tons neutros', 'Preto e branco', 'Tons terrosos', 'Cores vibrantes'],
  acessorios: ['Relógio e colar discretos', 'Sem acessórios', 'Relógio simples', 'Óculos e relógio', 'Colar discreto'],
};

function erroValidacao(mensagem) {
  const erro = new Error(mensagem);
  erro.status = 400;
  return erro;
}

function escolher(lista) {
  return lista[crypto.randomInt(lista.length)];
}

function textoOuAleatorio(valor, campo, lista, limite = 120) {
  if (valor === undefined || valor === null || valor === '') return escolher(lista);
  if (typeof valor !== 'string') throw erroValidacao(`O campo ${campo} deve ser um texto.`);
  const texto = valor.trim();
  if (!texto) return escolher(lista);
  if (texto.length > limite) throw erroValidacao(`O campo ${campo} deve ter no máximo ${limite} caracteres.`);
  return texto;
}

function numeroOuAleatorio(valor, campo, minimo, maximo, inteiro = false) {
  if (valor === undefined || valor === null || valor === '') {
    if (inteiro) return crypto.randomInt(minimo, maximo + 1);
    const minimoCentesimos = Math.round(minimo * 100);
    const maximoCentesimos = Math.round(maximo * 100);
    return Number((crypto.randomInt(minimoCentesimos, maximoCentesimos + 1) / 100).toFixed(2));
  }
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero < minimo || numero > maximo || (inteiro && !Number.isInteger(numero))) {
    throw erroValidacao(`Informe um valor válido para ${campo}, entre ${minimo} e ${maximo}${inteiro ? '' : ', com até duas casas decimais'}.`);
  }
  return numero;
}

function nomeOuVazio(valor) {
  if (valor === undefined || valor === null || valor === '') return '';
  if (typeof valor !== 'string') throw erroValidacao('O campo Nome deve ser um texto.');
  const nome = valor.trim();
  if (nome.length > 80) throw erroValidacao('O campo Nome deve ter no máximo 80 caracteres.');
  return nome;
}

function gerarIdInfluencer(data = new Date()) {
  const doisDigitos = (valor) => String(valor).padStart(2, '0');
  return `${doisDigitos(data.getDate())}${doisDigitos(data.getMonth() + 1)}${data.getFullYear()}${doisDigitos(data.getHours())}${doisDigitos(data.getMinutes())}${doisDigitos(data.getSeconds())}`;
}

function normalizarInfluencer(entrada) {
  if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) {
    throw erroValidacao('Os dados do influencer são inválidos.');
  }

  const sexo = entrada.sexo;
  if (!['masculino', 'feminino'].includes(sexo)) {
    throw erroValidacao('Selecione o sexo do influencer.');
  }

  const origem = entrada.origem || 'zero';
  if (!['zero', 'foto'].includes(origem)) {
    throw erroValidacao('Selecione uma origem válida para o influencer.');
  }
  const fotoOrigemAnexada = entrada.fotoOrigemAnexada === true;
  if (origem === 'foto' && !fotoOrigemAnexada) {
    throw erroValidacao('Anexe uma foto para usar a origem “A partir de foto”.');
  }

  const influencer = {
    nome: nomeOuVazio(entrada.nome),
    sexo,
    idade: numeroOuAleatorio(entrada.idade, 'idade', 18, 50, true),
    altura: numeroOuAleatorio(entrada.altura, 'altura', 1.5, 2.2),
    peso: numeroOuAleatorio(entrada.peso, 'peso', 45, 150, true),
    tipoCorpo: textoOuAleatorio(entrada.tipoCorpo, 'Tipo de Corpo', opcoes.tipoCorpo),
    tipoPele: textoOuAleatorio(entrada.tipoPele, 'Tipo de pele', opcoes.tipoPele),
    tamanhoCabelo: textoOuAleatorio(entrada.tamanhoCabelo, 'Tamanho do cabelo', opcoes.tamanhoCabelo),
    tipoCabelo: textoOuAleatorio(entrada.tipoCabelo, 'Tipo de cabelo', opcoes.tipoCabelo),
    corCabelo: textoOuAleatorio(entrada.corCabelo, 'Cor do cabelo', opcoes.corCabelo),
    corOlhos: textoOuAleatorio(entrada.corOlhos, 'Cor dos olhos', opcoes.corOlhos),
    sobrancelha: textoOuAleatorio(entrada.sobrancelha, 'Sobrancelha', opcoes.sobrancelha),
    nariz: textoOuAleatorio(entrada.nariz, 'Nariz', opcoes.nariz),
    maquiagem: textoOuAleatorio(entrada.maquiagem, 'Maquiagem', opcoes.maquiagem),
    estiloRoupa: textoOuAleatorio(entrada.estiloRoupa, 'Estilo de roupa', opcoes.estiloRoupa),
    roupaSuperior: textoOuAleatorio(entrada.roupaSuperior, 'Parte superior', opcoes.roupaSuperior),
    roupaInferior: textoOuAleatorio(entrada.roupaInferior, 'Parte inferior', opcoes.roupaInferior),
    calcados: textoOuAleatorio(entrada.calcados, 'Calçados', opcoes.calcados),
    coresPredominantes: textoOuAleatorio(entrada.coresPredominantes, 'Cores predominantes', opcoes.coresPredominantes),
    acessorios: textoOuAleatorio(entrada.acessorios, 'Acessórios', opcoes.acessorios),
    origem,
    fotoOrigemAnexada,
  };

  if (sexo === 'masculino') {
    influencer.barba = textoOuAleatorio(entrada.barba, 'Barba', opcoes.barba);
  }
  return influencer;
}

module.exports = { gerarIdInfluencer, normalizarInfluencer };
