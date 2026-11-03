// Desktop sizes grow smoothly on wide monitors: `a` px at a 1440px wide window (the Figma
// desktop frame), `b` px at 1920px and wider. Used in inline styles: fontSize: fluid(15, 17).
export const fluid = (a, b) => `clamp(${a}px, calc(${a}px + (100vw - 1440px) * ${((b - a) / 480).toFixed(4)}), ${b}px)`;
