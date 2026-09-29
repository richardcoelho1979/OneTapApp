import type { AchievementDef } from '@workspace/game-sdk';

export const memoryAchievements: AchievementDef[] = [
  {
    key: 'first_pair',
    title: { 'pt-BR': 'Primeira Dupla', en: 'First Pair', es: 'Primera Pareja' },
    description: {
      'pt-BR': 'Encontre seu primeiro par no Jogo da Memória.',
      en: 'Find your first pair in the Memory Game.',
      es: 'Encuentra tu primera pareja en el Juego de Memoria.',
    },
    icon: '🃏',
    category: 'milestone',
    xpReward: 10,
  },
  {
    key: 'perfect_memory',
    title: { 'pt-BR': 'Memória Perfeita', en: 'Perfect Memory', es: 'Memoria Perfecta' },
    description: {
      'pt-BR': 'Complete uma partida sem nenhum erro.',
      en: 'Complete a game without a single mistake.',
      es: 'Completa una partida sin un solo error.',
    },
    icon: '🧠',
    category: 'competitive',
    xpReward: 50,
    isSecret: true,
  },
  {
    key: 'speed_memory',
    title: { 'pt-BR': 'Velocista', en: 'Speed Runner', es: 'Veloz' },
    description: {
      'pt-BR': 'Termine uma partida solo em menos de 60 segundos.',
      en: 'Finish a solo game in under 60 seconds.',
      es: 'Termina una partida en solitario en menos de 60 segundos.',
    },
    icon: '⚡',
    category: 'competitive',
    xpReward: 30,
    isSecret: true,
  },
];
