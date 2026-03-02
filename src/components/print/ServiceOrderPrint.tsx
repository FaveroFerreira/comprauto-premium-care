import { ServiceOrderWithParts } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { logoPdfDataUrl } from './logo';

interface ServiceOrderPrintProps {
  data: ServiceOrderWithParts;
}

export function ServiceOrderPrint({ data }: ServiceOrderPrintProps) {
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
        .print-os-id {
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
        .print-os-date {
          width: 33.33%;
          text-align: right;
          font-size: 11px;
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
              <td className="print-os-id">O.S.: {data.id.substring(0, 8)}</td>
              <td className="print-logo">
                <img src={logoPdfDataUrl} alt="Rech Performance" />
              </td>
              <td className="print-os-date">Abertura: {formatDateTime(data.created_at)}</td>
            </tr>
          </tbody>
        </table>
      </div>

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
            {data.items && data.items.length > 0 ? (
              data.items.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.part?.name || `Peça ${item.part_id}`}</td>
                  <td className="print-text-right">{item.quantity}</td>
                  <td className="print-text-right">{formatCurrency(item.unit_price)}</td>
                  <td className="print-text-right">{formatCurrency(item.quantity * item.unit_price)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4}>Nenhuma peça relacionada à OS.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
        <p>Autorizo a execução dos serviços acima solicitados, assumindo as despesas decorrentes de substituição de peças, bem como mão-de-obra. Autorizo a empresa a manter em seus registros o cadastro dos meus dados pessoais e, em caso de inadimplência, efetuar o registro de meu nome no cadastro do SPC, após prévia comunicação. Autorizo de forma expressa e irrevogável, a penhora ou alienação do referido bem, caso não seja o pagamento não seja honrado.</p>
        <p><strong>Garantia:</strong> A garantia cobre especificamente as peças novas e serviços executados e pagos, com o sistema trabalhando em condições normais. Conforme o código de defesa do consumidor, seção IV, art. 26, II - noventa dias, tratando-se de fornecimento de serviços e de produtos duráveis. Serviços em cortesia não tem garantia. Em caso de problema, retornar a nossa empresa para fins de garantia.</p>
      </div>
    </div>
  );
}
