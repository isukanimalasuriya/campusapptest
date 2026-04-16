import { Filter } from "bad-words";

const filter = new Filter();

// Add extra words specific to your campus if needed
// filter.addWords("word1", "word2");

export const cleanText = (text) => {
  try {
    return filter.clean(text);
  } catch {
    return text;
  }
};

export const isProfane = (text) => {
  try {
    return filter.isProfane(text);
  } catch {
    return false;
  }
};