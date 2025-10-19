import type { Metadata } from "next";
import HomeClient from "src/components/HomeClient/HomeClient.component";

export const metadata: Metadata = {
  title: "FilterMyDisco.gs - A Discogs collection management tool",
  description:
    "View, filter and sort your Discogs collection and build a crate as you browse",
};

export default function Home() {
  return <HomeClient />;
}
