# 🎨 DESIGN SYSTEM — BASE TRÁFEGO COMMAND

> Glass Future Dark · Versão 1.0
> Estilo: nível Vercel Dashboard + Linear + Arc + Stripe

---

## 1. FILOSOFIA DE DESIGN

```
🎯 PRINCÍPIOS NORTEADORES

1. DENSIDADE COM RESPIRO
   Plataforma de operação séria, mas não cansativa.
   Whitespace generoso entre seções. Densidade dentro de cards.

2. GLASS QUE NÃO POLUI
   Backdrop-blur usado com PROPÓSITO (não em tudo).
   Hierarquia visual via translucência sutil.
   Bordas finas, sem sombras pesadas.

3. MOTION INTENCIONAL
   Toda animação tem MOTIVO (feedback, hierarquia, transição).
   Easing físico (não linear). Duração 200-600ms.
   Reduced-motion respeitado.

4. NÚMEROS COMO HEROES
   Métricas grandes em Geist Mono.
   Tabular-nums sempre.
   Tipografia variável pra hierarquia.

5. DARK BY DEFAULT
   Light mode existe mas é exceção.
   Dark é onde a marca brilha.
```

---

## 2. PALETA DE CORES

### 2.1 Cores Base

```css
/* BACKGROUNDS — Camadas de profundidade */
--bg-deepest:     #050505;  /* Camada mais profunda */
--bg-base:        #0A0A0B;  /* Body background */
--bg-surface:     #111113;  /* Cards primários */
--bg-elevated:    #1A1A1D;  /* Cards elevados (modals) */
--bg-overlay:     #222226;  /* Hover states */

/* GLASS LAYERS */
--glass-thin:     rgba(255, 255, 255, 0.02);
--glass-light:    rgba(255, 255, 255, 0.04);
--glass-medium:   rgba(255, 255, 255, 0.06);
--glass-heavy:    rgba(255, 255, 255, 0.08);

/* BORDERS */
--border-subtle:  rgba(255, 255, 255, 0.06);
--border-default: rgba(255, 255, 255, 0.08);
--border-strong:  rgba(255, 255, 255, 0.12);
--border-glow:    rgba(61, 90, 254, 0.4);

/* TEXTO */
--text-primary:   #FAFAFA;
--text-secondary: #A1A1AA;
--text-tertiary:  #71717A;
--text-muted:     #52525B;
--text-disabled:  #3F3F46;
```

### 2.2 Cores Semânticas

```css
/* BRAND PRIMARY — Azul elétrico BASE */
--brand-50:       #EEF1FF;
--brand-100:      #DDE3FF;
--brand-200:      #C0CCFF;
--brand-300:      #9DAEFF;
--brand-400:      #7A8DFF;
--brand-500:      #3D5AFE;  /* Principal */
--brand-600:      #2E47DB;
--brand-700:      #1F36B8;
--brand-800:      #102595;
--brand-900:      #061472;
--brand-glow:     #3D5AFE40;

/* SUCCESS */
--success-bg:     #052E1B;
--success-border: #115C36;
--success-text:   #4ADE80;
--success-glow:   #4ADE8040;

/* WARNING */
--warning-bg:     #2E1F05;
--warning-border: #5C3A11;
--warning-text:   #FBBF24;
--warning-glow:   #FBBF2440;

/* DANGER */
--danger-bg:      #2E0511;
--danger-border:  #5C112A;
--danger-text:    #F87171;
--danger-glow:    #F8717140;

/* INFO */
--info-bg:        #051D2E;
--info-border:    #11405C;
--info-text:      #38BDF8;
--info-glow:      #38BDF840;
```

### 2.3 Cores Especiais

