const CODES = {
  0: { label: "Sereno", icon: "sun" },
  1: { label: "Poco nuvoloso", icon: "sun" },
  2: { label: "Parzialmente nuvoloso", icon: "cloud" },
  3: { label: "Nuvoloso", icon: "cloud" },
  45: { label: "Nebbia", icon: "fog" },
  48: { label: "Nebbia gelata", icon: "fog" },
  51: { label: "Pioggia debole", icon: "rain" },
  53: { label: "Pioggia moderata", icon: "rain" },
  55: { label: "Pioggia intensa", icon: "rain" },
  56: { label: "Pioggia gelata debole", icon: "rain" },
  57: { label: "Pioggia gelata intensa", icon: "rain" },
  61: { label: "Pioggia debole", icon: "rain" },
  63: { label: "Pioggia moderata", icon: "rain" },
  65: { label: "Pioggia intensa", icon: "rain" },
  66: { label: "Pioggia gelata", icon: "rain" },
  67: { label: "Pioggia gelata intensa", icon: "rain" },
  71: { label: "Neve debole", icon: "snow" },
  73: { label: "Neve moderata", icon: "snow" },
  75: { label: "Neve intensa", icon: "snow" },
  77: { label: "Granuli di neve", icon: "snow" },
  80: { label: "Rovesci debili", icon: "rain" },
  81: { label: "Rovesci moderati", icon: "rain" },
  82: { label: "Rovesci violenti", icon: "rain" },
  85: { label: "Rovesci di neve", icon: "snow" },
  86: { label: "Rovesci di neve intensi", icon: "snow" },
  95: { label: "Temporale", icon: "storm" },
  96: { label: "Temporale con grandine", icon: "storm" },
  99: { label: "Temporale violento", icon: "storm" },
};

export function describeWeather(code) {
  return CODES[code] || { label: "—", icon: "cloud" };
}
