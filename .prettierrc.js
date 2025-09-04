module.exports = {
  semi: true, // vždy bodkočiarka na konci riadku
  singleQuote: true, // 'single quotes' namiesto "double quotes"
  jsxSingleQuote: false, // v JSX sa používajú dvojité úvodzovky (bežná prax)
  trailingComma: 'all', // všade, kde sa dá (lepšie diffy v Gite)
  printWidth: 100, // max šírka riadku, väčšinou 80 alebo 100
  tabWidth: 2, // 2 medzery na odsadenie (štandard v JS/TS)
  bracketSpacing: true, // { foo: bar } namiesto {foo:bar}
  arrowParens: 'always', // (x) => ... namiesto x => ...
  endOfLine: 'lf', // Unixové konce riadkov (LF), bezpečnejšie pre tímy
};
