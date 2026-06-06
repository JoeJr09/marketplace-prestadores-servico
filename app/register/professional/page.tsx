"use client";

import Link from "next/link";
import { startTransition, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

import { InputPhone } from "@/components/e/InputPhone";
import { normalizeBusinessName } from "@/app/lib/professional-slug";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

type RegisterResponse = {
  error?: string;
  details?: Record<string, string[] | undefined>;
};

const passwordChecks = [
  {
    key: "uppercase",
    label: "Uppercase letter",
    test: (value: string) => /[A-Z]/.test(value),
  },
  {
    key: "lowercase",
    label: "Lowercase letter",
    test: (value: string) => /[a-z]/.test(value),
  },
  {
    key: "number",
    label: "Number",
    test: (value: string) => /[0-9]/.test(value),
  },
  {
    key: "special",
    label: "Special character",
    test: (value: string) => /[^A-Za-z0-9]/.test(value),
  },
  {
    key: "match",
    label: "Passwords match",
    test: (value: string, confirmPassword: string) =>
      confirmPassword.length > 0 && value === confirmPassword,
  },
  {
    key: "length",
    label: "At least 8 characters",
    test: (value: string) => value.length >= 8,
  },
] as const;

function uniqueMessages(values: Array<string | undefined>) {
  return Array.from(new Set(values.filter(Boolean))) as string[];
}

function PasswordChecklist({
  password,
  confirmPassword,
}: {
  password: string;
  confirmPassword: string;
}) {
  return (
    <div className="grid gap-3 rounded-2xl border border-white/70 bg-white p-4 shadow-[0_25px_60px_-35px_rgba(4,22,39,0.55)]">
      {passwordChecks.map((item) => {
        const checked = item.test(password, confirmPassword);

        return (
          <label
            key={item.key}
            className="flex items-center gap-3 text-sm text-text-muted"
          >
            <Checkbox
              checked={checked}
              tabIndex={-1}
              aria-hidden="true"
              className="pointer-events-none data-checked:border-brand-navy data-checked:bg-brand-navy"
            />
            <span className={checked ? "text-text-main" : "text-text-muted"}>
              {item.label}
            </span>
          </label>
        );
      })}
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  visible,
  onToggleVisibility,
  autoComplete,
  onFocus,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  visible: boolean;
  onToggleVisibility: () => void;
  autoComplete: string;
  onFocus: () => void;
}) {
  return (
    <div className="space-y-3">
      <label
        htmlFor={id}
        className="block text-xs font-bold uppercase tracking-[0.26em] text-text-main"
      >
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={onFocus}
          className="h-14 rounded-2xl border-transparent bg-surface-muted px-5 pr-16 text-base text-text-main placeholder:text-brand-navy-soft focus-visible:border-brand-navy-soft focus-visible:ring-brand-navy-soft/30"
          required
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute right-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-xl text-brand-steel-deep hover:bg-white/70 hover:text-text-main"
          onClick={onToggleVisibility}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </Button>
      </div>
    </div>
  );
}

export default function ProfessionalRegisterPage() {
  const router = useRouter();
  const passwordSectionRef = useRef<HTMLDivElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordHelper, setShowPasswordHelper] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    business_name: "",
    city: "",
    country: "",
  });

  function updateField(field: keyof typeof formData, value: string) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handlePasswordSectionBlur() {
    requestAnimationFrame(() => {
      const activeElement = document.activeElement;

      if (passwordSectionRef.current?.contains(activeElement)) {
        return;
      }

      setShowPasswordHelper(false);
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessages([]);

    try {
      const response = await fetch("/api/auth/register/professional", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = (await response.json()) as RegisterResponse;

      if (!response.ok) {
        const detailMessages = data.details
          ? Object.values(data.details).flat().filter(Boolean)
          : [];

        const messages = uniqueMessages([...detailMessages, data.error]);

        setErrorMessages(
          messages.length > 0
            ? messages
            : ["Nao foi possivel concluir o cadastro."],
        );
        return;
      }

      startTransition(() => {
        router.push("/login/professional");
      });
    } catch {
      setErrorMessages(["Nao foi possivel conectar ao servidor."]);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-[2rem] border border-white/70 bg-surface shadow-[0_30px_90px_-45px_rgba(4,22,39,0.35)] lg:grid-cols-[1.12fr_1fr]">
          <div className="relative hidden min-h-190 overflow-hidden bg-brand-navy text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,22,39,0.42)_0%,rgba(4,22,39,0.86)_100%),repeating-linear-gradient(90deg,rgba(255,255,255,0.055)_0,rgba(255,255,255,0.055)_2px,transparent_2px,transparent_28px),repeating-linear-gradient(0deg,rgba(255,255,255,0.04)_0,rgba(255,255,255,0.04)_2px,transparent_2px,transparent_34px)]" />

            <div className="relative z-10 space-y-10">
              <div className="inline-flex rounded-sm bg-brand-brown px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-brand-peach">
                Provider Network
              </div>

              <div className="max-w-md space-y-8">
                <h1 className="text-6xl font-black uppercase leading-[0.98] tracking-tighter text-white">
                  Build your service presence.
                </h1>
                <p className="max-w-sm text-[1.95rem] leading-8 text-brand-steel">
                  Join the marketplace, receive client requests, and manage
                  your professional profile.
                </p>
              </div>
            </div>

            <div className="relative z-10 space-y-4 text-white">
              <div className="flex items-center gap-4 text-lg uppercase tracking-[0.18em]">
                <span className="inline-flex size-7 items-center justify-center rounded-full border border-brand-peach text-brand-peach">
                  *
                </span>
                <span>Verified marketplace</span>
              </div>
              <div className="flex items-center gap-4 text-lg uppercase tracking-[0.18em]">
                <span className="inline-flex size-7 items-center justify-center rounded-full border border-brand-peach text-brand-peach">
                  #
                </span>
                <span>Professional dashboard</span>
              </div>
            </div>
          </div>

          <div className="flex min-h-190 items-center bg-surface-plain px-6 py-10 sm:px-10 lg:px-14 xl:px-16">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-10 space-y-3">
                <h2 className="text-4xl font-black uppercase tracking-[-0.04em] text-text-main sm:text-[2.65rem]">
                  Provider Registration
                </h2>
                <p className="text-lg text-text-muted">
                  Enter your details to create your professional account.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <label
                    htmlFor="full_name"
                    className="block text-xs font-bold uppercase tracking-[0.26em] text-text-main"
                  >
                    Full name
                  </label>
                  <Input
                    id="full_name"
                    type="text"
                    autoComplete="name"
                    placeholder="Architecture Smith"
                    value={formData.full_name}
                    onChange={(event) =>
                      updateField("full_name", event.target.value)
                    }
                    className="h-14 rounded-2xl border-transparent bg-surface-muted px-5 text-base text-text-main placeholder:text-brand-navy-soft focus-visible:border-brand-navy-soft focus-visible:ring-brand-navy-soft/30"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <label
                    htmlFor="business_name"
                    className="block text-xs font-bold uppercase tracking-[0.26em] text-text-main"
                  >
                    Business name
                  </label>
                  <Input
                    id="business_name"
                    type="text"
                    autoComplete="organization"
                    placeholder="acode-studio"
                    value={formData.business_name}
                    onChange={(event) =>
                      updateField(
                        "business_name",
                        normalizeBusinessName(event.target.value),
                      )
                    }
                    className="h-14 rounded-2xl border-transparent bg-surface-muted px-5 text-base text-text-main placeholder:text-brand-navy-soft focus-visible:border-brand-navy-soft focus-visible:ring-brand-navy-soft/30"
                  />
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-3">
                    <label
                      htmlFor="city"
                      className="block text-xs font-bold uppercase tracking-[0.26em] text-text-main"
                    >
                      City
                    </label>
                    <Input
                      id="city"
                      type="text"
                      autoComplete="address-level2"
                      placeholder="Fortaleza"
                      value={formData.city}
                      onChange={(event) => updateField("city", event.target.value)}
                      className="h-14 rounded-2xl border-transparent bg-surface-muted px-5 text-base text-text-main placeholder:text-brand-navy-soft focus-visible:border-brand-navy-soft focus-visible:ring-brand-navy-soft/30"
                    />
                  </div>

                  <div className="space-y-3">
                    <label
                      htmlFor="country"
                      className="block text-xs font-bold uppercase tracking-[0.26em] text-text-main"
                    >
                      Country
                    </label>
                    <Input
                      id="country"
                      type="text"
                      autoComplete="country-name"
                      placeholder="Brasil"
                      value={formData.country}
                      onChange={(event) =>
                        updateField("country", event.target.value)
                      }
                      className="h-14 rounded-2xl border-transparent bg-surface-muted px-5 text-base text-text-main placeholder:text-brand-navy-soft focus-visible:border-brand-navy-soft focus-visible:ring-brand-navy-soft/30"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label
                    htmlFor="email"
                    className="block text-xs font-bold uppercase tracking-[0.26em] text-text-main"
                  >
                    Email address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    className="h-14 rounded-2xl border-transparent bg-surface-muted px-5 text-base text-text-main placeholder:text-brand-navy-soft focus-visible:border-brand-navy-soft focus-visible:ring-brand-navy-soft/30"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <label
                    htmlFor="phone"
                    className="block text-xs font-bold uppercase tracking-[0.26em] text-text-main"
                  >
                    Phone number
                  </label>
                  <InputPhone
                    id="phone"
                    autoComplete="tel"
                    placeholder="(85) 9 9888-9756"
                    value={formData.phone}
                    onChange={(value) => updateField("phone", value)}
                    className="h-14 rounded-2xl border-transparent bg-surface-muted px-5 text-base text-text-main placeholder:text-brand-navy-soft focus-visible:border-brand-navy-soft focus-visible:ring-brand-navy-soft/30"
                    required
                  />
                </div>

                <div
                  ref={passwordSectionRef}
                  onBlur={handlePasswordSectionBlur}
                  className="relative space-y-6"
                >
                  <PasswordField
                    id="password"
                    label="Password"
                    value={formData.password}
                    onChange={(value) => updateField("password", value)}
                    placeholder="Enter your password"
                    visible={showPassword}
                    onToggleVisibility={() =>
                      setShowPassword((current) => !current)
                    }
                    autoComplete="new-password"
                    onFocus={() => setShowPasswordHelper(true)}
                  />

                  <PasswordField
                    id="confirm_password"
                    label="Confirm password"
                    value={formData.confirm_password}
                    onChange={(value) => updateField("confirm_password", value)}
                    placeholder="Repeat your password"
                    visible={showConfirmPassword}
                    onToggleVisibility={() =>
                      setShowConfirmPassword((current) => !current)
                    }
                    autoComplete="new-password"
                    onFocus={() => setShowPasswordHelper(true)}
                  />

                  {showPasswordHelper ? (
                    <div className="absolute left-0 top-full z-20 mt-2 w-full">
                      <PasswordChecklist
                        password={formData.password}
                        confirmPassword={formData.confirm_password}
                      />
                    </div>
                  ) : null}
                </div>

                {errorMessages.length > 0 ? (
                  <div className="rounded-2xl border border-[#ffd3c4] bg-[#fff3ef] px-4 py-3 text-sm font-medium text-[#8a3b18]">
                    <ul className="space-y-1.5">
                      {errorMessages.map((message) => (
                        <li key={message} className="flex gap-2 leading-6">
                          <span className="pt-[1px]">•</span>
                          <span>{message}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <Button
                  type="submit"
                  variant="brand"
                  size="xl"
                  className="mt-2 w-full uppercase tracking-[0.18em]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating account..." : "Create provider"}
                </Button>
              </form>

              <div className="mt-8 text-center text-base text-text-subtle">
                Already have a provider account?{" "}
                <Link
                  href="/login/professional"
                  className="font-semibold text-text-main transition-colors hover:text-brand-orange"
                >
                  Log in here
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
