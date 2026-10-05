import Link from "next/link";
import BrunoWheelLab from "@/components/BrunoWheelLab";

export default function BrunoPage() {
  return (
    <div className="min-h-[80vh] py-6 space-y-6">
      <Link href="/learn" className="text-sm text-muted-foreground hover:text-foreground">← Learn</Link>
      <div>
        <h1 className="text-3xl font-bold">Bruno × Sanskrit Wheel Lab</h1>
        <p className="text-muted-foreground mt-2">
          Combinatorial memory interface. Bruno supplies representation; Pāṇini supplies validity.
          Predict first, validate second, then bind the result into your personal sensory world.
        </p>
      </div>
      <BrunoWheelLab />
    </div>
  );
}
