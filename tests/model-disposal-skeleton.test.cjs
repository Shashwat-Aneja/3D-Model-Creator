const assert = require("node:assert/strict");
const test = require("node:test");
const { disposeModel } = require("../src/model-utils.js");

test("disposes a skeleton bone texture and detaches its model", () => {
    let textureDisposals = 0;
    let detachments = 0;
    const boneTexture = { dispose() { textureDisposals += 1; } };
    const model = {
        parent: { remove(node) { assert.equal(node, model); detachments += 1; } },
        traverse(callback) { callback({ skeleton: { boneTexture } }); },
    };

    disposeModel(model);

    assert.equal(textureDisposals, 1);
    assert.equal(detachments, 1);
});
