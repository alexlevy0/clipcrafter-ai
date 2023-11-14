if (typeof window === "undefined") {
  window = {
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
}
if (typeof document === "undefined") {
  global.document = class {
    constructor() {}
  };
}

if (typeof Image === "undefined") {
  global.Image = class {
    constructor() {}
  };
}
