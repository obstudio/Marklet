import { InlineLexer } from '@marklet/core'
import { LexerConfig } from './index'

function escape(html: string): string {
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export default class extends InlineLexer {
  constructor(config: LexerConfig = {}) {
    super([
      {
        regex: /(?=\n[ \t]*(\n|$))/,
        pop: true
      },
      {
        type: 'escape',
        regex: /\\([\s\S])/,
        token: (cap) => cap[1]
      },
      {
        type: 'newline',
        regex: /\n/,
        token: '<br/>'
      },
      {
        type: 'code',
        regex: /(`+)\s*([\s\S]*?[^`]?)\s*\1(?!`)/,
        token: (cap) => `<code>${escape(cap[2])}</code>`
      },
      {
        type: 'strikeout',
        regex: /-(?=\S)([\s\S]*?\S)-(?!-)/,
        token: (cap) => `<del>${cap.inner}</del>`
      },
      {
        type: 'underline',
        regex: /_(?=\S)([\s\S]*?\S)_(?!_)/,
        token: (cap) => `<span style="text-decoration: underline">${cap.inner}</span>`
      },
      {
        type: 'bold',
        regex: /\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
        token: (cap) => `<strong>${cap.inner}</strong>`
      },
      {
        type: 'italic',
        regex: /\*(?=\S)([\s\S]*?\S)\*(?!\*)/,
        token: (cap) => `<em>${cap.inner}</em>`
      },
      {
        type: 'comment',
        regex: /\(\((?=\S)([\s\S]*?\S)\)\)(?!\))/,
        token: (cap) => `<span class="comment">${cap.inner}</span>`
      },
      {
        type: 'package',
        regex: /{{(?=\S)([\s\S]*?\S)}}(?!})/,
        token: (cap) => `<code class="package">${cap.inner}</code>`
      },
      {
        type: 'link',
        regex: /\[(?:([^\]|]+)\|)?([^\]]+)\]/,
        token(cap) {
          let text, match
          if (cap[1]) {
            text = cap[1]
          } else if (match = cap[2].match(/^\$\w+(#\w+)$/)) {
            text = match[1]
            // } else if (this.resolve(cap[2]) in this.options.dictionary) { // FIXME: function not added yet
            //   text = this.options.dictionary[this.resolve(cap[2])]
          } else if (cap[2].includes('#') || cap[2].includes('/')) {
            text = cap[2].match(/[#/]([^#/]+)$/)[1]
          } else {
            text = cap[2]
          }
          return cap[2][0] === '!' ?
            `<img src="${cap[2].slice(1)}" alt="${text}" title="${text}">` : // TODO: special treatment like <a> necessary?
            `<a href="#" data-raw-url="${cap[2]}" onclick="event.preventDefault()"'>${text}</a>`
        }
      }
    ], config)
  }
}
