import { loadPortfolio } from "@/lib/content/loadPortfolio";
import { getHomepageSections } from "@/lib/homepage";
import { Hero } from "@/components/home/Hero";
import { SelectedWork } from "@/components/home/SelectedWork";
import { Lab } from "@/components/home/Lab";
import { Timeline } from "@/components/home/Timeline";
import { About, Stack } from "@/components/home/About";
import { Contact } from "@/components/home/Contact";
import "./homepage.css";

export default function Page() {
  const portfolio = loadPortfolio();
  const sections = getHomepageSections(portfolio);
  return sections.map((section, index) => {
    const props = { portfolio, index: index + 1 };
    switch (section) {
      case "hero":
        return (
          <Hero
            key={section}
            portfolio={portfolio}
            nextSection={sections[index + 1]}
          />
        );
      case "work":
        return <SelectedWork key={section} {...props} />;
      case "lab":
        return <Lab key={section} {...props} />;
      case "timeline":
        return <Timeline key={section} {...props} />;
      case "about":
        return <About key={section} {...props} />;
      case "stack":
        return <Stack key={section} {...props} />;
      case "contact":
        return <Contact key={section} {...props} />;
    }
  });
}
