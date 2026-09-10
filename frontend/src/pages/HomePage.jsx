import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Helmet from "react-helmet";
import {
  ShieldCheck,
  Cloud,
  Database,
  Laptop,
  Code2,
  Mail,
  Fingerprint,
  Brain,
  Cpu,
  Radar,
  Scale,
  Crosshair,
  Siren,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Search,
  Settings2,
  Activity,
  Building2,
  Landmark,
  Banknote,
  Signal,
  HeartPulse,
  Factory,
  MonitorSmartphone,
  GraduationCap,
  Store,
  Quote,
  BookOpen,
  Lock,
  Unlock,
  BarChart2,
} from "lucide-react";
import Reveal from "@/components/Reveal";
import CountUp from "@/components/CountUp";
import Seo from "@/components/Seo";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import EmergencySupportModal from "@/components/EmergencySupportModal";
import { api } from "@/lib/api";

const HERO_IMG =
  "https://images.hostinger.com/a89a47e7-bf6a-4899-900c-655597fc6ae4.png";
const SOC_IMG =
  "https://images.hostinger.com/d98ff566-9411-4441-b79f-9205185b5c8c.png";
const TRAINING_IMG =
  "https://images.hostinger.com/2ba8a29d-24ff-4c18-b222-a975da63a478.png";

const marquee = [
  "Zero Trust architecture",
  "Cloud security posture",
  "Managed detection & response",
  "Identity & privileged access",
  "OT/IoT resilience",
  "Incident response retainers",
  "GRC & audit readiness",
  "Offensive security testing",
];

const challenges = [
  {
    t: "Expanding attack surface",
    d: "Hybrid cloud, SaaS sprawl, remote work and third parties widen exposure faster than teams can map it.",
  },
  {
    t: "Identity-driven intrusion",
    d: "Credential theft, MFA fatigue and privilege abuse now precede most enterprise breaches.",
  },
  {
    t: "Ransomware and extortion",
    d: "Encryption plus data theft turns an IT incident into a board-level business continuity event.",
  },
  {
    t: "Alert overload",
    d: "Disconnected tooling produces volume, not clarity, and real signals get buried in noise.",
  },
  {
    t: "Regulatory pressure",
    d: "Overlapping frameworks demand demonstrable controls, evidence and continuous reporting.",
  },
  {
    t: "AI-era risk",
    d: "Model misuse, data leakage into AI tools and AI-assisted attacks introduce controls most programmes lack.",
  },
];

const pillars = [
  {
    icon: Search,
    t: "Assess & Advise",
    d: "Independent assessments, threat modelling, maturity benchmarking and a prioritised roadmap tied to business risk.",
  },
  {
    icon: Settings2,
    t: "Design & Implement",
    d: "Reference architectures and hands-on engineering across cloud, identity, network, endpoint and data platforms.",
  },
  {
    icon: Activity,
    t: "Monitor & Improve",
    d: "24/7 monitoring, detection engineering, response readiness and measurable programme improvement cycles.",
  },
];

const services = [
  {
    icon: ShieldCheck,
    t: "Infrastructure Security",
    d: "Segmentation, hardening, secure network and remote access design.",
  },
  {
    icon: Cloud,
    t: "Cloud Security",
    d: "CSPM, workload protection and secure landing zones for AWS, Azure and GCP.",
  },
  {
    icon: Database,
    t: "Data Security",
    d: "Classification, DLP, encryption and key management across the data estate.",
  },
  {
    icon: Laptop,
    t: "Endpoint Security",
    d: "EDR/XDR deployment, hardening baselines and device trust enforcement.",
  },
  {
    icon: Code2,
    t: "Application Security",
    d: "Secure SDLC, SAST/DAST, API security and pipeline security gates.",
  },
  {
    icon: Mail,
    t: "Email Security",
    d: "Phishing defence, DMARC alignment and business email compromise controls.",
  },
  {
    icon: Fingerprint,
    t: "Identity Security",
    d: "IAM, SSO, MFA, PAM and least-privilege governance programmes.",
  },
  {
    icon: Brain,
    t: "AI Security",
    d: "AI usage governance, model risk, prompt and data-leakage controls.",
  },
  {
    icon: Cpu,
    t: "IoT / OT Security",
    d: "Asset visibility, industrial segmentation and safety-aware monitoring.",
  },
  {
    icon: Radar,
    t: "Security Operations",
    d: "SOC build-out, SIEM/SOAR engineering and detection content development.",
  },
  {
    icon: Scale,
    t: "GRC & Compliance",
    d: "Framework alignment, policy design, audit readiness and risk registers.",
  },
  {
    icon: Crosshair,
    t: "Offensive Security",
    d: "Penetration testing, red teaming and adversary simulation exercises.",
  },
  {
    icon: Siren,
    t: "Incident Response",
    d: "Containment, forensics, recovery and post-incident hardening.",
  },
];

