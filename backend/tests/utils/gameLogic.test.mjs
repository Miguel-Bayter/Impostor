import { describe, it, expect } from 'vitest';
import gameLogic from '../../utils/gameLogic.js';

const {
  getRandomWord,
  checkWordGuess,
  validateClueNotRepeated,
  validateClue,
  validateVote,
  calculateVotingResults,
  checkVictoryConditions,
  validateGameRules,
  resolveVoteTie,
} = gameLogic;

describe('gameLogic', () => {
  it('getRandomWord retorna string no vacío', () => {
    const w = getRandomWord();
    expect(typeof w).toBe('string');
    expect(w.length).toBeGreaterThan(0);
  });

  it('checkWordGuess ignora mayúsculas y espacios', () => {
    expect(checkWordGuess('  PErro ', 'perro')).toBe(true);
    expect(checkWordGuess('gato', 'perro')).toBe(false);
  });

  it('validateClueNotRepeated detecta repetidas', () => {
    const existing = [{ clue: 'pista A' }];
    expect(validateClueNotRepeated('PISTA a', existing).isValid).toBe(false);
    expect(validateClueNotRepeated('otra', existing).isValid).toBe(true);
  });

  it('validateClue valida vacía, repetida y palabra secreta', () => {
    const existing = [{ clue: 'pista1' }];
    expect(validateClue('', existing, 'secreto').isValid).toBe(false);
    expect(validateClue('pista1', existing, 'secreto').isValid).toBe(false);
    expect(validateClue('secreto', existing, 'secreto').isValid).toBe(false);
    expect(validateClue('válida', existing, 'secreto').isValid).toBe(true);
  });

  it('validateVote valida casos inválidos y válidos', () => {
    const players = [
      { userId: 'a', isEliminated: false },
      { userId: 'b', isEliminated: false },
    ];
    expect(validateVote('a', 'a', players).isValid).toBe(false);
    expect(validateVote('x', 'b', players).isValid).toBe(false);
    expect(validateVote('a', 'b', players).isValid).toBe(true);
  });

  it('calculateVotingResults maneja empates', () => {
    const votes = { a: 'x', b: 'y', c: 'x', d: 'y' };
    const r = calculateVotingResults(votes, []);
    expect(r.maxVotes).toBe(2);
    expect(r.isTie).toBe(true);
    expect(r.mostVotedId).toBe(null);
    expect(r.tiedPlayers.sort()).toEqual(['x', 'y'].sort());
  });

  it('calculateVotingResults sin empates', () => {
    const votes = { a: 'x', b: 'y', c: 'x' };
    const r = calculateVotingResults(votes, []);
    expect(r.maxVotes).toBe(2);
    expect(r.isTie).toBe(false);
    expect(r.mostVotedId).toBe('x');
    expect(r.tiedPlayers).toEqual(['x']);
  });

  it('resolveVoteTie selecciona un jugador de la lista', () => {
    const tied = ['a', 'b', 'c'];
    const resolved = resolveVoteTie(tied);
    expect(tied).toContain(resolved);
  });

  it('checkVictoryConditions evalúa ganador', () => {
    const players1 = [{ isEliminated: false, isImpostor: false }];
    expect(checkVictoryConditions(players1).winner).toBe('citizens');
    const players2 = [
      { isEliminated: false, isImpostor: true },
      { isEliminated: false, isImpostor: false },
    ];
    expect(checkVictoryConditions(players2).winner).toBe('impostor');
    const players3 = [
      { isEliminated: false, isImpostor: true },
      { isEliminated: false, isImpostor: false },
      { isEliminated: false, isImpostor: false },
    ];
    expect(checkVictoryConditions(players3).winner).toBe(null);
  });

  it('validateGameRules valida reglas', () => {
    expect(validateGameRules(3, 1).isValid).toBe(false);
    expect(validateGameRules(2, 1).isValid).toBe(false);
    expect(validateGameRules(4, 0).isValid).toBe(false);
    expect(validateGameRules(4, 4).isValid).toBe(false);
    expect(validateGameRules(5, 4).isValid).toBe(false);
  });
});
