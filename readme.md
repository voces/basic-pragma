# basic-pragma

This module provides a JSX pragma (createElement) for using JSX/TSX. The target
is configurable via specifying a required adapter. Designed with the intention
to support targeting Lua transpilation, but works when targeting JavaScript.

# Usage

Use `setAdapter` at the root of the project, which will bridge the pragma with
the application UI. See
[w3ts-jsx](https://github.com/voces/w3ts-jsx/blob/master/src/adapter.ts) for an
example adapter.
