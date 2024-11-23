import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron';
import { Octokit } from '@octokit/rest';
import fs from 'fs';
import path from 'path';
import { marked } from 'marked';

let mainWindow;

// Função para criar a janela principal
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

  // Criar o menu personalizado
  const template = [
    {
      label: 'Arquivo',
      submenu: [
        { label: 'Abrir', click: openFileDialog }, // Adicionado ao menu
        { type: 'separator' },
        { label: 'Sair', role: 'quit' },
      ]
    },
    {
      label: 'Editar',
      submenu: [
        { label: 'Desfazer', role: 'undo' },
        { label: 'Refazer', role: 'redo' },
        { type: 'separator' },
        { label: 'Copiar', role: 'copy' },
        { label: 'Colar', role: 'paste' },
      ]
    },
    {
      label: 'Ajuda',
      submenu: [
        {
          label: 'Instruções de Uso',
          click() {
            openInstructionModal();
          }
        },
        { type: 'separator' },
        {
          label: 'Sobre',
          click() {
            openAboutModal(); // Ação ao clicar em 'Sobre'
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function openInstructionModal() {
  // Envia uma mensagem para o processo de renderização (front-end) para abrir o modal
  mainWindow.webContents.send('open-instruction-modal');
}

function openAboutModal() {
  // Envia uma mensagem para o processo de renderização (front-end) para abrir o modal "Sobre"
  mainWindow.webContents.send('open-about-modal');
}

// Chama a função para criar a janela quando o aplicativo estiver pronto
app.whenReady().then(createWindow);

// Fecha o aplicativo quando todas as janelas forem fechadas
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Se o aplicativo for reativado
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// IPC para salvar no GitHub
ipcMain.on('save-to-github', async (event, { token, username, repo, content }) => {
  try {
    const octokit = new Octokit({ auth: token });
    const filePath = "notes/note.md";
    const message = "Adicionando nova nota";

    let existingFile = null;
    try {
      existingFile = await octokit.repos.getContent({
        owner: username,
        repo: repo,
        path: filePath,
      });
    } catch (err) {
      if (err.status === 404) {
        console.log("⚠️ Arquivo não encontrado. Criando um novo.");
      } else {
        console.error("❌ Erro ao verificar o arquivo existente!:", err);
        event.reply('file-saved', { success: false, message: '❌ Erro ao verificar o arquivo no repositório do GitHub!' });
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

    event.reply('file-saved', { success: true, message: '✅ Nota enviada ao repositório do GitHub com sucesso!' });
  } catch (error) {
    console.error("Erro ao enviar para o GitHub:", error);
    event.reply('file-saved', { success: false, message: `❌ Erro ao enviar para o GitHub: ${error.message}` });
  }
});

// IPC para salvar localmente com seleção de caminho
ipcMain.on('save-file', (event, noteContent) => {
  console.log("Conteúdo recebido no processo principal: ", noteContent);

  // Abre o diálogo para escolher o caminho do arquivo
  dialog.showSaveDialog({
    title: 'Escolha onde salvar o arquivo',
    defaultPath: path.join(app.getPath('desktop'), 'note.txt'), // Caminho padrão para salvar na área de trabalho
    filters: [{ name: 'Arquivos de Texto', extensions: ['txt'] }]
  }).then(result => {
    if (result.canceled) {
      event.reply('file-saved', { success: false, message: '⚠️ Usuário cancelou a seleção de caminho.' });
      return;
    }

    const filePath = result.filePath; // Caminho escolhido pelo usuário

    // Verifica se a gravação foi bem-sucedida
    fs.writeFile(filePath, noteContent, (err) => {
      if (err) {
        console.error("❌ Erro ao salvar o arquivo localmente.", err);
        event.reply('file-saved', { success: false, message: `❌ Erro ao salvar o arquivo: ${err.message}` });
        return;
      }
      console.log("Arquivo salvo em:", filePath);
      event.reply('file-saved', { success: true, message: `✅ Arquivo salvo em: ${filePath}` });
    });
  }).catch(err => {
    console.error("❌ Erro ao abrir o diálogo de salvamento:", err);
    event.reply('file-saved', { success: false, message: `❌ Erro ao abrir o diálogo de salvamento aqui: ${err.message}` });
  });
});

// Função para abrir o diálogo de abrir arquivo
function openFileDialog() {
  dialog.showOpenDialog({
    title: '📂 Arquivo aberto com sucesso!',
    filters: [{ name: 'Arquivos de Texto', extensions: ['txt'] }],
    properties: ['openFile'] // Permite apenas arquivos para serem abertos
  }).then(result => {
    if (result.canceled) {
      return;
    }

    const filePath = result.filePaths[0]; // Caminho do arquivo escolhido

    // Lê o conteúdo do arquivo
    fs.readFile(filePath, 'utf-8', (err, data) => {
      if (err) {
        console.error("❌ Erro ao ler o arquivo:", err);
        return;
      }

      // Envia o conteúdo do arquivo para o renderer
      mainWindow.webContents.send('file-opened', data);
    });
  }).catch(err => {
    console.error("❌ Erro ao abrir o diálogo de abrir arquivo:", err);
  });
}
