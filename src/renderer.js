const { ipcRenderer } = require('electron');

const textArea = document.getElementById('notePad');
const markdownPreview = document.getElementById('markdownPreview');

textArea.addEventListener('input', () => {
  const markdownContent = textArea.value;
  markdownPreview.innerHTML = marked.parse(markdownContent); 
});

document.addEventListener("DOMContentLoaded", () => {
  const githubModal = document.querySelector("#githubAuthModal .modal-content"); // Seletor do modal do GitHub
  const closeModalBtn = document.getElementById("closeModalBtn"); // Botão para fechar o modal
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  // Começar a arrastar o modal do GitHub
  githubModal.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - githubModal.offsetLeft;
    offsetY = e.clientY - githubModal.offsetTop;
    githubModal.style.cursor = "grabbing"; // Cursor de arrastar
  });

  // Mover o modal do GitHub
  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      const x = e.clientX - offsetX;
      const y = e.clientY - offsetY;
      githubModal.style.left = `${x}px`;
      githubModal.style.top = `${y}px`;
    }
  });

  // Finalizar o arraste
  document.addEventListener("mouseup", () => {
    isDragging = false;
    githubModal.style.cursor = "move"; // Cursor padrão após arrastar
  });

  // Função para fechar o modal do GitHub
  closeModalBtn.addEventListener("click", () => {
    document.getElementById("githubAuthModal").style.display = "none";
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const githubModal = document.querySelector("#githubAuthModal .modal-content"); // Seletor do modal do GitHub
  const closeModalBtn = document.getElementById("closeModalBtn"); // Botão para fechar o modal
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  // Começar a arrastar o modal do GitHub
  githubModal.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - githubModal.offsetLeft;
    offsetY = e.clientY - githubModal.offsetTop;
    githubModal.style.cursor = "grabbing"; // Cursor de arrastar
  });

  // Mover o modal do GitHub
  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      const x = e.clientX - offsetX;
      const y = e.clientY - offsetY;
      githubModal.style.left = `${x}px`;
      githubModal.style.top = `${y}px`;
    }
  });

  // Finalizar o arraste
  document.addEventListener("mouseup", () => {
    isDragging = false;
    githubModal.style.cursor = "move"; // Cursor padrão após arrastar
  });

  // Função para fechar o modal do GitHub
  closeModalBtn.addEventListener("click", () => {
    document.getElementById("githubAuthModal").style.display = "none";
  });
});

// Função para abrir o modal de instruções de uso
ipcRenderer.on('open-instruction-modal', () => {
  document.getElementById('instructionModal').style.display = 'block';
});

// Função para abrir o modal "Sobre"
ipcRenderer.on('open-about-modal', () => {
  document.getElementById('aboutModal').style.display = 'block'; // Mostrar o modal "Sobre"
});

// Fechar o modal de instruções de uso
document.getElementById('closeModal').addEventListener('click', () => {
  document.getElementById('instructionModal').style.display = 'none';
});

// Fechar o modal "Sobre" quando o botão "Fechar" for clicado
document.getElementById('closeAboutModal').addEventListener('click', () => {
  document.getElementById('aboutModal').style.display = 'none';
});

// Exibir o formulário de conexão com o GitHub
document.getElementById("connectGitHubBtn").addEventListener("click", () => {
  document.getElementById("githubAuthForm").style.display = "block";
});

// Enviar dados para o GitHub
document.getElementById("saveToGitHubBtn").addEventListener("click", () => {
  const token = document.getElementById("githubToken").value.trim();
  const username = document.getElementById("githubUsername").value.trim();
  const repo = document.getElementById("githubRepo").value.trim();
  const noteContent = document.getElementById("notePad").value;

  // Verificar se todos os campos estão preenchidos
  if (!token || !username || !repo || !noteContent) {
    alert("Todos os campos são obrigatórios!");
    return;
  }

  // Enviar dados para o processo principal para salvar no GitHub
  ipcRenderer.send('save-to-github', { token, username, repo, content: noteContent });

  // Exibir feedback para o usuário
  ipcRenderer.once('file-saved', (event, result) => {
    alert(result.message);

    if (result.success) {
      document.getElementById("githubToken").value = "";
      document.getElementById("githubUsername").value = "";
      document.getElementById("githubRepo").value = "";
      document.getElementById("notePad").value = "";
    }
  });
});

// Evento para salvar localmente na área de trabalho
document.getElementById("saveLocalBtn").addEventListener("click", () => {
  const noteContent = document.getElementById("notePad").value;
  
  // Verificar se há conteúdo para salvar
  if (!noteContent) {
    alert("O conteúdo está vazio. Não é possível salvar.");
    return;
  }

  // Enviar para o processo principal salvar na área de trabalho
  ipcRenderer.send('save-file', noteContent);

  // Exibir feedback após salvar
  ipcRenderer.once('file-saved', (event, result) => {
    alert(result.message);
  });
});

// Função para abrir o modal de autenticação do GitHub
function openGitHubAuthModal() {
  const modal = document.getElementById('githubAuthModal');
  modal.style.display = 'block';
}

// Função para fechar o modal de autenticação do GitHub
function closeGitHubAuthModal() {
  const modal = document.getElementById('githubAuthModal');
  modal.style.display = 'none';
}

// Adicionar evento de clique para fechar o modal
document.getElementById('closeModalBtn').addEventListener('click', closeGitHubAuthModal);

// Abrir o modal quando necessário (exemplo de uso)
document.getElementById('connectGitHubBtn').addEventListener('click', openGitHubAuthModal);

// Fechar o modal quando clicar fora do conteúdo
window.addEventListener('click', function(event) {
  const modal = document.getElementById('githubAuthModal');
  if (event.target === modal) {
    closeGitHubAuthModal();
  }
});

// Função para salvar dados no localStorage
function saveToLocalStorage() {
  const githubToken = document.getElementById('githubToken').value;
  const githubUsername = document.getElementById('githubUsername').value;
  const githubRepo = document.getElementById('githubRepo').value;

  // Armazenar dados no localStorage
  localStorage.setItem('githubToken', githubToken);
  localStorage.setItem('githubUsername', githubUsername);
  localStorage.setItem('githubRepo', githubRepo);
}

// Função para preencher campos com dados do localStorage
function populateFieldsFromLocalStorage() {
  const githubToken = localStorage.getItem('githubToken');
  const githubUsername = localStorage.getItem('githubUsername');
  const githubRepo = localStorage.getItem('githubRepo');

  if (githubToken) {
    document.getElementById('githubToken').value = githubToken;
  }
  if (githubUsername) {
    document.getElementById('githubUsername').value = githubUsername;
  }
  if (githubRepo) {
    document.getElementById('githubRepo').value = githubRepo;
  }
}

// Chamar função para preencher os campos quando o modal for aberto
document.getElementById('githubAuthModal').addEventListener('click', function() {
  populateFieldsFromLocalStorage();
});

// Função para abrir um arquivo
document.getElementById("openFileBtn").addEventListener("click", () => {
  ipcRenderer.invoke('open-file-dialog').then(filePath => {
    if (filePath) {
      // Carregar o conteúdo do arquivo selecionado
      fs.readFile(filePath, 'utf-8', (err, data) => {
        if (err) {
          alert("Erro ao abrir o arquivo");
        } else {
          document.getElementById("notePad").value = data;
        }
      });
    }
  });
});
