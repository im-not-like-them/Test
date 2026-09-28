// En Côte d'Ivoire l'année scolaire et universitaire démarre en septembre/octobre.
export function currentAcademicYearLabel(now = new Date()): string {
  const y = now.getFullYear();
  return now.getMonth() >= 7 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}
