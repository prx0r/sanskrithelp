import * as Phaser from "phaser";
import sandhiRules from "@/data/sandhi-rules.json";

interface SandhiExample {
  input: string[];
  output: string;
  annotation: string;
}

const rules = sandhiRules as Array<{
  id: string;
  signature: string;
  name: string;
  examples: SandhiExample[];
}>;

export class SandhiForgeScene extends Phaser.Scene {
  private ruleIndex = 0;
  private currentExample = 0;
  private score = 0;
  private inputBlocks: Phaser.GameObjects.Text[] = [];
  private outputBlock: Phaser.GameObjects.Text | null = null;
  private answerText: Phaser.GameObjects.Text | null = null;
  private feedbackText: Phaser.GameObjects.Text | null = null;

  constructor() {
    super({ key: "SandhiForge" });
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.add.text(w / 2, 24, "Sandhi Forge — Predict the junction", {
      fontSize: "20px",
      color: "#e8c547",
    }).setOrigin(0.5);

    this.add.text(w / 2, 52, "deva + indra = ?", {
      fontSize: "14px",
      color: "#94a3b8",
    }).setOrigin(0.5);

    this.nextChallenge();
  }

  private nextChallenge() {
    this.inputBlocks.forEach((b) => b.destroy());
    this.outputBlock?.destroy();
    this.answerText?.destroy();
    this.feedbackText?.destroy();

    const rule = rules[this.ruleIndex % rules.length];
    const ex = rule.examples[this.currentExample % rule.examples.length];
    this.currentExample++;

    const w = this.scale.width;
    const h = this.scale.height;
    const cy = h / 2;

    const left = this.add.text(w / 2 - 80, cy - 30, ex.input[0], {
      fontSize: "24px",
      color: "#c4b5fd",
    }).setOrigin(0.5);

    const plus = this.add.text(w / 2 - 10, cy - 30, "+", {
      fontSize: "20px",
      color: "#94a3b8",
    }).setOrigin(0.5);

    const right = this.add.text(w / 2 + 60, cy - 30, ex.input[1] || "", {
      fontSize: "24px",
      color: "#c4b5fd",
    }).setOrigin(0.5);

    this.inputBlocks = [left, plus, right];

    this.outputBlock = this.add.text(w / 2, cy + 40, "?", {
      fontSize: "28px",
      color: "#6a7a9a",
    }).setOrigin(0.5);

    this.answerText = this.add.text(w / 2, cy + 100, `Answer: ${ex.output}`, {
      fontSize: "18px",
      color: "#4ade80",
    }).setOrigin(0.5).setAlpha(0);

    this.feedbackText = this.add.text(w / 2, cy + 140, ex.annotation, {
      fontSize: "12px",
      color: "#94a3b8",
      wordWrap: { width: w - 80 },
      align: "center",
    }).setOrigin(0.5, 0).setAlpha(0);

    this.time.delayedCall(2000, () => {
      if (this.answerText) this.tweens.add({ targets: this.answerText, alpha: 1, duration: 400 });
      if (this.feedbackText) this.tweens.add({ targets: this.feedbackText, alpha: 1, duration: 400 });
      this.score += 10;
      this.time.delayedCall(3000, () => {
        this.ruleIndex++;
        this.nextChallenge();
      });
    });
  }
}
