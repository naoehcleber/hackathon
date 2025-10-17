// src/app/components/heatmap/heatMap.js

"use client"; // ESSENCIAL: Garante que este componente só seja executado no navegador

import React, { useEffect, useState, useMemo } from 'react';
// Importamos o Circle, o novo componente para marcar a área de monitoramento
import { MapContainer, TileLayer, useMap, Circle } from 'react-leaflet';
import './heatmap.css'; // Mantenha a importação dos seus estilos customizados

// URL do seu backend REAL (que está simulando a aquisição de dados)
const API_ENDPOINT = "http://localhost:3001/api/densidade-wifi"; 

// ======================================================================
// Componente Auxiliar para a Camada de Calor (Heat Layer)
// ======================================================================
const HeatmapLayer = ({ data }) => {
  const map = useMap(); 

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
        if (layer._isHeatmapLayer) {
          map.removeLayer(layer);
        }
      });

      // 4. Cria e adiciona a nova camada de calor
      const heatLayer = L.heatLayer(heatData, {
        radius: 35, // Raio de influência de cada AP
        blur: 25,   // Suavização
        maxZoom: 17,
        gradient: { 0.0: 'blue', 0.4: 'lime', 0.7: 'yellow', 1.0: 'red' } 
      }).addTo(map);

      heatLayer._isHeatmapLayer = true; 
    }

  }, [map, data]); 

  return null;
};

// ======================================================================
// Componente Principal: heatMap
// ======================================================================
const HeatMap = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // ------------------------------------------------------------------
  // CONFIGURAÇÕES DE ÁREA E MONITORAMENTO
  // ------------------------------------------------------------------
  // Centro da Igreja Matriz (também o centro do círculo de monitoramento)
  const initialPosition = useMemo(() => [-8.064595, -34.877441], []); 
  const zoomLevel = 17; 

  // Propriedades do Círculo de Monitoramento (400 metros de raio)
  const monitorCenter = initialPosition;
  const monitorRadius = 60; // Raio em metros
  const updateInterval = 500; 

  // Definindo as fronteiras da área de análise (restrição de arrasto do mapa)
  const bounds = useMemo(() => [
    [-8.07000, -34.88500], // Sudoeste (SW) 
    [-8.05800, -34.87300], // Nordeste (NE) 
  ], []);
  // ------------------------------------------------------------------

  // Função para buscar os dados do seu Backend (API Real)
  const fetchData = async () => {
    try {
      const response = await fetch(API_ENDPOINT);
      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const json = await response.json();
      if (Array.isArray(json)) {
        setData(json);
      } 
    } catch (error) {
      console.error("Erro ao carregar dados de densidade. Verifique o Backend:", error);
    } finally {
      setLoading(false);
    }
  };

  // Efeito para carregar os dados e configurar o polling
  useEffect(() => {
    fetchData(); 
    const intervalId = setInterval(fetchData, updateInterval); 
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
        
        
        maxBounds={bounds}          
        minZoom={16}    
        maxZoom={36}                
        maxBoundsViscosity={1.0} 
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* NOVO: Círculo representando a Área de Monitoramento */}
        <Circle 
          center={monitorCenter} 
          radius={monitorRadius}
          pathOptions={{ 
            color: 'blue', 
            fillColor: 'rgba(0, 100, 255, 0.15)', // Azul claro e transparente
            weight: 2, 
            opacity: 0.7, 
            fillOpacity: 0.2
          }}
        />
        
        {/* Renderiza a camada de calor com os dados da API */}
        <HeatmapLayer data={data} />
        
      </MapContainer>
      
      {/* Legenda */}
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