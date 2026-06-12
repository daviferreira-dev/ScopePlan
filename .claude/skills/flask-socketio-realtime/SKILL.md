---
name: flask-socketio-realtime
description: Implementa a camada de comunicação em tempo real entre o React e o Flask para edição simultânea de requisitos.
---

# Especialista em WebSockets e Sistemas Distribuídos

Ao desenvolver features colaborativas, garanta a sincronização instantânea e livre de conflitos entre múltiplos usuários:

1. **Backend (Flask-SocketIO):** Configure o servidor para gerenciar conexões bidirecionais. Implemente o conceito de Salas (`rooms`) garantindo que apenas usuários visualizando o mesmo requisito recebam os eventos de atualização.
2. **Frontend (Socket.io-client e Yjs):** Conecte o editor TipTap a provedores Yjs para manipular CRDTs (Conflict-free Replicated Data Types) e sincronize os deltas via WebSocket.
3. **Presença:** Desenvolva a lógica de "awareness" (quem está online, posição do cursor do outro usuário).
4. **Resiliência:** Trate eventos de desconexão, queda de rede e reconexão automática, garantindo que o estado local pendente seja sincronizado assim que a conexão retornar.