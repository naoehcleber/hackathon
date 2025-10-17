const fs = require('fs');
const path = require('path');

// Coordenadas Centrais (Recife, por exemplo)
const CENTRAL_LAT = -8.064595;
const CENTRAL_LNG = -34.877441;
const NUM_POINTS = 1000;
const MAX_DEVIATION = 0.005; // Desvio máximo de Lat/Lng para dispersar os 1000 pontos

// Função para gerar um número aleatório dentro de um intervalo
const getRandom = (min, max) => Math.random() * (max - min) + min;

// Função para gerar um único ponto de acesso simulado
const generateAp = (index) => {
    // Dispersa as coordenadas aleatoriamente em torno do centro
    const lat = CENTRAL_LAT + getRandom(-MAX_DEVIATION, MAX_DEVIATION);
    const lng = CENTRAL_LNG + getRandom(-MAX_DEVIATION, MAX_DEVIATION);

    // Contagem base e variância aleatórias para simular diferentes zonas
    const baseCount = Math.floor(getRandom(10, 80));
    const variance = Math.floor(baseCount * getRandom(0.2, 0.5)); // Variância entre 20% e 50% da base

    // Finge que 1 em cada 10 APs tem um pico (simulando áreas especiais)
    const hasPeak = index % 10 === 0;
    let peakConfig = { active: false };
    
    if (hasPeak) {
        // Horário de pico aleatório: manhã (9-11) ou almoço (12-14)
        const isMorningPeak = Math.random() < 0.5;
        peakConfig = {
            active: true,
            timeWindow: isMorningPeak ? [9, 11] : [12, 14]
        };
    }

    return {
        id: `AP-${index + 1}`,
        name: `Ponto de Acesso ${index + 1}`,
        lat: parseFloat(lat.toFixed(6)), // Limita a 6 casas decimais
        lng: parseFloat(lng.toFixed(6)),
        baseCount: baseCount,
        variance: variance,
        peakConfig: peakConfig
    };
};

// 1. Gera o array com 1000 APs
const largeApConfig = Array.from({ length: NUM_POINTS }, (_, i) => generateAp(i));

// 2. Formata o conteúdo para ser exportado como um módulo JS
const fileContent = `
/**
 * Arquivo gerado automaticamente em ${new Date().toISOString()}
 * Contém ${NUM_POINTS} Pontos de Acesso simulados.
 */
const AP_CONFIG = ${JSON.stringify(largeApConfig, null, 4)};

module.exports = { AP_CONFIG };
`;

// 3. Salva no arquivo 'data.js'
const outputPath = path.join(__dirname, 'data.js');
fs.writeFileSync(outputPath, fileContent.trim());

console.log(`✅ Arquivo 'data.js' criado com sucesso na raiz do projeto com ${NUM_POINTS} APs.`);   