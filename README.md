# Magista RPG

Fichas, chat e rolagens em tempo real da mesa Magista.

## Rodando localmente

Requisitos: Node 24 (`nvm use`), Docker.

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env      # preencha JWT_SECRET e as senhas do seed
cp apps/web/.env.example apps/web/.env.local
npm install
npm run db:up
npm run db:migrate
npm run db:seed
npm run dev                                  # web http://localhost:3000 · api http://localhost:3333
```

Arquitetura, regras de código e domínio: [`CLAUDE.md`](CLAUDE.md) e [`docs/`](docs).