const solutions = [
  {
    t: "Zero Trust",
    d: "Identity-centric access, continuous verification and micro-segmentation by design.",
  },
  {
    t: "SOC / MDR",
    d: "Co-managed or fully managed detection and response with defined service levels.",
  },
  {
    t: "SIEM / SOAR",
    d: "Consolidated telemetry, tuned detections and automated response playbooks.",
  },
  {
    t: "XDR / EDR",
    d: "Unified endpoint, identity and cloud signal correlation with rapid containment.",
  },
  {
    t: "Cloud Security",
    d: "Posture, entitlements, workload and pipeline protection for multi-cloud estates.",
  },
  {
    t: "Identity & PAM",
    d: "Privileged access vaulting, session control and joiner-mover-leaver hygiene.",
  },
  {
    t: "Data Protection",
    d: "Discovery, classification, protection and resilient backup architecture.",
  },
  {
    t: "Application Security",
    d: "Shift-left tooling, developer enablement and release-blocking guardrails.",
  },
  {
    t: "Cyber Resilience",
    d: "Recovery objectives, tested playbooks, tabletop exercises and continuity assurance.",
  },
  {
    t: "AI Security",
    d: "Guardrails for AI adoption, model access control and monitoring of AI-related risk.",
  },
];

const method = [
  "Discover",
  "Assess",
  "Prioritize",
  "Design",
  "Implement",
  "Monitor",
  "Respond",
  "Assure",
  "Improve",
];

const industries = [
  { icon: Building2, t: "Enterprise" },
  { icon: Landmark, t: "Government" },
  { icon: Banknote, t: "Financial Services" },
  { icon: Signal, t: "Telecom" },
  { icon: HeartPulse, t: "Healthcare" },
  { icon: Factory, t: "Manufacturing" },
  { icon: MonitorSmartphone, t: "Technology" },
  { icon: GraduationCap, t: "Education" },
  { icon: Store, t: "SMB" },
];

const outcomes = [
  {
    v: 62,
    suffix: "%",
    l: "Reduction in mean time to detect after SOC modernisation engagements.",
  },
  {
    v: 40,
    suffix: "%",
    l: "Fewer critical exposures within two quarters of a prioritised remediation plan.",
  },
  {
    v: 24,
    suffix: "/7",
    l: "Continuous monitoring coverage across hybrid and multi-cloud estates.",
  },
  {
    v: 9,
    suffix: " steps",
    l: "A single, repeatable methodology from discovery through continuous improvement.",
  },
];

const why = [
  "Engineers and advisors, not resellers - recommendations stay vendor-pragmatic.",
  "Business-risk framing that boards, auditors and engineers can all act on.",
  "Delivery across assessment, implementation, managed defence and training.",
  "Documented architectures and knowledge transfer at every handover.",
  "Response readiness built in, not bolted on after an incident.",
  "Measured outcomes reported against agreed control and risk baselines.",
];

const insights = [
  {
    tag: "Zero Trust",
    t: "A pragmatic Zero Trust sequence for hybrid enterprises",
    d: "Where to begin when identity, network and data maturity differ across regions.",
  },
  {
    tag: "Cloud",
    t: "Cloud entitlements: the quiet privilege problem",
    d: "Why over-permissioned roles remain the most common cloud breach path.",
  },
  {
    tag: "Resilience",
    t: "Designing recovery you have actually tested",
    d: "Turning continuity documents into rehearsed, timed operational capability.",
  },
];

const cases = [
  {
    sector: "Financial services",
    t: "SOC modernisation programme",
    d: "Case study in preparation - detection coverage, tuning and response metrics.",
  },
  {
    sector: "Manufacturing",
    t: "OT segmentation and visibility",
    d: "Case study in preparation - plant asset discovery and safe segmentation.",
  },
  {
    sector: "Public sector",
    t: "Identity and access overhaul",
    d: "Case study in preparation - privileged access consolidation and governance.",
  },
];

