import { logger } from '../utils/logger.js';
import type { JobPosting, UserCriteria, AnalysisResult } from '../types.js';

/**
 * Create skill variations for better matching
 */
function createSkillGroups(skills: string[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {};

  for (const skill of skills) {
    const key = skill.toLowerCase();
    groups[key] = [key];

    // Add common variations
    if (key === 'react') groups[key].push('reactjs', 'react.js');
    if (key === 'vue') groups[key].push('vuejs', 'vue.js');
    if (key === 'angular') groups[key].push('angularjs');
    if (key === 'node') groups[key].push('nodejs', 'node.js');
    if (key === 'typescript') groups[key].push('ts');
    if (key === 'javascript') groups[key].push('js', 'es6', 'es2015');
    if (key === 'python') groups[key].push('py');
    if (key === 'docker') groups[key].push('containerization');
    if (key === 'kubernetes') groups[key].push('k8s');
    if (key === 'aws') groups[key].push('amazon web services');
  }

  return groups;
}

/**
 * Score based on required skills matching (40 points max)
 */
function scoreSkills(
  job: JobPosting,
  coreSkills: string[]
): { score: number; reasons: string[] } {
  if (!coreSkills.length)
    return { score: 15, reasons: ['No specific skills required'] };

  const jobText = `${job.title} ${job.description}`.toLowerCase();
  const reasons: string[] = [];
  let matchedSkills = 0;

  // Define skill groups with variations
  const skillGroups = createSkillGroups(coreSkills);

  for (const skill of coreSkills) {
    const variations = skillGroups[skill.toLowerCase()] || [
      skill.toLowerCase(),
    ];
    const isMatch = variations.some((variation) => jobText.includes(variation));

    if (isMatch) {
      matchedSkills++;
      reasons.push(`✓ ${skill}`);
    }
  }

  let score = 0;
  const skillsRatio = matchedSkills / coreSkills.length;

  if (skillsRatio >= 0.8) {
    score = 40; // 80%+ skills matched
  } else if (skillsRatio >= 0.6) {
    score = 30; // 60-79% skills matched
  } else if (skillsRatio >= 0.3) {
    score = 20; // 30-59% skills matched
  } else if (matchedSkills > 0) {
    score = 10; // Some skills matched
  } else {
    score = 0; // No skills matched
  }

  return { score, reasons };
}

/**
 * Score based on experience level (30 points max)
 */
function scoreExperienceLevel(
  job: JobPosting,
  preferredLevel?: string
): { score: number; reasons: string[] } {
  if (!preferredLevel)
    return { score: 15, reasons: ['No experience preference'] };

  const jobText = `${job.title} ${job.description}`.toLowerCase();
  const reasons: string[] = [];

  const levelMappings = {
    junior: ['junior', 'entry', 'graduate', '0-2 years', 'new grad', 'trainee'],
    mid: ['mid', 'intermediate', '2-5 years', '3-5 years', 'experienced'],
    senior: [
      'senior',
      'lead',
      '5+ years',
      '7+ years',
      'expert',
      'principal',
      'architect',
    ],
  };

  const targetLevel = preferredLevel.toLowerCase();
  const targetTerms = levelMappings[
    targetLevel as keyof typeof levelMappings
  ] || [targetLevel];

  const hasMatch = targetTerms.some((term) => jobText.includes(term));
  const hasConflict = Object.entries(levelMappings)
    .filter(([level]) => level !== targetLevel)
    .some(([, terms]) => terms.some((term) => jobText.includes(term)));

  let score = 15; // Default score
  if (hasMatch) {
    score = 30;
    reasons.push(`✓ Matches ${preferredLevel} level`);
  } else if (hasConflict) {
    score = 5;
    reasons.push(`⚠ Different experience level detected`);
  }

  return { score, reasons };
}

/**
 * Score based on location and remote preferences (30 points max)
 */
function scoreLocation(
  job: JobPosting,
  criteria: UserCriteria
): { score: number; reasons: string[] } {
  const jobText = `${job.title} ${job.description} ${
    job.location || ''
  }`.toLowerCase();
  const reasons: string[] = [];
  let score = 15; // Default score

  // Check for remote work
  const remoteTerms = [
    'remote',
    'work from home',
    'wfh',
    'distributed',
    'anywhere',
    'télétravail',
    'hybrid',
  ];
  const hasRemote = remoteTerms.some((term) => jobText.includes(term));

  if (hasRemote) {
    score = 30;
    reasons.push('✓ Remote/Hybrid work available');
  }

  // Check location preferences
  const hasLocationMatch = jobText.includes(criteria.location.toLowerCase());

  if (hasLocationMatch) {
    score = Math.max(score, 25);
    reasons.push('✓ Preferred location match');
  }

  return { score, reasons };
}

/**
 * Bonus points for premium features (10 points max)
 */
function scoreBonusFeatures(job: JobPosting): {
  score: number;
  reasons: string[];
} {
  const jobText = `${job.title} ${job.description}`.toLowerCase();
  const reasons: string[] = [];
  let bonus = 0;

  const premiumIndicators = [
    {
      terms: ['equity', 'stock options', 'rsu'],
      points: 3,
      label: 'Equity offered',
    },
    {
      terms: ['unlimited pto', 'flexible time off'],
      points: 3,
      label: 'Flexible PTO',
    },
    {
      terms: ['learning budget', 'conference', 'training'],
      points: 2,
      label: 'Learning opportunities',
    },
    {
      terms: ['health insurance', 'medical', 'dental'],
      points: 2,
      label: 'Health benefits',
    },
  ];

  for (const indicator of premiumIndicators) {
    const hasFeature = indicator.terms.some((term) => jobText.includes(term));
    if (hasFeature) {
      bonus += indicator.points;
      reasons.push(`✓ ${indicator.label}`);
    }
  }

  return { score: Math.min(bonus, 10), reasons };
}

/**
 * Analyze job posting using rule-based scoring
 * Scoring distribution:
 * - Skills: 40 points max
 * - Experience Level: 30 points max
 * - Location/Remote: 30 points max
 * - Bonus Features: 10 points max
 * Total: 110 points max (capped at 100)
 */
export function analyzeJob(
  job: JobPosting,
  criteria: UserCriteria
): JobPosting & { analysisResult: AnalysisResult } {
  // Parse skills from comma-separated string
  const coreSkills = criteria.skills
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean);

  // Determine experience level from job title
  const jobTitleLower = criteria.jobTitle.toLowerCase();
  let experienceLevel: 'junior' | 'mid' | 'senior' | undefined;

  if (jobTitleLower.includes('junior') || jobTitleLower.includes('entry')) {
    experienceLevel = 'junior';
  } else if (
    jobTitleLower.includes('senior') ||
    jobTitleLower.includes('lead') ||
    jobTitleLower.includes('principal')
  ) {
    experienceLevel = 'senior';
  } else {
    experienceLevel = 'mid'; // Default to mid-level
  }

  let score = 0;
  const reasons: string[] = [];
  const breakdown = {
    skills: 0,
    experience: 0,
    location: 0,
    bonus: 0,
    penalties: 0,
  };

  // 1. Required Skills Matching (40 points max)
  const skillScore = scoreSkills(job, coreSkills);
  score += skillScore.score;
  breakdown.skills = skillScore.score;
  reasons.push(...skillScore.reasons);

  // 2. Experience Level Matching (30 points max)
  const expScore = scoreExperienceLevel(job, experienceLevel);
  score += expScore.score;
  breakdown.experience = expScore.score;
  reasons.push(...expScore.reasons);

  // 3. Location/Remote Preference (30 points max)
  const locationScore = scoreLocation(job, criteria);
  score += locationScore.score;
  breakdown.location = locationScore.score;
  reasons.push(...locationScore.reasons);

  // 4. Bonus points for premium indicators (10 points max)
  const bonusScore = scoreBonusFeatures(job);
  score += bonusScore.score;
  breakdown.bonus = bonusScore.score;
  reasons.push(...bonusScore.reasons);

  // Ensure score is between 0-100
  score = Math.max(0, Math.min(100, score));

  const analysisResult: AnalysisResult = {
    score: Math.round(score),
    reasons,
    breakdown,
  };

  return {
    ...job,
    score: analysisResult.score,
    analysisResult,
  };
}

/**
 * Analyze multiple jobs and return top N sorted by score
 */
export function analyzeAndRankJobs(
  jobs: JobPosting[],
  criteria: UserCriteria,
  topN: number = 3
): JobPosting[] {
  logger.info(`Analyzing ${jobs.length} jobs with rule-based scoring`);

  // Analyze all jobs
  const analyzedJobs = jobs.map((job) => analyzeJob(job, criteria));

  // Sort by score (highest first) and take top N
  const topJobs = analyzedJobs
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, topN);

  logger.info(
    `Selected top ${topN} jobs with scores: ${topJobs
      .map((j) => j.score)
      .join(', ')}`
  );

  return topJobs;
}

export default { analyzeJob, analyzeAndRankJobs };
