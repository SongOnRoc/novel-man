/**
 * This is the Orval configuration file.
 * @see https://orval.dev/reference/configuration
 * @type {import('orval').Config}
 */
module.exports = {
  main: {
    input: {
      // The target is our backend's swagger.json file
      target: '../backend/docs/swagger.json',
      // Use custom transformer to fix file upload types
      override: {
        transformer: './orval.transformer.js',
      },
    },
    output: {
      // We generate client functions based on react-query
      client: 'react-query',
      override: {
        mutator: {
          path: './src/lib/axios.ts',
          name: 'customInstance',
        },
      },
      // The output directory for all our generated code (client and types)
      target: './src/lib/api/generated',
      // We want to split the generated code by API tags for better organization
      mode: 'tags-split',
      // We ensure that all generated code is formatted with Prettier
      prettier: true,
      // We want to clean the output directory before generating new files
      clean: true,
    },
    hooks: {
      afterAllFilesWrite: 'pnpm exec prettier --write', // Format all generated files
    },
  },
};
