export const calculateProgress = (uomType, target, actual) => {
  const numTarget = Number(target) || 0;
  const numActual = Number(actual) || 0;

  if (uomType !== 'ZERO' && numTarget === 0) return 0;

  switch (uomType) {
    case 'MIN':
      // Lower is better (e.g. reduce complaints)
      if (numActual === 0) return 100;
      return Math.min(100, (numTarget / numActual) * 100);

    case 'MAX':
      // Higher is better (e.g. increase sales)
      return Math.min(100, (numActual / numTarget) * 100);

    case 'ZERO':
      // Zero = success (e.g. zero incidents)
      return numActual === 0 ? 100 : 0;

    case 'TIMELINE':
      // Based on completion percentage within timeline
      return Math.min(100, (numActual / numTarget) * 100);

    default:
      return 0;
  }
};
