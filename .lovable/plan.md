
# Plano: MotoStore SaaS

Esta é uma mudança grande de arquitetura. Hoje o sistema tem **uma loja única**; vai virar **plataforma multi-loja** onde cada lojista paga R$65,90/mês e tem painel próprio. Abaixo, o que vou construir.

## Visão geral

```text
                       ┌─────────────────────────┐
                       │  SUPER ADMIN (você)     │
                       │  - aprova cadastros     │
                       │  - confirma pagamentos  │
                       │  - vê todas as lojas    │
                       └────────────┬────────────┘
                                    │ aprova
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
   ┌─────────┐                ┌─────────┐                ┌─────────┐
   │ Loja A  │                │ Loja B  │                │ Loja C  │
   │/loja/a  │                │/loja/b  │                │/loja/c  │
   └─────────┘                └─────────┘                └─────────┘
   (motos, vendas, comprovantes — totalmente isolado por owner_id)
```

## Páginas novas

1. **`/` — Landing comercial** (substitui a vitrine atual da home)
   - Apresentação do software, recursos, screenshots
   - Preço: **R$ 65,90/mês**
   - Botão **"Assinar agora"** → modal com QR Code PIX + chave copia-e-cola (`5e5c677c-9e21-4240-91d4-026263bdbac6`) + upload do comprovante
   - Botão **"Recuperar conta (atraso de pagamento)"** → login + novo pagamento → reativa
   - Botão **"Pagamento adiantado"** (para quem já é cliente) → mesmo fluxo PIX
2. **`/loja/$slug`** — vitrine pública de cada lojista (substitui a `/` atual com filtro por owner)
3. **`/loja/$slug/motos/$id`** — detalhe da moto
4. **`/auth`** — agora exige aprovação após cadastro
5. **`/admin`** — painel do lojista (filtrado pelo `owner_id` dele)
6. **`/super-admin`** — painel só seu: aprovar cadastros, confirmar pagamentos, suspender, ver todas as assinaturas

## Fluxo do cliente novo

1. Vê a landing → clica em **Assinar**
2. Paga via PIX e envia comprovante
3. Cria conta (email/senha) e escolhe slug da loja
4. Status fica **"aguardando aprovação"**
5. Você recebe no `/super-admin`, valida o comprovante, **aprova**
6. Lojista entra no `/admin`, cadastra motos, vende
7. Se não pagar até 3 dias após vencimento → conta **suspensa automaticamente** (cron diário)
8. Pode reativar pelo botão "Recuperar conta" na landing

## Banco de dados (mudanças)

Tabelas novas:
- `tenants` — uma linha por loja: `owner_id`, `slug`, `status` (pending/active/suspended/cancelled), `subscription_due_date`
- `subscriptions` — histórico de cobranças mensais
- `payment_proofs` — comprovantes PIX enviados (arquivo + valor + status pending/approved/rejected)

Tabelas existentes ganham `tenant_id`:
- `motorcycles`, `orders`, `payment_receipts`, `store_settings`, `motorcycle_photos`

RLS reescrita: cada admin só enxerga linhas do seu `tenant_id`. Super admin vê tudo via `has_role('super_admin')`.

## Confirmação de pagamento PIX

Você escolheu **gateway (Mercado Pago)**. Para gerar QR Code dinâmico e confirmar pagamento automaticamente preciso de um **Access Token do Mercado Pago** (vou pedir no próximo passo via secret).

**Importante:** A chave PIX estática `5e5c677c-...` **não permite confirmação automática** sozinha — é só uma string identificadora. Para automação real preciso do token do Mercado Pago (gratuito, criado em mercadopago.com.br/developers). Enquanto não me passar o token, vou implementar com **upload manual de comprovante + aprovação sua no super-admin** como fallback — assim o sistema funciona desde já e a automação entra depois sem refazer telas.

## Cron de suspensão

Job diário (`pg_cron`) que verifica `subscription_due_date + 3 dias < hoje` e marca tenant como `suspended`. Lojas suspensas: `/loja/$slug` mostra "Loja temporariamente indisponível" e `/admin` redireciona pra tela de recuperação.

## Detalhes técnicos

- Roles: nova role `super_admin` adicionada ao enum `app_role` (o primeiro cadastrado vira super_admin; demais viram admin do próprio tenant após aprovação).
- Aprovação cancela o "dispositivo": rejeição = `auth.users` deletado, login não funciona mais.
- Slug único por tenant, validado no cadastro.
- Server functions com `requireSupabaseAuth` + check de role pra operações sensíveis (aprovar, suspender).
- QR Code PIX gerado client-side com `qrcode` (já que a chave é fixa) — pra Mercado Pago, gerado server-side via API.
- Header da landing com badge "Sistema profissional para concessionárias".

## Ordem de execução

1. Migration (tenants, subscriptions, payment_proofs, super_admin role, RLS reescrita)
2. Landing comercial nova em `/`
3. Modal de pagamento PIX + upload comprovante
4. Página `/super-admin` (aprovar cadastros + pagamentos)
5. Refatorar `/admin` pra filtrar por tenant + tela de "conta suspensa"
6. Mover vitrine pública pra `/loja/$slug`
7. Cron de suspensão automática
8. Fluxo de recuperação na landing

## Antes de começar

- Confirma que posso **apagar todas as contas existentes** (super admin atual incluso) pra você ser o primeiro a se cadastrar e virar super_admin?
- Você tem ou pretende criar conta no **Mercado Pago** pra automação de PIX? Se sim, eu peço o token quando chegar nessa etapa. Se não, fica só com aprovação manual (também funciona bem).
