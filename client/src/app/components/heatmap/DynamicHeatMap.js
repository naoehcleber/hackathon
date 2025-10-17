// src/app/components/heatmap/DynamicHeatMap.js

"use client"; // <--- ADICIONE ESTA LINHA

import dynamic from 'next/dynamic';
import React from 'react';

// IMPORTAÇÕES DE CSS AQUI TAMBÉM SÃO BOAS PRÁTICAS PARA COMPONENTES DE MAPA


// Importa o componente HeatMap DYNAMICAMENTE e desabilita a renderização
// no lado do servidor (SSR: false).
const DynamicMap = dynamic(() => import('./heatMap'), {
  ssr: false, // AGORA PERMITIDO porque o wrapper é um Client Component
  loading: () => <p>Carregando Mapa...</p>, 
});

const DynamicHeatMapWrapper = (props) => {
  return (
    <div style={{ height: '90vh', width: '100%' }}>
      <DynamicMap {...props} />
    </div>
  );
};

export default DynamicHeatMapWrapper;