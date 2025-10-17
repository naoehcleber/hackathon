// src/app/components/heatmap/heatMap.js

"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, useMap, Circle, CircleMarker } from 'react-leaflet';
import './heatmap.css';

const API_ENDPOINT = "/api/backend-proxy"; 
const EARTH_RADIUS_METERS = 6371000; // Raio da Terra em metros

// ======================================================================
// NOVO: Função para calcular a distância entre dois pontos (Haversine simplificado)
// Usado para filtrar os dados que estão fora do raio de monitoramento.
// ======================================================================
const getDistance = (lat1, lng1, lat2, lng2) => {
    const toRad = (x) => x * Math.PI / 180;
    
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return EARTH_RADIUS_METERS * c; // Distância em metros
};


// ======================================================================
// Componente Auxiliar para a Camada de Calor (Heat Layer)
// ======================================================================
const HeatmapLayer = ({ data }) => {
  // ... (mantém o código original)
  const map = useMap(); 

  useEffect(() => {
    if (typeof window !== 'undefined' && window.L && window.L.heatLayer) {
      
      const L = window.L;

      if (!map || data.length === 0) return;

      // 2. Prepara os dados no formato [lat, lng, intensidade/peso]
      const heatData = data.map(ponto => [
        ponto.lat, 
        ponto.lng, 
        ponto.count * 1.5 
      ]);

      // 3. Remove qualquer camada de calor existente 
      map.eachLayer(layer => {
        if (layer._isHeatmapLayer) {
          map.removeLayer(layer);
        }
      });

      // 4. Cria e adiciona a nova camada de calor
      const heatLayer = L.heatLayer(heatData, {
        radius: 35, 
        blur: 25,   
        maxZoom: 17,
        gradient: { 0.0: 'blue', 0.4: 'lime', 0.7: 'yellow', 1.0: 'red' } 
      }).addTo(map);

      heatLayer._isHeatmapLayer = true; 
    }

  }, [map, data]); 

  return null;
};


// ======================================================================
// Componente: Marcadores de Pontos de Acesso (APs)
// ======================================================================
const AccessPointMarkers = ({ data }) => {
    const markerOptions = {
        color: 'white',        
        fillColor: '#0070f3',  
        fillOpacity: 0.8,      
        weight: 1,             
    };

    return (
        <>
            {data.map((ponto, index) => (
                <CircleMarker
                    key={`marker-${index}`}
                    center={[ponto.lat, ponto.lng]}
                    pathOptions={markerOptions}
                    radius={4 + Math.min(ponto.count / 30, 8)} 
                >
                </CircleMarker>
            ))}
        </>
    );
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
  const initialPosition = useMemo(() => [-8.064595, -34.877441], []); 
  const zoomLevel = 17; 

  // Propriedades do Círculo de Monitoramento (MANTENDO 40M)
  const monitorCenter = initialPosition;
  const monitorRadius = 40; // Raio em metros
  const updateInterval = 500; 

  const bounds = useMemo(() => [
    [-8.07000, -34.88500], 
    [-8.05800, -34.87300], 
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

  useEffect(() => {
    fetchData(); 
    const intervalId = setInterval(fetchData, updateInterval); 
    return () => clearInterval(intervalId); 
  }, []);


  // ======================================================================
  // FILTRAGEM: AQUI ESTÁ A CHAVE PARA RESTRINGIR AO CÍRCULO
  // ======================================================================
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const [centerLat, centerLng] = monitorCenter;
    const radius = monitorRadius;

    // Filtra apenas os pontos que estão dentro do raio de monitoramento
    return data.filter(ponto => {
        const distance = getDistance(centerLat, centerLng, ponto.lat, ponto.lng);
        return distance <= radius;
    });

  }, [data, monitorCenter, monitorRadius]);
  // ======================================================================

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
        
        {/* Círculo representando a Área de Monitoramento */}
        <Circle 
          center={monitorCenter} 
          radius={monitorRadius}
          pathOptions={{ 
            color: 'blue', 
            fillColor: 'rgba(0, 100, 255, 0.15)', 
            weight: 2, 
            opacity: 0.7, 
            fillOpacity: 0.2
          }}
        />
        
        {/* Marcadores: Agora usa os DADOS FILTRADOS */}
        <AccessPointMarkers data={filteredData} />
        
        {/* Heatmap: Agora usa os DADOS FILTRADOS */}
        <HeatmapLayer data={filteredData} />
        
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