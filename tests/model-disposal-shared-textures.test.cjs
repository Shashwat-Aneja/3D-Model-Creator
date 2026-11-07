const assert = require("node:assert/strict");
const test = require("node:test");
const { disposeModel } = require("../src/model-utils.js");

test("disposes a texture shared by a material and skeleton only once", () => {
    let textureDisposals = 0;
    const sharedTexture = {
        isTexture: true,
        dispose() { textureDisposals += 1; },
    };
    const material = { map: sharedTexture, dispose() {} };
    const model = {
        traverse(callback) {
            callback({ material, skeleton: { boneTexture: sharedTexture } });
            callback({ material: [material] });
        },
    };

    disposeModel(model);

    assert.equal(textureDisposals, 1);
});
