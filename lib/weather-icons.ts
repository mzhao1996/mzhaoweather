export function getIconUrl(icon: string) {
  if (icon.startsWith("//")) {
    return `https:${icon}`;
  }

  if (icon.startsWith("http://") || icon.startsWith("https://")) {
    return icon;
  }

  return `https://openweathermap.org/img/wn/${icon}@2x.png`;
}
