import React, { useEffect, useMemo, useState } from "react";
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
  PlayCircle,
  ClipboardCheck,
  Video,
  Award,
  Sparkles,
} from "lucide-react";
import Reveal from "@/components/Reveal";
import CountUp from "@/components/CountUp";
import Seo from "@/components/Seo";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import EmergencySupportModal from "@/components/EmergencySupportModal";
import CourseCard, { CourseCardSkeleton } from "@/components/CourseCard";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { api } from "@/lib/api";

const HERO_IMG =
  "https://images.hostinger.com/a89a47e7-bf6a-4899-900c-655597fc6ae4.png";
const SOC_IMG =
  "https://images.hostinger.com/d98ff566-9411-4441-b79f-9205185b5c8c.png";
const TRAINING_IMG =
  "https://images.hostinger.com/2ba8a29d-24ff-4c18-b222-a975da63a478.png";
const CONTACT_EMAIL = "connect@cyberloy.com";

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

const heroStats = [
  { v: 13, suffix: "", l: "Security practice areas" },
  { v: 24, suffix: "/7", l: "Monitoring & response" },
  { v: 9, suffix: "-step", l: "Delivery methodology" },
];

const trustPoints = [
  {
    t: "Framework-aligned",
    d: "Engagements mapped to recognised control and risk frameworks.",
  },
  {
    t: "Vendor-pragmatic",
    d: "Architecture first, tooling second - no forced platform lock-in.",
  },
  {
    t: "Evidence-driven",
    d: "Findings, decisions and improvements documented end to end.",
  },
  {
    t: "Response-ready",
    d: "Retainer-backed incident response with defined escalation paths.",
  },
];

const learningFeatures = [
  { icon: PlayCircle, t: "Self-paced video lessons", d: "Learn on your schedule with progress saved automatically." },
  { icon: ClipboardCheck, t: "Quizzes & assignments", d: "Check understanding with graded MCQs and written tasks." },
  { icon: Video, t: "Live online classes", d: "Join instructor-led sessions right from your browser." },
  { icon: Award, t: "Verifiable certificates", d: "Earn a certificate employers can verify online." },
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
  { icon: ShieldCheck, t: "Infrastructure Security", d: "Segmentation, hardening, secure network and remote access design." },
  { icon: Cloud, t: "Cloud Security", d: "CSPM, workload protection and secure landing zones for AWS, Azure and GCP." },
  { icon: Database, t: "Data Security", d: "Classification, DLP, encryption and key management across the data estate." },
  { icon: Laptop, t: "Endpoint Security", d: "EDR/XDR deployment, hardening baselines and device trust enforcement." },
  { icon: Code2, t: "Application Security", d: "Secure SDLC, SAST/DAST, API security and pipeline security gates." },
  { icon: Mail, t: "Email Security", d: "Phishing defence, DMARC alignment and business email compromise controls." },
  { icon: Fingerprint, t: "Identity Security", d: "IAM, SSO, MFA, PAM and least-privilege governance programmes." },
  { icon: Brain, t: "AI Security", d: "AI usage governance, model risk, prompt and data-leakage controls." },
  { icon: Cpu, t: "IoT / OT Security", d: "Asset visibility, industrial segmentation and safety-aware monitoring." },
  { icon: Radar, t: "Security Operations", d: "SOC build-out, SIEM/SOAR engineering and detection content development." },
  { icon: Scale, t: "GRC & Compliance", d: "Framework alignment, policy design, audit readiness and risk registers." },
  { icon: Crosshair, t: "Offensive Security", d: "Penetration testing, red teaming and adversary simulation exercises." },
  { icon: Siren, t: "Incident Response", d: "Containment, forensics, recovery and post-incident hardening." },
];

