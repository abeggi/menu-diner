document.addEventListener('DOMContentLoaded', async () => {
    const menuContainer = document.getElementById('menu-container');

    try {
        const response = await fetch('/api/menu');
        if (!response.ok) throw new Error('Errore nel caricamento del menu');
        const menuData = await response.json();

        menuContainer.innerHTML = ''; // Clear loading text

        const titleH1 = document.querySelector('.hero-content h1');
        const subtitleP = document.querySelector('.hero-content p');
        if (titleH1 && menuData.title) titleH1.textContent = menuData.title;
        if (subtitleP && menuData.subtitle) subtitleP.textContent = menuData.subtitle;

        if (!menuData.categories || menuData.categories.length === 0) {
            menuContainer.innerHTML = '<p class="loading">Il menu è attualmente vuoto. Torna a trovarci presto!</p>';
            return;
        }

        const notesContainer = document.getElementById('menu-notes');
        if (menuData.notes) {
            notesContainer.textContent = menuData.notes;
            notesContainer.style.display = 'block';
        }

        if (menuData.heroImage) {
            const heroDataUrl = `url('${menuData.heroImage}')`;
            // Add a linear-gradient overlay dynamically for readability
            document.querySelector('.hero').style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), ${heroDataUrl}`;
        }

        menuData.categories.forEach((category, i) => {
            // Only render category if it has items, or if it's meant to be shown anyway.
            if (category.items.length === 0) return;

            const section = document.createElement('section');
            section.className = 'category-section';
            section.style.animation = `fadeIn 0.5s ease forwards ${i * 0.1}s`;
            section.style.opacity = '0';

            const title = document.createElement('h2');
            title.className = 'category-title';
            title.textContent = category.name;
            section.appendChild(title);

            category.items.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'menu-item';

                const infoDiv = document.createElement('div');
                infoDiv.className = 'item-info';

                const name = document.createElement('h3');
                name.className = 'item-name';
                name.textContent = item.name;

                infoDiv.appendChild(name);

                if (item.description) {
                    const desc = document.createElement('p');
                    desc.className = 'item-desc';
                    desc.textContent = item.description;
                    infoDiv.appendChild(desc);
                }

                const price = document.createElement('div');
                price.className = 'item-price';
                price.textContent = `€ ${item.price.toFixed(2)}`;

                itemDiv.appendChild(infoDiv);
                itemDiv.appendChild(price);
                section.appendChild(itemDiv);
            });

            menuContainer.appendChild(section);
        });

    } catch (error) {
        console.error('Error fetching menu:', error);
        menuContainer.innerHTML = "<p class='loading'>Siamo spiacenti, c'è stato un problema nel caricare il menu. Riprova più tardi.</p>";
    }
});
