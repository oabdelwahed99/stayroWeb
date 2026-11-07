"use client";

import { useTranslations } from "next-intl";
import { Mail, Phone } from "lucide-react";

const PHONES = [
  { href: "tel:+966551234471", label: "+966 55 123 4471" },
  { href: "tel:+966546546480", label: "+966 546 546 480" },
];

const EMAILS = [
  { href: "mailto:Rakan@stayro.com", label: "Rakan@stayro.com" },
  { href: "mailto:Abdulrahman@stayro.com", label: "Abdulrahman@stayro.com" },
];

const SOCIALS = [
  {
    href: "https://www.instagram.com/StayroApp",
    labelKey: "instagram" as const,
    icon: InstagramIcon,
  },
  {
    href: "https://www.tiktok.com/@StayroApp",
    labelKey: "tiktok" as const,
    icon: TikTokIcon,
  },
  {
    href: "https://x.com/StayroApp",
    labelKey: "x" as const,
    icon: XIcon,
  },
];

export function SiteFooter() {
  const t = useTranslations("common");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/40">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 text-center text-sm text-muted-foreground">
        <p className="font-medium text-foreground">{t("tagline")}</p>
        <p>{t("contactTitle")}</p>
        <div dir="ltr" className="flex flex-col items-center gap-2 font-medium text-foreground">
          {PHONES.map((phone) => (
            <a
              key={phone.href}
              href={phone.href}
              className="inline-flex items-center gap-2 transition-colors hover:text-primary"
            >
              <Phone className="size-4" aria-hidden />
              <span>{phone.label}</span>
            </a>
          ))}
          {EMAILS.map((email) => (
            <a
              key={email.href}
              href={email.href}
              className="inline-flex items-center gap-2 transition-colors hover:text-primary"
            >
              <Mail className="size-4" aria-hidden />
              <span>{email.label}</span>
            </a>
          ))}
        </div>
        <div dir="ltr" className="flex flex-wrap items-center justify-center gap-4">
          {SOCIALS.map((social) => (
            <a
              key={social.href}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t(social.labelKey)}
              className="inline-flex items-center gap-2 font-medium text-foreground transition-colors hover:text-primary"
            >
              <social.icon />
              <span>StayroApp</span>
            </a>
          ))}
        </div>
        <p>{t("license")}</p>
        <p>{t("copyright", { year })}</p>
      </div>
    </footer>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
      <path d="M12 2.2c3.2 0 3.6 0 4.9.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.9.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9-.1-1.2-.1-1.6-.1-4.8s0-3.6.1-4.8C2.4 4 4 2.4 7.2 2.3 8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.1 0-3.5 0-4.7.1-2.2.1-3.2 1.1-3.3 3.3-.1 1.2-.1 1.6-.1 4.6s0 3.4.1 4.7c.1 2.2 1.1 3.2 3.3 3.3 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c2.2-.1 3.2-1.1 3.3-3.3.1-1.2.1-1.6.1-4.7s0-3.4-.1-4.6c-.1-2.2-1.1-3.2-3.3-3.3-1.2-.1-1.6-.1-4.7-.1zm0 3.1a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8zm0 1.8a3.1 3.1 0 1 0 0 6.2 3.1 3.1 0 0 0 0-6.2zm6.3-2.2a1.1 1.1 0 1 1-2.3 0 1.1 1.1 0 0 1 2.3 0z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
      <path d="M12.5 2c1.2 0 2.4 0 3.6 0 .1 1.4.6 2.8 1.6 3.8 1 1 2.5 1.5 3.9 1.6v3.7c-1.3 0-2.6-.3-3.8-.9-.5-.2-1-.5-1.5-.8v8c-.1 1.3-.5 2.5-1.2 3.6-1.2 1.7-3.3 2.9-5.4 2.9-1.3.1-2.6-.3-3.7-.9-1.8-1.1-3.1-3.1-3.3-5.2 0-.4 0-.9 0-1.4.2-1.7 1-3.4 2.4-4.5 1.5-1.3 3.6-1.9 5.6-1.6v4c-.9-.3-2-.2-2.8.3-.6.4-1 1-1.2 1.6-.2.5-.1 1-.1 1.5.2 1.5 1.7 2.8 3.2 2.6 1 0 2-.6 2.5-1.5.2-.3.4-.6.4-1 .1-1.6.1-3.3.1-4.9V2z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
      <path d="M14.3 10.4 18.7 5h-1.1l-3.8 4.4L10.7 5H6.5l4.6 6.7L6.5 19h1.1l4-4.7 3.2 4.7h4.2l-4.7-6.9zm-1.4 1.7-.5-.7-3.7-5.3h1.6l3 4.3.5.7 4 5.6h-1.6l-3.3-4.6z" />
    </svg>
  );
}