```css
/* GRADIENTS PRINCIPAIS */
--gradient-brand: linear-gradient(135deg, #3D5AFE 0%, #7A8DFF 100%);
--gradient-glass: linear-gradient(180deg, 
  rgba(255,255,255,0.08) 0%, 
  rgba(255,255,255,0.02) 100%);
--gradient-radial: radial-gradient(
  circle at 50% 0%, 
  rgba(61,90,254,0.15) 0%, 
  transparent 50%);

/* AURA/GLOW EFFECTS */
--aura-brand: 
  0 0 0 1px rgba(61,90,254,0.3),
  0 0 20px rgba(61,90,254,0.15),
  0 0 40px rgba(61,90,254,0.05);

--aura-success:
  0 0 0 1px rgba(74,222,128,0.3),
  0 0 20px rgba(74,222,128,0.15);
```

### 2.4 Mapeamento Tailwind v4 (CSS Variables)

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  --color-bg-deepest: #050505;
  --color-bg-base: #0A0A0B;
  --color-bg-surface: #111113;
  --color-bg-elevated: #1A1A1D;
  --color-bg-overlay: #222226;
  
  --color-glass-thin: rgba(255, 255, 255, 0.02);
  --color-glass-light: rgba(255, 255, 255, 0.04);
  --color-glass-medium: rgba(255, 255, 255, 0.06);
  --color-glass-heavy: rgba(255, 255, 255, 0.08);
  
  --color-border-subtle: rgba(255, 255, 255, 0.06);
  --color-border-default: rgba(255, 255, 255, 0.08);
  --color-border-strong: rgba(255, 255, 255, 0.12);
  
  --color-brand-500: #3D5AFE;
  --color-brand-600: #2E47DB;
  
  --color-text-primary: #FAFAFA;
  --color-text-secondary: #A1A1AA;
  --color-text-tertiary: #71717A;
  --color-text-muted: #52525B;
  
  /* Tipografia */
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "Geist Mono", "JetBrains Mono", monospace;
  --font-display: "Fraunces", "Inter", serif;
  
  /* Tracking */
  --tracking-tightest: -0.05em;
  --tracking-tighter: -0.03em;
  --tracking-tight: -0.02em;
  --tracking-normal: 0;
  --tracking-wide: 0.025em;
  --tracking-label: 0.18em;
  
  /* Easings */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out-quart: cubic-bezier(0.76, 0, 0.24, 1);
  --ease-back-out: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

---

## 3. TIPOGRAFIA

### 3.1 Famílias

```
INTER (UI)
└─ Pesos: 300, 400, 500, 600, 700
└─ Use: tudo de UI, body text, headings curtos

GEIST MONO (Numbers + Code)
└─ Pesos: 400, 500, 700
└─ Use: métricas, números grandes, labels uppercase, código
└─ Settings: tabular-nums sempre

FRAUNCES (Editorial Accents)
└─ Pesos: 400, 500, 600
└─ Use: headlines especiais (raro)
└─ Optical size: 144 (display)
└─ Italic em palavras-chave
```

### 3.2 Type Scale

