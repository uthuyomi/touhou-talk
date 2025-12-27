import rawCharacters from "./characters.json";

/**
 * キャラクター定義（UI + world）
 * このファイルが「唯一の入口」
 */
export const CHARACTERS = rawCharacters as Record<
  string,
  {
    id: string;
    name: string;
    title: string;
    world?: {
      map: string;
      location: string;
    };
    color: {
      accent: string;
    };
    ui: {
      chatBackground: string;
      placeholder: string;
    };
  }
>;
