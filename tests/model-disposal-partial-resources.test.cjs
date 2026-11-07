const assert = require("node:assert/strict");
const test = require("node:test");
const { disposeModel } = require("../src/model-utils.js");

test("ignores absent materials and resources without dispose methods", () => {
    let removed = 0;
    const model = {
        parent: { remove() { removed += 1; } },
        traverse(callback) {
            callback({ geometry: {}, material: null });
            callback({ geometry: null, material: [null, {}] });
        },
    };

    assert.doesNotThrow(() => disposeModel(model));
    assert.equal(removed, 1);
});

test("does not require a parent when disposing detached models", () => {
    const model = { traverse(callback) { callback({ material: null }); } };
    assert.doesNotThrow(() => disposeModel(model));
});
