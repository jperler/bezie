import { autoUpdater, app, BrowserWindow, Menu, shell, dialog } from 'electron'
import os from 'os'

if (require('electron-squirrel-startup')) app.quit() // eslint-disable-line

let menu
let template
let updateFeed
let mainWindow = null
let currentFile = null

const platform = os.platform()
const arch = os.arch()
const version = app.getVersion()

if (process.env.NODE_ENV === 'development') {
    require('electron-debug')() // eslint-disable-line global-require
} else {
    updateFeed = platform === 'darwin' ?
        `https://bezie.herokuapp.com/update/${platform}_${arch}/${version}` :
        `https://bezie.herokuapp.com/update/win32/${version}` :

    autoUpdater.addListener('update-downloaded', (event, releaseNotes, releaseName) => {
        if (mainWindow) mainWindow.webContents.send('update-downloaded', releaseName)
    })

    autoUpdater.setFeedURL(updateFeed)
    autoUpdater.checkForUpdates()
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})


const installExtensions = async () => {
    if (process.env.NODE_ENV === 'development') {
        const installer = require('electron-devtools-installer') // eslint-disable-line
        const extensions = [
            'REACT_DEVELOPER_TOOLS',
            'REDUX_DEVTOOLS'
        ]
        const forceDownload = !!process.env.UPGRADE_EXTENSIONS
        for (const name of extensions) {
            try {
                await installer.default(installer[name], forceDownload)
            } catch (e) {} // eslint-disable-line
        }
    }
}

