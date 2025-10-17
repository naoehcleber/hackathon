// src/app/components/heatmap/heatMap.js

"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { MapContainer, TileLayer, useMap, Circle, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
// ⚠️ O CSS do Leaflet deve ser importado globalmente (ex.: em app/layout.tsx):
// import "leaflet/dist/leaflet.css";
import "./heatmap.css";

// Endpoint único (removida a duplicidade)
const API_ENDPOINT = "http://localhost:3001/api/densidade-wifi";

// ======================================================================
// Função utilitária: distância Haversine (em metros)
// ======================================================================
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// ======================================================================
// HeatmapLayer (processa clusters: totalCount, centerLat/centerLng)
// usa ref + setLatLngs para evitar recriar camada a cada render
// ======================================================================
const HeatmapLayer = ({ data }) => {
  const map = useMap();
  const heatRef = useRef(null);

  useEffect(() => {
    if (!map || !Array.isArray(data) || data.length === 0) return;

    // 1) Normalização por max totalCount
    const maxTotalCount = data.reduce(
      (max, cluster) => Math.max(max, Number(cluster.totalCount) || 0),
      0
    );

    const HEATMAP_INTENSITY_MULTIPLIER = 1.5;

    // 2) Monta [lat, lng, weight]
    const heatData = data.map((cluster) => {
      const lat = Number(cluster.centerLat);
      const lng = Number(cluster.centerLng);
      const total = Number(cluster.totalCount) || 0;

      let normalized = 0;
      if (maxTotalCount > 0) normalized = total / maxTotalCount;

      const scaled = normalized * HEATMAP_INTENSITY_MULTIPLIER;
      let finalWeight = 0;
      if (total > 0) {
        finalWeight = Math.max(0.01, Math.min(1.0, scaled));
      }

      return [lat, lng, finalWeight];
    });

    if (!heatRef.current) {
      heatRef.current = L.heatLayer(heatData, {
        radius: 35,
        blur: 25,
        maxZoom: 17,
        gradient: { 0.0: "blue", 0.4: "lime", 0.7: "yellow", 1.0: "red" },
      }).addTo(map);
    } else {
      heatRef.current.setLatLngs(heatData);
    }

    // Opcional: limpeza ao desmontar de verdade
    // return () => {
    //   heatRef.current?.remove();
    //   heatRef.current = null;
    // };
  }, [map, data]);

  return null;
};

// ======================================================================
// Marcadores dos APs (keys estáveis)
// ======================================================================
const AccessPointMarkers = ({ data }) => {
  const markerOptions = {
    color: "white",
    fillColor: "#0070f3",
    fillOpacity: 0.8,
    weight: 1,
  };

  return (
    <>
      {data.map((ponto, i) => {
        const lat = Number(ponto.lat);
        const lng = Number(ponto.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

        // key estável: usa id se existir, senão fallback coordenadas + índice
        const key = ponto.id ?? `${lat.toFixed(6)}_${lng.toFixed(6)}_${i}`;

        return (
          <CircleMarker
            key={`marker-${key}`}
            center={[lat, lng]}
            pathOptions={markerOptions}
            radius={4 + Math.min(Number(ponto.count || 0) / 30, 8)}
          />
        );
      })}
    </>
  );
};

// ======================================================================
// Componente principal
// - Busca clusters no backend
// - Filtra clusters por raio (para heatmap)
// - Achata APs dos clusters filtrados (para markers)
// ======================================================================
const HeatMap = () => {
  // Clusters originais do backend
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Configurações de área/monitoramento
  const initialPosition = useMemo(() => [-8.064595, -34.877441], []);
  const zoomLevel = 17;

  const monitorCenter = initialPosition;
  const monitorRadius = 40; // metros
  const updateInterval = 500; // cuidado com intervalos agressivos em dev

  const bounds = useMemo(
    () => [
      [-8.07, -34.885],
      [-8.058, -34.873],
    ],
    []
  );

  // Busca backend
  const fetchData = async () => {
    try {
      const resp = await fetch(API_ENDPOINT);
      if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);
      const json = await resp.json();
      if (Array.isArray(json)) setData(json);
    } catch (err) {
      console.error("Erro ao carregar dados de densidade. Verifique o Backend:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, updateInterval);
    return () => clearInterval(id);
  }, []);

  // 1) Clusters dentro do raio (para heatmap)
  const clusterHeatData = useMemo(() => {
    if (!data || data.length === 0) return [];
    const [cLat, cLng] = monitorCenter;
    return data.filter((cluster) => {
      const lat = Number(cluster.centerLat);
      const lng = Number(cluster.centerLng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
      const d = getDistance(cLat, cLng, lat, lng);
      return d <= monitorRadius;
    });
  }, [data, monitorCenter, monitorRadius]);

  // 2) APs achatados dos clusters filtrados (para markers)
  const filteredAPs = useMemo(() => {
    if (clusterHeatData.length === 0) return [];
    return clusterHeatData.flatMap((cluster) => Array.isArray(cluster.apList) ? cluster.apList : []);
  }, [clusterHeatData]);

  if (loading) {
    return <div className="heatmap-loading">Carregando mapa e dados de densidade...</div>;
  }

  return (
    <div className="heatmap-container">
      <MapContainer
        center={initialPosition}
        zoom={zoomLevel}
        scrollWheelZoom
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

        {/* Área de monitoramento */}
        <Circle
          center={monitorCenter}
          radius={monitorRadius}
          pathOptions={{
            color: "blue",
            fillColor: "rgba(0, 100, 255, 0.15)",
            weight: 2,
            opacity: 0.7,
            fillOpacity: 0.2,
          }}
        />

        {/* Marcadores: APs achatados */}
        <AccessPointMarkers data={filteredAPs} />

        {/* Heatmap: clusters filtrados */}
        <HeatmapLayer data={clusterHeatData} />
      </MapContainer>

      {/* Legenda */}
      <div className="heatmap-legend">
        <p>Densidade de Clientes Conectados (Simulada)</p>
        <span className="legend-red">Alto</span> | <span className="legend-lime">Médio</span> |{" "}
        <span className="legend-blue">Baixo</span>
      </div>
    </div>
  );
};

export default HeatMap;
