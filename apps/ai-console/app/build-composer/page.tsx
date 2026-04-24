import { BuildComposerForm } from "@/components/build-composer-form";

export default function BuildComposerPage() {
  return (
    <section>
      <h1 className="page-headline">Build Composer</h1>
      <p className="page-subtitle">
        Submit implementation requests with execution mode, risk profile, and staged deployment intent.
      </p>
      <BuildComposerForm />
    </section>
  );
}
