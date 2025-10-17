const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

// Variável global que armazenará o último conjunto de dados gerado
let simulatedData = []; 

// =======================================================
// Passo I.2: AP_CONFIG (Mantido do Exemplo Anterior)
// =======================================================
const AP_CONFIG = [
    {
        id: 'AP-Recepcao',
        name: 'Recepção Principal',
        lat: -8.0578,      
        lng: -34.8824,     
        baseCount: 40,
        variance: 15,
        peakConfig: { 
            active: true, 
            timeWindow: [8, 9] 
        }
    },
    {
        id: 'AP-Sala-Reuniao',
        name: 'Sala de Reunião Bloco A',
        lat: -8.0585,
        lng: -34.8819,
        baseCount: 15,
        variance: 10,
        peakConfig: { 
            active: true, 
            timeWindow: [10, 12] 
        }
    },
    {
        id: 'AP-Cafeteria',
        name: 'Cafeteria',
        lat: -8.0570,
        lng: -34.8830,
        baseCount: 20,
        variance: 10,
        peakConfig: { 
            active: true, 
            timeWindow: [12, 14] 
        }
    },
    {
        id: 'AP-TI-Labs',
        name: 'Laboratório de TI',
        lat: -8.0590,
        lng: -34.8825,
        baseCount: 50,
        variance: 25,
        peakConfig: { 
            active: false 
        } 
    }
];

// =======================================================
// Passo I.3: Lógica de Simulação (Mantida, mas agora é a "função pura" de geração)
// =======================================================
function generateSimulatedData() {
    const now = new Date();
    const currentHour = now.getHours();

    return AP_CONFIG.map(ap => {
        // Gera uma variação aleatória dentro do limite de variância
        const randomVariation = Math.floor(Math.random() * (ap.variance * 2 + 1)) - ap.variance;
        let finalCount = ap.baseCount + randomVariation;

        // Lógica de Pico (Simulação Inteligente)
        if (ap.peakConfig.active && ap.peakConfig.timeWindow) {
            const [startHour, endHour] = ap.peakConfig.timeWindow;
            
            if (currentHour >= startHour && currentHour < endHour) {
                // Aumento extra durante o período de pico
                finalCount += Math.floor(ap.baseCount * 0.5); 
            }
        }
        
        // Garante que a contagem não seja negativa
        finalCount = Math.max(0, finalCount);

        return {
            lat: ap.lat,
            lng: ap.lng,
            count: finalCount 
        };
    });
}


// =======================================================
// Nova Função Assíncrona/Periódica
// =======================================================
function updateDataPeriodically(intervalSeconds = 10) {
    console.log(`[DATA] Configurando atualização periódica a cada ${intervalSeconds} segundos.`);
    
    // 1. Gera os dados iniciais imediatamente
    simulatedData = generateSimulatedData();
    console.log(`[DATA] Primeira geração de dados concluída.`);
    
    // 2. Configura o loop de atualização a cada 60.000ms (1 minuto)
    setInterval(() => {
        simulatedData = generateSimulatedData();
        const now = new Date().toLocaleTimeString();
        // Opcional: Log para verificar se a atualização está funcionando
        console.log(`[DATA] Dados atualizados periodicamente em ${now}.`);
    }, intervalSeconds * 1000); 
}


// Inicializa a atualização periódica dos dados
updateDataPeriodically(60); // Atualiza a cada 60 segundos (1 minuto)


// =======================================================
// Rota da API
// =======================================================
app.use(cors()); 

// Passo I.4: O endpoint agora retorna a variável global, que está sendo atualizada no background
app.get('/api/densidade-wifi', (req, res) => {
    // Retorna o dado mais recente, sem precisar gerar no momento da requisição
    res.json(simulatedData); 
});


// Passo I.6: Rodar o Backend
app.listen(PORT, () => {
    console.log(`Backend de simulação rodando em http://localhost:${PORT}`);
    console.log('Endpoint da API: http://localhost:3001/api/densidade-wifi');
});