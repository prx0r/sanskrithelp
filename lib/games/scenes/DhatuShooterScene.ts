import * as Phaser from "phaser";
import { dhatus, isFormOfRoot, type Dhatu } from "../dhatus";

const COLORS = {
  correct: 0x4ade80,
  wrong: 0xf87171,
  target: 0xc4956a,
};

export class DhatuShooterScene extends Phaser.Scene {
  private currentRoot!: Dhatu;
  private score = 0;
  private lives = 3;
  private words: Phaser.GameObjects.Text[] = [];
  private targetRootText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private spawnTimer: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super({ key: "DhatuShooter" });
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.add.text(w / 2, 20, "Dhātu Shooter — Shoot words from √root", {
      fontSize: "18px",
      color: "#e8c547",
    }).setOrigin(0.5);

    this.currentRoot = dhatus[Math.floor(Math.random() * dhatus.length)];

    this.targetRootText = this.add.text(w / 2, 55, `√${this.currentRoot.iast}`, {
      fontSize: "28px",
      color: "#c4956a",
      fontStyle: "bold",
    }).setOrigin(0.5);

    this.scoreText = this.add.text(20, 20, "Score: 0", {
      fontSize: "14px",
      color: "#94a3b8",
    });

    this.livesText = this.add.text(20, 42, "♥♥♥", {
      fontSize: "18px",
      color: "#f87171",
    });

    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      this.words.forEach((tw) => {
        const bounds = tw.getBounds();
        if (p.x >= bounds.x && p.x <= bounds.x + bounds.width &&
            p.y >= bounds.y && p.y <= bounds.y + bounds.height) {
          const correct = tw.getData("correct");
          this.onWordHit(tw, correct);
          return;
        }
      });
    });

    this.spawnWord();
    this.spawnTimer = this.time.addEvent({
      delay: 2000,
      callback: () => this.spawnWord(),
      loop: true,
    });

    this.time.addEvent({
      delay: 15000,
      callback: () => this.newRoot(),
      loop: true,
    });
  }

  private spawnWord() {
    const w = this.scale.width;
    const h = this.scale.height;

    const allForms: string[] = [];
    dhatus.forEach((d) => {
      d.derivedForms?.forEach((df) => allForms.push(df.form));
      d.derivesTo?.forEach((f) => allForms.push(f));
    });

    const correctForm = this.getRandomCorrectForm();
    const wrongForm = allForms.filter((f) => !isFormOfRoot(f, this.currentRoot))[Math.floor(Math.random() * 5)] || "xyz";

    const useCorrect = Math.random() > 0.4;
    const form = useCorrect ? correctForm : wrongForm;
    const correct = isFormOfRoot(form, this.currentRoot);

    const side = Math.random() > 0.5 ? -1 : 1;
    const startX = side > 0 ? -50 : w + 50;
    const endX = side > 0 ? w + 50 : -50;
    const y = 120 + Math.random() * (h - 200);

    const tw = this.add.text(startX, y, form, {
      fontSize: "20px",
      color: correct ? "#4ade80" : "#f87171",
    });
    tw.setData("correct", correct);
    this.words.push(tw);

    this.tweens.add({
      targets: tw,
      x: endX,
      duration: 4000 + Math.random() * 2000,
      ease: "Linear",
      onComplete: () => {
        if (tw.active && !correct) {
          this.lives--;
          this.updateLives();
          if (this.lives <= 0) this.gameOver();
        }
        this.words = this.words.filter((w) => w !== tw);
        tw.destroy();
      },
    });
  }

  private getRandomCorrectForm(): string {
    const forms = [
      this.currentRoot.iast,
      ...(this.currentRoot.derivedForms?.map((d) => d.form) || []),
      ...(this.currentRoot.derivesTo || []),
    ].filter(Boolean);
    return forms[Math.floor(Math.random() * forms.length)] || this.currentRoot.iast;
  }

  private onWordHit(tw: Phaser.GameObjects.Text, correct: boolean) {
    if (!tw.active) return;

    this.words = this.words.filter((w) => w !== tw);
    tw.destroy();

    if (correct) {
      this.score += 15;
      this.scoreText.setText(`Score: ${this.score}`);
      this.cameras.main.flash(100, 0, 200, 0);
    } else {
      this.lives--;
      this.updateLives();
      this.cameras.main.shake(100, 0.005);
      if (this.lives <= 0) this.gameOver();
    }
  }

  private updateLives() {
    this.livesText.setText("♥".repeat(this.lives));
  }

  private newRoot() {
    const prev = this.currentRoot;
    let next = dhatus[Math.floor(Math.random() * dhatus.length)];
    while (next.id === prev.id && dhatus.length > 1) {
      next = dhatus[Math.floor(Math.random() * dhatus.length)];
    }
    this.currentRoot = next;
    this.targetRootText.setText(`√${this.currentRoot.iast}`);
    this.targetRootText.setAlpha(0);
    this.tweens.add({
      targets: this.targetRootText,
      alpha: 1,
      duration: 300,
    });
  }

  private gameOver() {
    this.spawnTimer?.destroy();

    const w = this.scale.width;
    const h = this.scale.height;

    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7).setInteractive();

    this.add.text(w / 2, h / 2 - 40, "Game Over", {
      fontSize: "32px",
      color: "#f87171",
    }).setOrigin(0.5);

    this.add.text(w / 2, h / 2, `Score: ${this.score}`, {
      fontSize: "24px",
      color: "#e8c547",
    }).setOrigin(0.5);

    const restart = this.add.text(w / 2, h / 2 + 50, "Tap to restart", {
      fontSize: "16px",
      color: "#94a3b8",
    }).setOrigin(0.5).setInteractive();

    restart.on("pointerdown", () => {
      this.scene.restart();
    });
  }
}
