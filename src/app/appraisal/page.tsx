import type { Metadata } from "next";
import { AppraisalForm } from "@/components/AppraisalForm";

export const metadata: Metadata = {
  title: "Request an appraisal",
  description:
    "Request a North Shore property appraisal from Drew Miller. Clear next steps, recent nearby sales, and no pressure.",
};

export default function AppraisalPage() {
  return (
    <section className="section">
      <div className="shell grid gap-10 lg:grid-cols-2">
        <div>
          <p className="eyebrow">Sell with clarity</p>
          <h1 className="display mt-2 text-5xl md:text-6xl">
            Get an appraisal that actually helps you decide
          </h1>
          <p className="prose-site mt-5">
            Share your address and we’ll come back with local context, recent
            nearby sales, and a clear recommendation on timing and positioning —
            not a generic number.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-ink-soft">
            <li>• North Shore specialist insight</li>
            <li>• Recent sold prices from nearby streets</li>
            <li>• Proven results across the Shore</li>
          </ul>
        </div>
        <AppraisalForm />
      </div>
    </section>
  );
}
