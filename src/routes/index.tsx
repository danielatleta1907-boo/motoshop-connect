import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SubscribeDialog } from "@/components/SubscribeDialog";
import { useAuth } from "@/hooks/useAuth";
import {
  Bike, BarChart3, Camera, MapPin, ShieldCheck, Smartphone, MessageSquare,
  Check, Sparkles, QrCode, RefreshCw, LogIn,
} from "lucide-react";
import { PLAN_PRICE } from "@/lib/pix";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MotoStore SaaS — Sistema completo para concessionárias de motos" },
      { name: "description", content: "Plataforma profissional para lojas de motos: catálogo online, vendas, comprovantes, dashboard financeiro e WhatsApp integrado. R$ 65,90/mês." },
      { property: "og:title", content: "MotoStore SaaS — Sistema completo para concessionárias" },
      { property: "og:description", content: "Catálogo online, vendas, dashboard e WhatsApp integrado para sua loja de motos. R$ 65,90/mês." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [subOpen, setSubOpen] = useState(false);
  const [renewOpen, setRenewOpen] = useState(false);
  const { user, tenant } = useAuth();
  const navigate = useNavigate();

  function clickSubscribe() {
    if (!user) {
      navigate({ to: "/auth", search: { plan: "1" } as any });
      return;
    }
    setSubOpen(true);
  }

  function clickRenew() {
    if (!user) {
      navigate({ to: "/auth", search: { recover: "1" } as any });
      return;
    }
    setRenewOpen(true);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid size-10 place-items-center rounded-lg bg-brand text-primary-foreground font-black">M</div>
            <div className="leading-tight">
              <div className="text-base font-bold">MotoStore</div>
              <div className="text-[10px] uppercase tracking-widest text-primary">SaaS</div>
            </div>
          </Link>
          <nav className="hidden gap-6 text-sm text-muted-foreground md:flex">
            <a href="#recursos" className="hover:text-foreground">Recursos</a>
            <a href="#preco" className="hover:text-foreground">Plano</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Link to={tenant ? "/admin" : "/admin"}>
                <Button variant="outline" size="sm">Painel</Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button variant="outline" size="sm"><LogIn className="mr-2 size-4" />Entrar</Button>
              </Link>
            )}
            <Button onClick={clickSubscribe} size="sm" className="bg-brand text-primary-foreground hover:opacity-90">
              <Sparkles className="mr-2 size-4" /> Assinar
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-hero text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 md:grid-cols-2 md:py-28">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wider uppercase">
              <Sparkles className="size-3.5" /> Sistema profissional para concessionárias
            </div>
            <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">
              Sua loja de motos no <span className="text-primary-foreground/90 underline decoration-primary decoration-4 underline-offset-4">próximo nível</span>.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/85">
              Catálogo online com fotos, parcelamento, dashboard de vendas, controle de comprovantes e contato direto via WhatsApp — tudo em uma plataforma feita para vender mais motos.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button size="lg" onClick={clickSubscribe} className="bg-white text-graphite hover:bg-white/90">
                <Sparkles className="mr-2 size-5" /> Assinar por R$ {PLAN_PRICE.toFixed(2).replace(".", ",")}/mês
              </Button>
              <Button size="lg" variant="outline" onClick={clickRenew} className="border-white/30 bg-white/10 text-white hover:bg-white/20">
                <RefreshCw className="mr-2 size-5" /> Recuperar conta
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-white/70">
              <span className="flex items-center gap-1.5"><Check className="size-3.5 text-primary" /> Sem fidelidade</span>
              <span className="flex items-center gap-1.5"><Check className="size-3.5 text-primary" /> Pagamento PIX</span>
              <span className="flex items-center gap-1.5"><Check className="size-3.5 text-primary" /> Suporte humano</span>
            </div>
          </div>
          <div className="relative hidden md:block">
            <div className="absolute -inset-6 rounded-3xl bg-primary/30 blur-3xl" />
            <div className="relative rounded-2xl border border-white/20 bg-white/5 p-6 backdrop-blur">
              <MockDashboard />
            </div>
          </div>
        </div>
      </section>

      {/* Recursos */}
      <section id="recursos" className="mx-auto max-w-7xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary">Recursos</div>
          <h2 className="mt-2 text-3xl font-extrabold md:text-4xl">Tudo o que sua loja precisa</h2>
          <p className="mt-3 text-muted-foreground">Funcionalidades pensadas para o dia a dia de quem vende motos.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Feature icon={<Bike />} title="Catálogo completo" desc="Marca, ano, modelo, KM, cor, preço à vista e parcelado com várias fotos." />
          <Feature icon={<Camera />} title="Fotos ilimitadas" desc="Galeria por moto, com capa e ordem personalizada." />
          <Feature icon={<MessageSquare />} title="Encomenda + WhatsApp" desc="Cliente envia interesse pelo site ou clica direto pro seu WhatsApp." />
          <Feature icon={<BarChart3 />} title="Dashboard financeiro" desc="Faturamento, lucro, margem e ticket médio com gráficos por mês." />
          <Feature icon={<MapPin />} title="Mapa da loja" desc="Localização integrada, horários e contato em todas as páginas." />
          <Feature icon={<ShieldCheck />} title="Comprovantes e NF" desc="Anexe fotos ou PDFs de comprovantes de venda e notas fiscais." />
          <Feature icon={<Smartphone />} title="Mobile-first" desc="Interface responsiva: cliente compra do celular, você vende do celular." />
          <Feature icon={<QrCode />} title="URL própria" desc="Sua loja em /loja/sualoja — compartilhe no Instagram, status, story." />
          <Feature icon={<Sparkles />} title="Personalização" desc="Logo, frase motivadora, cores e dados de contato no seu jeito." />
        </div>
      </section>

      {/* Preço */}
      <section id="preco" className="bg-secondary text-secondary-foreground">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary">Plano único</div>
          <h2 className="mt-2 text-3xl font-extrabold md:text-4xl">Simples e direto</h2>
          <p className="mt-3 opacity-80">Tudo incluído. Sem taxas escondidas, sem limite de motos.</p>

          <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <div className="text-sm font-semibold uppercase tracking-widest opacity-70">Mensal</div>
            <div className="mt-2 flex items-end justify-center gap-1">
              <span className="text-5xl font-extrabold">R$ {PLAN_PRICE.toFixed(2).replace(".", ",")}</span>
              <span className="pb-2 opacity-70">/mês</span>
            </div>
            <ul className="mx-auto mt-6 max-w-xs space-y-2 text-left text-sm">
              {[
                "Motos e fotos ilimitadas",
                "Dashboard de vendas e lucro",
                "URL pública /loja/sualoja",
                "Comprovantes e notas fiscais",
                "WhatsApp e mapa integrados",
                "Suporte por WhatsApp",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2"><Check className="size-4 text-primary" /> {t}</li>
              ))}
            </ul>
            <Button size="lg" className="mt-8 w-full bg-brand text-primary-foreground hover:opacity-90" onClick={clickSubscribe}>
              <Sparkles className="mr-2 size-5" /> Assinar agora
            </Button>
            <p className="mt-3 text-xs opacity-60">Pagamento via PIX · Aprovação rápida do super admin</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-20">
        <h2 className="text-3xl font-extrabold md:text-4xl">Perguntas frequentes</h2>
        <div className="mt-8 space-y-4">
          {[
            ["Como funciona o pagamento?", "Você paga R$ 65,90 via PIX (QR code ou chave aleatória), envia o comprovante pelo sistema e em poucas horas o super admin aprova sua conta."],
            ["O que acontece se eu atrasar?", "Você tem 3 dias de tolerância após o vencimento. Depois disso a loja é suspensa automaticamente. Para reativar, use o botão 'Recuperar conta'."],
            ["Posso ter mais de uma loja?", "Cada conta tem uma loja. Para gerenciar outra, basta criar uma nova conta."],
            ["Meus dados ficam isolados?", "Sim. Cada loja tem seu próprio banco de dados, ninguém consegue acessar suas motos, vendas ou comprovantes."],
            ["Posso cancelar quando quiser?", "Sim. Basta parar de renovar — a loja é suspensa após o vencimento, sem multas."],
          ].map(([q, a]) => (
            <details key={q} className="group rounded-xl border border-border bg-card p-5 open:shadow-soft">
              <summary className="cursor-pointer list-none text-base font-semibold">
                {q} <span className="float-right text-primary transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-secondary text-secondary-foreground">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-8 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-md bg-brand text-primary-foreground font-black">M</div>
            <span className="font-bold">MotoStore SaaS</span>
          </div>
          <div className="flex flex-col items-center gap-1 md:flex-row md:gap-4">
            <p className="text-xs opacity-60">© {new Date().getFullYear()} MotoStore. Todos os direitos reservados.</p>
            <a
              href="mailto:danielatleta1907@gmail.com?subject=Preciso%20de%20um%20software&body=Ol%C3%A1%20Daniel%2C%20gostaria%20de%20conversar%20sobre%20o%20desenvolvimento%20de%20um%20software."
              onClick={(e) => {
                if (!confirm("Precisa de um software sob medida? Vamos entrar em contato pelo e-mail danielatleta1907@gmail.com?")) {
                  e.preventDefault();
                }
              }}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Desenvolvedor
            </a>
          </div>
        </div>
      </footer>

      <SubscribeDialog open={subOpen} onOpenChange={setSubOpen} mode="new" />
      <SubscribeDialog open={renewOpen} onOpenChange={setRenewOpen} mode="renew" tenantName={tenant?.store_name} />
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-elegant">
      <div className="grid size-11 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</div>
      <h3 className="mt-4 text-lg font-bold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function MockDashboard() {
  return (
    <div className="space-y-3 text-graphite">
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold text-white/80">Painel · Moto Center</div>
        <div className="flex gap-1">{[1,2,3].map(i=> <div key={i} className="size-2 rounded-full bg-white/30" />)}</div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[["Vendas","R$ 84k"],["Lucro","R$ 21k"],["Motos","37"]].map(([l,v]) => (
          <div key={l} className="rounded-lg bg-white p-3">
            <div className="text-[10px] uppercase text-graphite/60">{l}</div>
            <div className="text-base font-extrabold">{v}</div>
          </div>
        ))}
      </div>
      <div className="rounded-lg bg-white p-3">
        <div className="text-[10px] uppercase text-graphite/60">Vendas/mês</div>
        <div className="mt-2 flex h-20 items-end gap-1">
          {[40,55,32,70,90,65,80,95,72,88,100,78].map((h,i)=> (
            <div key={i} className="flex-1 rounded-t bg-primary/80" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
