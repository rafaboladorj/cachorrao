# Cachorrão BanKa — cardápio digital

Abra `index.html` no navegador. Não há instalação nem compilação.

Para uma prévia HTTP na máquina, a partir desta pasta:

```powershell
python -m http.server 8080 --bind 127.0.0.1
```

Acesse http://127.0.0.1:8080. A prévia é local; para QR Code e acesso por clientes será necessário hospedar os arquivos em um endereço público.

## Funcionalidades
- Consulta de cachorros-quentes, bebidas e sorvetes Aice.
- Listas por lanche, com nome opcional, pão, ingredientes e molhos.
- Edição, cópia independente, remoção com desfazer e marcação de conferência.
- Subtotal apenas dos lanches; bebidas e sorvetes são consulta.
- Persistência no navegador, com aviso caso indisponível.
- Sem cadastro, transmissão de dados, WhatsApp ou pagamento.

## Conteúdo e manutenção
Preços dos pães, ingredientes e molhos estão em `model.js`; bebidas e sorvetes em `app.js`. A apresentação dos dois lanches também aparece no HTML. Alterações de preço devem atualizar ambos e os testes afetados.

Imagens derivadas exclusivamente dos materiais recebidos: logo e recorte do cardápio. A imagem do lanche é ilustrativa, como indicado na página. Os arquivos originais foram preservados. As fontes Barlow Condensed e DM Sans estão incluídas localmente, com suas licenças em `assets/`.

Nomes e escolhas são salvos apenas neste navegador. Outro aparelho ou outro endereço de acesso terá uma lista própria. Em navegação privada ou com armazenamento bloqueado a persistência pode não estar disponível. Não há controle de estoque: disponibilidade é conferida no estabelecimento.

## Testes
Na pasta `01_recebidos`:

```powershell
node --test cardapio/tests/model.test.cjs
node --check cardapio/app.js
```

Para repetir os testes de navegador, instale Playwright apenas como ferramenta de desenvolvimento (`npm install --no-save playwright` dentro de `cardapio` e `npx playwright install chromium`). Com o servidor local acima ativo, execute `node --test tests/browser.test.cjs` de dentro de `cardapio`.

Validação realizada: 11 testes aprovados (5 do modelo e 6 no Chromium), incluindo abertura direta do HTML, celular 390 × 844, foco por teclado, persistência, armazenamento bloqueado e atualização entre abas. Capturas em `qa/`.
