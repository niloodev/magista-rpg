# Produção no PC do Mestre

A mesa roda no PC do Mestre, só quando ele quer, exposta pelo túnel HTTPS do playit.gg. Tudo roda no Docker, com dados próprios: o banco e as imagens de produção ficam em volumes separados dos de desenvolvimento, então o seed e o e2e nunca tocam nas fichas reais.

```
navegador --https--> playit.gg (repassa o TLS cru) --> agente do playit (container, rede do host) --> 127.0.0.1:443 Caddy (certificado Let's Encrypt)
                                           /api/*  (sem o /api) -> api:3333 (HTTP, /api/media e o socket em /api/socket.io)
                                           resto                -> web:3000 (Next standalone)
api -> db (Postgres 17) e storage (SeaweedFS), na rede interna do compose
```

- **Origem única:** site e API ficam no mesmo endereço do túnel. A API fica atrás do prefixo `/api`, porque ela tem `/arena` e a web também.
- **Build sem domínio:** a web é compilada com `NEXT_PUBLIC_API_URL=/api`, então trocar o domínio do túnel é só mudar o `WEB_ORIGIN` no `.env.production`.
- **HTTPS:** o playit não termina o TLS: o túnel HTTPS repassa a conexão criptografada crua. Quem termina é o Caddy, com um certificado Let's Encrypt do `SITE_DOMAIN`, emitido e renovado sozinho pelo desafio TLS-ALPN (que passa pelo próprio túnel na 443, sem precisar da porta 80) e guardado no volume `caddy-data`. O cookie de sessão é `Secure` (a API não sobe em produção sem isso), então o acesso é sempre pelo `https://`; o `http://` do domínio não existe.
- **Portas:** o Caddy, o banco e o storage só escutam no `127.0.0.1` do PC. O banco e o storage ficam abertos ali para o backup e os comandos.

Arquivos: `docker-compose.prod.yml` (projeto `magista-prod`, com o agente do playit), `apps/api/Dockerfile`, `apps/web/Dockerfile`, `deploy/Caddyfile`, `scripts/prod/*.sh` e `.env.production` (gitignored, criado pelo `prod:init`).

## Primeira vez

Precisa de Docker com Compose, `openssl` e o Node 24 (`nvm use`) para os comandos de linha.

1. **Criar o env:** `npm run prod:init -- https://<endereço-do-túnel>` cria o `.env.production` com senhas e segredos aleatórios. Guarde uma cópia dele junto dos backups: sem ele, o banco restaurado não abre.
2. **Túnel:** no painel do playit, crie um agente do tipo Docker e ponha a chave dele em `PLAYIT_SECRET_KEY` no `.env.production` (o agente roda como o serviço `playit` do compose, com a rede do host, e liga e desliga junto com a mesa). O túnel HTTPS do domínio aponta para esse agente, em `127.0.0.1` com HTTP `80` e HTTPS `443` (`PROD_HTTP_PORT` e `PROD_HTTPS_PORT`). O agente do Windows não serve: ele não alcança as portas que o WSL repassa. Na primeira subida o Caddy pede o certificado assim que o túnel responde (`npm run prod:logs -- caddy` mostra "certificate obtained successfully"); o HTTP do domínio redireciona para o HTTPS.
3. **Subir:** `npm run prod:up` compila as imagens, aplica as migrações e sobe tudo. Termina dizendo "Mesa no ar".
4. **Conta do Mestre:** `npm run prod:cli -- account:create-gm "Mestre"` mostra a senha gerada uma vez só.
5. **Importar o Roll20:**
   - Fichas e contas: `npm run prod:cli -- import:roll20 "<pasta 002 - Players>"`, que mostra as senhas das contas.
   - Mapas: `npm run prod:cli -- import:roll20-pages "<pasta pages>"`.
6. **Entrar:** abra o endereço do túnel e entre com a conta do Mestre.

## Dia a dia

| Comando                                      | O que faz                                                                                                                                                 |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run prod:up`                            | Liga a mesa (e recompila se o código mudou)                                                                                                               |
| `npm run prod:down`                          | Desliga a mesa. Os dados ficam nos volumes                                                                                                                |
| `npm run prod:status` · `npm run prod:logs`  | Estado dos containers · logs ao vivo (`npm run prod:logs -- api` só da API)                                                                               |
| `npm run prod:backup`                        | Banco (`db.dump`) e imagens (`storage/`) numa pasta datada em `BACKUP_DIR` (padrão `backups/`), guardando as `BACKUP_KEEP` mais novas                     |
| `npm run prod:restore -- <pasta>`            | Substitui tudo pelo backup, pedindo confirmação                                                                                                           |
| `npm run prod:update`                        | Sobe a versão do app (os aparelhos baixam os assets de novo), faz backup se a mesa estiver ligada, recompila e reinicia                                   |
| `npm run prod:cli -- <comando> [argumentos]` | Roda um comando da API contra a produção: `account:create-gm`, `account:password`, `import:roll20`, `import:roll20-pages`, `media:assets`, `storage:dump` |

Os containers usam `restart: unless-stopped`: desligados pelo `prod:down`, ficam desligados. Se o Docker ou o PC reiniciarem com a mesa ligada, ela volta sozinha. Para que ela volte depois de reiniciar o PC, o Docker precisa iniciar com o sistema.

Para o `BACKUP_DIR` ficar fora do WSL (outro disco, uma pasta sincronizada), use um caminho como `/mnt/d/Magista/backups`.

## IP real e `TRUST_PROXY`

Como o playit repassa o TLS cru, ele não consegue acrescentar o `X-Forwarded-For`: para o Caddy, toda conexão vem do agente do playit. Então `TRUST_PROXY=1` (a API confia só no Caddy, que descarta qualquer `X-Forwarded-For` vindo de fora) e todos os jogadores aparecem com o mesmo IP, dividindo os limites de tentativas de login (30 falhas por IP a cada 15 min) e o limite geral de 600 requisições por minuto por IP. Para a mesa isso é aceitável; se aparecer "Muitas tentativas" durante a sessão, o caminho é ligar o PROXY protocol no túnel (se o plano do playit oferecer) e o `proxy_protocol` no Caddy, ou ajustar o limite geral.
