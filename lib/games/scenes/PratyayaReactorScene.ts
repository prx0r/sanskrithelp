import * as Phaser from "phaser";
import { dhatus } from "../dhatus";

export class PratyayaReactorScene extends Phaser.Scene {
  private components: string[] = [];
  private targetWord = "";
  private score = 0;

  constructor() {
    super({ key: "PratyayaReactor" });
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.add.text(w / 2, 24, "Pratyaya Reactor — Assemble the word", {
      fontSize: "20px",
      color: "#e8c547",
    }).setOrigin(0.5);

    const d = dhatus[Math.floor(Math.random() * dhatus.length)];
    const df = d.derivedForms[Math.floor(Math.random() * (d.derivedForms?.length || 1))];
    this.targetWord = df?.form || d.iast;
    const parts = [d.iast, df?.suffix?.replace(/[+\[\]]/g, "").trim() || "-a"].filter(Boolean);

    this.add.text(w / 2, 70, `Build: ${this.targetWord}`, {
      fontSize: "22px",
      color: "#c4b5fd",
    }).setOrigin(0.5);

    const y = h / 2 - 20;
    parts.forEach((p, i) => {
      this.add.text(w / 2 - 60 + i * 80, y, p, {
        fontSize: "18px",
        color: "#94a3b8",
      }).setOrigin(0.5);
    });

    this.add.text(w / 2, y + 50, "→", {
      fontSize: "24px",
      color: "#6a7a9a",
    }).setOrigin(0.5);

    this.add.text(w / 2, y + 90, this.targetWord, {
      fontSize: "20px",
      color: "#4ade80",
    }).setOrigin(0.5);

    this.add.text(w / 2, h - 60, `Root √${d.iast} + suffix → word`, {
      fontSize: "12px",
      color: "#64748b",
    }).setOrigin(0.5);
  }
}
