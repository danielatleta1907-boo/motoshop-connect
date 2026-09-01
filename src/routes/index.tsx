import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  Shirt, BarChart3, Camera, MapPin, ShieldCheck, Smartphone, MessageSquare,
  Check, Sparkles, QrCode, Gift, LogIn, Store,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Moda & Estilo — Vitrine online gratuita para lojas de roupas" },
      { name: "description", content: "Monte a vitrine da sua loja de roupas: catálogo com fotos, tamanhos, brindes, retirada no local, mapa e WhatsApp integrado. Uso 100% gratuito." },
      { property: "og:title", content: "Moda & Estilo — Vitrine online gratuita para lojas de roupas" },
      { property: "og:description", content: "Catálogo de peças, painel de vendas, mapa e WhatsApp para a sua loja de roupas. Grátis." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, tenant } = useAuth();
  const navigate = useNavigate();

  function clickStart() {
    navigate({ to: user ? "/admin" : "/auth" });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid size-10 place-items-center rounded-lg bg-brand text-primary-foreground font-black text-sm">ME</div>
            <div className="leading-tight">
              <div className="text-base font-bold">Moda & Estilo</div>
              <div className="text-[10px] uppercase tracking-widest text-primary">Vitrine de moda</div>
            </div>
          </Link>
          <nav className="hidden gap-6 text-sm text-muted-foreground md:flex">
            <a href="#recursos" className="hover:text-foreground">Recursos</a>
            <a href="#gratis" className="hover:text-foreground">Grátis</a>
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
            <Button onClick={clickStart} size="sm" className="bg-brand text-primary-foreground hover:opacity-90">
              <Sparkles className="mr-2 size-4" /> Criar minha loja
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-hero text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 md:grid-cols-2 md:py-28">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wider uppercase">
              <Sparkles className="size-3.5" /> Vitrine digital para lojas de roupas
            </div>
            <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">
              Sua moda merece uma <span className="underline decoration-primary decoration-4 underline-offset-4">vitrine linda</span>.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/85">
              Cadastre vestidos, shorts, blusas e conjuntos com fotos, tamanhos, cores e brindes. O cliente escolhe online,
              conversa no WhatsApp e retira na sua loja.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button size="lg" onClick={clickStart} className="bg-white text-graphite hover:bg-white/90">
                <Store className="mr-2 size-5" /> Criar minha loja grátis
              </Button>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
                  <LogIn className="mr-2 size-5" /> Já tenho conta
                </Button>
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-white/70">
              <span className="flex items-center gap-1.5"><Check className="size-3.5" /> 100% gratuito</span>
              <span className="flex items-center gap-1.5"><Check className="size-3.5" /> Sem cartão de crédito</span>
              <span className="flex items-center gap-1.5"><Check className="size-3.5" /> Retirada no local</span>
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
          <h2 className="mt-2 text-3xl font-extrabold md:text-4xl">Tudo o que sua loja de roupas precisa</h2>
          <p className="mt-3 text-muted-foreground">Feito para quem vende moda no dia a dia.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Feature icon={<Shirt />} title="Catálogo de peças" desc="Tipo da peça, tamanho, cor, tecido, gênero e preços à vista e parcelado." />
          <Feature icon={<Camera />} title="Fotos ilimitadas" desc="Galeria por peça, com capa e ordem personalizada." />
          <Feature icon={<Gift />} title="Brindes" desc="Informe se a peça vem com brinde e destaque isso na vitrine." />
          <Feature icon={<MessageSquare />} title="Encomenda + WhatsApp" desc="Cliente envia interesse pelo site ou fala direto no seu WhatsApp." />
          <Feature icon={<BarChart3 />} title="Painel financeiro" desc="Faturamento, lucro, margem e ticket médio com gráficos por mês." />
          <Feature icon={<MapPin />} title="Retirada no local" desc="Mapa, endereço e horário de funcionamento em todas as páginas." />
          <Feature icon={<ShieldCheck />} title="Comprovantes e NF" desc="Anexe fotos ou PDFs de comprovantes de venda e notas fiscais." />
          <Feature icon={<Smartphone />} title="Mobile-first" desc="A cliente compra do celular e você gerencia do celular." />
          <Feature icon={<QrCode />} title="URL própria" desc="Sua loja em /loja/sualoja — compartilhe no Instagram, status e story." />
        </div>
      </section>

      {/* Grátis */}
      <section id="gratis" className="bg-secondary text-secondary-foreground">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary">Acesso</div>
          <h2 className="mt-2 text-3xl font-extrabold md:text-4xl">Totalmente gratuito</h2>
          <p className="mt-3 opacity-80">Sem mensalidade, sem taxa e sem limite de peças. Basta a liberação do administrador.</p>

          <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <div className="text-sm font-semibold uppercase tracking-widest opacity-70">Plano único</div>
            <div className="mt-2 text-5xl font-extrabold">R$ 0</div>
            <ul className="mx-auto mt-6 max-w-xs space-y-2 text-left text-sm">
              {[
                "Peças e fotos ilimitadas",
                "Painel de vendas e lucro",
                "URL pública /loja/sualoja",
                "Comprovantes e notas fiscais",
                "WhatsApp e mapa integrados",
                "Cores e logo personalizáveis",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2"><Check className="size-4 text-primary" /> {t}</li>
              ))}
            </ul>
            <Button size="lg" className="mt-8 w-full bg-brand text-primary-foreground hover:opacity-90" onClick={clickStart}>
              <Sparkles className="mr-2 size-5" /> Quero minha loja
            </Button>
            <p className="mt-3 text-xs opacity-60">Liberação imediata — criou a conta, a loja já é sua</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-20">
        <h2 className="text-3xl font-extrabold md:text-4xl">Perguntas frequentes</h2>
        <div className="mt-8 space-y-4">
          {[
            ["Quanto custa?", "Nada. O Moda & Estilo é gratuito. Basta criar sua conta e a loja já fica disponível na hora."],
            ["Como funciona a liberação?", "Não existe espera: você cria a conta com e-mail e senha e já entra no painel da sua loja."],
            ["Como o cliente compra?", "Ele escolhe a peça na vitrine, envia a encomenda ou chama no WhatsApp e retira no local combinado com a loja."],
            ["Posso mudar as cores e a logo?", "Sim. No painel da loja você edita logo, frase, cores (inclusive degradê), endereço, horários e WhatsApp."],
            ["Meus dados ficam isolados?", "Sim. Cada loja só acessa suas próprias peças, vendas e comprovantes."],
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
            <div className="grid size-9 place-items-center rounded-md bg-brand text-primary-foreground font-black text-xs">ME</div>
            <span className="font-bold">Moda & Estilo</span>
          </div>
          <div className="flex flex-col items-center gap-1 md:flex-row md:gap-4">
            <p className="text-xs opacity-60">© {new Date().getFullYear()} Moda & Estilo. Todos os direitos reservados.</p>
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
        <div className="text-xs font-bold text-white/80">Painel · Ateliê Bella</div>
        <div className="flex gap-1">{[1,2,3].map(i=> <div key={i} className="size-2 rounded-full bg-white/30" />)}</div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[["Vendas","R$ 12k"],["Lucro","R$ 5k"],["Peças","84"]].map(([l,v]) => (
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
