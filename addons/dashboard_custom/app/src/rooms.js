export const ROOMS = [
  { name: "Ingresso", icon: "door", entities: ["light.luce_ingresso", "cover.tapparella_ingresso"] },
  {
    name: "Soggiorno",
    icon: "sofa",
    entities: [
      "light.luce_tavolo",
      "light.luce_divano",
      "light.luce_credenza",
      "cover.tapparella_divano",
      "cover.tapparella_tavolo",
    ],
  },
  {
    name: "Cucina",
    icon: "chef-hat",
    entities: ["light.luce_cucina", "light.luce_cappa", "cover.tapparella_cucina"],
  },
  { name: "Corridoio", icon: "route", entities: ["light.luce_corridoio"] },
  {
    name: "Bagno",
    icon: "bath",
    entities: ["light.luce_bagno", "light.luce_doccia", "cover.tapparella_bagno"],
  },
  { name: "Bagno 2", icon: "bath", entities: ["light.luce_bagno_2"] },
  { name: "Lavanderia", icon: "wash", entities: ["light.luce_lavanderia"] },
  { name: "Soffitta", icon: "home-roof", entities: ["light.luce_soffitta"] },
  {
    name: "Cameretta",
    icon: "bed",
    entities: ["light.luce_cameretta", "cover.tapparella_cameretta"],
  },
  {
    name: "Camera",
    icon: "moon",
    entities: [
      "light.luce_camera",
      "light.luce_applique_sx_camera",
      "light.luce_applique_dx_camera",
      "cover.tapparella_camera",
    ],
  },
  { name: "Cabina Armadio", icon: "shirt", entities: ["binary_sensor.luce_cabina_armadio"] },
  { name: "Esterno", icon: "tree", entities: ["light.luce_esterna"] },
  { name: "Scale", icon: "stairs", entities: ["light.luce_scale"] },
];

export function roomFor(entityId) {
  return ROOMS.find((r) => r.entities.includes(entityId));
}
