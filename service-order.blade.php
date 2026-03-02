<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ordem de Serviço #{{ $serviceOrder->id }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 11px;
            margin: 0;
            padding: 0;
            color: #000;
        }
        .header {
            width: 100%;
            margin-bottom: 20px;
            border-bottom: 1px solid #000;
            padding-bottom: 10px;
        }
        .header table {
            width: 100%;
            border: none;
        }
        .header td {
            border: none;
            padding: 0;
            vertical-align: middle;
        }
        .header .logo {
            width: 33.33%;
            text-align: center;
        }
        .header .logo img {
            max-height: 60px;
            display: inline-block;
        }
        .header .os-id {
            width: 33.33%;
            text-align: left;
            font-weight: bold;
            font-size: 14px;
        }
        .header .os-date {
            width: 33.33%;
            text-align: right;
            font-size: 11px;
        }
        .section {
            margin-bottom: 15px;
        }
        .owner-section {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .vehicle-info {
            margin-bottom: 15px;
        }
        .vehicle-info span {
            margin-right: 15px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        table th, table td {
            border: 1px solid #000;
            padding: 5px;
            text-align: left;
        }
        table th {
            background-color: #eee;
            font-weight: bold;
        }
        .text-right {
            text-align: right;
        }
        .totals {
            margin-top: 10px;
            width: 100%;
        }
        .totals-table {
            width: 250px;
            margin-left: auto;
        }
        .totals-table td {
            border: none;
            padding: 2px 5px;
        }
        .totals-table .total-row {
            font-weight: bold;
            border-top: 1px solid #000;
        }
        .separator {
            border-top: 1px solid #000;
            margin: 20px 0;
        }
        .footer {
            font-size: 9px;
            text-align: justify;
            line-height: 1.4;
        }
        .footer p {
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <table>
            <tr>
                <td class="os-id">O.S.: {{ substr($serviceOrder->id, 0, 8) }}</td>
                <td class="logo">
                    @php
                        $path = public_path('logo-pdf.svg');
                        $type = pathinfo($path, PATHINFO_EXTENSION);
                        $data = file_get_contents($path);
                        $base64 = 'data:image/' . $type . ';base64,' . base64_encode($data);
                    @endphp
                    <img src="{{ $base64 }}" alt="Logo">
                </td>
                <td class="os-date">Abertura: {{ $serviceOrder->created_at->format('d/m/Y H:i') }}</td>
            </tr>
        </table>
    </div>

    <div class="owner-section">
        Proprietário: {{ $serviceOrder->customer_name }}
    </div>

    <div class="vehicle-info">
        <span><strong>Placa:</strong> {{ $serviceOrder->vehicle_plate ?? '-' }}</span>
        <span><strong>Modelo:</strong> {{ $serviceOrder->vehicle_model }}</span>
        <span><strong>Ano:</strong> {{ $serviceOrder->vehicle_year }}</span>
        <span><strong>Kilometragem:</strong> {{ number_format($serviceOrder->mileage, 0, ',', '.') }} km</span>
    </div>

    <div class="section">
        <table>
            <thead>
                <tr>
                    <th>Peça</th>
                    <th class="text-right">Qtd</th>
                    <th class="text-right">Valor Unit.</th>
                    <th class="text-right">Subtotal</th>
                </tr>
            </thead>
            <tbody>
                @forelse($serviceOrder->parts as $part)
                    <tr>
                        <td>{{ $part->name }}</td>
                        <td class="text-right">{{ $part->pivot->quantity }}</td>
                        <td class="text-right">R$ {{ number_format($part->pivot->unit_price, 2, ',', '.') }}</td>
                        <td class="text-right">R$ {{ number_format($part->pivot->subtotal, 2, ',', '.') }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="4">Nenhuma peça relacionada à OS.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    @if($serviceOrder->labor_tasks && count($serviceOrder->labor_tasks) > 0)
    <div class="section">
        <table>
            <thead>
                <tr>
                    <th>Serviço</th>
                    <th class="text-right">Valor</th>
                </tr>
            </thead>
            <tbody>
                @foreach($serviceOrder->labor_tasks as $task)
                    <tr>
                        <td>{{ $task['description'] }}</td>
                        <td class="text-right">R$ {{ number_format($task['cost'], 2, ',', '.') }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif

    <div class="totals">
        <table class="totals-table">
            <tr>
                <td>Total Peças:</td>
                <td class="text-right">R$ {{ number_format($serviceOrder->parts_total, 2, ',', '.') }}</td>
            </tr>
            <tr>
                <td>Mão de Obra:</td>
                <td class="text-right">R$ {{ number_format($serviceOrder->labor_cost, 2, ',', '.') }}</td>
            </tr>
            <tr class="total-row">
                <td><strong>Total Geral:</strong></td>
                <td class="text-right"><strong>R$ {{ number_format($serviceOrder->total, 2, ',', '.') }}</strong></td>
            </tr>
        </table>
    </div>

    <div class="separator"></div>

    <div class="footer">
        <p>Autorizo a execução dos serviços acima solicitados, assumindo as despesas decorrentes de substituição de peças, bem como mão-de-obra. Autorizo a empresa a manter em seus registros o cadastro dos meus dados pessoais e, em caso de inadimplência, efetuar o registro de meu nome no cadastro do SPC, após prévia comunicação. Autorizo de forma expressa e irrevogável, a penhora ou alienação do referido bem, caso não seja o pagamento não seja honrado.</p>
        <p><strong>Garantia:</strong> A garantia cobre especificamente as peças novas e serviços executados e pagos, com o sistema trabalhando em condições normais. Conforme o código de defesa do consumidor, seção IV, art. 26, II - noventa dias, tratando-se de fornecimento de serviços e de produtos duráveis. Serviços em cortesia não tem grantia. Em caso de problema, retornar a nossa empresa para fins de grantia.</p>
    </div>
</body>
</html>
