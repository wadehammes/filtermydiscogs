import type { Metadata } from "next";
import { AboutClient } from "./AboutClient";

export const metadata: Metadata = {
  title: "About | FilterMyDisco.gs",
  description:
    "Terms of Service, Privacy Policy, and contact information for Filter My Disco.gs",
};

export default function AboutPage() {
  return <AboutClient />;
}
