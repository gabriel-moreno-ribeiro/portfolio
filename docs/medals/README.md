# Medal wall — como gerar as fotos das medalhas

Objetivo: 39 fotos de medalha **no mesmo ângulo, mesma luz, mesmo fundo**, geradas a partir
das fotos reais de cada medalha, para montar a parede de medalhas do site (foto do Gabriel
segurando as medalhas no centro, medalhas em volta). O mockup do design está em
`mockup-light.png`, `mockup-dark.png` e `mockup-mobile.png` nesta pasta.

## Resumo (o que fazer)

| | |
|---|---|
| Ferramenta | Google Labs → **Whisk** (labs.google/fx/tools/whisk) ou **Google AI Studio** (aistudio.google.com, mais controle) ou o app Gemini |
| Modelo | **Nano Banana Pro** (Gemini 3 Pro Image). Alternativa mais rápida: Nano Banana 2 |
| Proporção | **1:1** (quadrado) |
| Resolução | **2K** (2048 × 2048). 4K não precisa |
| Formato | PNG (ou o que a ferramenta der; eu converto para WebP/AVIF) |
| Fundo | **branco puro, liso, sem sombra** (vou recortar o fundo depois, então quanto mais limpo melhor) |
| Ângulo | frontal, câmera perpendicular à face da medalha, sem inclinação |
| Quantidade | 1 imagem por medalha (39), + a foto real sua segurando as medalhas |

Por que branco puro e não o fundo do site: no site a medalha vai "flutuar" em cima de um card
(claro no tema claro, escuro no tema escuro). Para isso eu removo o fundo. Branco liso é o fundo
mais fácil de recortar e o que o modelo reproduz com mais consistência entre 39 gerações.

## Antes de gerar: a foto de origem

O modelo só preserva o que consegue enxergar. Para cada medalha:

1. Superfície lisa e neutra (mesa clara, folha branca). Medalha deitada, fita esticada para cima.
2. Câmera **de frente, por cima**, paralela à medalha (não em ângulo). Medalha ocupando a maior
   parte do quadro.
3. Luz forte e uniforme (perto de uma janela de dia). Se der reflexo/brilho estourado, mude um
   pouco o ângulo e tire outra.
4. Resolução máxima do celular. Guarde as originais: se algum texto sair errado, elas são a
   referência.

## Prompt 1 — a primeira medalha (define o padrão)

Envie a foto da medalha e cole:

```
Recreate the medal in the attached photo as a clean, photorealistic studio product photograph.

FIDELITY (most important): this must be the exact same medal. Keep its shape, proportions, metal color (gold, silver or bronze, as in the photo), ribbon colors, and every engraving, logo, symbol, number and letter exactly as they appear. Do not invent, translate, redraw, add or remove any text or symbol. If some text is hard to read in the photo, keep it as close as possible to the original instead of replacing it.

CAMERA: strict front view, camera perfectly perpendicular to the medal face, medal face parallel to the image plane, no tilt, no rotation, no perspective distortion, 85mm lens look, everything in sharp focus.

FRAMING: square 1:1 image. The medal is centered horizontally, the disc takes about 55% of the image height and sits slightly below center. The ribbon rises from the top of the medal in a short, neat V shape and exits through the top edge of the frame (crop the ribbon at the top edge, do not show the full loop). If the medal has no ribbon, just center the medal.

LIGHTING: soft, even studio lighting from a large softbox at the top left, a gentle specular highlight on the metal, no glare, no hot spots, no reflections of a room or a person on the metal, neutral white balance.

BACKGROUND: pure flat white (#FFFFFF), seamless, no gradient, no texture, no floor line, no shadow cast on the background. Nothing else in the frame: no hands, no table, no props, no other medals, no added text, no watermark.
```

Gere até ficar boa (texto legível e igual ao original, metal na cor certa, fita saindo por cima).
**Salve essa imagem como `reference-style.png`.** Ela vira a âncora de todas as outras.

## Prompt 2 — todas as outras medalhas

Envie **duas** imagens: a foto da medalha nova (imagem 1) e a `reference-style.png` (imagem 2).
No Whisk: medalha nova em **Subject**, `reference-style.png` em **Style**, Scene vazio. Cole:

