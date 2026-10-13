export type Mood = "solitude" | "adventure" | "romance" | "wonder" | "stillness";
export type Terrain = "desert" | "ocean" | "forest" | "mountains" | "floating-city";
export type RegionId = "ember-reach" | "pale-highlands" | "hush-sea" | "far-reaches";

export interface Destination {
  slug: string;
  number: string;
  name: string;
  atmosphere: string;
  poem: string;
  intro: string;
  story: string[];
  highlights: { title: string; text: string }[];
  coordinates: string;
  season: string;
  region: RegionId;
  /** Position on the Dream Atlas, in map units (1200 × 700). */
  map: { x: number; y: number };
  alt: string;
  moods: Partial<Record<Mood, number>>;
  terrains: Partial<Record<Terrain, number>>;
}

export const destinations: Destination[] = [
  {
    slug: "solara",
    number: "01",
    name: "Solara",
    atmosphere: "Molten · Vast · Warm",
    poem: "A desert that keeps three suns and never runs out of afternoon.",
    intro:
      "A vast orange desert where enormous suns hang low over glowing sandstone formations.",
    story: [
      "Solara has no night, only a long, slow exhale of light. Three suns take turns lowering themselves toward the dunes, and the sandstone drinks each one in, glowing from the inside like banked embers.",
      "Travellers walk at the edge of the shadows the arches throw. They say that if you stand still at the right hour, the whole desert hums one low, golden note — and that you can answer it.",
    ],
    highlights: [
      { title: "The Triple Dusk", text: "Watch all three suns settle behind the Amber Spine in a single unbroken hour." },
      { title: "Glasswind Arches", text: "Sandstone portals that sing when the evening breeze passes through." },
      { title: "The Warm Road", text: "A dune track that stays sun-heated long after the light has gone." },
    ],
    coordinates: "18.4° N · 112.9° E",
    season: "The long afternoon",
    region: "ember-reach",
    map: { x: 215, y: 350 },
    alt: "An orange desert under three enormous suns, with glowing sandstone arches in the distance.",
    moods: { adventure: 3, solitude: 2, wonder: 1 },
    terrains: { desert: 4, mountains: 1 },
  },
  {
    slug: "the-sleeping-coast",
    number: "02",
    name: "The Sleeping Coast",
    atmosphere: "Hushed · Misted · Tender",
    poem: "Pink cliffs, still water, and a morning that has not quite decided to wake.",
    intro: "A quiet coastal world of pink cliffs, drifting mist and water so still it holds the sky.",
    story: [
      "The sea here forgot how to make waves. It lies flat against the foot of the rose-coloured cliffs, mirroring every cloud so faithfully that the horizon disappears.",
      "Mist arrives at dawn and stays until you stop looking for it. Nobody hurries on the Sleeping Coast; the paths are narrow so that you walk slowly, and the benches all face the water.",
    ],
    highlights: [
      { title: "The Mirror Hour", text: "At first light the bay becomes a perfect second sky." },
      { title: "Rosewall Cliffs", text: "Tall pink headlands that change colour with every passing cloud." },
      { title: "Lantern Steps", text: "A stair cut into the cliff, lit by small lanterns left by earlier travellers." },
    ],
    coordinates: "41.2° S · 64.5° W",
    season: "Early, endless morning",
    region: "hush-sea",
    map: { x: 455, y: 470 },
    alt: "Pink sea cliffs rising from perfectly still water under a pale, misty sky.",
    moods: { stillness: 3, romance: 2, solitude: 2 },
    terrains: { ocean: 3, mountains: 1 },
  },
  {
    slug: "the-blue-hour",
    number: "03",
    name: "The Blue Hour",
    atmosphere: "Nocturnal · Luminous · Deep",
    poem: "An archipelago of midnight islands, lit from below by the sea itself.",
    intro: "A midnight-blue archipelago where bioluminescent water traces every shore in light.",
    story: [
      "The Blue Hour is the moment just after sunset, kept alive. The sky never darkens past indigo, and the water beneath it glows with a cold, living light that brightens when you touch it.",
      "Boats here have no lamps. You steer by the shimmer left behind your own oar, from island to island, through a quiet that feels like being inside a held breath.",
    ],
    highlights: [
      { title: "Glowtide", text: "Row through water that lights up in the shape of every movement." },
      { title: "The Thousand Isles", text: "Small dark islands, each with its own faint colour of glow." },
      { title: "Stargate Reef", text: "A ring of luminous coral that reflects the constellations back at you." },
    ],
    coordinates: "7.8° N · 143.1° W",
    season: "Perpetual twilight",
    region: "hush-sea",
    map: { x: 690, y: 430 },
    alt: "A midnight-blue archipelago under a starry sky, the water glowing with teal bioluminescence.",
    moods: { romance: 3, wonder: 2, stillness: 1 },
    terrains: { ocean: 3 },
  },
  {
    slug: "moonflower-valley",
    number: "04",
    name: "Moonflower Valley",
    atmosphere: "Gentle · Giant · Dreaming",
    poem: "Blossoms the size of houses, opening only for the moon.",
    intro: "A dreamlike valley of oversized flowers cradled between lavender mountains.",
    story: [
      "Everything in Moonflower Valley is slightly too large, and nothing is out of place. Petals as wide as sails unfold at dusk, and the air turns sweet and faintly silver.",
      "Paths wind between stems taller than towers. Visitors tend to speak in whispers — not out of rule, but because the valley seems to be listening.",
    ],
    highlights: [
      { title: "The Opening", text: "Each night at moonrise the giant blooms unfold, one after another." },
      { title: "Lavender Ridge", text: "A high path with a view across the whole glowing valley." },
      { title: "Pollen Lights", text: "Drifting motes of gold that gather around anyone who stands still." },
    ],
    coordinates: "52.6° N · 8.3° E",
    season: "Moonrise to moonset",
    region: "pale-highlands",
    map: { x: 520, y: 215 },
    alt: "Enormous pink flowers growing in a valley beneath lavender mountains and a pale moon.",
    moods: { wonder: 3, romance: 2, stillness: 1 },
    terrains: { forest: 4, mountains: 2 },
  },
  {
    slug: "the-lost-meridian",
    number: "05",
    name: "The Lost Meridian",
    atmosphere: "Lofty · Impossible · Silent",
    poem: "A city that forgot the ground, and was never sorry.",
    intro: "An impossible city of towers and arches suspended above an endless sea of cloud.",
    story: [
      "No map agrees on where the Lost Meridian is, because it drifts. Its towers lean toward one another across gaps of open sky, joined by bridges that seem to be made of light.",
      "Below, the clouds roll like a slow ocean. Above, the sun never quite sets. Those who find the city rarely describe how they arrived — only how reluctant they were to leave.",
    ],
    highlights: [
      { title: "Cloud Gate", text: "The only entrance: an arch that appears when the clouds part below." },
      { title: "The Hanging Stair", text: "A spiral of stone that climbs nothing, and is somehow the best view in the city." },
      { title: "Noon Bells", text: "Bells that ring from every tower at once, with no ringers anywhere." },
    ],
    coordinates: "0.0° · 0.0°  (drifting)",
    season: "A permanent golden hour",
    region: "pale-highlands",
    map: { x: 790, y: 125 },
    alt: "A city of towers and arches floating on rock above a sea of pink and orange clouds.",
    moods: { wonder: 3, adventure: 2, solitude: 1 },
    terrains: { "floating-city": 4, mountains: 1 },
  },
  {
    slug: "velora",
    number: "06",
    name: "Velora",
    atmosphere: "Lush · Bright · Secret",
    poem: "A hidden island of turquoise lagoons and rock that grew into sculpture.",
    intro: "A hidden tropical island with turquoise lagoons and surreal, sculpted rock formations.",
    story: [
      "Velora is tucked behind a ring of reef that most charts leave blank. Inside, the water is a colour that doesn't have a fair name — somewhere between glass and jade.",
      "The island's rock has been shaped by wind into arches, needles and impossible balances. Swim out at noon and each formation throws its own small island of shade across the lagoon.",
    ],
    highlights: [
      { title: "The Glass Lagoon", text: "Water so clear that boats appear to hover above their own shadows." },
      { title: "Needle Garden", text: "Hundreds of slender spires rising out of the shallows." },
      { title: "Palm Hollow", text: "A hidden cove reached only through a natural tunnel of stone." },
    ],
    coordinates: "14.9° S · 171.4° E",
    season: "Warm, unhurried noon",
    region: "far-reaches",
    map: { x: 1010, y: 400 },
    alt: "A tropical island with turquoise lagoons, palm trees and sculpted rock spires beneath a bright sun.",
    moods: { adventure: 3, romance: 2, stillness: 1 },
    terrains: { ocean: 3, forest: 2 },
  },
];