```css
/* DISPLAY — Heroes e títulos massivos */
.text-display-xl {  /* 96px / 100 / -0.05em */
  font-size: clamp(4rem, 8vw, 6rem);
  line-height: 1;
  letter-spacing: -0.05em;
  font-weight: 600;
}

.text-display-lg {  /* 72px */
  font-size: clamp(3rem, 6vw, 4.5rem);
  line-height: 1.05;
  letter-spacing: -0.04em;
  font-weight: 600;
}

.text-display-md {  /* 56px */
  font-size: clamp(2.5rem, 5vw, 3.5rem);
  line-height: 1.1;
  letter-spacing: -0.04em;
  font-weight: 600;
}

/* HEADINGS — Títulos de seção */
.text-h1 {          /* 36px */
  font-size: 2.25rem;
  line-height: 1.15;
  letter-spacing: -0.03em;
  font-weight: 600;
}

.text-h2 {          /* 28px */
  font-size: 1.75rem;
  line-height: 1.2;
  letter-spacing: -0.025em;
  font-weight: 600;
}

.text-h3 {          /* 22px */
  font-size: 1.375rem;
  line-height: 1.25;
  letter-spacing: -0.02em;
  font-weight: 600;
}

.text-h4 {          /* 18px */
  font-size: 1.125rem;
  line-height: 1.3;
  letter-spacing: -0.015em;
  font-weight: 600;
}

/* BODY */
.text-body-lg {     /* 17px */
  font-size: 1.0625rem;
  line-height: 1.55;
  letter-spacing: -0.005em;
  font-weight: 400;
}

.text-body {        /* 15px */
  font-size: 0.9375rem;
  line-height: 1.55;
  font-weight: 400;
}

.text-body-sm {     /* 13px */
  font-size: 0.8125rem;
  line-height: 1.5;
  font-weight: 400;
}

/* LABEL — Mono uppercase */
.text-label {       /* 11px */
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  line-height: 1.2;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-weight: 500;
  color: var(--color-text-tertiary);
}

.text-label-lg {    /* 13px */
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  line-height: 1.2;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 500;
}

/* METRIC — Para números grandes */
.text-metric-xl {   /* 64px */
  font-family: var(--font-mono);
  font-size: 4rem;
  line-height: 1;
  letter-spacing: -0.04em;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.text-metric-lg {   /* 48px */
  font-family: var(--font-mono);
  font-size: 3rem;
  line-height: 1;
  letter-spacing: -0.03em;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.text-metric-md {   /* 32px */
  font-family: var(--font-mono);
  font-size: 2rem;
  line-height: 1;
  letter-spacing: -0.025em;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.text-metric-sm {   /* 22px */
  font-family: var(--font-mono);
  font-size: 1.375rem;
  line-height: 1;
  letter-spacing: -0.02em;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}
```

---

## 4. SPACING & LAYOUT

### 4.1 Sistema 4pt

```
0.5  = 2px
1    = 4px
2    = 8px
3    = 12px
4    = 16px      ← base
6    = 24px      ← gap padrão entre cards
8    = 32px      ← seção interna
12   = 48px      ← seção externa
16   = 64px      ← seção principal
24   = 96px      ← hero spacing
32   = 128px     ← landing seções
```

### 4.2 Container Widths

```css
.container-app    { max-width: 1440px; }  /* Dashboards */
.container-narrow { max-width: 1024px; }  /* Forms longos */
.container-text   { max-width: 680px;  }  /* Reading */
.container-prose  { max-width: 580px;  }  /* Blog/docs */
```

### 4.3 Grid System

```
Dashboard padrão:
- 12 columns
- gap: 24px
- padding lateral: clamp(16px, 4vw, 32px)

Cards:
- min-width: 280px
- auto-fill responsivo
- gap: 20px
```

---

## 5. COMPONENTES BASE

### 5.1 Glass Card

```tsx
// components/glass/glass-card.tsx
export function GlassCard({ children, className, ...props }) {
  return (
    <div
      className={cn(
        "relative rounded-2xl",
        "bg-glass-light backdrop-blur-xl",
        "border border-border-default",
        "shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_8px_32px_-8px_rgba(0,0,0,0.5)]",
        "transition-all duration-300 ease-out-expo",
        className
      )}
      {...props}
    >
      {/* Top highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      {children}
    </div>
  );
}
```

### 5.2 Metric Card

```tsx
// components/glass/metric-card.tsx
interface MetricCardProps {
  label: string;
  value: string | number;
  delta?: { value: number; period: string };
  icon?: ReactNode;
  loading?: boolean;
}

export function MetricCard({ label, value, delta, icon, loading }) {
  const isPositive = delta && delta.value > 0;
  
  return (
    <GlassCard className="p-6 group hover:bg-glass-medium">
      <div className="flex items-start justify-between mb-4">
        <span className="text-label">{label}</span>
        {icon && (
          <div className="text-text-tertiary group-hover:text-brand-500 transition-colors">
            {icon}
          </div>
        )}
      </div>
      
      <div className="text-metric-md mb-2">
        {loading ? (
          <Skeleton className="h-12 w-24" />
        ) : (
          value
        )}
      </div>
      
      {delta && !loading && (
        <div className={cn(
          "text-body-sm font-mono flex items-center gap-1",
          isPositive ? "text-success-text" : "text-danger-text"
        )}>
          {isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
          <span>{Math.abs(delta.value).toFixed(1)}%</span>
          <span className="text-text-tertiary">{delta.period}</span>
        </div>
      )}
    </GlassCard>
  );
}
```

