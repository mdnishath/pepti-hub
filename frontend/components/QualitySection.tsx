import { FlaskConical, Activity, ShieldCheck } from "lucide-react";

const features = [
  { icon: FlaskConical, title: "HPLC Analysis", desc: "Every batch tested with High-Performance Liquid Chromatography for purity verification." },
  { icon: Activity, title: "Mass Spectrometry", desc: "Molecular weight confirmed via mass spectrometry to ensure correct peptide sequences." },
  { icon: ShieldCheck, title: "Strict QC Protocols", desc: "Multi-step quality control from synthesis through final packaging and labeling." },
];

const QualitySection = () => (
  <section id="quality" className="bg-background py-16 md:py-24">
    <div className="container">
      <h2 className="text-3xl md:text-4xl font-bold text-deep-blue text-center mb-12">
        Our Commitment to Quality
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {features.map((f) => (
          <div key={f.title} className="text-center flex flex-col items-center">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-5">
              <f.icon className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-deep-blue">{f.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-xs">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default QualitySection;
