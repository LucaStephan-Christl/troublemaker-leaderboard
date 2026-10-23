import confetti from "canvas-confetti";

const COLORS = ["#ffcf33", "#e5391c", "#16110d", "#2fb883", "#78c0ff", "#f2e8d3"];

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