### 5.3 Status Pill

```tsx
// components/glass/status-pill.tsx
const variants = {
  active: "bg-success-bg text-success-text border-success-border shadow-[0_0_20px_rgba(74,222,128,0.15)]",
  paused: "bg-glass-medium text-text-secondary border-border-default",
  pending: "bg-warning-bg text-warning-text border-warning-border shadow-[0_0_20px_rgba(251,191,36,0.15)]",
  error: "bg-danger-bg text-danger-text border-danger-border shadow-[0_0_20px_rgba(248,113,113,0.15)]",
};

export function StatusPill({ variant, children, pulse = false }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5",
      "px-2.5 py-1 rounded-full",
      "text-label text-[10px]",
      "border",
      variants[variant]
    )}>
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-current opacity-50 animate-ping" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
        </span>
      )}
      {children}
    </span>
  );
}
```

### 5.4 Glass Button (Primary)

```tsx
// components/glass/glass-button.tsx
export function GlassButton({ variant = "primary", children, ...props }) {
  return (
    <button
      className={cn(
        "relative group",
        "inline-flex items-center justify-center gap-2",
        "px-5 py-2.5 rounded-xl",
        "text-body font-medium",
        "transition-all duration-200 ease-out-expo",
        "active:scale-[0.98]",
        
        // Variant primary
        variant === "primary" && [
          "bg-brand-500 text-white",
          "shadow-[0_0_0_1px_rgba(61,90,254,0.5),0_4px_16px_rgba(61,90,254,0.3)]",
          "hover:bg-brand-600 hover:shadow-[0_0_0_1px_rgba(61,90,254,0.7),0_8px_24px_rgba(61,90,254,0.5)]",
        ],
        
        // Variant glass
        variant === "glass" && [
          "bg-glass-medium border border-border-default text-text-primary",
          "hover:bg-glass-heavy hover:border-border-strong",
        ],
        
        // Variant ghost
        variant === "ghost" && [
          "text-text-secondary hover:text-text-primary",
          "hover:bg-glass-light",
        ],
      )}
      {...props}
    >
      {/* Inner highlight (primary only) */}
      {variant === "primary" && (
        <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-t-xl" />
      )}
      {children}
    </button>
  );
}
```

### 5.5 Sidebar Item

```tsx
// components/admin/sidebar-item.tsx
export function SidebarItem({ icon, label, href, active }) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-3",
        "px-3 py-2.5 rounded-xl",
        "text-body-sm font-medium",
        "transition-all duration-200 ease-out-expo",
        active 
          ? "bg-glass-medium text-text-primary"
          : "text-text-tertiary hover:text-text-primary hover:bg-glass-light"
      )}
    >
      {active && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-brand-500 rounded-r-full"
          transition={{ type: "spring", duration: 0.4 }}
        />
      )}
      <span className={cn(
        "transition-colors",
        active ? "text-brand-500" : ""
      )}>
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
}
```

---

## 6. MOTION SYSTEM

### 6.1 Easing Functions

```ts
export const easings = {
  // Mais usado — entrada de elementos
  outExpo: [0.16, 1, 0.3, 1],
  
  // Transições entre páginas/seções
  inOutQuart: [0.76, 0, 0.24, 1],
  
  // Botões, CTAs, micro-interações
  backOut: [0.34, 1.56, 0.64, 1],
  
  // Menus, dropdowns
  outQuint: [0.22, 1, 0.36, 1],
};
```

