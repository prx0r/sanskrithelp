import * as Phaser from "phaser";
import { dhatus, type Dhatu } from "../dhatus";

const COLORS = {
  root: 0xc4956a,
  derived: 0x6a7a9a,
  player: 0xe8c547,
  valid: 0x4ade80,
  text: "#fef3c7",
};

export class DhatuDashPlatformScene extends Phaser.Scene {
  private currentRoot!: Dhatu;
  private platforms: Map<string, Phaser.GameObjects.Container> = new Map();
  private player!: Phaser.GameObjects.Arc;
  private playerPlatform: string | null = null;
  private score = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private rootLabel!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "DhatuDashPlatform" });
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.add.text(w / 2, 24, "Dhātu Dash — Platform Hopper", {
      fontSize: "20px",
      color: "#e8c547",
    }).setOrigin(0.5);

    this.scoreText = this.add.text(w - 16, 24, "Score: 0", {
      fontSize: "14px",
      color: "#94a3b8",
    }).setOrigin(1, 0);

    this.rootLabel = this.add.text(w / 2, 52, "", {
      fontSize: "14px",
      color: "#c4b5fd",
    }).setOrigin(0.5);

    this.currentRoot = dhatus[0];
    this.rootLabel.setText(`√${this.currentRoot.iast} — ${this.currentRoot.meaning}`);

    this.buildPlatforms();

    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      this.platforms.forEach((container, id) => {
        const plat = container.getData("platform") as { id: string; x: number; y: number; w: number; h: number };
        if (plat && p.x >= plat.x - plat.w / 2 && p.x <= plat.x + plat.w / 2 &&
            p.y >= plat.y - plat.h / 2 && p.y <= plat.y + plat.h / 2) {
          this.tryHopTo(id);
        }
      });
    });

    this.input.keyboard?.on("keydown-SPACE", () => {
      const valid = this.getValidTargets();
      if (valid.length > 0) {
        this.tryHopTo(valid[Math.floor(Math.random() * valid.length)]);
      }
    });
  }

  private buildPlatforms() {
    this.platforms.clear();
    const existing = this.children.getByName("platforms");
    if (existing) existing.destroy();

    const container = this.add.container(0, 0).setName("platforms");
    const w = this.scale.width;
    const h = this.scale.height;
    const cx = w / 2;
    const cy = h / 2;

    // Other roots: horizontal strip at TOP, well separated
    const otherRoots = dhatus.filter((d) => d.id !== this.currentRoot.id).slice(0, 4);
    const rootWidth = 56;
    const rootGap = 12;
    const totalRootWidth = otherRoots.length * rootWidth + (otherRoots.length - 1) * rootGap;
    const rootStartX = cx - totalRootWidth / 2 + rootWidth / 2 + rootGap / 2;

    otherRoots.forEach((d, i) => {
      const rx = rootStartX + i * (rootWidth + rootGap);
      const ry = 100;
      const plat = this.makePlatform(rx, ry, rootWidth, 36, d.iast, true, d.id);
      container.add(plat);
      this.platforms.set(d.id, plat);
    });

    // Current root: large, centered
    const currPlat = this.makePlatform(cx, cy - 60, 88, 44, this.currentRoot.iast, true, this.currentRoot.id);
    container.add(currPlat);
    this.platforms.set(this.currentRoot.id, currPlat);

    // Derived forms: clean arc BELOW current root, no overlap
    const forms = this.getDerivedForms(this.currentRoot);
    const derivedDist = 130;
    forms.forEach((f, i) => {
      const angle = (i / Math.max(forms.length, 1)) * Math.PI * 0.85 + Math.PI * 0.575;
      const fx = cx + Math.cos(angle) * derivedDist;
      const fy = cy + 40 + Math.sin(angle) * 90;
      const plat = this.makePlatform(fx, fy, 56, 32, f, false, `derived_${f}`);
      container.add(plat);
      this.platforms.set(`derived_${f}`, plat);
    });

    // Player: distinct glowing orb, starts on current root
    const currData = this.platforms.get(this.currentRoot.id)?.getData("platform") as { x: number; y: number };
    const px = currData?.x ?? cx;
    const py = currData?.y ?? cy - 60;

    this.player = this.add.circle(px, py, 12, COLORS.player, 1);
    this.player.setStrokeStyle(3, 0xfffbeb, 1);
    this.player.setDepth(100);
    this.playerPlatform = this.currentRoot.id;
    container.add(this.player);

    // Subtle pulse on player
    this.tweens.add({
      targets: this.player,
      scale: 1.15,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private getDerivedForms(d: Dhatu): string[] {
    const forms: string[] = [];
    for (const df of d.derivedForms || []) {
      if (df.form) forms.push(df.form);
    }
    for (const name of d.derivesTo || []) {
      if (name && !forms.includes(name)) forms.push(name);
    }
    return forms.slice(0, 6);
  }

  private makePlatform(x: number, y: number, w: number, h: number, label: string, isRoot: boolean, id: string): Phaser.GameObjects.Container {
    const c = this.add.container(x, y);
    const isCurrentRoot = isRoot && id === this.currentRoot.id;
    const color = isCurrentRoot ? 0xd4a574 : isRoot ? COLORS.root : COLORS.derived;
    const rect = this.add.graphics();
    rect.fillStyle(color, isCurrentRoot ? 0.95 : 0.9);
    rect.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
    rect.lineStyle(isCurrentRoot ? 3 : 2, isCurrentRoot ? 0xfffbeb : 0xffffff, isCurrentRoot ? 0.6 : 0.3);
    rect.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
    c.add(rect);

    const text = this.add.text(0, 0, label, {
      fontSize: isRoot ? (isCurrentRoot ? "18px" : "14px") : "13px",
      color: COLORS.text,
      fontStyle: isCurrentRoot ? "bold" : "normal",
      wordWrap: { width: w - 12 },
      align: "center",
    }).setOrigin(0.5);
    c.add(text);

    c.setData("platform", { id, x, y, w, h, isRoot, label });
    c.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
    return c;
  }

  private getValidTargets(): string[] {
    if (!this.playerPlatform) return [];
    const plat = this.platforms.get(this.playerPlatform)?.getData("platform");
    if (!plat) return [];

    if (plat.isRoot) {
      return this.getDerivedForms(this.currentRoot).map((f) => `derived_${f}`);
    }

    const targets: string[] = [this.currentRoot.id];
    this.getDerivedForms(this.currentRoot).forEach((f) => {
      if (`derived_${f}` !== this.playerPlatform) targets.push(`derived_${f}`);
    });
    return targets;
  }

  private tryHopTo(targetId: string) {
    const valid = this.getValidTargets();
    if (!valid.includes(targetId)) return;

    const target = this.platforms.get(targetId)?.getData("platform");
    if (!target) return;

    this.tweens.add({
      targets: this.player,
      x: target.x,
      y: target.y,
      duration: 300,
      ease: "Back.easeOut",
      onComplete: () => {
        this.playerPlatform = targetId;
        this.score += 10;
        this.scoreText.setText(`Score: ${this.score}`);

        if (target.isRoot) {
          const d = dhatus.find((r) => r.id === targetId);
          if (d && d.id !== this.currentRoot.id) {
            this.currentRoot = d;
            this.rootLabel.setText(`√${this.currentRoot.iast} — ${this.currentRoot.meaning}`);
            this.buildPlatforms();
          }
        }
      },
    });
  }

}
