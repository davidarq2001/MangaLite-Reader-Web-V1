// Variables globales
let currentPage = 0;
let totalPages = 0;
let imageFiles = [];
let isDarkMode = false;
let pdfDoc = null;
let isPDF = false;
let currentRenderTask = null;
let zoomLevel = 1;
let imageCache = new Map();
let isRendering = false;
let isZoomControlsVisible = false;

// Configuración de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

// Elementos del DOM
const folderInput = document.getElementById('folder-input');
const fileInput = document.getElementById('file-input');
const folderButton = document.getElementById('folder-button');
const fileButton = document.getElementById('file-button');
const folderName = document.getElementById('folder-name');
const prevPageButton = document.getElementById('prev-page');
const nextPageButton = document.getElementById('next-page');
const currentPageSpan = document.getElementById('current-page');
const totalPagesSpan = document.getElementById('total-pages');
const mangaImage = document.getElementById('manga-image');
const pdfCanvas = document.getElementById('pdf-canvas');
const noImagesDiv = document.getElementById('no-images');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const zoomToggle = document.getElementById('zoom-toggle');
const infoToggle = document.getElementById('info-toggle');
const zoomOutButton = document.getElementById('zoom-out');
const zoomInButton = document.getElementById('zoom-in');
const zoomResetButton = document.getElementById('zoom-reset');
const zoomLevelSpan = document.getElementById('zoom-level');
const mangaImageContainer = document.getElementById('manga-image-container');
const singleView = document.getElementById('single-view');
const zoomControls = document.getElementById('zoom-controls');
const modalOverlay = document.getElementById('modal-overlay');
const modalClose = document.getElementById('modal-close');

// Event Listeners
folderButton.addEventListener('click', () => {
    folderInput.click();
});

fileButton.addEventListener('click', () => {
    fileInput.click();
});

folderInput.addEventListener('change', (event) => {
    const files = Array.from(event.target.files);

    // Filtrar solo archivos de imagen
    imageFiles = files.filter(file =>
        file.type.startsWith('image/')
    );

    if (imageFiles.length > 0) {
        loadImages(files[0].webkitRelativePath.split('/')[0]);
    }
});

fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];

    if (!file) return;

    if (file.type === 'application/pdf') {
        loadPDF(file);
    } else if (file.type.startsWith('image/')) {
        imageFiles = [file];
        loadImages(file.name);
    }
});

prevPageButton.addEventListener('click', () => {
    if (totalPages === 0) return;

    navigateToPage((currentPage - 1 + totalPages) % totalPages);
});

nextPageButton.addEventListener('click', () => {
    if (totalPages === 0) return;

    navigateToPage((currentPage + 1) % totalPages);
});

darkModeToggle.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);

    // Cambiar el icono según el modo
    const iconPath = darkModeToggle.querySelector('path');
    if (isDarkMode) {
        iconPath.setAttribute('d', 'M12,3c-4.97,0-9,4.03-9,9s4.03,9,9,9s9-4.03,9-9c0-0.46-0.04-0.92-0.1-1.36c-0.98,1.37-2.58,2.26-4.4,2.26 c-2.98,0-5.4-2.42-5.4-5.4c0-1.81,0.89-3.42,2.26-4.4C12.92,3.04,12.46,3,12,3L12,3z');
    } else {
        iconPath.setAttribute('d', 'M12,7c-2.76,0-5,2.24-5,5s2.24,5,5,5s5-2.24,5-5S14.76,7,12,7L12,7z M2,13l2,0c0.55,0,1-0.45,1-1s-0.45-1-1-1l-2,0 c-0.55,0-1,0.45-1,1S1.45,13,2,13z M20,13l2,0c0.55,0,1-0.45,1-1s-0.45-1-1-1l-2,0c-0.55,0-1,0.45-1,1S19.45,13,20,13z M11,2v2 c0,0.55,0.45,1,1,1s1-0.45,1-1V2c0-0.55-0.45-1-1-1S11,1.45,11,2z M11,20v2c0,0.55,0.45,1,1,1s1-0.45,1-1v-2c0-0.55-0.45-1-1-1 S11,19.45,11,20z M6.34,7.34l-1.41,1.41c-0.39,0.39-0.39,1.02,0,1.41c0.39,0.39,1.02,0.39,1.41,0l1.41-1.41 c0.39-0.39,0.39-1.02,0-1.41C7.36,6.95,6.73,6.95,6.34,7.34z M19.07,18.93c-0.39-0.39-1.02-0.39-1.41,0l-1.41,1.41 c-0.39,0.39-0.39,1.02,0,1.41c0.39,0.39,1.02,0.39,1.41,0l1.41-1.41C19.46,19.95,19.46,19.32,19.07,18.93z');
    }
});

