// Render anime list
function renderAnimeList() {
    const container = document.getElementById('animeList');
    if (!container) return;

    // Clear existing content
    container.innerHTML = '';

    // Clear existing image cache
    clearImageCache();
    
    // Re-load the list to ensure fresh data
    animeList = loadAnimeList();
    
    // Create a document fragment for better performance
    const fragment = document.createDocumentFragment();
    
    // Render each card
    for (const anime of animeList) {
        try {
            const card = renderAnimeCard(anime);
            if (card) fragment.appendChild(card);
        } catch (error) {
            console.error('Error rendering card:', error);
        }
    }
    
    // Append all cards at once
    container.appendChild(fragment);
}

// Update other functions to use the new save mechanism
function updateStatus(malId, status) {
    const index = animeList.findIndex(a => a.mal_id === malId);
    if (index !== -1) {
        animeList[index].status = status;
        saveAnimeList(animeList);
        renderAnimeList();
    }
}

function updateProgress(malId, progress) {
    const index = animeList.findIndex(a => a.mal_id === malId);
    if (index !== -1) {
        const maxEpisodes = animeList[index].episodes || progress;
        animeList[index].progress = Math.min(progress, maxEpisodes);
        saveAnimeList(animeList);
        renderAnimeList();
    }
}

function removeAnime(malId) {
    animeList = animeList.filter(anime => anime.mal_id !== malId);
    saveAnimeList(animeList);
    renderAnimeList();
}

// Initialize on page load
window.addEventListener('load', () => {
    loadAnimeList();
    const savedView = localStorage.getItem('viewPreference') || 'grid';
    setView(savedView);
}, { once: true });

// Cleanup on page unload
window.addEventListener('unload', () => {
    clearImageCache();
});

// Cache untuk menyimpan gambar yang sudah dioptimasi
const imageCache = new Map();

// Fungsi untuk membersihkan cache gambar
function clearImageCache() {
    imageCache.forEach(url => URL.revokeObjectURL(url));
    imageCache.clear();
}

// Optimize image function
function optimizeImage(imageUrl) {
    if (!imageUrl) return '';
    
    // Gunakan gambar large dari API Jikan
    const highResUrl = imageUrl.replace('small_image_url', 'large_image_url');
    
    // Cek cache
    if (imageCache.has(highResUrl)) {
        return imageCache.get(highResUrl);
    }

    // Return original URL if optimization fails
    return imageUrl;
}

// View state management
let currentView = localStorage.getItem('viewPreference') || 'grid';

// View switching functions
function setView(view) {
    const container = document.getElementById('animeList');
    const gridBtn = document.getElementById('gridViewBtn');
    const listBtn = document.getElementById('listViewBtn');

    // Reset view classes
    container.classList.remove('grid-view', 'list-view');
    container.classList.add(`${view}-view`);
    
    // Update active buttons
    gridBtn.classList.toggle('active', view === 'grid');
    listBtn.classList.toggle('active', view === 'list');
    
    // Save preference
    localStorage.setItem('viewPreference', view);
    currentView = view;
    
    // Re-render list
    renderAnimeList();
}

function switchToGridView() {
    setView('grid');
}

function switchToListView() {
    setView('list');
}

// Add event listeners for view switching
document.getElementById('gridViewBtn').addEventListener('click', switchToGridView);
document.getElementById('listViewBtn').addEventListener('click', switchToListView);

