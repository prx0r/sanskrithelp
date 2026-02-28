import * as Phaser from "phaser";
import { dhatus } from "../dhatus";

const CHAIN_WORDS = ["karma", "kārya", "kartṛ", "kriyā", "kṛta", "karoti", "saṃskāra", "kāraka"];

export class SabdaChainScene extends Phaser.Scene {
  private chain: string[] = [];
  private timer = 10;
  private timerText!: Phaser.GameObjects.Text;
  private chainText!: Phaser.GameObjects.Text;
  private score = 0;

  constructor() {
    super({ key: "SabdaChain" });
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.add.text(w / 2, 24, "Śabda Chain — Connect words by root/suffix", {
      fontSize: "18px",
      color: "#e8c547",
    }).setOrigin(0.5);

    this.chain = [CHAIN_WORDS[0]];
    this.chainText = this.add.text(w / 2, h / 2 - 40, this.chain[0], {
      fontSize: "28px",
      color: "#c4b5fd",
    }).setOrigin(0.5);

    this.timerText = this.add.text(w - 20, 50, "10", {
      fontSize: "24px",
      color: "#f87171",
    }).setOrigin(1, 0);

    const options = CHAIN_WORDS.slice(1, 5);
    options.forEach((word, i) => {
      const tw = this.add.text(w / 2 - 120 + i * 80, h - 100, word, {
        fontSize: "18px",
        color: "#94a3b8",
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      tw.on("pointerdown", () => {
        this.chain.push(word);
        this.chainText.setText(this.chain.join(" → "));
        this.score += 10;
        this.tweens.add({
          targets: tw,
          alpha: 0.3,
          duration: 200,
        });
      });
    });

    this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.timer--;
        this.timerText.setText(String(this.timer));
        if (this.timer <= 0) {
          this.add.text(w / 2, h / 2 + 40, `Chain: ${this.chain.length} links`, {
            fontSize: "16px",
            color: "#4ade80",
          }).setOrigin(0.5);
        }
      },
      loop: true,
    });
  }
}
