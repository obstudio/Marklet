module.exports = {
  tokenizer: {
    root: [
      { include: 'topLevel' },
    ],
    topLevel: [
      {
        regex: /(#{1,4}) +([^\n]+?)( +#)?/,
        action: {
          token: 'heading'
        }
      }
    ],
  },
}
