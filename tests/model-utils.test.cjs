const assert = require("node:assert/strict");
const test = require("node:test");

const {
    MAX_MODEL_BYTES,
    isSupportedModelFile,
    disposeModel,
} = require("../src/model-utils.js");

test("accepts non-empty GLB and GLTF files regardless of extension case", () => {
    assert.equal(isSupportedModelFile({ name: "scene.glb", size: 1024 }), true);
    assert.equal(isSupportedModelFile({ name: "scene.GLTF", size: 2048 }), true);
    assert.equal(isSupportedModelFile({ name: "large.glb", size: MAX_MODEL_BYTES }), true);
});

test("rejects unsupported, empty, and oversized model files", () => {
    assert.equal(isSupportedModelFile({ name: "scene.obj", size: 1024 }), false);
    assert.equal(isSupportedModelFile({ name: "empty.glb", size: 0 }), false);
    assert.equal(isSupportedModelFile({ name: "large.gltf", size: MAX_MODEL_BYTES + 1 }), false);
    assert.equal(isSupportedModelFile(null), false);
});

test("disposes shared geometries, materials, textures, and detaches the model once", () => {
    const calls = { geometry: 0, material: 0, texture: 0, removed: 0 };
    const geometry = { dispose: () => { calls.geometry += 1; } };
    const texture = { isTexture: true, dispose: () => { calls.texture += 1; } };
    const material = { map: texture, dispose: () => { calls.material += 1; } };
    const model = {
        parent: {
            remove(node) {
                assert.equal(node, model);
                calls.removed += 1;
            },
        },
        traverse(callback) {
            callback({ geometry, material });
            callback({ geometry, material: [material] });
        },
    };

    disposeModel(model);

    assert.deepEqual(calls, { geometry: 1, material: 1, texture: 1, removed: 1 });
});

test("safely ignores missing or non-traversable model values", () => {
    assert.doesNotThrow(() => disposeModel(null));
    assert.doesNotThrow(() => disposeModel({}));
});
