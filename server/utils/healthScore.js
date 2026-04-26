const calculateHealthScore = ({ lastServiceDate, issuesCount, mileage }) => {
  let score = 100;

  if (lastServiceDate) {
    const daysSinceService = Math.floor((Date.now() - new Date(lastServiceDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceService > 365) score -= 25;
    else if (daysSinceService > 180) score -= 15;
    else if (daysSinceService > 90) score -= 8;
  } else {
    score -= 20;
  }

  score -= Math.min(issuesCount * 7, 30);

  if (mileage > 120000) score -= 20;
  else if (mileage > 80000) score -= 12;
  else if (mileage > 50000) score -= 6;

  return Math.max(0, Math.min(100, score));
};

const getHealthBand = (score) => {
  if (score >= 90) return { label: 'Excellent', color: 'green' };
  if (score >= 70) return { label: 'Good', color: 'yellow' };
  if (score >= 50) return { label: 'Needs Service', color: 'orange' };
  return { label: 'Critical', color: 'red' };
};

module.exports = { calculateHealthScore, getHealthBand };