// Render list view
function renderListView(anime) {
    const progress = anime.episodes ? (anime.progress / anime.episodes * 100) : 0;
    return `
        <div class="list-card-content">
            <div class="anime-cover-container">
                <div class="image-loading-overlay">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
                <img src="${anime.image_url || 'images/placeholder.jpg'}" 
                     alt="${anime.title}" 
                     class="anime-cover" 
                     onerror="this.onerror=null; this.src='images/placeholder.jpg';"
                     onload="if(this.parentElement) { const overlay = this.parentElement.querySelector('.image-loading-overlay'); if(overlay) overlay.classList.add('d-none'); }">
            </div>
            <div class="anime-details">
                <h5 class="anime-title">${anime.title}</h5>
                <div class="anime-info-row">
                    <span class="anime-type">${anime.type || 'Unknown'}</span>
                    <select class="form-select form-select-sm status-select" 
                            onchange="updateStatus(${anime.mal_id}, this.value)">
                        ${['Planning', 'Watching', 'Completed', 'On Hold', 'Dropped']
                            .map(status => `<option value="${status}" ${anime.status === status ? 'selected' : ''}>${status}</option>`)
                            .join('')}
                    </select>
                    ${anime.episodes ? `
                        <div class="episode-counter">
                            <input type="number" 
                                   class="form-control form-control-sm episode-input" 
                                   value="${anime.progress || 0}" 
                                   min="0" 
                                   max="${anime.episodes}"
                                   onchange="updateProgress(${anime.mal_id}, parseInt(this.value))"
                            >
                            <span class="episode-total">/ ${anime.episodes} eps</span>
                        </div>
                    ` : ''}
                    <button class="remove-btn" onclick="removeAnime(${anime.mal_id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
                ${anime.episodes ? `
                    <div class="progress">
                        <div class="progress-bar" style="width: ${progress}%"></div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Render anime card
function renderAnimeCard(anime) {
    const card = document.createElement('div');
    card.className = 'anime-card';
    card.dataset.malId = anime.mal_id;

    if (currentView === 'grid') {
        // Grid view layout
        card.innerHTML = `
            <div class="card-content">
                <div class="anime-cover-container">
                    <div class="image-loading-overlay">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </div>
                    <img src="${anime.image_url || 'images/placeholder.jpg'}" 
                         alt="${anime.title}" 
                         class="anime-cover" 
                         onerror="this.onerror=null; this.src='images/placeholder.jpg';"
                         onload="if(this.parentElement) { const overlay = this.parentElement.querySelector('.image-loading-overlay'); if(overlay) overlay.classList.add('d-none'); }">
                </div>
                <div class="anime-info">
                    <h5 class="anime-title">${anime.title}</h5>
                    <div class="anime-meta">
                        <span class="anime-type">${anime.type || 'Unknown'}</span>
                        ${anime.episodes ? `<span class="episodes">${anime.episodes} eps</span>` : ''}
                    </div>
                </div>
                <div class="controls-container">
                    <select class="form-select form-select-sm status-select" 
                            onchange="updateStatus(${anime.mal_id}, this.value)">
                        ${['Planning', 'Watching', 'Completed', 'On Hold', 'Dropped']
                            .map(status => `<option value="${status}" ${anime.status === status ? 'selected' : ''}>${status}</option>`)
                            .join('')}
                    </select>
                    ${anime.episodes ? `
                        <div class="episode-input">
                            <input type="number" 
                                   class="form-control form-control-sm" 
                                   value="${anime.progress || 0}" 
                                   min="0" 
                                   max="${anime.episodes}"
                                   onchange="updateProgress(${anime.mal_id}, parseInt(this.value))"
                            >
                            <span>/ ${anime.episodes}</span>
                        </div>
                    ` : ''}
                    <button class="remove-btn" onclick="removeAnime(${anime.mal_id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `;
    } else {
        // List view layout
        card.innerHTML = renderListView(anime);
    }

    return card;
}

let searchController = null;

function renderSearchMessage(message, isError = false) {
    const resultsDiv = document.getElementById('searchResults');
    if (!resultsDiv) return;

    resultsDiv.innerHTML = `<div class="search-result-item ${isError ? 'text-danger' : 'text-muted'}">${message}</div>`;
}

// Search anime using Jikan API
async function searchAnime(query) {
    const resultsDiv = document.getElementById('searchResults');
    if (!resultsDiv) return;

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
        resultsDiv.innerHTML = '';
        if (searchController) searchController.abort();
        return;
    }

    if (searchController) searchController.abort();
    searchController = new AbortController();

    try {
        const response = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(trimmedQuery)}&limit=5`, {
            signal: searchController.signal
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data?.message || `Request failed (${response.status})`);
        }

        const results = Array.isArray(data?.data) ? data.data : [];
        resultsDiv.innerHTML = '';

        if (!results.length) {
            renderSearchMessage('No anime found.');
            return;
        }

        results.forEach(anime => {
            const div = document.createElement('div');
            const imageUrl = anime?.images?.jpg?.small_image_url || anime?.images?.webp?.small_image_url || 'images/placeholder.jpg';
            const episodes = anime?.episodes ?? '?';
            const type = anime?.type || 'Unknown';
            const title = anime?.title || 'Unknown title';

            div.className = 'search-result-item';
            div.innerHTML = `
                <div class="d-flex align-items-center">
                    <img src="${imageUrl}" style="width: 50px; margin-right: 10px;">
                    <div>
                        <strong>${title}</strong>
                        <br>
                        <small>${type} (${episodes} eps)</small>
                    </div>
                </div>
            `;
            div.onclick = () => addAnime(anime);
            resultsDiv.appendChild(div);
        });
    } catch (error) {
        if (error.name === 'AbortError') return;
        console.error('Error searching anime:', error);
        const message = error.message.includes('429')
            ? 'Rate limit reached. Please wait a moment and try again.'
            : 'Failed to search anime. Please try again.';
        renderSearchMessage(message, true);
    } finally {
        searchController = null;
    }
}

// Debounce function to limit API calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add debounced search event listener
document.getElementById('searchInput').addEventListener('input', 
    debounce(e => searchAnime(e.target.value), 500)
);

// Add anime to list
function addAnime(anime) {
    if (!animeList.some(a => a.mal_id === anime.mal_id)) {
        const animeData = {
            mal_id: anime.mal_id,
            title: anime.title,
            image_url: anime.images?.jpg?.large_image_url || anime.images?.webp?.large_image_url || anime.images?.jpg?.image_url || 'images/placeholder.jpg',
            episodes: anime.episodes,
            type: anime.type,
            status: 'Planning', 
            progress: 0
        };
        animeList.push(animeData);
        saveAnimeList(animeList);
        renderAnimeList();
    }
    document.getElementById('searchInput').value = '';
    document.getElementById('searchResults').innerHTML = '';
}

// Remove all anime from list
function removeAllAnime() {
    if (animeList.length === 0) {
        alert('Your list is already empty!');
        return;
    }

    const confirmMessage = `Are you sure you want to remove all ${animeList.length} anime from your list?\nThis action cannot be undone!`;
    if (window.confirm(confirmMessage)) {
        animeList = [];
        saveAnimeList(animeList);
        renderAnimeList();
        alert('All anime have been removed from your list.');
    }
}

// Export list
function exportList() {
    const dataStr = JSON.stringify(animeList, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'anime-list.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Import list
function importList(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedList = JSON.parse(e.target.result);
                if (Array.isArray(importedList)) {
                    animeList = importedList;
                    saveAnimeList(animeList);
                    renderAnimeList();
                    alert('List imported successfully!');
                } else {
                    alert('Invalid file format');
                }
            } catch (error) {
                alert('Error importing file');
                console.error(error);
            }
        };
        reader.readAsText(file);
    }
    input.value = ''; // Reset input
}

// Import notification
let importToast = null;
let isImportCancelled = false;

function showImportToast() {
    const toastHTML = `
        <div class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 1070;">
            <div class="toast" id="importToast" role="alert" aria-live="assertive" aria-atomic="true" data-bs-autohide="false">
                <div class="toast-header border-0">
                    <strong class="me-auto">Importing Anime</strong>
                </div>
                <div class="toast-body">
                    <div class="progress mb-2">
                        <div id="importProgress" class="progress-bar progress-bar-striped progress-bar-animated" 
                             role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                    <p id="importStatus" class="small mb-1">Analyzing file...</p>
                    <div class="d-flex justify-content-between small text-muted mb-2">
                        <span>Added: <span id="successCount">0</span></span>
                        <span>Skipped: <span id="failCount">0</span></span>
                    </div>
                    <button type="button" class="btn btn-secondary btn-sm w-100" id="cancelImport">Cancel Import</button>
                </div>
            </div>
        </div>
    `;

    // Remove existing toast if any
    const existingToast = document.querySelector('.toast-container');
    if (existingToast) {
        existingToast.remove();
    }

    // Reset cancel flag
    isImportCancelled = false;

    // Add toast to body
    document.body.insertAdjacentHTML('beforeend', toastHTML);

    // Initialize toast
    const toastEl = document.getElementById('importToast');
    importToast = new bootstrap.Toast(toastEl, {
        autohide: false,
        animation: true
    });

    // Add cancel handler
    const cancelBtn = document.getElementById('cancelImport');
    cancelBtn.addEventListener('click', () => {
        isImportCancelled = true;
        cancelBtn.disabled = true;
        cancelBtn.textContent = 'Cancelling...';
        document.getElementById('importStatus').textContent = 'Cancelling import...';
        // Hide toast after delay
        setTimeout(() => {
            importToast?.hide();
            setTimeout(() => {
                const toastContainer = document.querySelector('.toast-container');
                if (toastContainer) {
                    toastContainer.remove();
                }
            }, 500);
        }, 1500);
    });

    // Show toast
    importToast.show();

    return {
        progressBar: document.getElementById('importProgress'),
        statusText: document.getElementById('importStatus'),
        successCount: document.getElementById('successCount'),
        failCount: document.getElementById('failCount'),
        cancelBtn: cancelBtn
    };
}

// Cancel import
function cancelImport() {
    if (importToast) {
        isImportCancelled = true;
        const cancelBtn = document.getElementById('cancelImport');
        if (cancelBtn) {
            cancelBtn.disabled = true;
            cancelBtn.textContent = 'Cancelling...';
        }
        const statusText = document.getElementById('importStatus');
        if (statusText) {
            statusText.textContent = 'Cancelling import...';
        }
        // Hide toast after delay
        setTimeout(() => {
            importToast?.hide();
            setTimeout(() => {
                const toastContainer = document.querySelector('.toast-container');
                if (toastContainer) {
                    toastContainer.remove();
                }
            }, 500);
        }, 1500);
    }
}

function importFromMAL(input) {
    const file = input.files[0];
    if (!file) return;

    isImportCancelled = false;
    let successCount = 0;
    let failCount = 0;
    let totalEntries = 0;
    let processedEntries = 0;

    try {
        const elements = showImportToast();
        const { progressBar, statusText, successCount: successEl, failCount: failEl } = elements;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(e.target.result, "text/xml");
                const animeEntries = Array.from(xmlDoc.getElementsByTagName('anime'));
                totalEntries = animeEntries.length;

                if (totalEntries === 0) {
                    statusText.textContent = 'No anime found in the list';
                    setTimeout(() => {
                        importToast?.hide();
                        setTimeout(() => {
                            const toastContainer = document.querySelector('.toast-container');
                            if (toastContainer) {
                                toastContainer.remove();
                            }
                        }, 500);
                    }, 1500);
                    return;
                }

                statusText.textContent = `Found ${totalEntries} anime in the list. Starting import...`;
                setTimeout(() => {
                    // Batch processing helper
                    function processBatch(items, batchSize, processItem, onProgress) {
                        const results = [];
                        const batches = Math.ceil(items.length / batchSize);
                        
                        for (let i = 0; i < batches; i++) {
                            const start = i * batchSize;
                            const end = Math.min(start + batchSize, items.length);
                            const batch = items.slice(start, end);
                            
                            // Process items in batch sequentially to reduce load
                            for (let j = 0; j < batch.length; j++) {
                                if (isImportCancelled) break;
                                
                                const result = processItem(batch[j], start + j);
                                results.push(result);
                                
                                if (onProgress) {
                                    onProgress(start + j + 1, items.length);
                                }
                                
                                // Add small delay between items
                                setTimeout(() => {}, 300);
                            }
                            
                            // Longer delay between batches
                            setTimeout(() => {}, 1000);
                            
                            // Force garbage collection every few batches
                            if (i % 3 === 0) {
                                setTimeout(() => {}, 1500);
                            }
                        }
                        
                        return results;
                    }

                    // Process in smaller batches
                    const batchSize = 3;
                    processBatch(animeEntries, batchSize, 
                        (entry, index) => {
                            if (isImportCancelled) {
                                // Clean up on cancel
                                setTimeout(() => {
                                    importToast?.hide();
                                    setTimeout(() => {
                                        const toastContainer = document.querySelector('.toast-container');
                                        if (toastContainer) {
                                            toastContainer.remove();
                                        }
                                    }, 500);
                                }, 1500);
                                return null;
                            }

                            try {
                                const malId = parseInt(entry.getElementsByTagName('series_animedb_id')[0].textContent);
                                const title = entry.getElementsByTagName('series_title')[0].textContent;
                                const status = entry.getElementsByTagName('my_status')[0].textContent;
                                const watchedEpisodes = parseInt(entry.getElementsByTagName('my_watched_episodes')[0].textContent);

                                // Update status before processing
                                statusText.textContent = `Checking: ${title}`;
                                setTimeout(() => {}, 200);

                                // Check for existing anime
                                const existingIndex = animeList.findIndex(a => a.mal_id === malId);
                                if (existingIndex !== -1) {
                                    // Update existing entry if needed
                                    const updatedStatus = mapStatus(status);
                                    if (animeList[existingIndex].status !== updatedStatus || 
                                        animeList[existingIndex].progress !== watchedEpisodes) {
                                        
                                        statusText.textContent = `Updating: ${title}`;
                                        setTimeout(() => {}, 200);
                                        
                                        animeList[existingIndex] = {
                                            ...animeList[existingIndex],
                                            status: updatedStatus,
                                            progress: watchedEpisodes || 0
                                        };
                                        successCount++;
                                        successEl.textContent = successCount;
                                        statusText.textContent = `Updated: ${title}`;
                                    } else {
                                        failCount++;
                                        failEl.textContent = failCount;
                                        statusText.textContent = `Skipped (no changes): ${title}`;
                                    }
                                } else {
                                    // Add new entry with basic info
                                    statusText.textContent = `Adding: ${title}`;
                                    setTimeout(() => {}, 200);

                                    const basicAnimeData = {
                                        mal_id: malId,
                                        title: title,
                                        image_url: '',
                                        episodes: 0,
                                        type: '',
                                        status: mapStatus(status),
                                        progress: watchedEpisodes || 0
                                    };
                                    
                                    animeList.push(basicAnimeData);
                                    successCount++;
                                    successEl.textContent = successCount;
                                    statusText.textContent = `Added: ${title}`;

                                    // Schedule background fetch with longer delays
                                    setTimeout(() => {
                                        fetch(`https://api.jikan.moe/v4/anime/${malId}`)
                                            .then(response => response.json())
                                            .then(data => {
                                                const anime = data.data;
                                                const index = animeList.findIndex(a => a.mal_id === malId);
                                                if (index !== -1) {
                                                    animeList[index] = {
                                                        ...animeList[index],
                                                        image_url: anime.images.jpg.large_image_url,
                                                        episodes: anime.episodes,
                                                        type: anime.type
                                                    };
                                                    saveAnimeList(animeList, true);
                                                    updateAnimeDetails(malId);
                                                }
                                            })
                                            .catch(console.error);
                                    }, index * 500); // Increased delay between API calls
                                }

                                // Update progress
                                processedEntries++;
                                const progress = Math.round((processedEntries / totalEntries) * 100);
                                progressBar.style.width = `${progress}%`;
                                progressBar.setAttribute('aria-valuenow', progress);

                                // Save periodically
                                if (processedEntries % batchSize === 0) {
                                    saveAnimeList(animeList, true);
                                    setTimeout(() => {}, 500);
                                }

                                return true;
                            } catch (error) {
                                console.error('Error processing anime:', error);
                                failCount++;
                                failEl.textContent = failCount;
                                statusText.textContent = `Error processing: ${error.message}`;
                                setTimeout(() => {}, 500);
                                return false;
                            }
                        },
                        (current, total) => {
                            const progress = Math.round((current / total) * 100);
                            progressBar.style.width = `${progress}%`;
                            progressBar.setAttribute('aria-valuenow', progress);
                        }
                    );

                    // Final update
                    setTimeout(() => {
                        saveAnimeList(animeList);

                        if (!isImportCancelled) {
                            const message = `Completed! Added/Updated ${successCount} anime, Skipped ${failCount}`;
                            statusText.textContent = message;
                            setTimeout(() => {
                                importToast?.hide();
                                setTimeout(() => {
                                    const toastContainer = document.querySelector('.toast-container');
                                    if (toastContainer) {
                                        toastContainer.remove();
                                    }
                                }, 500);
                            }, 3000);
                        }
                    }, 1000);
                }, 2000);
            } catch (error) {
                console.error('Import error:', error);
                statusText.textContent = `Import failed: ${error.message}`;
                setTimeout(() => {
                    importToast?.hide();
                    setTimeout(() => {
                        const toastContainer = document.querySelector('.toast-container');
                        if (toastContainer) {
                            toastContainer.remove();
                        }
                    }, 500);
                }, 3000);
            }
        };
        reader.readAsText(file);
    } catch (error) {
        console.error('Import error:', error);
        const statusText = document.getElementById('importStatus');
        if (statusText) {
            statusText.textContent = `Import failed: ${error.message}`;
            setTimeout(() => {
                importToast?.hide();
                setTimeout(() => {
                    const toastContainer = document.querySelector('.toast-container');
                    if (toastContainer) {
                        toastContainer.remove();
                    }
                }, 500);
            }, 3000);
        }
    }

    input.value = '';
}

