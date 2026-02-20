#!/bin/bash

# Configurazione
APP_NAME="menu-diner"
APP_DIR="/opt/diner-menu"

echo "--------------------------------------------------"
echo "   Script di Gestione Menu Diner (Native)         "
echo "--------------------------------------------------"

# Spostamento nella cartella del progetto
cd "$APP_DIR" || exit

# 1. Verifica installazione Node.js e NPM
if ! command -v node &> /dev/null; then
    echo "ATTENZIONE: Node.js non è installato."
    read -p "Vuoi procedere con l'installazione automatica di Node.js 20? (s/n): " install_node
    if [[ "$install_node" =~ ^[SsYy]$ ]]; then
        echo "Installazione di Node.js 20 in corso..."
        # Utilizza NodeSource per installare una versione recente di Node.js su Ubuntu
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
        echo "Node.js installato correttamente."
    else
        echo "ERRORE: Node.js è richiesto per far girare l'applicazione. Installalo manualmente e riprova."
        exit 1
    fi
fi

# 2. Installazione dipendenze locali
if [ ! -d "node_modules" ]; then
    echo "[1/4] Installazione dipendenze dell'app (npm install)..."
    npm install
else
    echo "[1/4] Dipendenze già presenti."
fi

# 3. Verifica e installazione di PM2
if ! command -v pm2 &> /dev/null; then
    echo "[2/4] PM2 non trovato. Installazione globale in corso..."
    sudo npm install -g pm2
else
    echo "[2/4] PM2 è già installato."
fi

# 4. Gestione file .env
if [ ! -f ".env" ]; then
    echo "[3/4] File .env mancante. Creazione con valori di default..."
    cat <<EOT >> .env
NODE_ENV=production
PORT=3000
ADMIN_PASSWORD=menuadmin
SESSION_SECRET=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
EOT
    echo "      -> Creato file .env con password 'menuadmin'."
else
    echo "[3/4] File .env già esistente."
fi

# 5. Richiesta conferma avvio
echo "--------------------------------------------------"
read -p "Vuoi avviare/riavviare l'app con PM2? (s/n): " confirm
if [[ "$confirm" =~ ^[SsYy]$ ]]; then
    echo "[4/4] Avvio di $APP_NAME..."
    
    # Rimuove istanza precedente se esiste per evitare duplicati
    pm2 delete "$APP_NAME" 2>/dev/null || true
    
    # Avvia l'app
    pm2 start server.js --name "$APP_NAME"
    
    # Imposta PM2 per riavviarsi al boot del sistema
    pm2 save
    
    echo "--------------------------------------------------"
    echo "COMPLETATO! L'app è in esecuzione in background."
    pm2 status
else
    echo "Operazione annullata."
fi
