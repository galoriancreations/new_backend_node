/////////////////////////
// ChallengeGenerator.ts //
/////////////////////////
export type Selection = {
  day: number;
  text: string;
  emoji: string;
  score: number;
};

export type ChallengeOutput = {
  name: string;
  selections: Selection[];
};

export type Challenge = ChallengeOutput & {
  _id: string;
  active: boolean;
  createdOn: Number;
  creator: string;
  date: string;
  declined: Boolean;
  invite: string;
  isPublic: Boolean;
  scores: [];
  template: string;
  verified: Boolean;
  days: [];
  preMessages: [];
  preDays: [];
};

/////////////////////////
// ArticleGenerator.ts //
/////////////////////////
export type ArticleOutput = {
  title: string;
  imagePrompt: string;
  text: string;
};

export type Article = Omit<ArticleOutput, 'imagePrompt'> & {
  image: string;
};
