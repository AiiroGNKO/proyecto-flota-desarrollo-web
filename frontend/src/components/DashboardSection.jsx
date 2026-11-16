const formatoCLP = (valor) =>
  Number(valor || 0).toLocaleString("es-CL", { style: "currency", currency: "CLP" });

export default function DashboardSection({ kpis }) {
  if (!kpis) {
    return <p className="aviso">Calculando indicadores operativos de la flota...</p>;
  }

  const { resumen, gasto_mensual, ranking_eficiencia } = kpis;
  const maxGastoMes = Math.max(...gasto_mensual.map((m) => m.total_clp), 1);
  const maxKml = Math.max(...ranking_eficiencia.map((r) => r.rendimiento_promedio_kml), 1);

  const masEficiente = ranking_eficiencia[0] || null;
  const menosEficiente =
    ranking_eficiencia.length > 1
      ? ranking_eficiencia[ranking_eficiencia.length - 1]
      : null;

  return (
    <section>
      <h2>Panel Ejecutivo e Indicadores Clave (KPIs)</h2>

      {/* Tarjetas superiores de métricas globales */}
      <div className="kpi-grid">
        <div className="kpi-card kpi-destacado">
          <span className="kpi-titulo">Costo Operativo Global</span>
          <strong className="kpi-valor">
            {resumen.costo_por_km_clp > 0
              ? `$${Number(resumen.costo_por_km_clp).toLocaleString("es-CL")} CLP/km`
              : "Sin tramos medidos"}
          </strong>
          <span className="subtexto">
            Combustible + Mantención sobre {Number(resumen.km_totales_operacion).toLocaleString("es-CL")} km
          </span>
        </div>

        <div className="kpi-card">
          <span className="kpi-titulo">Gasto Total Combustible</span>
          <strong className="kpi-valor">{formatoCLP(resumen.gasto_combustible_clp)}</strong>
          <span className="subtexto">Acumulado histórico</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-titulo">Gasto Total Mantenciones</span>
          <strong className="kpi-valor">{formatoCLP(resumen.gasto_mantencion_clp)}</strong>
          <span className="subtexto">Repuestos + Mano de obra</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-titulo">Flota Operativa Activa</span>
          <strong className="kpi-valor">{resumen.total_vehiculos} unidades</strong>
          <span className="subtexto">Habilitadas en operación</span>
        </div>
      </div>

      <div className="dashboard-dos-columnas">
        {/* Gráfico 1: Gasto mensual de combustible */}
        <div className="panel-grafico">
          <h3>Gasto Total de Combustible por Mes (CLP)</h3>
          {gasto_mensual.length === 0 ? (
            <p className="aviso">Registra cargas de combustible para visualizar la evolución mensual.</p>
          ) : (
            <div className="barras-lista">
              {gasto_mensual.map((item) => {
                const anchoPct = Math.max(8, Math.round((item.total_clp / maxGastoMes) * 100));
                return (
                  <div key={item.mes} className="barra-item">
                    <div className="barra-header">
                      <strong>{item.mes}</strong>
                      <span>
                        {formatoCLP(item.total_clp)} ({Number(item.total_litros).toLocaleString("es-CL")} L)
                      </span>
                    </div>
                    <div className="barra-fondo">
                      <div className="barra-relleno barra-azul" style={{ width: `${anchoPct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Gráfico 2: Ranking de eficiencia por vehículo */}
        <div className="panel-grafico">
          <h3>Ranking de Eficiencia de Flota (km/L)</h3>

          {masEficiente && (
            <div className="comparativa-extremos">
              <div className="extremo-box extremo-mejor">
                <span className="subtexto">Más eficiente</span>
                <strong>{masEficiente.patente} ({masEficiente.rendimiento_promedio_kml} km/L)</strong>
              </div>
              {menosEficiente && (
                <div className="extremo-box extremo-menor">
                  <span className="subtexto">Menor rendimiento</span>
                  <strong>{menosEficiente.patente} ({menosEficiente.rendimiento_promedio_kml} km/L)</strong>
                </div>
              )}
            </div>
          )}

          {ranking_eficiencia.length === 0 ? (
            <p className="aviso">
              Se requieren al menos 2 cargas de combustible en un vehículo para calcular su rendimiento en km/L.
            </p>
          ) : (
            <div className="barras-lista">
              {ranking_eficiencia.map((r, index) => {
                const anchoPct = Math.max(10, Math.round((r.rendimiento_promedio_kml / maxKml) * 100));
                const esUltimo = ranking_eficiencia.length > 1 && index === ranking_eficiencia.length - 1;
                return (
                  <div key={r.id} className="barra-item">
                    <div className="barra-header">
                      <span>
                        <strong>#{index + 1} {r.patente}</strong> — {r.vehiculo}
                      </span>
                      <strong>{r.rendimiento_promedio_kml} km/L</strong>
                    </div>
                    <div className="barra-fondo">
                      <div
                        className={`barra-relleno ${esUltimo ? "barra-naranja" : "barra-verde"}`}
                        style={{ width: `${anchoPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}