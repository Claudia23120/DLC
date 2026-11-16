import { afterEach, describe, expect, it, vi } from "vitest";

const sendMail = vi.fn().mockResolvedValue({});
const createTransport = vi.fn(() => ({ sendMail }));
vi.mock("nodemailer", () => ({ default: { createTransport } }));
vi.mock("resend", () => ({ Resend: vi.fn() }));

async function load() {
  vi.resetModules();
  return (await import("../resend")).sendEmail;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("sendEmail", () => {
  it("sends over SMTP when SMTP_HOST is set", async () => {
    vi.stubEnv("EMAILS_ENABLED", "true");
    vi.stubEnv("SMTP_HOST", "mailpit");
    vi.stubEnv("EMAIL_FROM", "avisos@test.cat");
    const sendEmail = await load();
    await sendEmail({ to: ["a@x.cat", "b@x.cat"], subject: "Hola", html: "<p>x</p>" });
    expect(createTransport).toHaveBeenCalledWith(expect.objectContaining({ host: "mailpit", port: 1025 }));
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "avisos@test.cat", bcc: ["a@x.cat", "b@x.cat"], subject: "Hola" }),
    );
  });

  it("does nothing when emails are disabled", async () => {
    vi.stubEnv("EMAILS_ENABLED", "false");
    vi.stubEnv("SMTP_HOST", "mailpit");
    const sendEmail = await load();
    await sendEmail({ to: ["a@x.cat"], subject: "Hola", html: "<p>x</p>" });
    expect(sendMail).not.toHaveBeenCalled();
  });
});
