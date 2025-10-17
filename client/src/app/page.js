// src/app/page.js

// Importe o novo componente Wrapper (que lida com o carregamento dinâmico)
import DynamicHeatMapWrapper from './components/heatmap/DynamicHeatMap';

export default function Home() {
  return (
    <main>
      <h1 style={{ textAlign: 'center', padding: '10px' }}>
          Visualização de Densidade de Usuários
      </h1>
      
      {/* Use o wrapper que garante o Client-Side Rendering */}
      <DynamicHeatMapWrapper />
    </main>
  );
}