### 6.2 Durations

```ts
export const durations = {
  instant: 100,    // Hover states
  fast: 200,       // Buttons, toggles
  normal: 300,     // Cards, modals
  slow: 500,       // Page transitions
  slower: 800,     // Hero animations
};
```

### 6.3 Variants Padrão

```tsx
// lib/motion/variants.ts

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: easings.outExpo }
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: { duration: 0.2 }
  }
};

export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    }
  }
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.3, ease: easings.outExpo }
  },
};

export const slideInRight = {
  initial: { opacity: 0, x: 30 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.4, ease: easings.outExpo }
  },
};
```

### 6.4 Hover Patterns

```tsx
// Card lift on hover
<motion.div
  whileHover={{ 
    y: -4,
    transition: { duration: 0.2, ease: easings.outExpo }
  }}
>

// Button press
<motion.button
  whileTap={{ scale: 0.97 }}
  transition={{ duration: 0.1 }}
>

// Magnetic cursor (avançado)
<MagneticButton strength={0.3}>
  Click me
</MagneticButton>
```

---

## 7. ICONOGRAFIA

```
LIBRARY: lucide-react

PESOS:
- stroke-width: 1.5 (padrão)
- stroke-width: 2 (ênfase)

TAMANHOS:
- 14px: inline com texto
- 16px: dentro de botões pequenos
- 20px: padrão UI
- 24px: headers
- 32px: ilustrações

CORES:
- text-text-tertiary (default)
- text-text-secondary (hover)
- text-brand-500 (active/highlight)
```

---

## 8. EFEITOS GLASS AVANÇADOS

### 8.1 Glass com Aura (cards importantes)

```css
.glass-aura {
  position: relative;
  background: var(--glass-light);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border-default);
  border-radius: 24px;
}

.glass-aura::before {
  content: "";
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(
    135deg,
    rgba(255,255,255,0.15) 0%,
    transparent 30%,
    transparent 70%,
    rgba(61,90,254,0.3) 100%
  );
  -webkit-mask: 
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}
```

### 8.2 Background Orbs

```tsx
// components/glass/background-orbs.tsx
export function BackgroundOrbs() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Top-left orb */}
      <motion.div
        animate={{
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-brand-500/10 blur-[120px]"
      />
      
      {/* Bottom-right orb */}
      <motion.div
        animate={{
          x: [0, -40, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-brand-500/8 blur-[150px]"
      />
      
      {/* Center subtle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-brand-500/3 blur-[200px]" />
      
      {/* Grain overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
```

### 8.3 Animated Border Beam

```tsx
// components/glass/border-beam.tsx
export function BorderBeam({ children, delay = 0 }) {
  return (
    <div className="relative group">
      <div 
        className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `conic-gradient(
            from 0deg at 50% 50%,
            transparent 0deg,
            #3D5AFE 90deg,
            transparent 180deg
          )`,
          animation: `beam-rotate 4s linear infinite`,
          animationDelay: `${delay}ms`,
        }}
      />
      <div className="relative bg-bg-base rounded-2xl">
        {children}
      </div>
    </div>
  );
}
```

---

## 9. CHARTS (RECHARTS)

### 9.1 Tema Custom

```tsx
// lib/charts/theme.ts
export const chartTheme = {
  colors: {
    primary: "#3D5AFE",
    success: "#4ADE80",
    warning: "#FBBF24",
    danger: "#F87171",
    grid: "rgba(255,255,255,0.06)",
    axis: "#52525B",
    tooltip: {
      bg: "rgba(26,26,29,0.95)",
      border: "rgba(255,255,255,0.08)",
      text: "#FAFAFA",
    },
  },
  fonts: {
    family: "Geist Mono, monospace",
    size: 11,
  },
};
```

### 9.2 Wrapper Padrão

