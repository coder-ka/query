type DoResult = {
  children: TestResult[];
};
type TestResult = DoResult & {
  skipped: boolean;
};
type Test = {
  skipped: boolean;
  do(test: (param: {}) => Promise<DoResult | void>): Promise<TestResult>;
  skip(): Test;
};
export function test(description?: string): Test {
  return {
    skipped: false,
    async do(test) {
      if (this.skipped)
        return {
          skipped: true,
          children: [],
        };

      if (description) console.log(description);

      const result = await test({});

      return {
        ...(result || { children: [] }),
        skipped: this.skipped,
      };
    },
    skip() {
      this.skipped = true;
      return this;
    },
  };
}
