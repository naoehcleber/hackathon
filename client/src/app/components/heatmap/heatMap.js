// src/app/components/heatmap/heatMap.js

"use client"; // ESSENCIAL: Garante que este componente só seja executado no navegador

import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
// Os imports 'L from leaflet', 'leaflet/dist/leaflet.css' e 'leaflet.heat'
// foram removidos daqui e movidos para o lado do cliente (via window.L e import global CSS)
import './heatmap.css'; // Mantenha a importação dos seus estilos customizados

// URL do seu backend REAL (que está simulando a aquisição de dados)
const API_ENDPOINT = 'http://localhost:3001/api/densidade-wifi'; 
// OBS: Mude para a URL do seu servidor final ao implantar!

// ======================================================================
// Componente Auxiliar para a Camada de Calor (Heat Layer)
// Gerencia a criação e atualização do heatmap.
// ======================================================================
const HeatmapLayer = ({ data }) => {
  const map = useMap(); // Hook do React-Leaflet para acessar o objeto do mapa Leaflet

  useEffect(() => {
    // 1. Verifica se estamos no cliente E se o Leaflet (L) e o plugin heatLayer estão carregados.
    if (typeof window !== 'undefined' && window.L && window.L.heatLayer) {
      
      const L = window.L; // Usa o objeto Leaflet globalmente disponível

      if (!map || data.length === 0) return;

      // 2. Prepara os dados no formato [lat, lng, intensidade/peso]
      const heatData = data.map(ponto => [
        ponto.lat, 
        ponto.lng, 
        ponto.count * 1.5 // Fator de multiplicação para aumentar o contraste visual
      ]);

      // 3. Remove qualquer camada de calor existente (para atualizar sem sobrepor)
      map.eachLayer(layer => {
        // Verifica a propriedade customizada para identificar a camada
        if (layer._isHeatmapLayer) {
          map.removeLayer(layer);
        }
      });

      // 4. Cria e adiciona a nova camada de calor
      const heatLayer = L.heatLayer(heatData, {
        radius: 35, // Raio de influência de cada AP
        blur: 25,   // Suavização
        maxZoom: 17,
        // Gradiente de cores (ajuste os valores 0.0 a 1.0 para calibrar o seu heatmap)
        gradient: { 0.0: 'blue', 0.4: 'lime', 0.7: 'yellow', 1.0: 'red' } 
      }).addTo(map);

      heatLayer._isHeatmapLayer = true; // Marca a camada para futura remoção
    }

  }, [map, data]); // Dependências: re-executa quando o mapa ou os dados mudam

  return null;
};

// ======================================================================
// Componente Principal: heatMap
// ======================================================================
const HeatMap = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Coordenadas centrais (Ajuste este ponto para o centro da sua área mapeada)
  const initialPosition = useMemo(() => [-8.1030, -34.9080], []); 
  const zoomLevel = 14;
  const updateInterval = 5000; // Intervalo de atualização (5 segundos)

  // Função para buscar os dados do seu Backend (API Real)
  const fetchData = async () => {
    try {
      const response = await fetch(API_ENDPOINT);
      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const json = await response.json();
      // Validação básica: garante que os dados são um array antes de setar
      if (Array.isArray(json)) {
        setData(json);
      } else {
        console.error("API retornou um formato de dados inválido.");
      }
      
    } catch (error) {
      console.error("Erro ao carregar dados de densidade. Verifique o Backend:", error);
    } finally {
      setLoading(false);
    }
  };

  // Efeito para carregar os dados e configurar o polling em tempo real
  useEffect(() => {
    fetchData(); 
    const intervalId = setInterval(fetchData, updateInterval); 

    // Função de limpeza (executada ao desmontar o componente)
    return () => clearInterval(intervalId); 
  }, []);

  if (loading) {
    return <div className="heatmap-loading">Carregando mapa e dados de densidade...</div>;
  }

  return (
    <div className="heatmap-container">
      <MapContainer 
        center={initialPosition} 
        zoom={zoomLevel} 
        scrollWheelZoom={true}
        className="leaflet-map-container"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Renderiza a camada de calor com os dados da API */}
        <HeatmapLayer data={data} />
        
      </MapContainer>
      
      {/* Legenda (Use os estilos do heatmap.css) */}
      <div className="heatmap-legend">
          <p>Densidade de Clientes Conectados (Simulada)</p>
          <span className="legend-red">Alto</span> | 
          <span className="legend-lime"> Médio</span> | 
          <span className="legend-blue"> Baixo</span>
      </div>
    </div>
  );
};

export default HeatMap;