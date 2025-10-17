# Heatmap de Densidade Wi-Fi (Monitoramento em Tempo Real)

Este projeto simula um sistema de monitoramento de densidade de usuários de Wi-Fi em uma área urbana específica (baseado em Recife, PE), utilizando uma arquitetura moderna dividida em Frontend (Next.js/React) e Backend (Node.js/Express).

O objetivo é visualizar, em tempo real, o fluxo de pessoas (simuladas como clientes conectados) através de um mapa de calor dinâmico (Heatmap) e marcadores de usuários.

## Tecnologias Utilizadas

| Camada | Tecnologia | Descrição |
| :--- | :--- | :--- |
| **Frontend** | `Next.js` (React) | Criação da interface de usuário e renderização do mapa. |
| **Visualização** | `React-Leaflet` + `Leaflet.heat` | Biblioteca de mapas e plugin para a camada de calor dinâmica. |
| **Backend** | `Node.js` + `Express` | Servidor de API responsável pela lógica de simulação e fornecimento dos dados. |
| **Simulação** | Lógica JavaScript customizada | Geração de 1000 pontos de acesso (APs) e simulação de tráfego/picos de usuários em tempo real. |

---
## Visualização e Funcionalidades Chave

| Funcionalidade | Descrição |
| :--- | :--- |
| **Simulação Dinâmica** | O servidor Node.js atualiza o número de usuários simulados a cada 5 segundos, garantindo que o mapa de calor nunca seja estático. |
| **Pontos de Usuário** | Cada ponto azul é um `CircleMarker` de raio fixo, representando um **usuário individual**. |
| **Heatmap Reativo** | A intensidade da cor (Azul $\rightarrow$ Vermelho) é determinada pela **aglomeração** dos usuários, visualizando a densidade de tráfego em tempo real. |
| **Área de Monitoramento** | Um círculo azul de 40 metros de raio define a zona de análise. O Frontend usa o algoritmo Haversine simplificado para **filtrar** e mostrar apenas os usuários dentro desta área. |
| **Simulação de Picos** | A lógica de backend inclui períodos de pico (ex: 9h-11h ou 12h-14h) para simular o aumento de tráfego em horários comerciais, refletindo-se na intensidade do heatmap. |

---
