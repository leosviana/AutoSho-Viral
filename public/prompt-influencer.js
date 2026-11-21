function criarPromptInfluencer(influencer) {
  const linhas = [
    'Crie um personagem influencer digital hiper-realista, com aparência humana natural e alta qualidade visual, seguindo rigorosamente as especificações abaixo.',
    '',
    '### 1. ORIGEM DO PERSONAGEM',
  ];

  if (influencer.origem === 'zero') {
    linhas.push(
      'REGRAS:',
      '- Crie um personagem completamente novo e original, sem utilizar como referência qualquer pessoa ou personagem existente.',
    );
  } else if (influencer.origem === 'foto' && influencer.fotoOrigemAnexada) {
    linhas.push(
      'REGRAS:',
      '- Utilize a imagem anexada como principal referência visual, preservando as características físicas e os traços mais marcantes da pessoa retratada. A imagem gerada deve manter as características físicas abaixo sobressaindo sobre a identidade visual do personagem da referência.',
    );
  }

  linhas.push(
    '',
    '### 2. CARACTERÍSTICAS FÍSICAS',
    `- Nome: ${influencer.nome ?? ''}`,
    `- Sexo: ${(influencer.sexo || '').toUpperCase()}`,
    `- Idade: ${influencer.idade ?? ''} anos`,
    `- Altura: ${Number(influencer.altura).toFixed(2)} metros`,
    `- Peso: ${influencer.peso ?? ''} kg`,
    `- Tipo de corpo: ${influencer.tipoCorpo ?? ''}`,
    `- Tipo de pele: ${influencer.tipoPele ?? ''}`,
    '- Cabelo:',
    `  - Tamanho: ${influencer.tamanhoCabelo ?? ''}`,
    `  - Tipo: ${influencer.tipoCabelo ?? ''}`,
    `  - Cor: ${influencer.corCabelo ?? ''}`,
    '- Rosto:',
    `  - Cor dos olhos: ${influencer.corOlhos ?? ''}`,
    `  - Sobrancelha: ${influencer.sobrancelha ?? ''}`,
    `  - Nariz: ${influencer.nariz ?? ''}`,
    `  - Maquiagem: ${influencer.maquiagem ?? ''}`,
  );
  if (influencer.sexo === 'masculino') linhas.push(`  - Barba: ${influencer.barba ?? ''}`);
  linhas.push(
    '- Vestimentas:',
    `  - Estilo de roupa: ${influencer.estiloRoupa ?? ''}`,
    `  - Parte superior: ${influencer.roupaSuperior ?? ''}`,
    `  - Parte inferior: ${influencer.roupaInferior ?? ''}`,
    `  - Calçados: ${influencer.calcados ?? ''}`,
    `  - Cores predominantes: ${influencer.coresPredominantes ?? ''}`,
    `  - Acessórios: ${influencer.acessorios ?? ''}`,
    '',
    '### 3. FIDELIDADE VISUAL',
    '- Respeitar rigorosamente todas as características físicas informadas.',
    '- Manter proporções anatômicas realistas e naturais.',
    '- Apresentar textura de pele realista, com detalhes naturais.',
    '- Posição em pé com rosto neutro, de frente olhando para camera, com os pés juntos, braços proximos ao quadril.',
    '- Evitar aparência artificial, excessivamente plastificada ou semelhante a bonecos.',
    '- Garantir harmonia entre as características físicas.',
    '- Criar uma aparência visual autêntica e marcante.',
    '',
    '### 4. REGRAS DE VESTIMENTA',
    '- As roupas devem respeitar o estilo escolhido pelo usuário.',
    '- Garantir harmonia entre cores, tecidos e acessórios.',
    '- As vestimentas devem ser compatíveis com o sexo, idade e características físicas do personagem.',
    '- As roupas devem apresentar caimento natural e proporções realistas.',
    '- Evitar combinações visuais exageradas ou incompatíveis com o estilo selecionado.',
    '- Não adicionar peças, estampas ou acessórios que contradigam as escolhas do usuário.',
    '- Preservar a identidade visual do personagem.',
    '',
    '### RESULTADO ESPERADO',
    'Gerar um personagem influencer digital com aparência fotográfica hiper-realista, identidade visual consistente e características físicas bem definidas.',
    'O personagem deve parecer uma pessoa real, fotografada por uma câmera profissional, com iluminação natural, riqueza de detalhes e excelente qualidade de imagem.',
    'IMPORTANTE:',
    'As características físicas especificadas pelo usuário devem ter prioridade na geração. Não modificar arbitrariamente sexo, idade, altura, peso, tipo de corpo, tipo de pele, tamanho do cabelo, tipo de cabelo, cor do cabelo, olhos comuns de brasileiro, cor dos olhos e barba(caso for masculino).',
  );
  return linhas.join('\n');
}

if (typeof module !== 'undefined') module.exports = criarPromptInfluencer;
