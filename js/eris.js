export class Eris {
  #root;
  reporter = new ErisConsoleReporter();

  constructor(name, builder) {
    this.name = name;
    this.#root = new ErisTestGroup(name, null, builder);
  }

  run({params, condition, reporter} = {}) {
    this.#runWhenLoaded(() => {
      params ??= new URL(document.location).searchParams;

      condition ??= params.has("test")
      if (!condition) { return }

      reporter ??= this.reporter;

      let context = {
        params,
        reporter,
        assert: new ErisAssertions(reporter),
        befores: [],
        afters: [],
      };
      this.#root.run(context);
      reporter.summarize();
    });

    return this;
  }

  #runWhenLoaded(fn) {
    if (Eris.runImmediately) {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", (event) => setTimeout(() => fn(), 1));
    }
  }

  static test(...args) {
    return new this(...args).run();
  }
}

export class ErisTestCase {
  #body;

  constructor(name, body) {
    this.name = name;
    this.#body = body;
  }

  get description() { return `${this.#body}` }

  run(context = {}) {
    context.befores.forEach(fn => fn(this, context));
    this.#body(context);
    context.afters.forEach(fn => fn(this, context));
  }
}

export class ErisTestGroup {
  #suite = [];
  #lets = [];
  #befores = [];
  #afters = [];

  constructor(name, parent, builder) {
    this.name = name;
    this.parent = parent;
    builder(this);
  }

  it(description, body) {
    this.#suite.push(new ErisTestCase(description, body));
  }

  describe(description, builder) {
    this.#suite.push(new ErisTestGroup(description, this, builder));
  }

  let(name, fn) {
    this.#lets[name] = fn;
  }

  get letVars() {
    return Object.keys(this.#lets).toDictionary(name => [name, this.#lets[name]()]);
  }

  letElement(name, fn) {
    this.before(() => this[name] = fn());
    this.after(() => {this[name].remove(); delete this[name]});
  }

  before(fn) { this.#befores.push(fn) }
  after(fn) { this.#afters.push(fn) }

  run(context = {}) {
    let reporter = context.reporter;

    if (!this.parent) {
      window.erisResults ??= {runCount: 0, passCount: 0, failCount: 0, errorCount: 0, suites: {}};
      window.erisResults.suites[this.name] = {runCount: 0, passCount: 0, failCount: 0, errorCount: 0, finished: false};
    }

    reporter.beginGroup(this);
    this.#suite.forEach(testcase => {
      reporter.begin(context);
      reporter.run(testcase, {
        ...context,
        ...this.letVars,
        befores: [...context.befores, ...this.#befores],
        afters: [...context.afters, ...this.#afters],
      });
      reporter.end(context);
    });
    reporter.endGroup(this);

    if (!this.parent) {
      window.erisResults.runCount += reporter.runCount;
      window.erisResults.passCount += reporter.passCount;
      window.erisResults.failCount += reporter.failCount;
      window.erisResults.errorCount += reporter.errorCount;
      window.erisResults.suites[this.name] = {
        runCount: reporter.runCount,
        passCount: reporter.passCount,
        failCount: reporter.failCount,
        errorCount: reporter.errorCount,
        finished: true,
      };
    }
  }
}

export class ErisAssertions {
  constructor(reporter) { this.reporter = reporter }

  true(condition, failMessage, passMessage) { this.reporter.tick(condition, condition ? (passMessage ?? `✅ ${JSON.stringify(condition)} is true`) : (failMessage ?? `❌ ${JSON.stringify(condition)} is false`)) }
  false(condition, failMessage, passMessage) { this.true(!condition, (passMessage ?? `✅ ${JSON.stringify(condition)} is false`), (failMessage ?? `❌ ${JSON.stringify(condition)} is true`)) }
  defined(actual) { this.true(actual !== null && actual !== undefined, `❌ Expected ${JSON.stringify(actual)} to be defined`) }
  equals(actual, expected) { this.true(Array.eql(actual, expected) || actual === expected, `❌ Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`) }
  jsonEquals(actual, expected) { this.equals(JSON.stringify(actual), JSON.stringify(expected), `❌ Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`) }
  matchesRegex(actual, expected) { let match = actual.match(expected); this.reporter.tick(match, `❌ Expected "${actual}" to match ${expected}, but it did not`, `"✅ ${actual} matched pattern ${expected}"`) }
  includedIn(actual, expectedIn) { this.true(expectedIn.includes(actual), `❌ Expected ${JSON.stringify(actual)} to be in ${JSON.stringify(expectedIn)}`) }
  expectError(callback, errorClass) {
    try { callback(); this.true(false, `❌ Expected error of type ${errorClass}, but nothing was thrown`)}
    catch(err) {
      (err.constructor.name === errorClass) || this.reporter.error(err);
      this.equals(err.constructor.name, errorClass, `❌ Expected error of type ${errorClass}, but ${err.constructor.name} was thrown instead`) }
  }
}

export class ErisConsoleReporter {
  runCount = 0;
  passCount = 0;
  failCount = 0;
  errorCount = 0;

  begin() {}
  end() {}

  beginGroup(group) { console.group(group.name) }
  endGroup(group) { console.groupEnd() }

  run(testable, context) {
    console.group(testable.name);
    testable.description && console.debug(testable.description);
    try {
      this.runCount += 1;
      testable.run(context);
    } catch (err) {
      this.errorCount += 1;
      this.error(err);
    }
    console.groupEnd();
  }

  tick(passed, failMessage, passMessage) { passed ? this.passed(passMessage) : this.failed(failMessage) }
  passed(message) { this.passCount += 1; console.info(message ?? `✅`) }
  failed(message) { this.failCount += 1; console.error(message ?? `❌`) }
  error(err) { console.error(err, `💥 ${err}`) }

  summarize() {
    if (this.failCount + this.errorCount > 0) {
      console.error(`${this.passCount} passed; ${this.failCount} failed; ${this.errorCount} errored`);
    } else {
      console.info(`${this.passCount} passed`);
    }
  }
}

document.addEventListener("DOMContentLoaded", (event) => {
  Eris.runImmediately = true;
});

Eris.test("Eris", makeSure => {
  makeSure.it("can pass", ({assert}) => assert.true(true));

  makeSure.describe("let blocks", makeSure => {
    makeSure.let("foo", () => [1]);

    makeSure.it("gives me `foo` in the context", ({assert, foo}) => {
      assert.equals(foo, [1]);
      foo.push(2);
      assert.equals(foo, [1, 2]);
    });

    makeSure.it("gives me a new `foo` in each test", ({assert, foo}) => {
      assert.equals(foo, [1]);
    });
  });
});
