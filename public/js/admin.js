let categoriesData = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Check auth
    const authRes = await fetch('/api/auth/status');
    const authData = await authRes.json();
    if (!authData.isAuthenticated) {
        window.location.href = '/login.html';
        return;
    }

    loadData();

    document.getElementById('logout-btn').addEventListener('click', async () => {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/login.html';
    });

    // Forms
    document.getElementById('category-form').addEventListener('submit', handleCategorySubmit);
    document.getElementById('item-form').addEventListener('submit', handleItemSubmit);
    document.getElementById('settings-form').addEventListener('submit', handleSettingsSubmit);
});

async function loadData() {
    try {
        const response = await fetch('/api/menu');
        if (!response.ok) {
            if (response.status === 401) window.location.href = '/login.html';
            throw new Error('Failed to fetch menu data');
        }
        const data = await response.json();

        categoriesData = data.categories || [];
        document.getElementById('menu-title').value = data.title || '';
        document.getElementById('menu-subtitle').value = data.subtitle || '';
        document.getElementById('menu-notes').value = data.notes || '';

        renderCategories();
        renderItems();
        updateCategorySelect();
    } catch (err) {
        console.error(err);
    }
}

function renderCategories() {
    const container = document.getElementById('categories-container');
    if (categoriesData.length === 0) {
        container.innerHTML = '<p>Nessuna categoria.</p>';
        return;
    }

    container.innerHTML = categoriesData.map(cat => `
        <div class="admin-item-row">
            <div>
                <strong>${cat.name}</strong> 
                <small style="color:#7f8c8d; margin-left:10px;">(Ordine: ${cat.sort_order})</small>
            </div>
            <div class="admin-actions">
                <button class="btn btn-small btn-secondary" onclick="editCategory(${cat.id}, '${cat.name.replace(/'/g, "\\'")}', ${cat.sort_order})">Modifica</button>
                <button class="btn btn-small btn-danger" onclick="deleteCategory(${cat.id})">Elimina</button>
            </div>
        </div>
    `).join('');
}

function renderItems() {
    const container = document.getElementById('items-container');
    let allItemsHtml = '';
    let hasItems = false;

    categoriesData.forEach(cat => {
        if (cat.items && cat.items.length > 0) {
            hasItems = true;
            allItemsHtml += `<h4 style="margin: 1rem 0 0.5rem 0; color: var(--primary-color);">${cat.name}</h4>`;
            allItemsHtml += cat.items.map(item => `
                <div class="admin-item-row">
                    <div>
                        <strong>${item.name}</strong> - €${item.price.toFixed(2)}
                        <br>
                        <small style="color:var(--text-muted);">${item.description || 'Nessuna descrizione'}</small>
                    </div>
                    <div class="admin-actions">
                        <button class="btn btn-small btn-secondary" onclick="editItem(${item.id}, ${cat.id}, '${item.name.replace(/'/g, "\\'")}', '${(item.description || '').replace(/'/g, "\\'")}', ${item.price}, ${item.sort_order})">Modifica</button>
                        <button class="btn btn-small btn-danger" onclick="deleteItem(${item.id})">Elimina</button>
                    </div>
                </div>
            `).join('');
        }
    });

    container.innerHTML = hasItems ? allItemsHtml : '<p>Nessun piatto presente.</p>';
}

function updateCategorySelect() {
    const select = document.getElementById('item-category');
    select.innerHTML = categoriesData.map(cat =>
        `<option value="${cat.id}">${cat.name}</option>`
    ).join('');
}


// MODALS
function openModal(id) {
    document.getElementById(id).classList.add('active');
}
function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

