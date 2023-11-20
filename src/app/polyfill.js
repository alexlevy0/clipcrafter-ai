if (
  typeof Image === "undefined" ||
  typeof window === "undefined" ||
  typeof document === "undefined"
) {
  console.log("yoooooooooo--------");
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
  console.log("waaaaaaazzaaaaaa");
}
