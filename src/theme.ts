// The four group colours, shared by the board, Pairs and the Logic Grid.
// Lives on its own so the other modes don't have to import the game screen
// to know what colour a group is.
export const CATEGORY_THEMES = [
  { grad: "from-[#f2b544] to-[#eda820]", ink: "#3b2703", emoji: "🟨", shape: "●", tint: "#a06e07" },
  { grad: "from-[#7cc0e8] to-[#5eb0e0]", ink: "#0a344a", emoji: "🟦", shape: "▲", tint: "#186a9e" },
  { grad: "from-[#c5a3e8] to-[#b48fd9]", ink: "#2f1547", emoji: "🟪", shape: "■", tint: "#7b47ad" },
  { grad: "from-[#8fd6ab] to-[#6cc793]", ink: "#093b22", emoji: "🟩", shape: "◆", tint: "#177a48" },
];
