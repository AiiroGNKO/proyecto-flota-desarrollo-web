import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [vehiculos, setVehiculos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/vehiculos/')
      .then((res) => {
        if (!res.ok) throw new Error('Error al conectar con la API')
        return res.json()
      })
      .then((data) => {
        setVehiculos(data.results)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Gestión de Flota - Control de Vehículos</h1>
      {loading && <p>Cargando vehículos...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {!loading && !error && (
        <ul>
          {vehiculos.map((v) => (
            <li key={v.id}>
              <strong>{v.patente}</strong> - {v.marca} {v.modelo} (Km: {v.kilometraje_actual})
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default App