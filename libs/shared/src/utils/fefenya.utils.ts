/**
 * @description Gives a random int number in-between requested values
 * @param min {number} Minimal number
 * @param max {number} Maximum number
 */
export const randInBetweenInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1) + min);

/**
 * @description Generate random greeting for GotD command
 * @param greeting {string} greeting flow string
 * @param userId {string} id of discord guild member
 * */
export const gotdGreeter = (greeting: string, userId: string) =>
  `${greeting} <@${userId}>`;

export const fefenyaKeyFormatter = (key: string) => `FEFENYA:${key}`;