const Section = ({ id, children, className = "" }) => (
  <section id={id} className={`px-5 py-20 lg:px-8 lg:py-28 ${className}`}>
    <div className="mx-auto w-full max-w-[80rem]">{children}</div>
  </section>
);

const Eyebrow = ({ children }) => (
  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0052FE]">
    {children}
  </p>
);

const darkCardHover =
  "group relative z-0 h-full min-h-[145px] overflow-hidden rounded-lg border border-white/10 " +
  "bg-[hsl(var(--ink))] p-8 text-slate-300 transition-all duration-300 ease-out responsive-hover-expand-dark";

export default function HomePage() {
  const [activeTrustCard, setActiveTrustCard] = useState(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const coursesTrackRef = useRef(null);
  const dragState = useRef({ dragging: false, startX: 0, startScrollLeft: 0 });

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const data = await api.getCourses();
      setCourses((data || []).slice(0, 3)); // Show only first 3 featured courses
    } catch (e) {
      console.error("Failed to load courses:", e);
    } finally {
      setCoursesLoading(false);
    }
  };

  return (
    <div id="top" className="min-h-screen bg-background">
      <Helmet>
        <title>
          CyberLoy | Enterprise Cybersecurity Consulting, Managed Defence &
          Training
        </title>
        <meta
          name="description"
          content="CyberLoy delivers cybersecurity consulting, assessments, implementation, managed security operations, incident response, GRC and professional training for enterprises, government and regulated industries."
        />
      </Helmet>
      <Seo
        title="CyberLoy | Enterprise Cybersecurity Consulting & Managed Defence"
        description="Secure what matters. Enable what's next. Assessments, Zero Trust architecture, SOC/MDR, incident response, GRC and cybersecurity training."
        image={HERO_IMG}
        siteName="CyberLoy"
      />

      <SiteNav />

      {/* HERO */}
      <section className="relative flex min-h-[92dvh] items-center overflow-hidden bg-[hsl(var(--ink))]">
        <img
          src={HERO_IMG}
          alt="Secure enterprise data centre corridor"
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--ink))] via-[hsl(var(--ink))]/90 to-[hsl(var(--ink))]/30" />
        <div className="grid-lines absolute inset-0 opacity-[0.06]" />
        <div className="relative mx-auto grid w-full max-w-[80rem] gap-12 px-5 py-24 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:px-8">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-slate-200">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                Consulting - Engineering - Managed Defence - Training
              </span>
            </Reveal>
            <Reveal delay={0.08}>
              <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.05] text-white sm:text-5xl lg:text-6xl">
                Secure What Matters.
                <span className="relative mt-2 block text-accent">
                  Enable What&apos;s Next.
                  <span className="absolute -bottom-1 left-0 h-[3px] w-32 rounded-full bg-accent/70" />
                </span>
              </h1>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-7 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
                CyberLoy protects the infrastructure, cloud platforms,
                identities, data, applications and operations that your business
                depends on. We assess risk objectively, engineer controls that
                hold, and defend them around the clock - so security enables
                growth instead of slowing it down.
              </p>
            </Reveal>
            <Reveal delay={0.24}>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#assessment"
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded bg-primary px-6 text-sm font-semibold text-[#0052FE]-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
                >
                  Request a Security Assessment{" "}
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="#assessment"
                  className="inline-flex min-h-[48px] items-center justify-center rounded border border-white/25 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10 active:scale-[0.98]"
                >
                  Talk to an Expert
                </a>
              </div>
            </Reveal>
          </div>
          <Reveal delay={0.3}>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                Programme at a glance
              </p>
              <dl className="mt-5 divide-y divide-white/10">
                {[
                  [
                    "Coverage",
                    "Infrastructure, cloud, identity, data, apps, OT",
                  ],
                  ["Delivery", "Advisory, engineering, managed SOC, response"],
                  ["Assurance", "GRC alignment, testing, continuous reporting"],
                  ["Enablement", "Role-based professional training programmes"],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-1 py-3.5">
                    <dt className="text-xs uppercase tracking-wide text-slate-400">
                      {k}
                    </dt>
                    <dd className="text-sm font-medium text-slate-100">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
        </div>
      </section>

      {/* TRUST MARQUEE */}
      <div className="overflow-hidden border-y border-border bg-secondary/60 py-4">
        <div className="marquee-track flex w-max gap-10 whitespace-nowrap">
          {[...marquee, ...marquee].map((item, i) => (
            <span
              key={`${item}-${i}`}
              className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
            >
              <ShieldCheck
                className="h-3.5 w-3.5 text-[#0052FE]"
                strokeWidth={2}
              />{" "}
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* TRUST / CREDIBILITY */}
      <Section id="company">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <Reveal>
            <Eyebrow>Why organisations trust CyberLoy</Eyebrow>
            <h2 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
              Practitioner-led security, accountable from advice to operations.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              Our consultants, architects and analysts work inside regulated,
              high-availability environments every day. That means
              recommendations you can implement, controls that survive audit,
              and operations that hold up under real pressure.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <div
              className="relative grid min-h-[340px] gap-5 overflow-visible sm:grid-cols-2"
              onMouseLeave={() => setActiveTrustCard(null)}
            >
              {[
                [
                  "Framework-aligned",
                  "Engagements mapped to recognised control and risk frameworks.",
                ],
                [
                  "Vendor-pragmatic",
                  "Architecture first, tooling second - no forced platform lock-in.",
                ],
                [
                  "Evidence-driven",
                  "Findings, decisions and improvements documented end to end.",
                ],
                [
                  "Response-ready",
                  "Retainer-backed incident response with defined escalation paths.",
                ],
              ].map(([t, d], i) => {
                const originClass =
                  i === 0
                    ? "origin-top-left"
                    : i === 1
                      ? "origin-top-right"
                      : i === 2
                        ? "origin-bottom-left"
                        : "origin-bottom-right";

                const isActive = activeTrustCard?.i === i;

                return (
                  <div
                    key={t}
                    onMouseEnter={() => setActiveTrustCard({ t, d, i })}
                    onClick={() =>
                      setActiveTrustCard((current) =>
                        current?.i === i ? null : { t, d, i },
                      )
                    }
                    className={`group relative min-h-[150px] rounded-lg border border-border bg-card p-6 transition-all duration-300 ease-out responsive-hover-trust ${originClass} ${
                      isActive
                        ? "z-30 md:scale-x-[1.28] md:scale-y-[1.20] max-md:scale-100 max-md:border-[#0052FE] max-md:bg-white max-md:shadow-[0_0_14px_rgba(0,82,254,0.22),0_0_30px_rgba(0,82,254,0.12)] md:border-[#0052FE] md:bg-white md:shadow-[0_0_18px_rgba(0,82,254,0.45),0_0_40px_rgba(0,82,254,0.22)]"
                        : "z-10"
                    }`}
                  >
                    <CheckCircle2
                      className={`h-5 w-5 text-[#0052FE] transition-all duration-300 ${
                        isActive ? "scale-110" : "group-hover:scale-110"
                      }`}
                      strokeWidth={2}
                    />

                    <p
                      className={`mt-3 font-display font-bold text-foreground transition-all duration-300 ${
                        isActive
                          ? "text-[1.05rem] text-[#0052FE]"
                          : "text-base group-hover:text-[#0052FE]"
                      }`}
                    >
                      {t}
                    </p>

                    <p
                      className={`mt-1.5 font-medium leading-relaxed text-muted-foreground transition-all duration-300 ${
                        isActive
                          ? "text-[0.95rem] text-black"
                          : "text-sm group-hover:text-black"
                      }`}
                    >
                      {d}
                    </p>

                    {isActive && (
                      <>
                        <div className="pointer-events-none absolute inset-x-7 bottom-5 h-px bg-gradient-to-r from-blue-600 via-blue-400 to-transparent opacity-80" />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </Reveal>
        </div>
      </Section>

      {/* WHAT WE DO */}
      <Section>
        <div className="grid gap-10 lg:grid-cols-3">
          {pillars.map((p, i) => (
            <Reveal key={p.t} delay={i * 0.08}>
              <div className={darkCardHover}>
                <span className="flex h-11 w-11 items-center justify-center rounded bg-white/10 text-accent">
                  <p.icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <h3 className="mt-6 font-display text-xl font-semibold text-white transition-colors duration-300 group-hover:text-[#0052FE] group-hover:font-extrabold ">
                  {p.t}
                </h3>
                <p className="mt-3 text-sm leading-relaxed transition-colors duration-300 group-hover:text-black group-hover:text-base group-hover:font-bold">
                  {p.d}
                </p>
                <span className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-accent transition-colors duration-300 group-hover:text-[#0052FE]">
                  Step {i + 1} of the lifecycle
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* SERVICES */}
      <Section id="services" className="border-y border-border bg-card">
        <Reveal>
          <Eyebrow>Core services</Eyebrow>
          <h2 className="max-w-3xl font-display text-3xl font-semibold leading-tight sm:text-4xl">
            Thirteen practice areas, one coordinated security programme.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-3 overflow-visible rounded-lg sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <div
              key={s.t}
              className="group relative h-full overflow-hidden bg-background p-6 transition-all duration-300 ease-out responsive-hover-lift"
            >
              <s.icon
                className="h-5 w-5 text-[#0052FE] transition-transform duration-200 group-hover:-translate-y-px"
                strokeWidth={2}
              />
              <h3 className="mt-4 font-display text-base font-bold text-foreground transition-all duration-300 group-hover:text-[#0052FE] group-hover:text-xl group-hover:font-extrabold">
                {s.t}
              </h3>
              <p className="mt-2 text-sm font-bold leading-relaxed text-muted-foreground transition-all duration-300 group-hover:text-lg group-hover:text-black group-hover:font-extrabold">
                {s.d}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* SOLUTIONS */}
      <Section id="solutions">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <Reveal>
            <div>
              <Eyebrow>Featured solutions</Eyebrow>
              <h2 className="max-w-2xl font-display text-3xl font-semibold leading-tight sm:text-4xl">
                Outcome-focused solution architectures.
              </h2>
            </div>
          </Reveal>
          <a
            href="#assessment"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#0052FE] hover:underline"
          >
            Discuss a solution fit <ArrowRight className="h-4 w-4" />
          </a>
        </div>
        <div className="mt-12 grid gap-8 overflow-visible md:grid-cols-2">
          {solutions.map((s, i) => (
            <Reveal key={s.t} delay={(i % 2) * 0.06}>
              <div className="group relative flex h-full gap-5 overflow-hidden rounded-lg border border-border bg-card p-6 transition-all duration-300 ease-out responsive-hover-expand">
                <span className="mt-1 font-mono text-xs font-semibold text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold transition-all duration-300 group-hover:text-[#0052FE] group-hover:text-[1.75rem] group-hover:font-extrabold">
                    {s.t}
                  </h3>
                  <p className="mt-2 text-sm font-bold leading-relaxed text-muted-foreground transition-all duration-300 group-hover:text-lg group-hover:text-black group-hover:font-extrabold">
                    {s.d}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* METHODOLOGY */}
      <Section className="bg-[hsl(var(--ink))] text-slate-300">
        <Reveal>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
            Our methodology
          </p>
          <h2 className="max-w-3xl font-display text-3xl font-semibold leading-tight text-white sm:text-4xl">
            A nine-stage cycle that keeps security measurable.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-3 overflow-visible rounded-lg sm:grid-cols-3">
          {method.map((m, i) => (
            <div
              key={m}
              className="group relative min-h-[145px] overflow-hidden bg-[hsl(var(--ink))] p-6 transition-all duration-300 ease-out responsive-hover-expand-dark"
            >
              {/* Lightning glow overlay */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-100/80 via-white to-blue-50 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="pointer-events-none absolute -left-10 top-0 h-[2px] w-24 rotate-[-35deg] bg-blue-400 opacity-0 blur-[1px] transition-all duration-500 group-hover:left-[110%] group-hover:opacity-100" />

              <div className="relative z-10">
                <span className="font-mono text-xs font-bold text-accent transition-all duration-300 group-hover:text-lg group-hover:text-[#0052FE] group-hover:font-extrabold">
                  {String(i + 1).padStart(2, "0")}
                </span>

                <p className="mt-2 font-display text-lg font-bold text-white transition-all duration-300 group-hover:text-[2.5rem] group-hover:font-extrabold group-hover:text-[#0052FE]">
                  {m}
                </p>

                <span className="mt-4 block h-[3px] w-10 bg-accent/60 transition-all duration-300 group-hover:w-20 group-hover:bg-[#0052FE]" />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* INDUSTRIES */}
      <Section id="industries" className="border-b border-border">
        <Reveal>
          <Eyebrow>Industries we serve</Eyebrow>
          <h2 className="max-w-3xl font-display text-3xl font-semibold leading-tight sm:text-4xl">
            Sector context changes the threat model - and our approach.
          </h2>
        </Reveal>
        <div className="mt-12 flex flex-wrap gap-6 overflow-visible">
          {industries.map((ind) => (
            <div
              key={ind.t}
              className="group flex min-w-[13rem] flex-1 items-center gap-3 rounded border border-border bg-card px-5 py-4 transition-all duration-300 ease-out responsive-hover-lift"
            >
              <ind.icon
                className="h-5 w-5 text-[#0052FE] transition-all duration-300 group-hover:-translate-y-1 group-hover:scale-110 group-hover:text-accent"
                strokeWidth={2}
              />
              <span className="font-display text-sm font-bold transition-all duration-300 group-hover:text-lg group-hover:text-[#0052FE] group-hover:font-extrabold group-hover:font-extrabold">
                {ind.t}
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* MANAGED SOC */}
      <Section className="bg-secondary/40">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <div className="group overflow-visible rounded-lg border border-border transition-all duration-300 ease-out responsive-hover-lift">
              <img
                src={SOC_IMG}
                alt="CyberLoy security operations centre analysts monitoring threat dashboards"
                className="h-full w-full object-cover"
              />
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div>
              <Eyebrow>Managed security & SOC</Eyebrow>
              <h2 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
                Continuous defence, run by people who engineer it.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                Our analysts monitor, triage and contain around the clock,
                backed by detection engineering, threat intelligence and
                response playbooks tuned to your environment. Co-managed or
                fully managed - with transparent metrics either way.
              </p>
              <ul className="mt-7 grid gap-3">
                {[
                  "24/7 monitoring, triage and escalation with agreed service levels",
                  "Detection engineering and continuous tuning to reduce false positives",
                  "Threat hunting and adversary-informed detection coverage reviews",
                  "Containment support and forensic escalation into incident response",
                ].map((l) => (
                  <li key={l} className="flex gap-3 text-sm leading-relaxed">
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                      strokeWidth={2}
                    />
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* OUTCOMES */}
      <Section>
        <Reveal>
          <Eyebrow>Business outcomes</Eyebrow>
          <h2 className="max-w-3xl font-display text-3xl font-semibold leading-tight sm:text-4xl">
            Security measured the way the business measures everything else.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-10 overflow-visible sm:grid-cols-2 lg:grid-cols-4">
          {outcomes.map((o, i) => (
            <Reveal key={o.l} delay={i * 0.06}>
              <div className="group h-full border-t border-border pt-5 transition-all duration-300 ease-out responsive-hover-expand">
                <p className="font-display text-4xl font-semibold text-[#0052FE] transition-all duration-300 group-hover:text-[3.25rem] group-hover:font-extrabold group-hover:text-[#0052FE]">
                  <CountUp value={o.v} suffix={o.suffix} />
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {o.l}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="mt-8 max-w-3xl text-xs leading-relaxed text-muted-foreground">
          Figures reflect typical improvement ranges observed across CyberLoy
          engagements and depend on scope, baseline maturity and client
          environment.
        </p>
      </Section>

      {/* WHY US + TRAINING */}
      <Section id="training" className="border-y border-border bg-card">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <Reveal>
            <div>
              <Eyebrow>Why choose CyberLoy</Eyebrow>
              <h2 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
                Depth where it counts, clarity where it matters.
              </h2>
              <ul className="mt-8 grid gap-4">
                {why.map((w) => (
                  <li
                    key={w}
                    className="flex gap-3 text-sm leading-relaxed text-muted-foreground"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="group overflow-visible rounded-lg border border-border transition-all duration-300 ease-out responsive-hover-lift">
              <img
                src={TRAINING_IMG}
                alt="CyberLoy professional cybersecurity training workshop"
                className="h-64 w-full object-cover sm:h-80"
              />
              <div className="p-7">
                <Eyebrow>Professional training</Eyebrow>
                <h3 className="font-display text-xl font-semibold">
                  Build capability inside your own team.
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Role-based programmes for engineers, SOC analysts, developers,
                  risk teams and executives - delivered as workshops, hands-on
                  labs and simulation exercises, aligned to the controls you
                  actually operate.
                </p>
                <a
                  href="#assessment"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#0052FE] hover:underline"
                >
                  Request the training catalogue{" "}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* CASE STUDIES */}
      <Section>
        <Reveal>
          <Eyebrow>Case studies</Eyebrow>
          <h2 className="max-w-3xl font-display text-3xl font-semibold leading-tight sm:text-4xl">
            Client work, published once approved.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            We publish engagement detail only with written client consent.
            Anonymised walkthroughs are available on request under NDA.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-8 overflow-visible md:grid-cols-3">
          {cases.map((c, i) => (
            <Reveal key={c.t} delay={i * 0.06}>
              <div className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-dashed border-border bg-secondary/30 p-6 transition-all duration-300 ease-out responsive-hover-expand">
                <Quote className="h-5 w-5 text-[#0052FE]/70" strokeWidth={2} />
                <span className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {c.sector}
                </span>
                <h3 className="mt-2 font-display text-lg font-bold transition-all duration-300 group-hover:text-[#0052FE] group-hover:text-[1.75rem] group-hover:font-extrabold">
                  {c.t}
                </h3>
                <p className="mt-2 text-sm font-bold leading-relaxed text-muted-foreground transition-all duration-300 group-hover:text-lg group-hover:text-black group-hover:font-extrabold">
                  {c.d}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* FEATURED COURSES */}
      <Section id="courses" className="bg-secondary/40">
        <div className="flex items-center justify-between gap-4">
          <Reveal>
            <Eyebrow>Interactive Learning</Eyebrow>
          </Reveal>
          <Link
            to="/courses"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
          >
            Show All
          </Link>
        </div>

        <div className="mt-8">
          {coursesLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-400 text-sm">
              Loading featured courses...
            </div>
          ) : courses.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-slate-400 text-sm">
              No courses available yet.
            </div>
          ) : (
            <div className="overflow-hidden rounded-[28px] border border-border bg-card/40 p-4">
              <div
                ref={coursesTrackRef}
                className="flex items-stretch gap-6 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none cursor-grab active:cursor-grabbing"
                onPointerDown={(event) => {
                  if (!coursesTrackRef.current) return;
                  dragState.current.dragging = true;
                  dragState.current.startX = event.clientX;
                  dragState.current.startScrollLeft = coursesTrackRef.current.scrollLeft;
                  coursesTrackRef.current.setPointerCapture?.(event.pointerId);
                }}
                onPointerMove={(event) => {
                  if (!dragState.current.dragging || !coursesTrackRef.current) return;
                  const delta = event.clientX - dragState.current.startX;
                  coursesTrackRef.current.scrollLeft = dragState.current.startScrollLeft - delta;
                }}
                onPointerUp={() => {
                  dragState.current.dragging = false;
                }}
                onPointerLeave={() => {
                  dragState.current.dragging = false;
                }}
                onPointerCancel={() => {
                  dragState.current.dragging = false;
                }}
              >
                {courses.map((course, idx) => {
                  const price = Number(course.price || 49.0).toFixed(2);
                  return (
                    <Link
                      key={`${course.id}-${idx}`}
                      to={`/courses/${course.id}`}
                      className="group relative w-[340px] shrink-0 overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all duration-300 ease-out hover:border-[#0052FE]/50 hover:shadow-lg hover:shadow-[#0052FE]/20"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="mb-3 flex items-center gap-2">
                            <span className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-slate-300 transition group-hover:border-[#0052FE]/30 group-hover:bg-[#0052FE]/10 group-hover:text-[#0052FE]">
                              {course.level}
                            </span>
                            {course.is_unlocked ? (
                              <span className="flex items-center gap-1 rounded-md border border-emerald-800/80 bg-emerald-950/80 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
                                <Unlock className="h-3 w-3" /> Unlocked
                              </span>
                            ) : (
                              <span className="rounded-md border border-cyan-800/80 bg-cyan-950/80 px-2.5 py-1 text-[11px] font-bold text-cyan-300 font-mono">
                                ${price}
                              </span>
                            )}
                          </div>

                          <h3 className="line-clamp-2 font-display text-xl font-bold text-slate-900 transition group-hover:text-[#0052FE]">
                            {course.title}
                          </h3>

                          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">
                            {course.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#0052FE] to-cyan-600 text-white transition group-hover:scale-110">
                            <BookOpen className="h-6 w-6" />
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-800/80 pt-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-mono">
                          <BarChart2 className="h-3.5 w-3.5" />
                          {course.modules_count || 0} Modules
                        </span>
                        {course.is_unlocked ? (
                          <span className="text-[11px] font-mono text-[#0052FE]">
                            {course.progress_percentage || 0}%
                          </span>
                        ) : (
                          <span className="text-[11px] font-mono text-cyan-400">
                            Get access
                          </span>
                        )}
                      </div>

                      {course.is_unlocked && (
                        <div className="mt-4">
                          <div className="mb-2 flex justify-between text-[11px] font-mono text-slate-300">
                            <span>Progress</span>
                            <span className="text-[#0052FE] font-bold">
                              {course.progress_percentage || 0}%
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full border border-slate-800 bg-slate-950">
                            <div
                              className="h-full bg-gradient-to-r from-[#0052FE] to-cyan-500 transition-all duration-500"
                              style={{ width: `${course.progress_percentage || 0}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* INSIGHTS */}
      <Section id="insights" className="border-y border-border bg-secondary/40">
        <Reveal>
          <Eyebrow>Insights & resources</Eyebrow>
          <h2 className="max-w-3xl font-display text-3xl font-semibold leading-tight sm:text-4xl">
            Practical guidance from our practice leads.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-8 overflow-visible md:grid-cols-3">
          {insights.map((n, i) => (
            <Reveal key={n.t} delay={i * 0.06}>
              <article className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card p-6 transition-all duration-300 ease-out responsive-hover-expand">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                  {n.tag}
                </span>
                <h3 className="mt-3 font-display text-lg font-bold leading-snug transition-all duration-300 group-hover:text-2xl group-hover:text-[#0052FE] group-hover:font-extrabold">
                  {n.t}
                </h3>
                <p className="mt-2.5 text-sm font-bold leading-relaxed text-muted-foreground transition-all duration-300 group-hover:text-lg group-hover:text-black group-hover:font-extrabold">
                  {n.d}
                </p>
                <a
                  href="#insights"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#0052FE] hover:underline"
                >
                  Read the briefing <ArrowRight className="h-4 w-4" />
                </a>
              </article>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* FINAL CTA + EMERGENCY */}
      <Section id="assessment" className="bg-[hsl(var(--ink))]">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <Reveal>
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
                Next step
              </p>
              <h2 className="font-display text-3xl font-semibold leading-tight text-white sm:text-4xl">
                Start with a security assessment. Decide with evidence.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300">
                We review your current controls, exposure and priorities, then
                return a clear findings report and a sequenced roadmap - scoped
                to your environment, budget and regulatory obligations.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a
                  href="mailto:connect@cyberloy.com"
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded bg-primary px-6 text-sm font-semibold text-[#0052FE]-foreground transition-colors hover:bg-primary/90 active:scale-[0.98]"
                >
                  Request a Security Assessment{" "}
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="mailto:connect@cyberloy.com"
                  className="inline-flex min-h-[48px] items-center justify-center rounded border border-white/25 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10 active:scale-[0.98]"
                >
                  Talk to an Expert
                </a>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div
              id="emergency"
              className="rounded-lg border border-destructive/40 bg-destructive/10 p-7"
            >
              <div className="flex items-center gap-2 text-destructive-foreground">
                <Siren className="h-5 w-5" strokeWidth={2} />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">
                  Emergency support
                </span>
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold text-white">
                Active incident? Escalate now.
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                Our incident response team supports containment, forensics and
                recovery for suspected breaches, ransomware and business email
                compromise.
              </p>
              <button
                onClick={() => setShowEmergencyModal(true)}
                className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded bg-white px-5 text-sm font-semibold text-[hsl(var(--ink))] hover:bg-slate-100 transition-transform active:scale-[0.98]"
              >
                Contact incident response
              </button>
            </div>
          </Reveal>
        </div>
      </Section>

      <EmergencySupportModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
      />

      <SiteFooter />
    </div>
  );
}
