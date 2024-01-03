export class Eris {
  #root;
  reporter = new ErisConsoleReporter();

  constructor(name, builder) {
    this.name = name;
    this.#root = new ErisTestGroup(name, builder);
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
      document.addEventListener("DOMContentLoaded", (event) => fn());
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

  get description() { return `${this.name}  -  ${this.#body}` }

  run(context = {}) {
    this.#body(context);
  }
}

export class ErisTestGroup {
  #suite = [];

  constructor(name, builder) {
    this.name = name;
    builder(this);
  }

  get description() { return this.name }

  it(description, body) {
    this.#suite.push(new ErisTestCase(description, body));
  }

  describe(description, builder) {
    this.#suite.push(new ErisTestGroup(description, builder));
  }

  run(context = {}) {
    let reporter = context.reporter;

    reporter.beginGroup(this);
    this.#suite.forEach(testcase => {
      reporter.begin(context);
      reporter.run(testcase, context);
      reporter.end(context);
    });
    reporter.endGroup(this);
  }
}

export class ErisAssertions {
  constructor(reporter) { this.reporter = reporter }

  true(condition, failMessage, passMessage) { this.reporter.tick(condition, condition ? passMessage : failMessage) }
  equals(actual, expected) { this.true(actual === expected, `Expected ${expected} but got ${actual}`) }
  jsonEquals(actual, expected) { this.equals(JSON.stringify(actual), JSON.stringify(expected)) }
  includedIn(actual, expectedIn) { this.true(expectedIn.includes(actual), `Expected ${actual} to be in ${expectedIn}`) }
  expectError(callback, errorClass) {
    try { callback(); this.true(false, `Expected error of type ${errorClass}`)}
    catch(err) { this.equals(err.constructor.name, errorClass) }
  }
}

export class ErisConsoleReporter {
  passCount = 0;
  failCount = 0;
  errorCount = 0;

  begin() {}
  end() {}

  beginGroup(group) { console.group(group.description) }
  endGroup(group) { console.groupEnd() }

  run(testable, context) {
    console.group(testable.description);
    try {
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
  error(err) { console.error(`💥 ${err}`) }

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
