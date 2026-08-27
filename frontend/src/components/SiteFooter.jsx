import React from "react";
import { Mail, PhoneCall, MapPin } from "lucide-react";
import logoUrl from "@/assets/cyberloy-logo.png";
import { useNavigate } from "react-router-dom";

const columns = [
  {
    title: "Services",
    links: [
      "Infrastructure",
      "Cloud",
      "Data",
      "Endpoint",
      "Application",
      "Identity",
      "Security Operations",
      "Incident Response",
    ],
  },
  {
    title: "Solutions",
    links: [
      "Zero Trust",
      "SOC / MDR",
      "SIEM / SOAR",
      "XDR / EDR",
      "Identity & PAM",
      "Data Protection",
      "Cyber Resilience",
      "AI Security",
    ],
  },
  {
    title: "Company",
    links: [
      "About CyberLoy",
      "Our Approach",
      "Careers",
      "Partners",
      "Training Academy",
      "Insights",
      "Contact",
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-border bg-[hsl(var(--ink))] text-slate-300">
      <div className="mx-auto grid w-full max-w-[90rem] gap-10 px-5 py-16 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <a href="#top" className="flex shrink-0 items-center">
            <img
              src={logoUrl}
              alt="CyberLoy"
              className="block h-11 w-auto max-w-[10rem] object-contain sm:h-12 sm:max-w-[12rem] rounded bg-white px-2 py-1"
            />
          </a>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
            Cybersecurity consulting, engineering, managed defence and training
            for organisations that cannot afford downtime, data loss, or
            regulatory failure.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-slate-400">
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-accent" /> connect@cyberloy.com
            </li>
            <li className="flex items-center gap-2">
              <PhoneCall className="h-4 w-4 text-accent" /> 24/7 incident line
              +8801744201201
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent" /> Regional delivery
              centres
            </li>
          </ul>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
              {col.title}
            </p>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link}>
                  <a
                    href="#top"
                    className="text-sm text-slate-400 transition-colors hover:text-white"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-2 px-5 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>
            &copy; {new Date().getFullYear()} CyberLoy. All rights reserved.
          </p>
          <p className="flex gap-5">
            <a href="#top" className="hover:text-slate-300">
              Privacy
            </a>
            <a href="#top" className="hover:text-slate-300">
              Terms
            </a>
            <a href="#top" className="hover:text-slate-300">
              Responsible disclosure
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
