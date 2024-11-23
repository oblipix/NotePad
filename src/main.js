import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron';
import { Octokit } from '@octokit/rest';
import fs from 'fs';
import path from 'path';
import { marked } from 'marked';

let mainWindow;

// Function to create the main window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile('src/index.html');
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create custom menu
  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'Open', click: openFileDialog }, // Added to menu
        { type: 'separator' },
        { label: 'Quit', role: 'quit' },
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', role: 'undo' },
        { label: 'Redo', role: 'redo' },
        { type: 'separator' },
        { label: 'Copy', role: 'copy' },
        { label: 'Paste', role: 'paste' },
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Instruction for Use',
          click() {
            openInstructionModal();
          }
        },
        { type: 'separator' },
        {
          label: 'About',
          click() {
            openAboutModal(); // Action when clicking on 'About'
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function openInstructionModal() {
  // Sends a message to the renderer process (front-end) to open the modal
  mainWindow.webContents.send('open-instruction-modal');
}

function openAboutModal() {
  // Sends a message to the renderer process (front-end) to open the "About" modal
  mainWindow.webContents.send('open-about-modal');
}

// Calls the function to create the window when the app is ready
app.whenReady().then(createWindow);

// Close the application when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// If the app is reactivated
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// IPC to save to GitHub
ipcMain.on('save-to-github', async (event, { token, username, repo, content }) => {
  try {
    const octokit = new Octokit({ auth: token });
    const filePath = "notes/note.md";
    const message = "Adding new note";

    let existingFile = null;
    try {
      existingFile = await octokit.repos.getContent({
        owner: username,
        repo: repo,
        path: filePath,
      });
    } catch (err) {
      if (err.status === 404) {
        console.log("⚠️ File not found. Creating a new one.");
      } else {
        console.error("❌ Error checking the existing file!:", err);
        event.reply('file-saved', { success: false, message: '❌ Error checking the file in the GitHub repository!' });
        return;
      }
    }

    const contentBase64 = Buffer.from(content).toString("base64");

    await octokit.repos.createOrUpdateFileContents({
      owner: username,
      repo: repo,
      path: filePath,
      message,
      content: contentBase64,
      sha: existingFile ? existingFile.data.sha : undefined,
    });

    event.reply('file-saved', { success: true, message: '✅ Note successfully sent to the GitHub repository!' });
  } catch (error) {
    console.error("Error sending to GitHub:", error);
    event.reply('file-saved', { success: false, message: `❌ Error sending to GitHub: ${error.message}` });
  }
});

// IPC to save locally with path selection
ipcMain.on('save-file', (event, noteContent) => {
  console.log("Content received in the main process: ", noteContent);

  // Open dialog to choose file path
  dialog.showSaveDialog({
    title: 'Choose where to save the file',
    defaultPath: path.join(app.getPath('desktop'), 'note.txt'), // Default path to save on desktop
    filters: [{ name: 'Text Files', extensions: ['txt'] }]
  }).then(result => {
    if (result.canceled) {
      event.reply('file-saved', { success: false, message: '⚠️ User canceled the path selection.' });
      return;
    }

    const filePath = result.filePath; // Path chosen by the user

    // Check if the writing was successful
    fs.writeFile(filePath, noteContent, (err) => {
      if (err) {
        console.error("❌ Error saving the file locally.", err);
        event.reply('file-saved', { success: false, message: `❌ Error saving the file: ${err.message}` });
        return;
      }
      console.log("File saved at:", filePath);
      event.reply('file-saved', { success: true, message: `✅ File saved at: ${filePath}` });
    });
  }).catch(err => {
    console.error("❌ Error opening save dialog:", err);
    event.reply('file-saved', { success: false, message: `❌ Error opening the save dialog here: ${err.message}` });
  });
});

// Function to open the file open dialog
function openFileDialog() {
  dialog.showOpenDialog({
    title: '📂 File opened successfully!',
    filters: [{ name: 'Text Files', extensions: ['txt'] }],
    properties: ['openFile'] // Allows only files to be opened
  }).then(result => {
    if (result.canceled) {
      return;
    }

    const filePath = result.filePaths[0]; // Path of the chosen file

    // Read the content of the file
    fs.readFile(filePath, 'utf-8', (err, data) => {
      if (err) {
        console.error("❌ Error reading the file:", err);
        return;
      }

      // Sends the file content to the renderer
      mainWindow.webContents.send('file-opened', data);
    });
  }).catch(err => {
    console.error("❌ Error opening the file open dialog:", err);
  });
}