// Helper function to map MAL status
function mapStatus(status) {
    const statusMap = {
        'Watching': 'Watching',
        'Completed': 'Completed',
        'On-Hold': 'On Hold',
        'Dropped': 'Dropped',
        'Plan to Watch': 'Planning'
    };
    return statusMap[status] || 'Planning';
}

// Update anime details in background
function updateAnimeDetails(malId) {
    const card = document.querySelector(`[data-anime-id="${malId}"]`);
    if (!card) return;

    const imageContainer = card.querySelector('.anime-cover-container');
    const loadingOverlay = imageContainer?.querySelector('.image-loading-overlay');
    const img = card.querySelector('.anime-cover');
    
    try {
        // Show loading state
        if (loadingOverlay) {
            loadingOverlay.classList.remove('d-none');
        }

        // Fetch anime details
        fetch(`https://api.jikan.moe/v4/anime/${malId}`)
            .then(response => response.json())
            .then(data => {
                const anime = data.data;

                // Find anime in list
                const index = animeList.findIndex(a => a.mal_id === malId);
                if (index === -1) return;

                // Update anime data
                const updatedAnime = {
                    ...animeList[index],
                    image_url: anime.images.jpg.large_image_url,
                    episodes: anime.episodes,
                    type: anime.type
                };
                animeList[index] = updatedAnime;

                // Update image if it exists
                if (img) {
                    img.src = anime.images.jpg.large_image_url;
                }

                // Update card details based on view type
                if (currentView === 'grid') {
                    // Update grid view specific elements
                    const typeSpan = card.querySelector('.type');
                    const episodesSpan = card.querySelector('.episodes');
                    const progressBar = card.querySelector('.progress-bar');
                    const progressText = card.querySelector('.progress-text');

                    if (typeSpan) typeSpan.textContent = anime.type || 'Unknown';
                    if (episodesSpan) episodesSpan.textContent = `${anime.episodes || '?'} eps`;
                    
                    if (progressBar) {
                        const progress = anime.episodes ? (updatedAnime.progress / anime.episodes * 100) : 0;
                        progressBar.style.width = `${progress}%`;
                    }
                    
                    if (progressText) {
                        progressText.textContent = `${updatedAnime.progress || 0}${anime.episodes ? '/' + anime.episodes : ''}`;
                    }
                } else {
                    // Update list view specific elements
                    const episodesSpan = card.querySelector('.episodes');
                    const progressBar = card.querySelector('.progress-bar');
                    
                    if (episodesSpan) {
                        episodesSpan.textContent = `${anime.episodes || '?'} episodes`;
                    }
                    
                    if (progressBar) {
                        const progress = anime.episodes ? (updatedAnime.progress / anime.episodes * 100) : 0;
                        progressBar.style.width = `${progress}%`;
                    }
                }

                // Save updated list
                saveAnimeList(animeList, true);
                
            })
            .catch(error => console.error('Error updating anime details:', error));
    } finally {
        // Hide loading overlay
        if (loadingOverlay) {
            loadingOverlay.classList.add('d-none');
        }
    }
}

// Load anime list from localStorage
function loadAnimeList() {
    try {
        const savedList = localStorage.getItem('animeList');
        return savedList ? JSON.parse(savedList) : [];
    } catch (error) {
        console.error('Error loading anime list:', error);
        return [];
    }
}

// Save anime list to localStorage
function saveAnimeList(list, skipRender = false) {
    try {
        localStorage.setItem('animeList', JSON.stringify(list));
        if (!skipRender) {
            renderAnimeList();
        }
    } catch (error) {
        console.error('Error saving anime list:', error);
    }
}

let animeList = loadAnimeList();