// Toggle controles de zoom
zoomToggle.addEventListener('click', () => {
    isZoomControlsVisible = !isZoomControlsVisible;
    if (isZoomControlsVisible) {
        zoomControls.classList.add('visible');
    } else {
        zoomControls.classList.remove('visible');
    }
});

// Toggle modal de información
infoToggle.addEventListener('click', () => {
    modalOverlay.classList.add('active');
});

// Cerrar modal
modalClose.addEventListener('click', () => {
    modalOverlay.classList.remove('active');
});

// Cerrar modal al hacer clic fuera del contenido
modalOverlay.addEventListener('click', (event) => {
    if (event.target === modalOverlay) {
        modalOverlay.classList.remove('active');
    }
});

// Cerrar modal con tecla Escape
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modalOverlay.classList.contains('active')) {
        modalOverlay.classList.remove('active');
    }
});

// Controles de zoom
zoomOutButton.addEventListener('click', () => {
    setZoomLevel(zoomLevel - 0.25);
});

zoomInButton.addEventListener('click', () => {
    setZoomLevel(zoomLevel + 0.25);
});

zoomResetButton.addEventListener('click', () => {
    setZoomLevel(1);
});

// Navegación con teclado
document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
        prevPageButton.click();
    } else if (event.key === 'ArrowRight') {
        nextPageButton.click();
    } else if (event.key === '-') {
        zoomOutButton.click();
    } else if (event.key === '+' || event.key === '=') {
        zoomInButton.click();
    } else if (event.key === '0') {
        zoomResetButton.click();
    } else if (event.key === 'z' || event.key === 'Z') {
        zoomToggle.click();
    } else if (event.key === 'i' || event.key === 'I') {
        infoToggle.click();
    }
});

// Funciones auxiliares
function loadImages(folderNameText) {
    folderName.textContent = folderNameText;
    totalPages = imageFiles.length;
    currentPage = 0;
    isPDF = false;
    pdfDoc = null;

    updatePageCounter();
    displayCurrentPage();

    // Ocultar mensaje de no archivos y mostrar imagen
    noImagesDiv.style.display = 'none';
    singleView.style.display = 'flex';
}

function navigateToPage(page) {
    currentPage = page;
    updatePageCounter();
    displayCurrentPage();
    resetScrollPosition();
}

function updatePageCounter() {
    currentPageSpan.textContent = totalPages === 0 ? '0' : currentPage + 1;
    totalPagesSpan.textContent = totalPages === 0 ? '0' : totalPages;
}

function displayCurrentPage() {
    if (isPDF) {
        renderPDFPage(currentPage + 1);
    } else if (imageFiles.length > 0) {
        const file = imageFiles[currentPage];

        // Ocultar mensaje y mostrar imagen
        noImagesDiv.style.display = 'none';
        mangaImage.style.display = 'block';

        // Usar caché si está disponible
        if (imageCache.has(currentPage)) {
            mangaImage.src = imageCache.get(currentPage);
            // Esperar a que la imagen cargue antes de aplicar zoom
            mangaImage.onload = () => {
                applyZoom();
            };
        } else {
            const reader = new FileReader();
            reader.onload = (e) => {
                mangaImage.src = e.target.result;
                imageCache.set(currentPage, e.target.result);
                // Aplicar zoom después de que la imagen cargue
                mangaImage.onload = () => {
                    applyZoom();
                };
            };
            reader.readAsDataURL(file);
        }
    }
}

