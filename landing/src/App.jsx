import Header from "./components/Header";
import Hero from "./components/Hero";
import StickyCta from "./components/StickyCta";
import Waitlist from "./components/Waitlist";
import {
  DecisionLoop,
  HowItWorks,
  KillerFeature,
  TrustBand,
  RecordPreview,
  FeatureChips,
} from "./components/Sections";

export default function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <DecisionLoop />
        <HowItWorks />
        <KillerFeature />
        <TrustBand />
        <RecordPreview />
        <FeatureChips />
      </main>
      <Waitlist />
      <StickyCta />
    </>
  );
}
