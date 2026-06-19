# Marketplace de Prestadores de Serviço

Plataforma web para conexão entre clientes e prestadores de serviço, com autenticação, catálogo de serviços, solicitações de atendimento e painel administrativo.

## Tecnologias

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Supabase
- JWT
- Zod

## Requisitos

Antes de executar o projeto, garanta que você tenha instalado:

- Node.js 20 ou superior
- npm
- Um projeto Supabase configurado

## Instalacao

1. Clone o repositório:

```bash
git clone https://github.com/JoeJr09/marketplace-prestadores-servico.git
cd marketplace-prestadores-servico
```

2. Instale as dependencias:

```bash
npm install
```

3. Crie o arquivo `.env.local` a partir do `.env.example`:

No Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

No macOS/Linux:

```bash
cp .env.example .env.local
```

4. Abra o arquivo `.env.local` e preencha com os dados do seu projeto Supabase.

## Configuracao do `.env.local`

O projeto usa Supabase para autenticação, banco de dados e storage. No arquivo `.env.local`, configure:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_ANON
SUPABASE_SERVICE_ROLE_KEY=SUA_SERVICE_ROLE_KEY

JWT_ACCESS_SECRET=UM_SEGREDO_GRANDE_E_SEGURO
JWT_REFRESH_SECRET=OUTRO_SEGREDO_GRANDE_E_SEGURO

DATABASE_URL=postgresql://usuario:senha@host:6543/postgres?sslmode=require
```

### O que significa cada variável

- `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto no Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: chave pública usada no frontend.
- `SUPABASE_SERVICE_ROLE_KEY`: chave privada usada nas rotas protegidas do backend.
- `JWT_ACCESS_SECRET`: segredo para gerar o token de acesso.
- `JWT_REFRESH_SECRET`: segredo para gerar o token de refresh.
- `DATABASE_URL`: string de conexão com o banco PostgreSQL do Supabase.

## Como obter as chaves no Supabase

1. Acesse seu projeto no Supabase.
2. Vá em `Project Settings`.
3. Entre em `API`.
4. Copie:
   - `Project URL`
   - `anon public key`
   - `service_role key`
5. Para a `DATABASE_URL`, acesse a área de conexão do banco no Supabase e copie a connection string PostgreSQL.

## Configuracao do banco no Supabase

O repositório possui um arquivo [config.sql](./config.sql) com a base da estrutura do banco.

### Como aplicar

1. Crie um novo projeto no Supabase.
2. Acesse `SQL Editor`.
3. Abra o arquivo `config.sql`.
4. Cole o conteudo no editor SQL do Supabase.
5. Execute o script.

### O que o `config.sql` ja cobre

- tabelas principais como `profiles`, `professionals`, `services`, `categories`, `calendar` e outras tabelas auxiliares
- chaves primarias
- relações entre tabelas
- alguns `checks` e validações no banco

### O que ainda precisa ser conferido ou criado manualmente

O `config.sql` sozinho ainda NÃO é suficiente para garantir 100% do funcionamento do projeto. Estes pontos precisam ser validados no Supabase:

1. Extensoes do banco:
   - `uuid-ossp`, porque o script usa `uuid_generate_v4()`
   - `pgcrypto`, porque o script usa `gen_random_uuid()`
   - PostGIS, porque existem referencias como `spatial_ref_sys` e campo `location USER-DEFINED`

2. Tipos customizados:
   - `request_status`
   - `payment_status`

O script usa esses tipos em colunas `USER-DEFINED`, mas eles não aparecem definidos no arquivo.

**3. Buckets do Storage:**

- `avatars`
- `service_images`

**Esses buckets precisam existir no Supabase Storage para upload de imagens funcionar.**

4. Políticas e RLS:
   - o arquivo não traz as políticas de Row Level Security
   - se você pretende usar RLS, será necessário criar as policies compatíveis com as rotas do projeto

5. Triggers opcionais:
   - se quiser manter `updated_at` atualizado automaticamente, vale criar trigger para isso nas tabelas que usam esse campo

### Resumo pratico

Para rodar o projeto com segurança, use o `config.sql` como ponto de partida, mas confira também:

- extensões
- enums customizados
- buckets de storage
- policies/RLS

## Buckets recomendados no Supabase Storage

Crie manualmente os buckets:

- `avatars`
- `service_images`

Os dois podem ser públicos se você quiser exibir as imagens diretamente por URL pública.

## Executando o projeto

Modo desenvolvimento:

```bash
npm run dev
```

O projeto ficará disponível em:

```text
http://localhost:3000
```

## Script de execução

```bash
npm run dev
```

Inicia o projeto em modo de desenvolvimento.

## Fluxos principais do sistema

### Cliente

- Login e edicao de perfil
- Visualizacao de prestadores
- Escolha de serviços
- Criacao de solicitações
- Acompanhamento dos pedidos

### Prestador

- Login e edicao de perfil
- Cadastro e gestao de serviços
- Upload de imagem dos serviços
- Aceite e recusa de solicitações

### Super admin

- Login em `/login/admin`
- Painel em `/admin`
- Alteração e exclusão de clientes
- Alteração e exclusão de prestadores
- Alteração e exclusão de serviços

## Observações importantes

- O arquivo `.env.local` não deve ser versionado.
- Usuarios com `role = "admin"` devem ser criados **diretamente** no banco de dados.
- O login de admin não possui tela de registro.
- Para recursos administrativos completos, a variável `SUPABASE_SERVICE_ROLE_KEY` precisa estar corretamente configurada.

## Estrutura esperada do Supabase

O projeto depende de tabelas e recursos como:

- `profiles`
- `professionals`
- `services`
- `categories`
- `calendar`
- buckets de storage:
  - `avatars`
  - `service_images`

## Créditos da equipe

- Renan Cesar: frontend
- Vinicius Lobo: rota de admin
- Pedro Henrique: autenticação
- Joel Junior: banco de dados
- Rafael Rezende: validação de dados
