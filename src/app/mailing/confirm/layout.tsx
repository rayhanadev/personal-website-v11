import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Email confirmed | Ray Arayilakath",
  description: "Subscription confirmed for Ray Arayilakath's mailing list.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function MailingConfirmLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
