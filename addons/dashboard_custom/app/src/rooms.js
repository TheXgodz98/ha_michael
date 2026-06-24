export const ROOMS = [
  { name: "Ingresso", icon: "door", entities: ["light.ads_luce_ingresso", "cover.ads_tapparella_ingresso"] },
  {
    name: "Soggiorno",
    icon: "sofa",
    entities: [
      "light.ads_luce_tavolo",
      "light.ads_luce_divano",
      "light.ads_luce_credenza",
      "cover.ads_tapparella_divano",
      "cover.ads_tapparella_tavolo",
    ],
  },
  {
    name: "Cucina",
    icon: "kitchen",
    entities: ["light.ads_luce_cucina", "cover.ads_tapparella_cucina"],
  },
  { name: "Corridoio", icon: "route", entities: ["light.ads_luce_corridoio"] },
  {
    name: "Bagno",
    icon: "bath",
    entities: ["light.ads_luce_bagno", "light.ads_luce_doccia", "cover.ads_tapparella_bagno"],
  },
  { name: "Bagno 2", icon: "bath", entities: ["light.ads_luce_bagno_2"] },
  { name: "Lavanderia", icon: "laundry", entities: ["light.ads_luce_lavanderia"] },
  { name: "Soffitta", icon: "attic", entities: ["light.ads_luce_soffitta"] },
  {
    name: "Cameretta",
    icon: "bed",
    entities: ["light.ads_luce_cameretta", "cover.ads_tapparella_cameretta"],
  },
  {
    name: "Camera",
    icon: "moon",
    entities: [
      "light.ads_luce_camera",
      "light.ads_luce_aplique_sx_camera",
      "light.ads_luce_aplique_dx_camera",
      "cover.ads_tapparella_camera",
    ],
  },
  { name: "Esterno", icon: "tree", entities: ["light.ads_luce_esterna"] },
  { name: "Scale", icon: "stairs", entities: ["light.ads_luce_scale"] },
];

export function roomFor(entityId) {
  return ROOMS.find((r) => r.entities.includes(entityId));
}
