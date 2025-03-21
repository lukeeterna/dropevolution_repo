#!/bin/bash

# Colori per migliorare la leggibilità degli output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==============================================${NC}"
echo -e "${BLUE}  DROP EVOLUTION - AVVIO COMPLETO DEL SISTEMA${NC}"
echo -e "${BLUE}==============================================${NC}"

# Impostazione della directory base del progetto
PROJECT_DIR="/Users/macbook/Desktop/DropEvolutionProject"

# Step 1: Entrare nella directory del progetto
echo -e "${YELLOW}[1/7] Entrando nella directory del progetto...${NC}"
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ Errore: La directory $PROJECT_DIR non esiste.${NC}"
    exit 1
fi
cd "$PROJECT_DIR"
echo -e "${GREEN}✅ Directory progetto trovata${NC}"

# Step 2: Controllo e attivazione dell'ambiente virtuale
echo -e "${YELLOW}[2/7] Controllo ambiente virtuale Python...${NC}"
if [ ! -d "$PROJECT_DIR/venv" ]; then
    echo -e "${RED}❌ Errore: L'ambiente virtuale 'venv' non esiste.${NC}"
    echo -e "${YELLOW}🔄 Creazione di un nuovo ambiente virtuale...${NC}"
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Errore: Impossibile creare l'ambiente virtuale.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Ambiente virtuale creato${NC}"
fi

echo -e "${YELLOW}🔄 Attivazione ambiente virtuale...${NC}"
source "$PROJECT_DIR/venv/bin/activate"
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Errore: Impossibile attivare l'ambiente virtuale.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Ambiente virtuale attivato${NC}"

# Step 3: Avvio del backend
echo -e "${YELLOW}[3/7] Avvio del backend...${NC}"
if [ ! -f "$PROJECT_DIR/backend/app/main.py" ]; then
    echo -e "${RED}❌ Errore: File main.py non trovato in $PROJECT_DIR/backend/app/${NC}"
    exit 1
fi

# Avvia il backend in background
echo -e "${YELLOW}🔄 Avvio del server backend...${NC}"
cd "$PROJECT_DIR"
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
BACKEND_PID=$!

# Verifica se il processo backend è stato avviato
if [ $? -ne 0 ] || ! ps -p $BACKEND_PID > /dev/null; then
    echo -e "${RED}❌ Errore: Impossibile avviare il backend.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Backend avviato con PID: $BACKEND_PID${NC}"

# Step 4 e 5: Avvio del frontend e delle viste
echo -e "${YELLOW}[4/7] Controllo e avvio del frontend...${NC}"
if [ ! -d "$PROJECT_DIR/frontend" ]; then
    echo -e "${RED}❌ Errore: Directory frontend non trovata.${NC}"
    kill $BACKEND_PID
    exit 1
fi

if [ ! -f "$PROJECT_DIR/frontend/package.json" ]; then
    echo -e "${RED}❌ Errore: File package.json non trovato in $PROJECT_DIR/frontend/${NC}"
    kill $BACKEND_PID
    exit 1
fi

# Installa le dipendenze npm se node_modules non esiste
if [ ! -d "$PROJECT_DIR/frontend/node_modules" ]; then
    echo -e "${YELLOW}🔄 Installazione dipendenze npm (può richiedere qualche minuto)...${NC}"
    cd "$PROJECT_DIR/frontend"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Errore: Impossibile installare le dipendenze npm.${NC}"
        kill $BACKEND_PID
        exit 1
    fi
    echo -e "${GREEN}✅ Dipendenze npm installate${NC}"
else
    cd "$PROJECT_DIR/frontend"
fi

# Avvia il frontend in background
echo -e "${YELLOW}🔄 Avvio del frontend...${NC}"
npm run dev -- --port 5173 > frontend.log 2>&1 &
FRONTEND_PID=$!

# Verifica se il processo frontend è stato avviato
if [ $? -ne 0 ] || ! ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${RED}❌ Errore: Impossibile avviare il frontend.${NC}"
    kill $BACKEND_PID
    exit 1
fi
echo -e "${GREEN}✅ Frontend avviato con PID: $FRONTEND_PID${NC}"

# Avvio delle viste se presente lo script
echo -e "${YELLOW}[5/7] Avvio delle viste...${NC}"
if grep -q "\"views\":" "$PROJECT_DIR/frontend/package.json"; then
    echo -e "${YELLOW}🔄 Avvio delle viste...${NC}"
    npm run views > views.log 2>&1 &
    VIEWS_PID=$!
    
    # Verifica se il processo delle viste è stato avviato
    if [ $? -ne 0 ] || ! ps -p $VIEWS_PID > /dev/null; then
        echo -e "${RED}❌ Errore: Impossibile avviare le viste.${NC}"
        kill $BACKEND_PID
        kill $FRONTEND_PID
        exit 1
    fi
    echo -e "${GREEN}✅ Viste avviate con PID: $VIEWS_PID${NC}"
    VIEWS_RUNNING=true
else
    echo -e "${YELLOW}⚠️ Script 'views' non trovato in package.json. Viste non avviate.${NC}"
    VIEWS_RUNNING=false
fi

# Step 6: Mostra i link di accesso
echo -e "${YELLOW}[6/7] URL di accesso:${NC}"
echo -e "${GREEN}🔗 Backend: http://localhost:8000${NC}"
echo -e "${GREEN}🔗 API Docs: http://localhost:8000/api/docs${NC}"
echo -e "${GREEN}🔗 Frontend: http://localhost:5173${NC}"
if [ "$VIEWS_RUNNING" = true ]; then
    echo -e "${GREEN}🔗 Viste: Consultare l'output nei log per l'URL specifico${NC}"
fi

# Step 7: Controllo log per eventuali errori
echo -e "${YELLOW}[7/7] Monitoraggio log...${NC}"
echo -e "${BLUE}---------------------------------------------${NC}"
echo -e "${YELLOW}🔍 Per visualizzare i log, esegui questi comandi:${NC}"
echo -e "${GREEN}   - Backend: tail -f $PROJECT_DIR/backend.log${NC}"
echo -e "${GREEN}   - Frontend: tail -f $PROJECT_DIR/frontend.log${NC}"
if [ "$VIEWS_RUNNING" = true ]; then
    echo -e "${GREEN}   - Viste: tail -f $PROJECT_DIR/views.log${NC}"
fi
echo -e "${BLUE}---------------------------------------------${NC}"
echo -e "${GREEN}✅ Tutti i servizi sono stati avviati correttamente!${NC}"
echo -e "${YELLOW}⚠️ Premi CTRL+C per terminare tutti i processi quando hai finito.${NC}"
echo -e "${BLUE}==============================================${NC}"

# Gestione dell'interruzione dello script
trap "echo -e '${YELLOW}Arresto dei servizi...${NC}'; kill $BACKEND_PID 2>/dev/null; kill $FRONTEND_PID 2>/dev/null; if [ \"$VIEWS_RUNNING\" = true ]; then kill $VIEWS_PID 2>/dev/null; fi; echo -e '${GREEN}Tutti i servizi sono stati arrestati.${NC}'; exit" INT TERM EXIT

# Mantieni lo script in esecuzione
wait