function loadPDF(file) {
    const fileReader = new FileReader();

    fileReader.onload = function () {
        const typedarray = new Uint8Array(this.result);

        pdfjsLib.getDocument(typedarray).promise.then(function (pdf) {
            pdfDoc = pdf;
            totalPages = pdf.numPages;
            currentPage = 0;
            isPDF = true;

            folderName.textContent = file.name;
            updatePageCounter();
            displayCurrentPage();

            // Ocultar mensaje de no archivos
            noImagesDiv.style.display = 'none';
            singleView.style.display = 'flex';
        }).catch(function (error) {
            console.error('Error al cargar el PDF:', error);
            alert('Error al cargar el PDF. Asegúrate de que es un archivo PDF válido.');
        });
    };

    fileReader.readAsArrayBuffer(file);
}

function renderPDFPage(pageNumber) {
    if (isRendering) {
        return; // Evitar múltiples renderizados simultáneos
    }

    isRendering = true;

    // Cancelar renderizado anterior si existe
    if (currentRenderTask) {
        currentRenderTask.cancel();
    }

    pdfDoc.getPage(pageNumber).then(function (page) {
        const viewport = page.getViewport({ scale: zoomLevel * 1.5 });
        const context = pdfCanvas.getContext('2d');

        // Limpiar canvas
        context.clearRect(0, 0, pdfCanvas.width, pdfCanvas.height);

        pdfCanvas.height = viewport.height;
        pdfCanvas.width = viewport.width;

        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };

        currentRenderTask = page.render(renderContext);
        return currentRenderTask.promise;
    }).then(function () {
        currentRenderTask = null;
        isRendering = false;
        // Mostrar canvas y ocultar imagen
        pdfCanvas.style.display = 'block';
        mangaImage.style.display = 'none';
    }).catch(function (error) {
        isRendering = false;
        if (error && error.name !== 'RenderingCancelledException') {
            console.error('Error al renderizar PDF:', error);
        }
    });
}

function setZoomLevel(level) {
    zoomLevel = Math.max(0.5, Math.min(3, level));
    zoomLevelSpan.textContent = `${Math.round(zoomLevel * 100)}%`;

    if (isPDF) {
        renderPDFPage(currentPage + 1);
    } else {
        applyZoom();
    }
}

function applyZoom() {
    if (!isPDF && mangaImage.src && mangaImage.naturalWidth > 0) {
        const originalWidth = mangaImage.naturalWidth;
        const originalHeight = mangaImage.naturalHeight;

        // Calcular nuevo tamaño manteniendo la relación de aspecto
        const containerWidth = mangaImageContainer.clientWidth - 40; // 40px de padding
        const maxWidth = containerWidth * 0.95; // 95% del ancho del contenedor

        let newWidth = originalWidth * zoomLevel;
        let newHeight = originalHeight * zoomLevel;

        // Si el ancho excede el máximo, ajustar
        if (newWidth > maxWidth) {
            const scale = maxWidth / newWidth;
            newWidth = maxWidth;
            newHeight = newHeight * scale;
        }

        mangaImage.style.width = `${newWidth}px`;
        mangaImage.style.height = `${newHeight}px`;
        mangaImage.style.maxWidth = 'none';
        mangaImage.style.maxHeight = 'none';
    }
}

function resetScrollPosition() {
    // Resetear scroll al inicio
    if (singleView) {
        singleView.scrollTop = 0;
        singleView.scrollLeft = 0;
    }
    if (mangaImageContainer) {
        mangaImageContainer.scrollTop = 0;
        mangaImageContainer.scrollLeft = 0;
    }
}

// Inicialización
updatePageCounter();
setZoomLevel(1);

// Ocultar la imagen inicialmente
mangaImage.style.display = 'none';