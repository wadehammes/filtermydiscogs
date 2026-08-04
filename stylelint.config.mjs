export default {
  extends: ["stylelint-config-standard", "stylelint-config-css-modules"],
  plugins: ["stylelint-value-no-unknown-custom-properties"],
  rules: {
    "block-no-empty": true,
    "csstools/value-no-unknown-custom-properties": [
      true,
      {
        importFrom: [
          "src/styles/themes/index.css",
          "src/styles/stylelint-custom-properties.css",
        ],
      },
    ],
    "custom-property-pattern": null,
    "declaration-property-value-no-unknown": [
      true,
      {
        ignoreProperties: {
          "container-type": ["style"],
        },
      },
    ],
    "keyframes-name-pattern": null,
    "selector-class-pattern": null,
  },
};
