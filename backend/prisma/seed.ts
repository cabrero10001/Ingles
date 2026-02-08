import { PrismaClient, Goal } from '@prisma/client';

const prisma = new PrismaClient();

function lessonTitle(goal: Goal, day: number) {
  const base = {
    TRAVEL: 'Travel English',
    JOB_INTERVIEW: 'Job Interview English',
    IT: 'IT English',
    BUSINESS: 'Business English',
    DAILY_CONVERSATION: 'Daily Conversation',
    GAMING: 'Gaming English',
  }[goal];
  return `${base} - Day ${day}`;
}

function microObjective(goal: Goal, day: number) {
  const themes: Record<Goal, string[]> = {
    TRAVEL: ['at the airport', 'hotel check-in', 'ordering food', 'asking directions', 'emergencies'],
    JOB_INTERVIEW: ['introductions', 'experience', 'strengths', 'projects', 'closing'],
    IT: ['variables', 'functions', 'debugging', 'APIs', 'code reviews'],
    BUSINESS: ['meetings', 'emails', 'negotiation', 'presentations', 'reporting'],
    DAILY_CONVERSATION: ['small talk', 'plans', 'opinions', 'requests', 'stories'],
    GAMING: ['team chat', 'strategy', 'matchmaking', 'roles', 'sportsmanship'],
  };
  const t = themes[goal][(day - 1) % themes[goal].length];
  return `Practice clear sentences ${t}.`;
}

function vocab(goal: Goal, day: number): string[] {
  const bank: Record<Goal, string[]> = {
    TRAVEL: ['boarding pass', 'gate', 'reservation', 'luggage', 'downtown', 'ticket', 'schedule', 'platform'],
    JOB_INTERVIEW: ['strengths', 'weaknesses', 'deadline', 'stakeholder', 'impact', 'ownership', 'collaborate', 'challenge'],
    IT: ['variable', 'function', 'array', 'object', 'bug', 'deploy', 'endpoint', 'review'],
    BUSINESS: ['agenda', 'follow-up', 'proposal', 'budget', 'forecast', 'client', 'deliverable', 'timeline'],
    DAILY_CONVERSATION: ['usually', 'maybe', 'actually', 'pretty', 'kind of', 'by the way', 'sounds good', 'no worries'],
    GAMING: ['queue', 'ranked', 'party', 'loadout', 'cooldown', 'objective', 'push', 'rotate'],
  };
  const b = bank[goal];
  const start = (day * 3) % b.length;
  return Array.from({ length: 8 }).map((_, i) => b[(start + i) % b.length]);
}

function prompt(goal: Goal, day: number) {
  const p: Record<Goal, string> = {
    TRAVEL: 'Write 60-90 words about a travel situation. Use at least 3 vocabulary words.',
    JOB_INTERVIEW: 'Write 60-90 words answering an interview question. Use at least 3 vocabulary words.',
    IT: 'Write 60-90 words explaining a technical concept. Use at least 3 vocabulary words.',
    BUSINESS: 'Write 60-90 words as a short email update. Use at least 3 vocabulary words.',
    DAILY_CONVERSATION: 'Write 60-90 words about your day. Use at least 3 vocabulary words.',
    GAMING: 'Write 60-90 words giving team instructions. Use at least 3 vocabulary words.',
  };
  return `${p[goal]} (Day ${day})`;
}

async function main() {
  const goals: Goal[] = [
    Goal.TRAVEL,
    Goal.JOB_INTERVIEW,
    Goal.IT,
    Goal.BUSINESS,
    Goal.DAILY_CONVERSATION,
    Goal.GAMING,
  ];

  for (const g of goals) {
    for (let day = 1; day <= 30; day++) {
      await prisma.lessonTemplate.upsert({
        where: { goal_dayNumber: { goal: g, dayNumber: day } },
        update: {
          title: lessonTitle(g, day),
          microObjective: microObjective(g, day),
          vocabulary: vocab(g, day),
          prompt: prompt(g, day),
        },
        create: {
          goal: g,
          dayNumber: day,
          title: lessonTitle(g, day),
          microObjective: microObjective(g, day),
          vocabulary: vocab(g, day),
          prompt: prompt(g, day),
        },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