const solutions = [
  { t: "Zero Trust", d: "Identity-centric access, continuous verification and micro-segmentation by design." },
  { t: "SOC / MDR", d: "Co-managed or fully managed detection and response with defined service levels." },
  { t: "SIEM / SOAR", d: "Consolidated telemetry, tuned detections and automated response playbooks." },
  { t: "XDR / EDR", d: "Unified endpoint, identity and cloud signal correlation with rapid containment." },
  { t: "Cloud Security", d: "Posture, entitlements, workload and pipeline protection for multi-cloud estates." },
  { t: "Identity & PAM", d: "Privileged access vaulting, session control and joiner-mover-leaver hygiene." },
  { t: "Data Protection", d: "Discovery, classification, protection and resilient backup architecture." },
  { t: "Application Security", d: "Shift-left tooling, developer enablement and release-blocking guardrails." },
  { t: "Cyber Resilience", d: "Recovery objectives, tested playbooks, tabletop exercises and continuity assurance." },
  { t: "AI Security", d: "Guardrails for AI adoption, model access control and monitoring of AI-related risk." },
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
  { v: 62, suffix: "%", l: "Reduction in mean time to detect after SOC modernisation engagements." },
  { v: 40, suffix: "%", l: "Fewer critical exposures within two quarters of a prioritised remediation plan." },
  { v: 24, suffix: "/7", l: "Continuous monitoring coverage across hybrid and multi-cloud estates." },
  { v: 9, suffix: " steps", l: "A single, repeatable methodology from discovery through continuous improvement." },
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
  { tag: "Zero Trust", t: "A pragmatic Zero Trust sequence for hybrid enterprises", d: "Where to begin when identity, network and data maturity differ across regions." },
  { tag: "Cloud", t: "Cloud entitlements: the quiet privilege problem", d: "Why over-permissioned roles remain the most common cloud breach path." },
  { tag: "Resilience", t: "Designing recovery you have actually tested", d: "Turning continuity documents into rehearsed, timed operational capability." },
];

const cases = [
  { sector: "Financial services", t: "SOC modernisation programme", d: "Case study in preparation - detection coverage, tuning and response metrics." },
  { sector: "Manufacturing", t: "OT segmentation and visibility", d: "Case study in preparation - plant asset discovery and safe segmentation." },
  { sector: "Public sector", t: "Identity and access overhaul", d: "Case study in preparation - privileged access consolidation and governance." },
];

const faqs = [
  {
    q: "How do I enrol in a CyberLoy course?",
    a: "Create a free account, open the course catalogue and choose a course. Free courses unlock immediately; paid courses unlock as soon as checkout is complete.",
  },
  {
    q: "Do I receive a certificate?",
    a: "Yes. Courses with certificates enabled issue one automatically when you complete every lesson and assessment, and anyone can verify it online with its certificate code.",
  },
  {
    q: "Are the courses self-paced or live?",
    a: "Both. Video lessons, quizzes and assignments are self-paced and your progress is saved, and instructors can also run live online classes inside the platform.",
  },
  {
    q: "Can CyberLoy train our internal security team?",
    a: "Yes. We deliver role-based programmes for engineers, SOC analysts, developers, risk teams and executives as workshops, hands-on labs and simulation exercises.",
  },
  {
    q: "What does a security assessment include?",
    a: "We review your current controls, exposure and priorities, then deliver a findings report and a sequenced remediation roadmap scoped to your environment, budget and regulatory obligations.",
  },
  {
    q: "We have an active incident. How fast can you help?",
    a: "Use the emergency support option on this page to reach our incident response team for containment, forensics and recovery support.",
  },
];

const Section = ({ id, children, className = "", labelledBy }) => (
  <section
    id={id}
    aria-labelledby={labelledBy}
    className={`scroll-mt-20 px-5 py-20 lg:px-8 lg:py-28 ${className}`}
  >
    <div className="mx-auto w-full max-w-[80rem]">{children}</div>
  </section>
);

const Eyebrow = ({ children, dark = false }) => (
  <p
    className={`mb-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] ${
      dark ? "text-accent" : "text-[#0052FE]"
    }`}
  >
    <span className={`h-px w-6 ${dark ? "bg-accent" : "bg-[#0052FE]"}`} />
    {children}
  </p>
);

const SectionHeading = ({ id, children, className = "", dark = false }) => (
  <h2
    id={id}
    className={`max-w-3xl font-display text-3xl font-bold leading-tight sm:text-4xl ${
      dark ? "text-white" : "text-foreground"
    } ${className}`}
  >
    {children}
  </h2>
);

const primaryBtn =
  "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[#0052FE] px-6 text-sm font-semibold text-white shadow-lg shadow-[#0052FE]/30 transition hover:bg-[#0045d6] hover:shadow-xl hover:shadow-[#0052FE]/40 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--ink))]";