const createWindow = async () => {
    await installExtensions()

    mainWindow = new BrowserWindow({
        show: false,
        width: 1024,
        height: 400,
        minHeight: 400,
        maxHeight: 400,
        minWidth: 800,
    })

    mainWindow.loadURL(`file://${__dirname}/app/app.html`)

    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.show()
        mainWindow.focus()
    })

    mainWindow.on('closed', () => {
        mainWindow = null
    })

    if (process.env.NODE_ENV === 'development') {
        mainWindow.openDevTools()
        mainWindow.webContents.on('context-menu', (e, props) => {
            const { x, y } = props

            Menu.buildFromTemplate([{
                label: 'Inspect element',
                click() {
                    mainWindow.inspectElement(x, y)
                }
            }]).popup(mainWindow)
        })
    }

    if (process.platform === 'darwin') {
        template = [{
            label: 'Bezie',
            submenu: [
                {
                    label: 'About Bezie',
                    selector: 'orderFrontStandardAboutPanel:'
                },
                { type: 'separator' },
                {
                    label: 'Hide',
                    accelerator: 'Command+H',
                    selector: 'hide:'
                },
                {
                    label: 'Hide Others',
                    accelerator: 'Command+Shift+H',
                    selector: 'hideOtherApplications:'
                },
                {
                    label: 'Show All',
                    selector: 'unhideAllApplications:'
                },
                { type: 'separator' },
                {
                    label: 'Quit',
                    accelerator: 'Command+Q',
                    click () {
                        app.quit()
                    }
                },
            ]
        },
        {
            label: 'File',
            submenu: [
                {
                    label: 'New',
                    accelerator: 'Command+N',
                    click () {
                        if (mainWindow === null) createWindow()
                    },
                },
                {
                    label: 'Open',
                    accelerator: 'Command+O',
                    click () {
                        dialog.showOpenDialog({
                            properties: ['openFile'],
                            filters: [
                                { name: 'Ableton', extensions: ['alc'] },
                            ],
                        }, filename => {
                            currentFile = filename[0]
                            mainWindow.webContents.send('open-file', filename)
                        })
                    },
                },
                {
                    label: 'Save',
                    accelerator: 'Command+S',
                    click () {
                        if (currentFile) {
                            mainWindow.webContents.send('save-file', currentFile)
                        } else {
                            dialog.showSaveDialog({
                                filters: [
                                    { name: 'Ableton', extensions: ['alc'] },
                                ],
                            }, filename => {
                                mainWindow.webContents.send('save-file', filename)
                            })
                        }
                    },
                },
                {
                    label: 'Save As...',
                    accelerator: 'Command+Shift+S',
                    click () {
                        dialog.showSaveDialog({
                            filters: [
                                { name: 'Ableton', extensions: ['alc'] },
                            ],
                        }, filename => {
                            mainWindow.webContents.send('save-file', filename)
                        })
                    },
                },
            ],
        },
        {
            label: 'Edit',
            submenu: [
                {
                    label: 'Undo',
                    accelerator: 'Command+Z',
                    selector: 'undo:'
                },
                {
                    label: 'Redo',
                    accelerator: 'Shift+Command+Z',
                    selector: 'redo:'
                },
                { type: 'separator' },
                {
                    label: 'Cut',
                    accelerator: 'Command+X',
                    selector: 'cut:'
                }, {
                    label: 'Copy',
                    accelerator: 'Command+C',
                    selector: 'copy:'
                },
                {
                    label: 'Paste',
                    accelerator: 'Command+V',
                    selector: 'paste:'
                },
                {
                    label: 'Select All',
                    accelerator: 'Command+A',
                    selector: 'selectAll:'
                },
            ],
        },
        {
            label: 'View',
            submenu: (process.env.NODE_ENV === 'development') ? [
                {
                    label: 'Reload',
                    accelerator: 'Command+R',
                    click () {
                        mainWindow.webContents.reload()
                    }
                },
                {
                    label: 'Toggle Full Screen',
                    accelerator: 'Ctrl+Command+F',
                    click () {
                        mainWindow.setFullScreen(!mainWindow.isFullScreen())
                    }
                },
                {
                    label: 'Toggle Developer Tools',
                    accelerator: 'Alt+Command+I',
                    click() {
                        mainWindow.toggleDevTools()
                    }
                }] : [{
                    label: 'Toggle Full Screen',
                    accelerator: 'Ctrl+Command+F',
                    click () {
                        mainWindow.setFullScreen(!mainWindow.isFullScreen())
                    }
                }]
        },
        {
            label: 'Window',
            submenu: [
                {
                    label: 'Minimize',
                    accelerator: 'Command+M',
                    selector: 'performMiniaturize:'
                },
                {
                    label: 'Close',
                    accelerator: 'Command+W',
                    selector: 'performClose:'
                },
                { type: 'separator' },
                {
                    label: 'Bring All to Front',
                    selector: 'arrangeInFront:'
                },
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'Learn More',
                    click () {
                        shell.openExternal('http://electron.atom.io')
                    }
                },
            ],
        }]

        menu = Menu.buildFromTemplate(template)
        Menu.setApplicationMenu(menu)
    } else {
        template = [{
            label: '&File',
            submenu: [
                {
                    label: '&Open',
                    accelerator: 'Ctrl+O'
                },
                {
                    label: '&Close',
                    accelerator: 'Ctrl+W',
                    click () {
                        mainWindow.close()
                    }
                }
            ],
        },
        {
            label: '&View',
            submenu: (process.env.NODE_ENV === 'development') ? [{
                label: '&Reload',
                accelerator: 'Ctrl+R',
                click () {
                    mainWindow.webContents.reload()
                }
            },
            {
                label: 'Toggle &Full Screen',
                accelerator: 'F11',
                click () {
                    mainWindow.setFullScreen(!mainWindow.isFullScreen())
                }
            },
            {
                label: 'Toggle &Developer Tools',
                accelerator: 'Alt+Ctrl+I',
                click () {
                    mainWindow.toggleDevTools()
                }
            }] : [{
                label: 'Toggle &Full Screen',
                accelerator: 'F11',
                click () {
                    mainWindow.setFullScreen(!mainWindow.isFullScreen())
                }
            }]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'Learn More',
                    click () {
                        shell.openExternal('http://electron.atom.io')
                    }
                },
            ]
        }]

        menu = Menu.buildFromTemplate(template)
        mainWindow.setMenu(menu)
    }
}

app.on('ready', createWindow)

app.on('activate', () => {
    if (mainWindow === null) createWindow()
})