```
Image 1 is a photo of a medal. Image 2 is the reference for the final look.

Recreate the medal from Image 1 as a studio product photograph that matches Image 2 exactly in camera angle (strict front view, perpendicular to the medal face), framing (square, medal centered, disc about 55% of the height, ribbon in a short V exiting through the top edge), lighting (soft softbox from the top left, gentle highlight, no glare) and background (pure flat white, no shadow).

Only the medal itself changes: it must be the exact medal from Image 1, with its own shape, metal color, ribbon colors and every engraving, logo, number and letter kept exactly as they are. Do not copy anything from Image 2's medal. Do not invent, change or remove any text. Nothing else in the frame, no added text, no watermark.
```

## Prompt 3 — conserto rápido (quando só o texto sai errado)

Envie a imagem gerada e cole, trocando o texto entre aspas:

```
Keep this image exactly as it is (same angle, framing, lighting, background and ribbon). Only correct the engraved text on the medal so it reads exactly: "OBMEP 2023". Match the original font style and the metal relief.
```

## Checagem de cada imagem (30 segundos)

- Texto e logo iguais à medalha real (o erro mais comum do modelo é trocar letras).
- Cor do metal certa (ouro não pode virar bronze e vice-versa).
- Fita saindo pelo topo em V, medalha um pouco abaixo do centro, fundo branco sem sombra.
- Nada além da medalha (sem mão, mesa, texto).

## A foto do centro

Foto real, sem passar pelo modelo (rosto gerado por IA fica estranho). Você segurando as
medalhas na altura do peito, de frente, luz boa, fundo o mais limpo possível. Vertical ou
quadrada, resolução máxima. Eu recorto para o quadrado do centro.

## Como me mandar

Nomes de arquivo: `NN-sigla-ano.png` (ex.: `01-onneq-2024.png`, `02-obq-jr-2022.png`).
E uma lista, uma linha por medalha, neste formato (as que já conheço pelo resume estão
preenchidas como exemplo; complete e corrija):

```
nº | sigla    | nome completo                               | ano  | medalha | área       | nível
01 | ONNEQ    | Olimpíada Norte/Nordeste de Química          |      | ouro    | química    | regional
02 | OBQ Jr.  | Olimpíada Brasileira de Química Júnior       | 2022 | ouro    | química    | nacional
03 | OBQ      | Olimpíada Brasileira de Química              |      | bronze  | química    | nacional
04 | OBMEP    | Olimp. Bras. de Matemática das Escolas Públ. |      | prata   | matemática | nacional
05 | MSF      | Mathématiques Sans Frontières                |      | ouro    | matemática | internacional
06 | MSF      | Mathématiques Sans Frontières                |      | ouro    | matemática | internacional
07 | OBFEP    | Olimp. Bras. de Física das Escolas Públicas  |      | ouro    | física     | nacional
08 | OBB      | Olimpíada Brasileira de Biotecnologia        |      | ouro    | biologia   | nacional
09 | ONC      | Olimpíada Nacional de Ciências               |      | ouro    | ciências   | nacional
10 | ONEE     | Olimp. Nacional de Eficiência Energética     |      | ouro    | física     | nacional
11 | ONEE     | Olimp. Nacional de Eficiência Energética     |      | ouro    | física     | nacional
12 | ...
```

## O design (decidido)

- Uma parede em grade: 7 colunas no desktop, 3 no celular. No centro, a sua foto segurando as
  medalhas (3 × 3 células) com a placa "39 medals · 19 gold · 2 international". Em volta, uma
  medalha por card, no mesmo estilo dos cards do site (borda de 1 px, cantos arredondados, fundo
  `--surface`). Sobra uma célula, que vira a placa "49 competitions".
- Hover/foco: o card sobe e mostra a legenda (sigla · ano · medalha). Clique: abre em tela cheia.
- Chegada: os cards aparecem em cascata (só opacidade e transform). Com reduced-motion, tudo já
  aparece pronto. Imagens com tamanho reservado (zero CLS).
- Por que grade e não círculo em volta da foto: 39 medalhas num anel ficam minúsculas; a grade
  aceita qualquer quantidade e lê como uma parede de verdade.
- Onde: página `/work/medals` (já existe, sem fotos) ganha a parede; o card "39 Olympiad Medals"
  da Home passa a mostrar a foto do centro e leva para a parede. Arquivos em
  `public/honors/medals/`, dados em `src/data/medals.json`.
