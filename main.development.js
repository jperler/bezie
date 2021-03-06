import { app, BrowserWindow, Menu, shell, dialog } from "electron";
import os from "os";

let menu;
let template;
let mainWindow = null;
let currentFile = null;

const platform = os.platform();

if (process.env.NODE_ENV === "development") {
  require("electron-debug")();
}

const installExtensions = async () => {
  if (process.env.NODE_ENV === "development") {
    const installer = require("electron-devtools-installer");
    const extensions = ["REACT_DEVELOPER_TOOLS", "REDUX_DEVTOOLS"];
    const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
    for (const name of extensions) {
      try {
        await installer.default(installer[name], forceDownload);
      } catch (e) {} // eslint-disable-line
    }
  }
};

function onOpenDialog() {
  dialog.showOpenDialog(
    {
      properties: ["openFile"],
      filters: [{ name: "Bezie", extensions: ["bezie"] }]
    },
    (paths = []) => {
      const filename = paths[0];
      if (filename) {
        mainWindow.webContents.send("open-file", filename);
        currentFile = filename;
      }
    }
  );
}

function onSaveDialog() {
  if (currentFile) {
    mainWindow.webContents.send("save-file", currentFile);
  } else {
    dialog.showSaveDialog(
      {
        filters: [{ name: "Bezie", extensions: ["bezie"] }]
      },
      filename => {
        if (filename) {
          mainWindow.webContents.send("save-file", filename);
          currentFile = filename;
        }
      }
    );
  }
}

function onSaveAsDialog() {
  dialog.showSaveDialog(
    {
      filters: [{ name: "Bezie", extensions: ["bezie"] }]
    },
    filename => {
      if (filename) {
        mainWindow.webContents.send("save-file", filename);
        currentFile = filename;
      }
    }
  );
}

function onLearnMore() {
  shell.openExternal("http://bezie.io");
}

function onManual() {
  shell.openExternal("http://bezie.io/manual.html");
}

const createWindow = async () => {
  await installExtensions();

  // Reset current file
  currentFile = null;

  // Add padding for the file menu in Windows
  const height = platform === "darwin" ? 400 : 440;

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    minWidth: 950,
    height,
    minHeight: height,
    maxHeight: height
  });

  mainWindow.loadURL(`file://${__dirname}/app/app.html`);

  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  if (process.env.NODE_ENV === "development") {
    mainWindow.openDevTools();
    mainWindow.webContents.on("context-menu", (e, props) => {
      const { x, y } = props;

      Menu.buildFromTemplate([
        {
          label: "Inspect element",
          click() {
            mainWindow.inspectElement(x, y);
          }
        }
      ]).popup(mainWindow);
    });
  }

  if (process.platform === "darwin") {
    template = [
      {
        label: "Bezie",
        submenu: [
          {
            label: "About Bezie",
            selector: "orderFrontStandardAboutPanel:"
          },
          { type: "separator" },
          {
            label: "Hide",
            accelerator: "Command+H",
            selector: "hide:"
          },
          {
            label: "Hide Others",
            accelerator: "Command+Shift+H",
            selector: "hideOtherApplications:"
          },
          {
            label: "Show All",
            selector: "unhideAllApplications:"
          },
          { type: "separator" },
          {
            label: "Quit",
            accelerator: "Command+Q",
            click() {
              app.quit();
            }
          }
        ]
      },
      {
        label: "File",
        submenu: [
          {
            label: "New",
            accelerator: "Command+N",
            click() {
              if (mainWindow) mainWindow.close();
              createWindow();
            }
          },
          {
            label: "Open",
            accelerator: "Command+O",
            click: onOpenDialog
          },
          {
            label: "Save",
            accelerator: "Command+S",
            click: onSaveDialog
          },
          {
            label: "Save As...",
            accelerator: "Command+Shift+S",
            click: onSaveAsDialog
          }
        ]
      },
      {
        label: "Edit",
        submenu: [
          {
            label: "Undo",
            accelerator: "Command+Z",
            selector: "undo:"
          },
          {
            label: "Redo",
            accelerator: "Shift+Command+Z",
            selector: "redo:"
          },
          { type: "separator" },
          {
            label: "Cut",
            accelerator: "Command+X",
            selector: "cut:"
          },
          {
            label: "Copy",
            accelerator: "Command+C",
            selector: "copy:"
          },
          {
            label: "Paste",
            accelerator: "Command+V",
            selector: "paste:"
          },
          {
            label: "Select All",
            accelerator: "Command+A",
            selector: "selectAll:"
          }
        ]
      },
      {
        label: "View",
        submenu:
          process.env.NODE_ENV === "development"
            ? [
                {
                  label: "Reload",
                  accelerator: "Command+R",
                  click() {
                    mainWindow.webContents.reload();
                  }
                },
                {
                  label: "Toggle Developer Tools",
                  accelerator: "Alt+Command+I",
                  click() {
                    mainWindow.toggleDevTools();
                  }
                }
              ]
            : []
      },
      {
        label: "Window",
        submenu: [
          {
            label: "Minimize",
            accelerator: "Command+M",
            selector: "performMiniaturize:"
          },
          {
            label: "Close",
            accelerator: "Command+W",
            selector: "performClose:"
          },
          { type: "separator" },
          {
            label: "Bring All to Front",
            selector: "arrangeInFront:"
          },
          {
            label: "Toggle Always on Top",
            accelerator: "Command+T",
            click() {
              mainWindow.setAlwaysOnTop(!mainWindow.isAlwaysOnTop());
            }
          }
        ]
      },
      {
        label: "Help",
        submenu: [
          {
            label: "Learn More",
            click: onLearnMore
          },
          {
            label: "Manual",
            click: onManual
          }
        ]
      }
    ];

    menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  } else {
    template = [
      {
        label: "&File",
        submenu: [
          {
            label: "&Open",
            accelerator: "Ctrl+O",
            click: onOpenDialog
          },
          {
            label: "&Close",
            accelerator: "Ctrl+W",
            click() {
              mainWindow.close();
            }
          },
          {
            label: "&Save",
            accelerator: "Ctrl+S",
            click: onSaveDialog
          },
          {
            label: "&Save As...",
            accelerator: "Ctrl+Shift+S",
            click: onSaveAsDialog
          }
        ]
      },
      {
        label: "&View",
        submenu:
          process.env.NODE_ENV === "development"
            ? [
                {
                  label: "&Reload",
                  accelerator: "Ctrl+R",
                  click() {
                    mainWindow.webContents.reload();
                  }
                },
                {
                  label: "Toggle &Developer Tools",
                  accelerator: "Alt+Ctrl+I",
                  click() {
                    mainWindow.toggleDevTools();
                  }
                }
              ]
            : []
      },
      {
        label: "Window",
        submenu: [
          {
            label: "Toggle Always on Top",
            accelerator: "Ctrl+T",
            click() {
              mainWindow.setAlwaysOnTop(!mainWindow.isAlwaysOnTop());
            }
          }
        ]
      },
      {
        label: "Help",
        submenu: [
          {
            label: "Learn More",
            click: onLearnMore
          },
          {
            label: "Manual",
            click: onManual
          }
        ]
      }
    ];

    menu = Menu.buildFromTemplate(template);
    mainWindow.setMenu(menu);
  }
};

app.on("ready", createWindow);

app.on("activate", () => {
  if (mainWindow === null) createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
