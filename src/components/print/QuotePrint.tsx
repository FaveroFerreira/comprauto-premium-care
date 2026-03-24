import { QuoteWithParts } from '@/types';
import { formatCurrency, formatDateTime, formatDate } from '@/lib/utils';
import { logoPdfDataUrl } from './logo';

interface QuotePrintProps {
  data: QuoteWithParts;
}

export function QuotePrint({ data }: QuotePrintProps) {
  const formatNumber = (value: number) => {
    return value.toLocaleString('pt-BR');
  };

  return (
    <div className="print-document">
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
        .print-document {
          font-family: Arial, sans-serif;
          font-size: 11px;
          color: #000;
          background: #fff;
          padding: 0;
          margin: 0;
        }
        .print-header {
          width: 100%;
          margin-bottom: 20px;
          border-bottom: 1px solid #000;
          padding-bottom: 10px;
        }
        .print-header-table {
          width: 100%;
          border: none;
          border-collapse: collapse;
        }
        .print-header-table td {
          border: none;
          padding: 0;
          vertical-align: middle;
        }
        .print-quote-id {
          width: 33.33%;
          text-align: left;
          font-weight: bold;
          font-size: 14px;
        }
        .print-logo {
          width: 33.33%;
          text-align: center;
        }
        .print-logo img {
          max-height: 60px;
          display: inline-block;
        }
        .print-quote-date {
          width: 33.33%;
          text-align: right;
          font-size: 11px;
        }
        .print-validity-banner {
          background-color: #f0f0f0 !important;
          border: 1px solid #ccc;
          padding: 8px;
          margin-bottom: 15px;
          text-align: center;
          font-weight: bold;
        }
        .print-owner-section {
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .print-vehicle-info {
          margin-bottom: 15px;
        }
        .print-vehicle-info span {
          margin-right: 15px;
        }
        .print-section {
          margin-bottom: 15px;
        }
        .print-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        .print-table th,
        .print-table td {
          border: 1px solid #000;
          padding: 5px;
          text-align: left;
        }
        .print-table th {
          background-color: #eee !important;
          font-weight: bold;
        }
        .print-text-right {
          text-align: right;
        }
        .print-totals {
          margin-top: 10px;
          width: 100%;
        }
        .print-totals-table {
          width: 250px;
          margin-left: auto;
          border-collapse: collapse;
        }
        .print-totals-table td {
          border: none;
          padding: 2px 5px;
        }
        .print-total-row {
          font-weight: bold;
          border-top: 1px solid #000;
        }
        .print-separator {
          border-top: 1px solid #000;
          margin: 20px 0;
        }
        .print-footer {
          font-size: 9px;
          text-align: justify;
          line-height: 1.4;
        }
        .print-footer p {
          margin-bottom: 10px;
        }
      `}</style>

      <div className="print-header">
        <table className="print-header-table">
          <tbody>
            <tr>
              <td className="print-quote-id">ORÇAMENTO: {data.id.substring(0, 8)}</td>
              <td className="print-logo">
                <img src={logoPdfDataUrl} alt="Comprauto Premium Care" />
              </td>
              <td className="print-quote-date">Data: {formatDateTime(data.created_at)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {data.valid_until && (
        <div className="print-validity-banner">
          Válido até: {formatDate(data.valid_until)}
        </div>
      )}

      <div className="print-owner-section">
        Proprietário: {data.customer_name}
      </div>

      <div className="print-vehicle-info">
        <span><strong>Placa:</strong> {data.vehicle_plate || '-'}</span>
        <span><strong>Modelo:</strong> {data.vehicle_brand} {data.vehicle_model}</span>
        <span><strong>Ano:</strong> {data.vehicle_year}</span>
        {data.mileage && (
          <span><strong>Kilometragem:</strong> {formatNumber(data.mileage)} km</span>
        )}
      </div>

      {data.items && data.items.length > 0 && (
        <div className="print-section">
          <table className="print-table">
            <thead>
              <tr>
                <th>Peça</th>
                <th className="print-text-right">Qtd</th>
                <th className="print-text-right">Valor Unit.</th>
                <th className="print-text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.part?.name || `Peça ${item.part_id}`}</td>
                  <td className="print-text-right">{item.quantity}</td>
                  <td className="print-text-right">{formatCurrency(item.unit_price)}</td>
                  <td className="print-text-right">{formatCurrency(item.quantity * item.unit_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data.labor_tasks && data.labor_tasks.length > 0 && (
        <div className="print-section">
          <table className="print-table">
            <thead>
              <tr>
                <th>Serviço</th>
                <th className="print-text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {data.labor_tasks.map((task, idx) => (
                <tr key={idx}>
                  <td>{task.description}</td>
                  <td className="print-text-right">{formatCurrency(task.cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="print-totals">
        <table className="print-totals-table">
          <tbody>
            <tr>
              <td>Total Peças:</td>
              <td className="print-text-right">{formatCurrency(data.parts_total)}</td>
            </tr>
            <tr>
              <td>Mão de Obra:</td>
              <td className="print-text-right">{formatCurrency(data.labor_cost)}</td>
            </tr>
            <tr className="print-total-row">
              <td><strong>Total Geral:</strong></td>
              <td className="print-text-right"><strong>{formatCurrency(data.total)}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="print-separator"></div>

      <div className="print-footer">
        <p><strong>ATENÇÃO:</strong> Este documento é apenas um orçamento e não representa uma ordem de serviço. Os valores apresentados são estimativas e podem sofrer alterações durante a execução do serviço, caso sejam identificados problemas adicionais.</p>
        <p><strong>Validade:</strong> Este orçamento tem validade de {data.valid_until ? formatDate(data.valid_until) : '7 dias a partir da data de emissão'}. Após este prazo, os valores podem ser reajustados conforme tabela vigente.</p>
        <p><strong>Condições:</strong> Os valores das peças estão sujeitos à disponibilidade no momento da execução do serviço. Peças substituídas durante o serviço serão entregues ao cliente, exceto em casos de troca em garantia.</p>
      </div>
    </div>
  );
}
