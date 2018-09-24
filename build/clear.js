const fs = require('fs')
const path = require('path')

const BASE_DIR = path.join(__dirname, '../packages')

fs.readdirSync(BASE_DIR).forEach((dir) => {
  fs.readdirSync(path.join(BASE_DIR, dir))
    .forEach((file) => {
      if (/[\w.-]+\.tgz/.test(file)) fs.unlinkSync(path.join(BASE_DIR, dir, file))
    })
})
