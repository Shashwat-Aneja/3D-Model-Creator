const assert = require("node:assert/strict");
const test = require("node:test");
const { MAX_MODEL_BYTES, isSupportedModelFile } = require("../src/model-utils.js");

test("rejects malformed file metadata without throwing", () => {
    for (const file of [
        undefined,
        {},
        { name: 42, size: 10 },
        { name: "scene.glb", size: Number.NaN },
        { name: "scene.glb", size: Number.POSITIVE_INFINITY },
        { name: "scene.glb", size: -1 },
    ]) {
        assert.equal(isSupportedModelFile(file), false);
    }
});

test("accepts the exact maximum size and rejects the next byte", () => {
    assert.equal(isSupportedModelFile({ name: "scene.gltf", size: MAX_MODEL_BYTES }), true);
    assert.equal(isSupportedModelFile({ name: "scene.gltf", size: MAX_MODEL_BYTES + 1 }), false);
});
