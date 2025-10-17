const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

// Variável global que armazenará o último conjunto de dados gerado
let simulatedData = []; 
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://alisha-lifelike-ozie.ngrok-free.dev' // adicione o domínio público do ngrok
  ],
  credentials: true
}));
// =======================================================
// Passo I.2: AP_CONFIG (Mantido do Exemplo Anterior)
// =======================================================
const { AP_CONFIG } = require('./data');

// =======================================================
// Passo I.3: Lógica de Simulação (Mantida, mas agora é a "função pura" de geração)
// =======================================================
function generateSimulatedData() {
    const now = new Date();
    const currentHour = now.getHours();

     // 1. Geração de contagem de clientes com base em configuração e hora
    const rawData = AP_CONFIG.map(ap => {
        const randomVariation = Math.floor(Math.random() * (ap.variance * 2 + 1)) - ap.variance;
        let finalCount = ap.baseCount + randomVariation;

        if (ap.peakConfig.active && ap.peakConfig.timeWindow) {
            const [startHour, endHour] = ap.peakConfig.timeWindow;
            if (currentHour >= startHour && currentHour < endHour) {
                finalCount += Math.floor(ap.baseCount * 0.5); 
            }
        }
        
        finalCount = Math.max(0, finalCount);

        return {
            
            lat: ap.lat,
            lng: ap.lng,
            count: finalCount 
        };
    });
    
    // 2. Agrupamento dos dados brutos
    // O raio de agrupamento é de 20 metros (exemplo)
    const RADIUS_METERS = 20; 
    // CHAVE: Aqui, os dados brutos são transformados em clusters (vetores de APs próximos)
    return groupDataByProximity(rawData, RADIUS_METERS);
}

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Raio da Terra em metros
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distância em metros
}

function groupDataByProximity(data, radiusMeters = 20) {
    const grouped = [];
    // Array auxiliar para rastrear quais pontos já foram agrupados
    const isGrouped = new Array(data.length).fill(false);

    for (let i = 0; i < data.length; i++) {
        if (isGrouped[i]) continue; // Pula se já estiver em um cluster

        const cluster = [];
        let totalCount = 0;
        let sumLat = 0;
        let sumLng = 0;
        
        // 1. Começa o novo cluster com o ponto 'i'
        cluster.push(data[i]);
        isGrouped[i] = true;
        totalCount += data[i].count;
        sumLat += data[i].lat;
        sumLng += data[i].lng;


        // 2. Procura vizinhos dentro do raio para agrupar
        for (let j = i + 1; j < data.length; j++) {
            if (isGrouped[j]) continue;

            // Calcula a distância do ponto 'j' para o ponto de origem 'i'
            const dist = getDistance(data[i].lat, data[i].lng, data[j].lat, data[j].lng);

            if (dist <= radiusMeters) {
                cluster.push(data[j]);
                isGrouped[j] = true;
                totalCount += data[j].count;
                sumLat += data[j].lat;
                sumLng += data[j].lng;
            }
        }
        
        // 3. Calcula o centro (ponto médio) do cluster
        const centerLat = sumLat / cluster.length;
        const centerLng = sumLng / cluster.length;

        // 4. Adiciona o cluster formatado
        grouped.push({
            centerLat: centerLat, // Latitude central do agrupamento
            centerLng: centerLng, // Longitude central do agrupamento
            totalCount: totalCount, // Contagem total de clientes no agrupamento
            apList: cluster // O vetor (array) de APs que compõem o grupo
        });
    }

    return grouped;
}

// =======================================================
// Nova Função Assíncrona/Periódica
// =======================================================
function updateDataPeriodically(intervalSeconds = 60) {
    // 1. Gera e agrupa os dados iniciais imediatamente
    simulatedGroupedData = generateSimulatedData();
    console.log(`[DATA] Primeira geração e agrupamento concluídos. Clusters: ${simulatedGroupedData.length}`);
    
    // 2. Configura o loop de atualização
    setInterval(() => {
        simulatedGroupedData = generateSimulatedData();
        const now = new Date().toLocaleTimeString();
        console.log(`[DATA] Dados atualizados e agrupados em ${now}. Total de Clusters: ${simulatedGroupedData.length}`);
    }, intervalSeconds * 1000); 
}


// Inicializa a atualização periódica dos dados
updateDataPeriodically(5); // Atualiza a cada 60 segundos (1 minuto)


// =======================================================
// Rota da API
// =======================================================
app.use(cors()); 

// Passo I.4: O endpoint agora retorna a variável global, que está sendo atualizada no background
app.get('/api/densidade-wifi', (req, res) => {
    // Retorna o dado mais recente, sem precisar gerar no momento da requisição
    res.json(simulatedGroupedData); 
});


// Passo I.6: Rodar o Backend
app.listen(PORT, () => {
    
});