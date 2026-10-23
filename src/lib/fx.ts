import confetti from "canvas-confetti";

const COLORS = ["#239ae7", "#e91e8c", "#1b1a1f", "#c4fbd1", "#ffa653", "#ffffff"];

function reduced() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function confettiBurst(x = 0.5, y = 0.6) {
  if (reduced()) return;
  void confetti({ particleCount: 90, spread: 80, startVelocity: 42, origin: { x, y }, colors: COLORS, scalar: 1.1 });
}

export function confettiCannons() {
  if (reduced()) return;
  const shoot = (angle: number, x: number) =>
    void confetti({ particleCount: 70, angle, spread: 65, startVelocity: 55, origin: { x, y: 0.85 }, colors: COLORS });
  shoot(60, 0);
  shoot(120, 1);
}

export function emojiRain(emoji: string) {
  if (reduced()) return;
  const shape = confetti.shapeFromText({ text: emoji, scalar: 3 });
  void confetti({ particleCount: 28, spread: 120, startVelocity: 35, gravity: 0.8, origin: { x: 0.5, y: 0.2 }, shapes: [shape], scalar: 3, flat: true });
}
