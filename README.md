# Comprauto Premium Care

Sistema de gestao para **estetica automotiva**. Gerencia ordens de servico, orcamentos, pecas, veiculos, clientes e despesas.

Aplicacao desktop construida com **Tauri 2.0** (Rust + React).

## Stack

| Camada    | Tecnologia                                          |
|-----------|-----------------------------------------------------|
| Frontend  | React 19, TypeScript 5.8, Vite 7, Tailwind CSS     |
| Backend   | Rust, Tauri 2.0                                     |
| Banco     | SQLite (rusqlite)                                   |
| UI        | Radix UI, Lucide Icons                              |
| State     | TanStack React Query                                |

## Pre-requisitos

- [Node.js](https://nodejs.org/) >= 20.19 (ou 22+)
- [Rust](https://www.rust-lang.org/tools/install) (stable)
- Dependencias do sistema (Linux): `libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf`

## Desenvolvimento

```bash
# Instalar dependencias
npm install

# Rodar o app em modo desenvolvimento
npm run tauri dev

# Apenas o frontend (sem Tauri)
npm run dev

# Lint e formatacao
npm run lint
npm run format
```

Para mudancas no backend Rust:

```bash
cd src-tauri
cargo check
cargo build
```

## Build de producao

```bash
npm run tauri build
```

O instalador `.msi` (Windows) sera gerado em `src-tauri/target/release/bundle/msi/`.

## Estrutura do projeto

```
src/
  components/ui/       # Componentes Radix UI
  components/shared/   # Componentes de dominio (CustomerSelector, UpdateChecker, etc.)
  components/print/    # Componentes de impressao/PDF
  components/layouts/  # Layout principal do app
  pages/               # Paginas por rota (service-orders/, quotes/, parts/, etc.)
  lib/api/             # Wrappers de invoke para o Tauri
  types/               # Interfaces TypeScript

src-tauri/
  src/commands/        # Handlers de comandos Tauri (vehicles, parts, service_orders, quotes, expenses, customers, stats)
  src/models/          # Structs de dados Rust
  src/db.rs            # Inicializacao do SQLite e migrations
  src/lib.rs           # Setup do app Tauri e plugins
  migrations/          # Scripts SQL de migracao
  capabilities/        # Permissoes do Tauri
```

## Entidades

| Entidade       | Descricao                                                     |
|----------------|---------------------------------------------------------------|
| Cliente        | Clientes (revendas, pessoas fisicas) com contato              |
| Ordem de Servico | Servicos com pecas e mao de obra (status: ABERTA/FINALIZADA) |
| Orcamento      | Propostas de preco (status: PENDENTE/APROVADO/REJEITADO/CONVERTIDO) |
| Peca           | Pecas e produtos com preco                                     |
| Veiculo        | Veiculos (marca, modelo, ano)                                  |
| Despesa        | Despesas do negocio (categorias: pecas, prestador, equipamento, outros) |

## Numeracao sequencial

Ordens de Servico e Orcamentos possuem numeracao sequencial automatica (alem do UUID interno). A tabela `counters` no SQLite gerencia os contadores. Registros existentes recebem numero retroativamente via migration.

## Banco de dados

O SQLite fica no diretorio de dados do app:

- **Windows**: `C:\Users\<usuario>\AppData\Roaming\br.com.comprautopremiumcare\comprauto_premium_care.db`

O banco **nao e afetado** por reinstalacoes. Migrations sao executadas automaticamente ao abrir o app.

## Auto-updater

O app verifica automaticamente se ha novas versoes disponíveis via GitHub Releases. Ao detectar uma atualizacao, exibe uma notificacao no canto inferior direito para o usuario instalar com um clique.

### Como funciona

1. Push na branch `master` dispara o workflow de CI
2. CI compila o app, assina os artefatos e cria um GitHub Release
3. O app do cliente verifica o endpoint `latest.json` do release
4. Se ha versao nova, oferece download e instalacao automatica
5. Apos instalar, o app reinicia com a nova versao

### Secrets necessarios no GitHub Actions

| Secret                            | Descricao                                                           |
|-----------------------------------|---------------------------------------------------------------------|
| `TAURI_SIGNING_PRIVATE_KEY`       | Chave privada para assinatura dos artefatos de update               |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Password da chave (pode ficar vazio se gerada sem password)      |
| `UPDATER_GITHUB_TOKEN`            | Fine-grained PAT com acesso `Contents: Read-only` ao repositorio   |

### Gerando a signing key

```bash
npx @tauri-apps/cli signer generate -w ~/.tauri/comprauto.key
```

- A **public key** (`.key.pub`) vai no campo `plugins.updater.pubkey` do `tauri.conf.json`
- A **private key** (`.key`) vai no secret `TAURI_SIGNING_PRIVATE_KEY`

### Token de acesso (repo privado)

Como o repositorio e privado, o app precisa de um token para acessar os releases. O token e um **Fine-grained Personal Access Token** do GitHub com:

- **Repository access**: Apenas este repositorio
- **Permissions**: `Contents: Read-only`

O token e injetado no binario em compile time via env var `UPDATER_GITHUB_TOKEN` no CI. Nao fica no codigo fonte.

## CI/CD

O workflow `.github/workflows/release.yml` e disparado a cada push na `master`:

- Compila o app para Windows
- Assina os artefatos com a signing key
- Cria um GitHub Release com o `.msi` e o `latest.json` para o updater

### Versionamento

A versao do app e definida em dois arquivos (devem estar sincronizados):

- `package.json` → campo `version`
- `src-tauri/tauri.conf.json` → campo `version`

O CI usa a versao do `tauri.conf.json` para nomear a tag e o release.

## Fluxo de trabalho

1. Desenvolver na branch `develop`
2. Quando pronto, fazer merge/PR para `master`
3. O push na `master` dispara o build e cria o release automaticamente
4. Clientes com o app instalado recebem a atualizacao automaticamente
