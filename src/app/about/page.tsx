import type { Metadata } from "next";
import { AboutClient } from "./AboutClient";

export const metadata: Metadata = {
  title: "About | FilterMyDisco.gs",
  description:
    "About FilterMyDisco.gs, contact information, and how to support the project",
};

export default function AboutPage() {
  return <AboutClient />;
}
