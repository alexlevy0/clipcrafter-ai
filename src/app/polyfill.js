if (
  typeof Image === "undefined" ||
  typeof window === "undefined" ||
  typeof document === "undefined"
) {
  console.log("In");
  global.Image = class {
    constructor() {}
  };

  // window = {
  //   document: {
  //     querySelector: function () {},
  //   },
  //   location: {
  //     protocol: {},
  //     hostname: {},
  //     port: {},
  //   },
  // };

  global.window = class window {
    constructor() {}
    document = {
      querySelectorAll: () => [],
      querySelector: () => [],
    };
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
  window.document = {
    querySelectorAll: () => [],
    querySelector: () => [],
  };
  document = {
    querySelectorAll: () => [],
    querySelector: () => [],
  };
  // console.log('weshhhh', document)
  window.location = { protocol: "", hostname: "", port: "" };
  // document = {
  //   querySelectorAll: function () {},
  //   querySelector: function () {},
  // };
  // window.document = {
  //   querySelectorAll: function () {},
  //   querySelector: function () {},
  // };
} else {
  console.log("OK");
}
