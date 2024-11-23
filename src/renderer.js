const { ipcRenderer } = require('electron');

const textArea = document.getElementById('notePad');
const markdownPreview = document.getElementById('markdownPreview');

textArea.addEventListener('input', () => {
  const markdownContent = textArea.value;
  markdownPreview.innerHTML = marked.parse(markdownContent); 
});

document.addEventListener("DOMContentLoaded", () => {
  const githubModal = document.querySelector("#githubAuthModal .modal-content"); // GitHub modal selector
  const closeModalBtn = document.getElementById("closeModalBtn"); // Close the modal
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  // Start dragging the GitHub modal
  githubModal.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - githubModal.offsetLeft;
    offsetY = e.clientY - githubModal.offsetTop;
    githubModal.style.cursor = "grabbing"; // Grabbing cursor
  });

  // Move the GitHub modal
  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      const x = e.clientX - offsetX;
      const y = e.clientY - offsetY;
      githubModal.style.left = `${x}px`;
      githubModal.style.top = `${y}px`;
    }
  });

  // End dragging
  document.addEventListener("mouseup", () => {
    isDragging = false;
    githubModal.style.cursor = "move"; // Default cursor after dragging
  });

  // Function to close the GitHub modal
  closeModalBtn.addEventListener("click", () => {
    document.getElementById("githubAuthModal").style.display = "none";
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const githubModal = document.querySelector("#githubAuthModal .modal-content"); // GitHub modal selector
  const closeModalBtn = document.getElementById("closeModalBtn"); // Close the modal
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  // Start dragging the GitHub modal
  githubModal.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - githubModal.offsetLeft;
    offsetY = e.clientY - githubModal.offsetTop;
    githubModal.style.cursor = "grabbing"; // Grabbing cursor
  });

  // Move the GitHub modal
  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      const x = e.clientX - offsetX;
      const y = e.clientY - offsetY;
      githubModal.style.left = `${x}px`;
      githubModal.style.top = `${y}px`;
    }
  });

  // End dragging
  document.addEventListener("mouseup", () => {
    isDragging = false;
    githubModal.style.cursor = "move"; // Default cursor after dragging
  });

  // Function to close the GitHub modal
  closeModalBtn.addEventListener("click", () => {
    document.getElementById("githubAuthModal").style.display = "none";
  });
});

// Function to open the usage instructions modal
ipcRenderer.on('open-instruction-modal', () => {
  document.getElementById('instructionModal').style.display = 'block';
});

// Function to open the "About" modal
ipcRenderer.on('open-about-modal', () => {
  document.getElementById('aboutModal').style.display = 'block'; // Show the "About" modal
});

// Close the usage instructions modal
document.getElementById('closeModal').addEventListener('click', () => {
  document.getElementById('instructionModal').style.display = 'none';
});

// Close the "About" modal when the "Close" button is clicked
document.getElementById('closeAboutModal').addEventListener('click', () => {
  document.getElementById('aboutModal').style.display = 'none';
});

// Display the GitHub connection form
document.getElementById("connectGitHubBtn").addEventListener("click", () => {
  document.getElementById("githubAuthForm").style.display = "block";
});

// Handle sending data to GitHub
document.getElementById("saveToGitHubBtn").addEventListener("click", () => {
  const token = document.getElementById("githubToken").value.trim();
  const username = document.getElementById("githubUsername").value.trim();
  const repo = document.getElementById("githubRepo").value.trim();
  const noteContent = document.getElementById("notePad").value;

  // Check if all fields are filled
  if (!token || !username || !repo || !noteContent) {
    alert("All fields are required!");
    return;
  }

  // Send data to the main process to save to GitHub
  ipcRenderer.send('save-to-github', { token, username, repo, content: noteContent });

  // Display feedback for the user
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

// Event to save locally on Desktop
document.getElementById("saveLocalBtn").addEventListener("click", () => {
  const noteContent = document.getElementById("notePad").value;
  
  // Check if there is content to save
  if (!noteContent) {
    alert("The content is empty. Cannot save.");
    return;
  }

  // Send to the main process to save on Desktop
  ipcRenderer.send('save-file', noteContent);

  // Display feedback after saving
  ipcRenderer.once('file-saved', (event, result) => {
    alert(result.message);
  });
});

// Function to open the GitHub authentication modal
function openGitHubAuthModal() {
  const modal = document.getElementById('githubAuthModal');
  modal.style.display = 'block';
}

// Function to close the GitHub authentication modal
function closeGitHubAuthModal() {
  const modal = document.getElementById('githubAuthModal');
  modal.style.display = 'none';
}

// Add click event to close the modal
document.getElementById('closeModalBtn').addEventListener('click', closeGitHubAuthModal);

// Open the modal when necessary (example usage)
document.getElementById('connectGitHubBtn').addEventListener('click', openGitHubAuthModal);

// Close the modal when clicking outside the content
window.addEventListener('click', function(event) {
  const modal = document.getElementById('githubAuthModal');
  if (event.target === modal) {
    closeGitHubAuthModal();
  }
});

// Function to save data to localStorage
function saveToLocalStorage() {
  const githubToken = document.getElementById('githubToken').value;
  const githubUsername = document.getElementById('githubUsername').value;
  const githubRepo = document.getElementById('githubRepo').value;

  // Storing data in localStorage
  localStorage.setItem('githubToken', githubToken);
  localStorage.setItem('githubUsername', githubUsername);
  localStorage.setItem('githubRepo', githubRepo);
}

// Function to populate fields from localStorage
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

// Call function to populate fields when the modal is opened
document.getElementById('githubAuthModal').addEventListener('click', function() {
  populateFieldsFromLocalStorage();
});

// Function to open a file
document.getElementById("openFileBtn").addEventListener("click", () => {
  ipcRenderer.invoke('open-file-dialog').then(filePath => {
    if (filePath) {
      // Load the content of the selected file
      fs.readFile(filePath, 'utf-8', (err, data) => {
        if (err) {
          alert("Error opening file");
        } else {
          document.getElementById("notePad").value = data;
        }
      });
    }
  });
});
