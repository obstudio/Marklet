const { app, BrowserWindow } = require('electron')
const path = require('path')

let mainWindow

function createMain() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    center: true,
    resizable: false,
    useContentSize: true,
    autoHideMenuBar: false,
  })

  mainWindow.loadFile(path.join(__dirname, 'index.prod.html'))
  
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('ready', createMain)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (mainWindow === null) createMain()
})
