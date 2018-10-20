module.exports = program => program
  .command('build [filepath|dirpath]')
  .description('Build a marklet project into a website.')
  // .option('-s, --source [path]', 'Read text from file')
  // .option('-i, --input [text]', 'Read text directly from stdin', '')
  // .option('-d, --dest [path]', 'Write parsed data to file instead of stdin')
  .allowConfig()
  .action(function(filepath = '') {
    const options = this.getOptions(filepath)
    console.log(options)
  })
