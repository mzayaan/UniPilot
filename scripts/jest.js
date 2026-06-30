#!/usr/bin/env node
// Sets NODE_OPTIONS before spawning jest so worker processes inherit the heap limit.
process.env.NODE_OPTIONS = '--max-old-space-size=4096';
require('../node_modules/jest/bin/jest.js');