export const bySlug = (slug: string) => destinations.find((d) => d.slug === slug);

export const moods: { id: Mood; label: string; line: string }[] = [
  { id: "solitude", label: "Solitude", line: "to be somewhere nobody else has been" },
  { id: "adventure", label: "Adventure", line: "to follow the horizon until it moves" },
  { id: "romance", label: "Romance", line: "to share a view that feels like a secret" },
  { id: "wonder", label: "Wonder", line: "to see something that should not be possible" },
  { id: "stillness", label: "Stillness", line: "to let the world go quiet for a while" },
];

export const terrains: { id: Terrain; label: string; line: string }[] = [
  { id: "desert", label: "Desert", line: "warm sand and wide horizons" },
  { id: "ocean", label: "Ocean", line: "water that goes on forever" },
  { id: "forest", label: "Forest", line: "growing things and soft shade" },
  { id: "mountains", label: "Mountains", line: "high air and long views" },
  { id: "floating-city", label: "Floating city", line: "architecture without ground" },
];

export function recommend(mood: Mood, terrain: Terrain): Destination {
  let best = destinations[0];
  let bestScore = -1;
  for (const d of destinations) {
    const score = (d.moods[mood] ?? 0) + (d.terrains[terrain] ?? 0) * 1.1;
    if (score > bestScore) {
      best = d;
      bestScore = score;
    }
  }
  return best;
}

export const regions: { id: RegionId; name: string; text: string }[] = [
  { id: "ember-reach", name: "The Ember Reach", text: "A warm western continent of dunes and sandstone, lit by more than one sun." },
  { id: "pale-highlands", name: "The Pale Highlands", text: "Lavender mountains and the high skies above them, where valleys bloom and cities drift." },
  { id: "hush-sea", name: "The Hush Sea", text: "A calm, central sea of mirrored coasts and glowing islands. Voices drop here." },
  { id: "far-reaches", name: "The Far Reaches", text: "A lone bright island beyond the reef, rarely charted and easily missed." },
];