// category logic
function openCategoryModal() {
    document.getElementById('category-id').value = '';
    document.getElementById('category-name').value = '';
    document.getElementById('category-sort').value = '0';
    document.getElementById('category-modal-title').innerText = 'Nuova Categoria';
    openModal('category-modal');
}
function editCategory(id, name, sortOrder) {
    document.getElementById('category-id').value = id;
    document.getElementById('category-name').value = name;
    document.getElementById('category-sort').value = sortOrder;
    document.getElementById('category-modal-title').innerText = 'Modifica Categoria';
    openModal('category-modal');
}
async function deleteCategory(id) {
    if (!confirm('Sei sicuro? Verranno eliminati anche tutti i piatti di questa categoria.')) return;
    await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    loadData();
}
async function handleCategorySubmit(e) {
    e.preventDefault();
    const id = document.getElementById('category-id').value;
    const body = {
        name: document.getElementById('category-name').value,
        sort_order: parseInt(document.getElementById('category-sort').value) || 0
    };

    if (id) {
        await fetch(`/api/categories/${id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
        });
    } else {
        await fetch('/api/categories', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
        });
    }
    closeModal('category-modal');
    loadData();
}

// item logic
function openItemModal() {
    if (categoriesData.length === 0) {
        alert('Crea prima una categoria!');
        return;
    }
    document.getElementById('item-id').value = '';
    document.getElementById('item-name').value = '';
    document.getElementById('item-desc').value = '';
    document.getElementById('item-price').value = '';
    document.getElementById('item-sort').value = '0';
    if (categoriesData.length > 0) {
        document.getElementById('item-category').value = categoriesData[0].id;
    }
    document.getElementById('item-modal-title').innerText = 'Nuovo Piatto';
    openModal('item-modal');
}
function editItem(id, catId, name, desc, price, sortOrder) {
    document.getElementById('item-id').value = id;
    document.getElementById('item-category').value = catId;
    document.getElementById('item-name').value = name;
    document.getElementById('item-desc').value = desc;
    document.getElementById('item-price').value = price;
    document.getElementById('item-sort').value = sortOrder;
    document.getElementById('item-modal-title').innerText = 'Modifica Piatto';
    openModal('item-modal');
}
async function deleteItem(id) {
    if (!confirm("Continuare con l'eliminazione?")) return;
    await fetch(`/api/items/${id}`, { method: 'DELETE' });
    loadData();
}
async function handleItemSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('item-id').value;
    const body = {
        category_id: document.getElementById('item-category').value,
        name: document.getElementById('item-name').value,
        description: document.getElementById('item-desc').value,
        price: parseFloat(document.getElementById('item-price').value),
        sort_order: parseInt(document.getElementById('item-sort').value) || 0
    };

    if (id) {
        await fetch(`/api/items/${id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
        });
    } else {
        await fetch('/api/items', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
        });
    }
    closeModal('item-modal');
    loadData();
}

// settings logic
async function handleSettingsSubmit(e) {
    e.preventDefault();
    const titleValue = document.getElementById('menu-title').value;
    const subtitleValue = document.getElementById('menu-subtitle').value;
    const notesValue = document.getElementById('menu-notes').value;

    try {
        await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                menu_title: titleValue,
                menu_subtitle: subtitleValue,
                menu_notes: notesValue
            })
        });

        const msg = document.getElementById('settings-save-msg');
        msg.style.display = 'inline';
        setTimeout(() => msg.style.display = 'none', 3000);
    } catch (err) {
        console.error('Error saving settings', err);
        alert('Errore nel salvataggio delle note.');
    }
}

// upload logic
document.getElementById('hero-upload-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('hero-image-input');
    if (!fileInput.files[0]) return;

    const formData = new FormData();
    formData.append('heroImage', fileInput.files[0]);

    try {
        const res = await fetch('/api/upload-hero', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();

        if (data.success) {
            const msg = document.getElementById('upload-save-msg');
            msg.style.display = 'inline';
            setTimeout(() => msg.style.display = 'none', 3000);
            fileInput.value = ''; // clear input
        } else {
            alert('Errore durante il caricamento: ' + (data.error || 'sconosciuto'));
        }
    } catch (err) {
        console.error('Upload error', err);
        alert('Errore di connessione durante il caricamento.');
    }
});
