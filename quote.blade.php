<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Orçamento #{{ $quote->id }}</title>
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
        .header .quote-id {
            width: 33.33%;
            text-align: left;
            font-weight: bold;
            font-size: 14px;
        }
        .header .quote-date {
            width: 33.33%;
            text-align: right;
            font-size: 11px;
        }
        .validity-banner {
            background-color: #f0f0f0;
            border: 1px solid #ccc;
            padding: 8px;
            margin-bottom: 15px;
            text-align: center;
            font-weight: bold;
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
                <td class="quote-id">ORÇAMENTO: {{ substr($quote->id, 0, 8) }}</td>
                <td class="logo">
                    @php
                        $path = public_path('logo-pdf.svg');
                        $type = pathinfo($path, PATHINFO_EXTENSION);
                        $data = file_get_contents($path);
                        $base64 = 'data:image/' . $type . ';base64,' . base64_encode($data);
                    @endphp
                    <img src="{{ $base64 }}" alt="Logo">
                </td>
                <td class="quote-date">Data: {{ $quote->created_at->format('d/m/Y H:i') }}</td>
            </tr>
        </table>
    </div>

    @if($quote->valid_until)
    <div class="validity-banner">
        Válido até: {{ $quote->valid_until->format('d/m/Y') }}
    </div>
    @endif

    <div class="owner-section">
        Proprietário: {{ $quote->customer_name }}
    </div>

    <div class="vehicle-info">
        <span><strong>Placa:</strong> {{ $quote->vehicle_plate ?? '-' }}</span>
        <span><strong>Modelo:</strong> {{ $quote->vehicle_model }}</span>
        <span><strong>Ano:</strong> {{ $quote->vehicle_year }}</span>
        @if($quote->mileage)
        <span><strong>Kilometragem:</strong> {{ number_format($quote->mileage, 0, ',', '.') }} km</span>
        @endif
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
                @forelse($quote->parts as $part)
                    <tr>
                        <td>{{ $part->name }}</td>
                        <td class="text-right">{{ $part->pivot->quantity }}</td>
                        <td class="text-right">R$ {{ number_format($part->pivot->unit_price, 2, ',', '.') }}</td>
                        <td class="text-right">R$ {{ number_format($part->pivot->subtotal, 2, ',', '.') }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="4">Nenhuma peça relacionada ao orçamento.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    @if($quote->labor_tasks && count($quote->labor_tasks) > 0)
    <div class="section">
        <table>
            <thead>
                <tr>
                    <th>Serviço</th>
                    <th class="text-right">Valor</th>
                </tr>
            </thead>
            <tbody>
                @foreach($quote->labor_tasks as $task)
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
                <td class="text-right">R$ {{ number_format($quote->parts_total, 2, ',', '.') }}</td>
            </tr>
            <tr>
                <td>Mão de Obra:</td>
                <td class="text-right">R$ {{ number_format($quote->labor_cost, 2, ',', '.') }}</td>
            </tr>
            <tr class="total-row">
                <td><strong>Total Geral:</strong></td>
                <td class="text-right"><strong>R$ {{ number_format($quote->total, 2, ',', '.') }}</strong></td>
            </tr>
        </table>
    </div>

    <div class="separator"></div>

    <div class="footer">
        <p><strong>ATENÇÃO:</strong> Este documento é apenas um orçamento e não representa uma ordem de serviço. Os valores apresentados são estimativas e podem sofrer alterações durante a execução do serviço, caso sejam identificados problemas adicionais.</p>
        <p><strong>Validade:</strong> Este orçamento tem validade de {{ $quote->valid_until ? $quote->valid_until->format('d/m/Y') : '7 dias a partir da data de emissão' }}. Após este prazo, os valores podem ser reajustados conforme tabela vigente.</p>
        <p><strong>Condições:</strong> Os valores das peças estão sujeitos à disponibilidade no momento da execução do serviço. Peças substituídas durante o serviço serão entregues ao cliente, exceto em casos de troca em garantia.</p>
    </div>
</body>
</html>