```tsx
// components/charts/glass-chart.tsx
export function GlassChart({ data, children }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <defs>
          <linearGradient id="brandGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3D5AFE" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#3D5AFE" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid 
          strokeDasharray="0" 
          stroke="rgba(255,255,255,0.04)" 
          vertical={false}
        />
        <XAxis 
          dataKey="date"
          stroke="#52525B"
          fontSize={11}
          fontFamily="Geist Mono, monospace"
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          stroke="#52525B"
          fontSize={11}
          fontFamily="Geist Mono, monospace"
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<GlassTooltip />} />
        {children}
      </LineChart>
    </ResponsiveContainer>
  );
}
```

---

## 10. PADRÕES DE PÁGINA

### 10.1 Admin Layout

```
┌─────────────────────────────────────────────────────────┐
│  Sidebar (240px)  │  Topbar (64px)                      │
│  - Logo           │                                      │
│  - Nav items      ├──────────────────────────────────────┤
│  - User menu      │                                      │
│                   │   Main Content                       │
│                   │   - Container max 1440px             │
│                   │   - Padding 32px                     │
│                   │   - Gap entre seções 32px            │
│                   │                                      │
│                   │                                      │
└─────────────────────────────────────────────────────────┘
```

### 10.2 Cliente Layout (white-label)

```
┌─────────────────────────────────────────────────────────┐
│  Topbar (72px)                                           │
│  Logo cliente | Nav horizontal | User                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│   Main Content                                           │
│   - Container max 1280px                                 │
│   - Padding generoso                                     │
│   - Cards com mais espaço                                │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 11. RESPONSIVIDADE

```
Breakpoints:
- sm:  640px   ← mobile landscape
- md:  768px   ← tablet
- lg:  1024px  ← laptop
- xl:  1280px  ← desktop
- 2xl: 1536px  ← wide

Estratégia:
- Mobile-first
- Sidebar vira drawer no mobile
- Grids 4col → 2col → 1col
- Métricas mantêm tamanho (são UI essential)
- Tabelas viram cards no mobile
```

---

## 12. ACESSIBILIDADE

```
☑ WCAG AA mínimo
☑ Focus visible em TODOS os elementos interativos
☑ Reduced-motion respeitado
☑ Alt text em todas imagens
☑ aria-labels em ícones-only buttons
☑ Skip links
☑ Keyboard navigation completa
☑ Screen reader friendly
☑ Contrast ratio 4.5:1 mínimo (texto)
☑ Touch targets 44x44px mínimo
```

---

## 13. INSPIRAÇÃO E REFERÊNCIAS

```
🎨 VERCEL DASHBOARD
   - Glass cards
   - Grid de projetos
   - Charts limpos
   - Topbar minimalista
   
🎨 LINEAR
   - Sidebar contextual
   - Command palette
   - Atalhos de teclado
   - Lista densa
   
🎨 ARC BROWSER
   - Glass effects sutis
   - Sidebar com personalidade
   - Spaces como contexto
   
🎨 STRIPE DASHBOARD
   - Charts financeiros
   - Filtros de período
   - Tabelas robustas
   
🎨 RAYCAST
   - Comandos rápidos
   - Atalhos de teclado primários
   
🎨 AWWWARDS 2025
   - Glass futurismo
   - Type display
   - Motion intencional
```

---

## 14. CHECKLIST DE QUALIDADE

Toda tela criada deve passar por:

```
☐ Dark mode perfeito (sem cores hardcoded)
☐ Glass usado com propósito (não em tudo)
☐ Tipografia hierárquica (não tudo body)
☐ Métricas em mono tabular
☐ Hover states em TODOS os elementos interativos
☐ Loading states (skeleton ou spinner)
☐ Empty states com ilustração + CTA
☐ Error states com retry
☐ Mobile responsive
☐ Reduced-motion respeitado
☐ Focus visible
☐ Sem scrollbar horizontal
☐ Sem layout shift
☐ Animações 60fps
```

---

> **Próximo:** `05-MCP-SERVER-SPEC.md` (especificação completa do MCP server)
