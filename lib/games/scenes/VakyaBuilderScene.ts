import * as Phaser from "phaser";

const SENTENCES = [
  { meaning: "Rāma goes to the forest", words: ["rāmaḥ", "vanam", "gacchati"] },
  { meaning: "The teacher gives knowledge", words: ["guruḥ", "jñānam", "dadāti"] },
  { meaning: "Sītā sees the moon", words: ["sītā", "candram", "paśyati"] },
];

export class VakyaBuilderScene extends Phaser.Scene {
  private wordTokens: Phaser.GameObjects.Text[] = [];
  private slotY = 0;
  private currentSentence = 0;

  constructor() {
    super({ key: "VakyaBuilder" });
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.add.text(w / 2, 24, "Vākya Builder — Arrange words into a sentence", {
      fontSize: "18px",
      color: "#e8c547",
    }).setOrigin(0.5);

    const sent = SENTENCES[this.currentSentence % SENTENCES.length];
    this.add.text(w / 2, 55, `Meaning: ${sent.meaning}`, {
      fontSize: "14px",
      color: "#94a3b8",
    }).setOrigin(0.5);

    this.slotY = h / 2 - 20;
    const shuffled = [...sent.words].sort(() => Math.random() - 0.5);

    shuffled.forEach((word, i) => {
      const tw = this.add.text(80 + i * 100, h - 100, word, {
        fontSize: "18px",
        color: "#c4b5fd",
      }).setInteractive({ useHandCursor: true }).setOrigin(0.5);

      this.input.setDraggable(tw);
      this.wordTokens.push(tw);
    });

    const dropZone = this.add.zone(w / 2, this.slotY, w - 80, 60).setRectangleDropZone(w - 80, 60);
    this.add.rectangle(w / 2, this.slotY, w - 80, 60, 0x1e1b2e, 0.5).setStrokeStyle(2, 0x4a5568);

    this.input.on("drop", (_: never, zone: Phaser.GameObjects.Zone, dropped: Phaser.GameObjects.GameObject) => {
      const txt = dropped as Phaser.GameObjects.Text;
      txt.setPosition(txt.x, this.slotY);
    });
  }
}
