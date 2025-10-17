import './globals.css'; // Mantenha a importação dos seus estilos globais
import 'leaflet/dist/leaflet.css'; // <-- ADICIONE AQUI

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}