import { autoUpdater, app, BrowserWindow, Menu, shell, dialog } from 'electron'
import os from 'os'
import { RELEASE_BASE_URL } from './app/constants'

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
        `${RELEASE_BASE_URL}/update/${platform}_${arch}/${version}` :
        `${RELEASE_BASE_URL}/update/win32/${version}`

    autoUpdater.addListener('update-downloaded', (event, releaseNotes, releaseName) => {
        if (mainWindow) mainWindow.webContents.send('update-downloaded', releaseName)
    })

    autoUpdater.setFeedURL(updateFeed)
    autoUpdater.checkForUpdates()
}

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

    // Reset current file
    currentFile = null

    // Add padding for the file menu in Windows
    const height = platform === 'darwin' ? 400 : 440

    mainWindow = new BrowserWindow({
        show: false,
        width: 1024,
        minWidth: 850,
        height,
        minHeight: height,
        maxHeight: height,
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
        template = [
            {
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
                            if (mainWindow) mainWindow.close()
                            createWindow()
                        },
                    },
                    {
                        label: 'Open',
                        accelerator: 'Command+O',
                        click: onOpenDialog,
                    },
                    {
                        label: 'Save',
                        accelerator: 'Command+S',
                        click: onSaveDialog,
                    },
                    {
                        label: 'Save As...',
                        accelerator: 'Command+Shift+S',
                        click: onSaveAsDialog,
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
                    },
                    {
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
                        label: 'Toggle Developer Tools',
                        accelerator: 'Alt+Command+I',
                        click() {
                            mainWindow.toggleDevTools()
                        }
                    }] : []
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
                        click: onLearnMore,
                    },
                    {
                        label: 'Activate',
                        click: onActivate,
                    },
                ],
            },
        ]

        menu = Menu.buildFromTemplate(template)
        Menu.setApplicationMenu(menu)
    } else {
        template = [
            {
                label: '&File',
                submenu: [
                    {
                        label: '&Open',
                        accelerator: 'Ctrl+O',
                        click: onOpenDialog,
                    },
                    {
                        label: '&Close',
                        accelerator: 'Ctrl+W',
                        click () {
                            mainWindow.close()
                        }
                    },
                    {
                        label: '&Save',
                        accelerator: 'Ctrl+S',
                        click: onSaveDialog,
                    },
                    {
                        label: '&Save As...',
                        accelerator: 'Ctrl+Shift+S',
                        click: onSaveAsDialog,
                    },
                ],
            },
            {
                label: '&View',
                submenu: (process.env.NODE_ENV === 'development') ? [
                    {
                        label: '&Reload',
                        accelerator: 'Ctrl+R',
                        click () {
                            mainWindow.webContents.reload()
                        }
                    },
                    {
                        label: 'Toggle &Developer Tools',
                        accelerator: 'Alt+Ctrl+I',
                        click () {
                            mainWindow.toggleDevTools()
                        }
                    }
                ] : []
            },
            {
                label: 'Help',
                submenu: [
                    {
                        label: 'Learn More',
                        click: onLearnMore,
                    },
                    {
                        label: 'Activate',
                        click: onActivate,
                    },
                ]
            }
        ]

        menu = Menu.buildFromTemplate(template)
        mainWindow.setMenu(menu)
    }
}

function onOpenDialog () {
    dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            { name: 'Bezie', extensions: ['bezie'] },
        ],
    }, (paths = []) => {
        const filename = paths[0]
        if (filename) {
            mainWindow.webContents.send('open-file', filename)
            currentFile = filename
        }
    })
}

function onSaveDialog () {
    if (currentFile) {
        mainWindow.webContents.send('save-file', currentFile)
    } else {
        dialog.showSaveDialog({
            filters: [
                { name: 'Bezie', extensions: ['bezie'] },
            ],
        }, filename => {
            if (filename) {
                mainWindow.webContents.send('save-file', filename)
                currentFile = filename
            }
        })
    }
}

function onSaveAsDialog () {
    dialog.showSaveDialog({
        filters: [
            { name: 'Bezie', extensions: ['bezie'] },
        ],
    }, filename => {
        if (filename) {
            mainWindow.webContents.send('save-file', filename)
            currentFile = filename
        }
    })
}

function onLearnMore () {
    shell.openExternal('http://bezie.io')
}

function onActivate () {
    mainWindow.webContents.send('activate')
}

app.on('ready', createWindow)

app.on('activate', () => {
    if (mainWindow === null) createWindow()
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})
