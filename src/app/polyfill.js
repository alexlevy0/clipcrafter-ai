if (
  typeof Image === "undefined" ||
  typeof window === "undefined" ||
  typeof document === "undefined"
) {
  window = {
    document: {
      querySelector: function () {},
    },
    location: {
      protocol: {},
    },
  };

  window = class {
    constructor() {}
    location = {
      hash: {},
      host: {},
      hostname: {},
      href: {},
      origin: {},
      pathname: {},
      port: {},
      protocol: {},
      search: {},
    };
  };
  global.window = class {
    constructor() {}
    location = {
      hash: {},
      host: {},
      hostname: {},
      href: {},
      origin: {},
      pathname: {},
      port: {},
      protocol: {},
      search: {},
    };
  };
  global.Image = class {
    constructor() {}
  };
}
