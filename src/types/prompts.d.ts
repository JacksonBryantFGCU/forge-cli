declare module "prompts" {
  type Question = {
    type: "confirm" | "text" | "select" | "password";
    name: string;
    message: string;
    initial?: boolean | string | number;
  };

  type Answers = Record<string, unknown>;

  function prompts(questions: Question | Question[]): Promise<Answers>;

  export default prompts;
}
