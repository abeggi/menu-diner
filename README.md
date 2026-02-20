# Menu Diner App

Un'applicazione elegante e mobile-friendly per la gestione di un menu di una tavola calda/diner.

## Funzionalità
- **Menu Pubblico**: Design moderno e reattivo, con caricamento dinamico dei piatti.
- **Pannello Staff**: Area protetta da password per gestire categorie, piatti, note a piè di pagina e foto di sfondo.
- **Docker**: Completamente containerizzata per una distribuzione istantanea.

## Avvio Rapido (con Docker)
1. Assicurati di avere Docker installato.
2. Scarica il file `docker-compose.yml`.
3. Crea i file persistenti necessari:
   ```bash
   touch menu.db
   mkdir -p public/uploads
   ```
4. Avvia l'applicazione:
   ```bash
   docker compose up -d
   ```
L'app sarà disponibile all'indirizzo `http://localhost:3000`.

## Configurazione
Puoi cambiare la password e altre impostazioni modificando la sezione `environment` nel file `docker-compose.yml`.
