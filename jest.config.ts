export default {
    testEnvironment: 'node',
    setupFiles: ['./jest.setup.ts'],
    transform: {
        '^.+\\.ts$': [
            '@swc/jest',
            {
                sourceMaps: 'inline',
                module: {
                    type: 'commonjs',
                },
                jsc: {
                    target: 'es2022',
                    parser: {
                        syntax: 'typescript',
                        decorators: true,
                    },
                    transform: {
                        legacyDecorator: true,
                        decoratorMetadata: true,
                    },
                },
            },
        ],
    },
    moduleFileExtensions: ['ts', 'js'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
};
