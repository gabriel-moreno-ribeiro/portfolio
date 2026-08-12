# Como adicionar um livro à biblioteca

Adicionar um objeto ao array em `src/data/books.json` é a **única** ação necessária.
Número de fileiras, divisão, altura de cada prateleira, geometria do móvel, posição da câmera e animações são todos calculados em runtime.

## Campos obrigatórios

```jsonc
{
  "id": "nome-do-livro",           // kebab-case único, usado como seed do PRNG e no URL
  "title": "Nome do Livro",
  "author": "Nome Completo",
  "year": 2024,                    // ano de publicação original
  "pages": 320,
  "cover": "/books/nome-do-livro.webp", // webp, largura máx 800px
  "coverColor": "#1a3a6b",         // cor dominante da capa, usada como placeholder
  "format": "standard",            // pocket | standard | large | textbook
  "status": "finished",            // finished | reading
  "favorite": false,
  "progress": 100,                 // 0-100; use <100 quando status = reading
  "tags": ["sci-fi"],
  "readAge": 17,                   // idade em que você leu
  "readPeriod": "2024 - 2025"      // use hífen simples, não en-dash
}
```

## Campos opcionais

```jsonc
{
  "subtitle": "The subtitle",
  "rating": 5,                     // 1-5
  "review": "...",                 // 45-90 palavras, sem em-dash ou en-dash
  "quote": "Frase marcante.",
  "language": "pt",                // só preencher se você leu em português
  "finishedAt": "2025-01-01",
  "link": "https://..."            // só preencher se você verificou o URL
}
```

## Formatos e o que eles implicam em dimensões

| format | exemplos | espessura aprox | altura aprox |
|--------|----------|-----------------|--------------|
| pocket | romances finos, peças teatrais | 0.10-0.25 | 1.75-1.90 |
| standard | maioria dos livros | 0.15-0.35 | 1.90-2.15 |
| large | Harry Potter, Duna, sagas | 0.25-0.46 | 2.10-2.35 |
| textbook | didáticos, manuais | 0.25-0.46 | 2.20-2.45 |

As dimensões exatas são calculadas em runtime via PRNG semeado no `id`.

## Ordem na estante

A ordem no array é a ordem de leitura cronológica (campo `readAge`). Coloque o novo livro na posição correta pelo `readAge`.

## Capa

Converta para webp antes de adicionar:
```bash
npx sharp-cli -i capa-original.jpg -o public/books/nome-do-livro.webp --resize 800 --quality 80
```
