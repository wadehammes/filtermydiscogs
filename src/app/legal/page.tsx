import type { Metadata } from "next";
import { LegalClient } from "./LegalClient";

export const metadata: Metadata = {
  title: "Terms & Privacy | FilterMyDisco.gs",
  description: "Terms of Service and Privacy Policy for FilterMyDisco.gs",
};

export default function LegalPage() {
  return <LegalClient />;
}
