// Allow importing plain JavaScript modules without type declarations
// This silences errors like: "Could not find a declaration file for module './components/GradeCalculator'"
declare module '*.js' {
  const value: any;
  export default value;
}

// Fallback: allow importing modules without extensions (e.g. import Foo from './components/Foo')
// so TypeScript won't complain about missing declaration files in a mixed JS/TS codebase.
declare module '*';
