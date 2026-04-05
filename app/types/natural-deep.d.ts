declare module 'natural/lib/natural/phonetics/metaphone.js' {
  class Metaphone {
    process(token: string): string
  }
  export default Metaphone
}

declare module 'natural/lib/natural/stemmers/porter_stemmer.js' {
  const PorterStemmer: { stem(token: string): string }
  export default PorterStemmer
}