const ghostBtn =
  "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-white/25 bg-white/5 px-6 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";
const lightCard =
  "group h-full rounded-2xl border border-border bg-card p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#0052FE]/40 hover:shadow-xl hover:shadow-[#0052FE]/10";

export default function HomePage() {
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .getCourses()
      .then((data) => {
        if (active) setCourses((data || []).slice(0, 3));
      })
      .catch((e) => console.error("Failed to load courses:", e))
      .finally(() => {
        if (active) setCoursesLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  // Structured data: organisation, site, FAQ and the featured course list.
  const structuredData = useMemo(() => {
    const graph = [
      {
        "@type": ["Organization", "EducationalOrganization"],
        "@id": `${origin}/#organization`,
        name: "CyberLoy",
        url: `${origin}/`,
        logo: HERO_IMG,
        email: CONTACT_EMAIL,
        description:
          "Cybersecurity consulting, managed security operations, incident response, GRC and professional cybersecurity training.",
      },
      {
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        name: "CyberLoy",
        url: `${origin}/`,
        publisher: { "@id": `${origin}/#organization` },
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ];
    if (courses.length > 0) {
      graph.push({
        "@type": "ItemList",
        name: "Featured cybersecurity courses",
        itemListElement: courses.map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "Course",
            name: c.title,
            description: c.description || c.title,
            url: `${origin}/courses/${c.id}`,
            provider: { "@id": `${origin}/#organization` },
          },
        })),
      });
    }
    return JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
  }, [courses, origin]);

  return (
    <div id="top" className="min-h-screen bg-background">
      <Helmet>
        <title>
          CyberLoy | Cybersecurity Courses, Consulting & Managed Defence
        </title>
        <meta
          name="description"
          content="Learn cybersecurity with CyberLoy's hands-on online courses, live classes and verified certificates - and protect your business with expert consulting, managed SOC, incident response and GRC services."
        />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <link rel="preload" as="image" href={HERO_IMG} />
        <script type="application/ld+json">{structuredData}</script>
      </Helmet>
      <Seo
        title="CyberLoy | Cybersecurity Courses, Consulting & Managed Defence"
        description="Hands-on cybersecurity courses with verified certificates, plus consulting, Zero Trust architecture, SOC/MDR, incident response and GRC services."
        image={HERO_IMG}
        siteName="CyberLoy"
      />

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-900 focus:shadow-lg"
      >
        Skip to main content
      </a>

      <SiteNav />

      <main id="main-content">
        {/* HERO */}
        <section
          aria-labelledby="hero-heading"
          className="relative isolate flex min-h-[92dvh] items-center overflow-hidden bg-[hsl(var(--ink))]"
        >
          <img
            src={HERO_IMG}
            alt=""
            aria-hidden="true"
            // React 18 only forwards the lowercase attribute (fetchPriority is React 19+).
            {...{ fetchpriority: "high" }}
            decoding="async"
            className="absolute inset-0 -z-20 h-full w-full object-cover opacity-35"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[hsl(var(--ink))] via-[hsl(var(--ink))]/90 to-[hsl(var(--ink))]/40" />
          <div className="grid-lines absolute inset-0 -z-10 opacity-[0.06]" />
          <div aria-hidden="true" className="absolute -left-32 top-1/4 -z-10 h-96 w-96 rounded-full bg-[#0052FE]/30 blur-[120px]" />
          <div aria-hidden="true" className="absolute -right-24 bottom-0 -z-10 h-80 w-80 rounded-full bg-cyan-400/20 blur-[110px]" />

          <div className="relative mx-auto grid w-full max-w-[80rem] gap-14 px-5 py-24 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:px-8">
            <div>
              <Reveal>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-slate-200 backdrop-blur">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60 motion-reduce:animate-none" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                  </span>
                  Consulting · Engineering · Managed Defence · Training
                </span>
              </Reveal>
              <Reveal delay={0.08}>
                <h1
                  id="hero-heading"
                  className="mt-6 font-display text-4xl font-bold leading-[1.05] text-white sm:text-5xl lg:text-6xl"
                >
                  Secure What Matters.
                  <span className="mt-2 block bg-gradient-to-r from-cyan-300 via-sky-400 to-[#5b8cff] bg-clip-text text-transparent">
                    Enable What&apos;s Next.
                  </span>
                </h1>
              </Reveal>
              <Reveal delay={0.16}>
                <p className="mt-7 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
                  CyberLoy protects the infrastructure, cloud, identities, data
                  and applications your business runs on - and trains the people
                  who defend them, with hands-on cybersecurity courses and
                  verified certificates.
                </p>
              </Reveal>
              <Reveal delay={0.24}>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <Link to="/courses" className={primaryBtn}>
                    Explore Courses <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <a href="#assessment" className={ghostBtn}>
                    Request a Security Assessment
                  </a>
                </div>
              </Reveal>
              <Reveal delay={0.3}>
                <dl className="mt-12 grid max-w-xl grid-cols-3 gap-4 border-t border-white/10 pt-8">
                  {heroStats.map((s) => (
                    <div key={s.l}>
                      <dt className="sr-only">{s.l}</dt>
                      <dd className="font-display text-2xl font-bold text-white sm:text-3xl">
                        <CountUp value={s.v} suffix={s.suffix} />
                      </dd>
                      <dd className="mt-1 text-xs leading-snug text-slate-400">{s.l}</dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            </div>

            <Reveal delay={0.3}>
              <div className="relative rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/30 backdrop-blur-md sm:p-8">
                <div aria-hidden="true" className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                  Programme at a glance
                </p>
                <dl className="mt-5 space-y-1">
                  {[
                    [ShieldCheck, "Coverage", "Infrastructure, cloud, identity, data, apps, OT"],
                    [Radar, "Delivery", "Advisory, engineering, managed SOC, response"],
                    [Scale, "Assurance", "GRC alignment, testing, continuous reporting"],
                    [GraduationCap, "Enablement", "Online courses, live classes & certificates"],
                  ].map(([Icon, k, v]) => (
                    <div key={k} className="flex gap-4 rounded-xl p-3 transition-colors hover:bg-white/5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-cyan-300">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{k}</dt>
                        <dd className="mt-0.5 text-sm font-medium text-slate-100">{v}</dd>
                      </div>
                    </div>
                  ))}
                </dl>
              </div>
            </Reveal>
          </div>
        </section>

        {/* TRUST MARQUEE */}
        <div className="overflow-hidden border-y border-border bg-secondary/60 py-4" aria-label="Capabilities">
          <div className="marquee-track flex w-max gap-10 whitespace-nowrap">
            {[...marquee, ...marquee].map((item, i) => (
              <span
                key={`${item}-${i}`}
                aria-hidden={i >= marquee.length ? "true" : undefined}
                className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-[#0052FE]" strokeWidth={2} aria-hidden="true" />
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* FEATURED COURSES */}
        <Section id="courses" labelledBy="courses-heading" className="relative overflow-hidden">
          <div aria-hidden="true" className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-[#0052FE]/10 blur-3xl" />
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <Reveal>
              <Eyebrow>Cybersecurity Academy</Eyebrow>
              <SectionHeading id="courses-heading">
                Build in-demand security skills with hands-on courses.
              </SectionHeading>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
                Practitioner-built courses with video lessons, graded
                assessments, live classes and a certificate when you finish.
              </p>
            </Reveal>
            <Link
              to="/courses"
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:border-[#0052FE]/40 hover:text-[#0052FE]"
            >
              Browse all courses <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-12">
            {coursesLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading courses">
                {Array.from({ length: 3 }, (_, i) => (
                  <CourseCardSkeleton key={i} />
                ))}
              </div>
            ) : courses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
                <GraduationCap className="mx-auto h-10 w-10 text-[#0052FE]" aria-hidden="true" />
                <p className="mt-4 font-display text-lg font-semibold">New courses are on the way</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create a free account to be ready when enrolment opens.
                </p>
                <Link to="/register" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#0052FE] hover:underline">
                  Create an account <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((course, i) => (
                  <Reveal key={course.id} delay={i * 0.08} className="h-full">
                    <CourseCard course={course} />
                  </Reveal>
                ))}
              </div>
            )}
          </div>

          <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {learningFeatures.map((f) => (
              <li key={f.t} className="flex gap-4 rounded-2xl border border-border bg-card/60 p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0052FE]/10 text-[#0052FE]">
                  <f.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-display text-sm font-bold text-foreground">{f.t}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{f.d}</p>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        {/* TRUST / CREDIBILITY */}
        <Section id="company" labelledBy="company-heading" className="border-y border-border bg-secondary/40">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <Reveal>
              <Eyebrow>Why organisations trust CyberLoy</Eyebrow>
              <SectionHeading id="company-heading">
                Practitioner-led security, accountable from advice to operations.
              </SectionHeading>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                Our consultants, architects and analysts work inside regulated,
                high-availability environments every day. That means
                recommendations you can implement, controls that survive audit,
                and operations that hold up under real pressure.
              </p>
            </Reveal>
            <div className="grid gap-5 sm:grid-cols-2">
              {trustPoints.map((p, i) => (
                <Reveal key={p.t} delay={i * 0.06} className="h-full">
                  <div className={lightCard}>
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0052FE]/10 text-[#0052FE] transition group-hover:bg-[#0052FE] group-hover:text-white">
                      <CheckCircle2 className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 font-display text-base font-bold text-foreground">{p.t}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{p.d}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </Section>

        {/* WHAT WE DO */}
        <Section labelledBy="lifecycle-heading" className="bg-[hsl(var(--ink))]">
          <Reveal>
            <Eyebrow dark>How we work</Eyebrow>
            <SectionHeading id="lifecycle-heading" dark>
              One lifecycle, from first assessment to continuous defence.
            </SectionHeading>
          </Reveal>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {pillars.map((p, i) => (
              <Reveal key={p.t} delay={i * 0.08} className="h-full">
                <div className="group relative h-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-8 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-white/[0.07]">
                  <div aria-hidden="true" className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#0052FE]/20 blur-3xl transition-opacity duration-300 group-hover:opacity-100 opacity-0" />
                  <div className="flex items-center justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#0052FE] to-cyan-500 text-white shadow-lg shadow-[#0052FE]/30">
                      <p.icon className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
                    </span>
                    <span className="font-mono text-xs font-semibold text-slate-500">0{i + 1}</span>
                  </div>
                  <h3 className="mt-6 font-display text-xl font-bold text-white">{p.t}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-400">{p.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Section>

        {/* SERVICES */}
        <Section id="services" labelledBy="services-heading">
          <Reveal>
            <Eyebrow>Core services</Eyebrow>
            <SectionHeading id="services-heading">
              Thirteen practice areas, one coordinated security programme.
            </SectionHeading>
          </Reveal>
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {services.map((s) => (
              <li key={s.t}>
                <div className={lightCard}>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0052FE]/10 text-[#0052FE] transition group-hover:bg-[#0052FE] group-hover:text-white">
                    <s.icon className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-display text-base font-bold text-foreground">{s.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        {/* SOLUTIONS */}
        <Section id="solutions" labelledBy="solutions-heading" className="border-y border-border bg-secondary/40">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <Reveal>
              <Eyebrow>Featured solutions</Eyebrow>
              <SectionHeading id="solutions-heading">Outcome-focused solution architectures.</SectionHeading>
            </Reveal>
            <a href="#assessment" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[#0052FE] hover:underline">
              Discuss a solution fit <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
          <ol className="mt-12 grid gap-4 md:grid-cols-2">
            {solutions.map((s, i) => (
              <li key={s.t}>
                <div className={`${lightCard} flex gap-5`}>
                  <span className="font-mono text-sm font-bold text-[#0052FE]/60 transition group-hover:text-[#0052FE]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground">{s.t}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        {/* METHODOLOGY */}
        <Section labelledBy="method-heading" className="bg-[hsl(var(--ink))]">
          <Reveal>
            <Eyebrow dark>Our methodology</Eyebrow>
            <SectionHeading id="method-heading" dark>
              A nine-stage cycle that keeps security measurable.
            </SectionHeading>
          </Reveal>
          <ol className="mt-12 grid gap-3 sm:grid-cols-3">
            {method.map((m, i) => (
              <li
                key={m}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition duration-300 hover:border-cyan-300/40 hover:bg-white/[0.07]"
              >
                <span className="font-mono text-xs font-bold text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="mt-2 font-display text-xl font-bold text-white">{m}</p>
                <span aria-hidden="true" className="mt-4 block h-[3px] w-10 rounded-full bg-gradient-to-r from-[#0052FE] to-cyan-400 transition-all duration-300 group-hover:w-20" />
              </li>
            ))}
          </ol>
        </Section>

        {/* INDUSTRIES */}
        <Section id="industries" labelledBy="industries-heading">
          <Reveal>
            <Eyebrow>Industries we serve</Eyebrow>
            <SectionHeading id="industries-heading">
              Sector context changes the threat model - and our approach.
            </SectionHeading>
          </Reveal>
          <ul className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {industries.map((ind) => (
              <li
                key={ind.t}
                className="group flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-[#0052FE]/40 hover:shadow-lg hover:shadow-[#0052FE]/10"
              >
                <ind.icon className="h-5 w-5 shrink-0 text-[#0052FE]" strokeWidth={2} aria-hidden="true" />
                <span className="font-display text-sm font-semibold">{ind.t}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* MANAGED SOC */}
        <Section labelledBy="soc-heading" className="border-y border-border bg-secondary/40">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <div className="relative">
                <div aria-hidden="true" className="absolute -inset-3 -z-10 rounded-3xl bg-gradient-to-br from-[#0052FE]/20 to-cyan-400/20 blur-xl" />
                <img
                  src={SOC_IMG}
                  alt="CyberLoy security operations centre analysts monitoring threat dashboards"
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/3] w-full rounded-2xl border border-border object-cover shadow-xl"
                />
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <Eyebrow>Managed security & SOC</Eyebrow>
              <SectionHeading id="soc-heading">Continuous defence, run by people who engineer it.</SectionHeading>
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
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2} aria-hidden="true" />
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </Section>

        {/* OUTCOMES */}
        <Section labelledBy="outcomes-heading">
          <Reveal>
            <Eyebrow>Business outcomes</Eyebrow>
            <SectionHeading id="outcomes-heading">
              Security measured the way the business measures everything else.
            </SectionHeading>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {outcomes.map((o, i) => (
              <Reveal key={o.l} delay={i * 0.06} className="h-full">
                <div className={lightCard}>
                  <p className="bg-gradient-to-r from-[#0052FE] to-cyan-500 bg-clip-text font-display text-4xl font-extrabold text-transparent">
                    <CountUp value={o.v} suffix={o.suffix} />
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{o.l}</p>
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
        <Section id="training" labelledBy="why-heading" className="border-y border-border bg-secondary/40">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            <Reveal>
              <Eyebrow>Why choose CyberLoy</Eyebrow>
              <SectionHeading id="why-heading">Depth where it counts, clarity where it matters.</SectionHeading>
              <ul className="mt-8 grid gap-4">
                {why.map((w) => (
                  <li key={w} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0052FE]" aria-hidden="true" />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-slate-900/5">
                <img
                  src={TRAINING_IMG}
                  alt="CyberLoy professional cybersecurity training workshop"
                  loading="lazy"
                  decoding="async"
                  className="h-64 w-full object-cover sm:h-72"
                />
                <div className="p-7">
                  <Eyebrow>Professional training</Eyebrow>
                  <h3 className="font-display text-xl font-bold">Build capability inside your own team.</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    Role-based programmes for engineers, SOC analysts,
                    developers, risk teams and executives - delivered as
                    workshops, hands-on labs and simulation exercises, aligned
                    to the controls you actually operate.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      to="/courses"
                      className="inline-flex items-center gap-2 rounded-full bg-[#0052FE] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0045d6]"
                    >
                      View online courses <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                    <a
                      href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Team training enquiry")}`}
                      className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition hover:border-[#0052FE]/40 hover:text-[#0052FE]"
                    >
                      Plan team training
                    </a>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </Section>

        {/* CASE STUDIES */}
        <Section labelledBy="cases-heading">
          <Reveal>
            <Eyebrow>Case studies</Eyebrow>
            <SectionHeading id="cases-heading">Client work, published once approved.</SectionHeading>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              We publish engagement detail only with written client consent.
              Anonymised walkthroughs are available on request under NDA.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {cases.map((c, i) => (
              <Reveal key={c.t} delay={i * 0.06} className="h-full">
                <article className={`${lightCard} flex flex-col border-dashed`}>
                  <Quote className="h-6 w-6 text-[#0052FE]/60" strokeWidth={2} aria-hidden="true" />
                  <span className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{c.sector}</span>
                  <h3 className="mt-2 font-display text-lg font-bold">{c.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.d}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </Section>

        {/* INSIGHTS */}
        <Section id="insights" labelledBy="insights-heading" className="border-y border-border bg-secondary/40">
          <Reveal>
            <Eyebrow>Insights & resources</Eyebrow>
            <SectionHeading id="insights-heading">Practical guidance from our practice leads.</SectionHeading>
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {insights.map((n, i) => (
              <Reveal key={n.t} delay={i * 0.06} className="h-full">
                <article className={`${lightCard} flex flex-col`}>
                  <span className="w-fit rounded-full bg-[#0052FE]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0052FE]">
                    {n.tag}
                  </span>
                  <h3 className="mt-4 font-display text-lg font-bold leading-snug">{n.t}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{n.d}</p>
                  <a
                    href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Briefing request: ${n.t}`)}`}
                    className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-[#0052FE] hover:underline"
                  >
                    Request the briefing <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                </article>
              </Reveal>
            ))}
          </div>
        </Section>

        {/* FAQ */}
        <Section id="faq" labelledBy="faq-heading">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <Reveal>
              <Eyebrow>FAQ</Eyebrow>
              <SectionHeading id="faq-heading">Questions, answered.</SectionHeading>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Can&apos;t find what you need?{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-[#0052FE] hover:underline">
                  Email our team
                </a>
                .
              </p>
            </Reveal>
            <Reveal delay={0.08}>
              <Accordion type="single" collapsible className="rounded-2xl border border-border bg-card px-6 shadow-sm">
                {faqs.map((f, i) => (
                  <AccordionItem key={f.q} value={`faq-${i}`} className={i === faqs.length - 1 ? "border-b-0" : ""}>
                    <AccordionTrigger className="text-left font-display text-base font-semibold hover:no-underline hover:text-[#0052FE]">
                      {f.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                      {f.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Reveal>
          </div>
        </Section>

        {/* FINAL CTA + EMERGENCY */}
        <Section id="assessment" labelledBy="cta-heading" className="relative overflow-hidden bg-[hsl(var(--ink))]">
          <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-0 h-80 w-80 rounded-full bg-[#0052FE]/25 blur-[110px]" />
          <div className="relative grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <Reveal>
              <Eyebrow dark>Next step</Eyebrow>
              <SectionHeading id="cta-heading" dark>
                Start with a security assessment. Decide with evidence.
              </SectionHeading>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300">
                We review your current controls, exposure and priorities, then
                return a clear findings report and a sequenced roadmap - scoped
                to your environment, budget and regulatory obligations.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a
                  href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Security assessment request")}`}
                  className={primaryBtn}
                >
                  Request a Security Assessment <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
                <Link to="/register" className={ghostBtn}>
                  <Sparkles className="h-4 w-4" aria-hidden="true" /> Start learning free
                </Link>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div
                id="emergency"
                className="rounded-2xl border border-rose-400/30 bg-gradient-to-br from-rose-500/15 to-rose-500/5 p-7 shadow-2xl shadow-rose-950/20"
              >
                <div className="flex items-center gap-2 text-rose-200">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-70 motion-reduce:animate-none" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-400" />
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">Emergency support</span>
                </div>
                <h3 className="mt-4 font-display text-xl font-bold text-white">Active incident? Escalate now.</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  Our incident response team supports containment, forensics
                  and recovery for suspected breaches, ransomware and business
                  email compromise.
                </p>
                <button
                  type="button"
                  onClick={() => setShowEmergencyModal(true)}
                  className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-[hsl(var(--ink))] transition hover:bg-rose-50 active:scale-[0.98]"
                >
                  <Siren className="h-4 w-4 text-rose-600" aria-hidden="true" /> Contact incident response
                </button>
              </div>
            </Reveal>
          </div>
        </Section>
      </main>

      <EmergencySupportModal isOpen={showEmergencyModal} onClose={() => setShowEmergencyModal(false)} />

      <SiteFooter />
    </div>
  );
}
