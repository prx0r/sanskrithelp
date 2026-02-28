import * as Phaser from "phaser";

const KARAKAS = ["kartṛ", "karma", "karaṇa", "sampradāna", "apādāna", "adhikaraṇa"];
const SAMPLE_WORDS = ["rāmaḥ", "vanam", "śastreṇa", "sītāyai", "grāmāt", "aśve"];

export class KarakaWebScene extends Phaser.Scene {
  private slots: Map<string, Phaser.GameObjects.Zone> = new Map();
  private words: Phaser.GameObjects.Text[] = [];
  private score = 0;
  private verbText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "KarakaWeb" });
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    const cx = w / 2;
    const cy = h / 2 + 20;

    this.add.text(cx, 24, "Kāraka Web — Drag words to semantic slots", {
      fontSize: "18px",
      color: "#e8c547",
    }).setOrigin(0.5);

    this.verbText = this.add.text(cx, cy - 80, "gacchati (goes)", {
      fontSize: "22px",
      color: "#c4956a",
    }).setOrigin(0.5);

    const rad = 120;
    KARAKAS.forEach((k, i) => {
      const angle = (i / KARAKAS.length) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(angle) * rad;
      const y = cy + Math.sin(angle) * rad;

      const slot = this.add.zone(x, y, 90, 40).setRectangleDropZone(90, 40);
      this.add.text(x, y - 30, k, {
        fontSize: "11px",
        color: "#94a3b8",
      }).setOrigin(0.5);

      this.add.rectangle(x, y, 90, 40, 0x2d1b4e, 0.5).setStrokeStyle(2, 0x6a7a9a);
      this.slots.set(k, slot);
    });

    const startY = h - 80;
    SAMPLE_WORDS.forEach((word, i) => {
      const tw = this.add.text(80 + i * 90, startY, word, {
        fontSize: "16px",
        color: "#c4b5fd",
      }).setInteractive({ useHandCursor: true }).setOrigin(0.5);

      this.input.setDraggable(tw);
      this.words.push(tw);
    });

    this.input.on("dragstart", (_: never, obj: Phaser.GameObjects.GameObject) => {
      const t = obj as Phaser.GameObjects.Text;
      t.setAlpha(0.7);
    });

    this.input.on("dragend", (_: never, obj: Phaser.GameObjects.GameObject) => {
      const t = obj as Phaser.GameObjects.Text;
      t.setAlpha(1);
    });

    this.input.on("drop", (_: never, zone: Phaser.GameObjects.Zone, dropped: Phaser.GameObjects.GameObject) => {
      const txt = dropped as Phaser.GameObjects.Text;
      const k = [...this.slots.entries()].find(([, z]) => z === zone)?.[0];
      if (k) {
        txt.setPosition(zone.x, zone.y);
        txt.setDepth(5);
        this.score += 5;
      }
    });
  }
}
