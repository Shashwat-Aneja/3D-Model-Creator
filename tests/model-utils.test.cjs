const assert = require("node:assert/strict");
const test = require("node:test");

const {
    MAX_MODEL_BYTES,
    isSupportedModelFile,
    calculateCameraDistance,
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

test("calculates a positive camera distance for a model bounding box", () => {
    const distance = calculateCameraDistance(
        { width: 2, height: 2, depth: 2 },
        60,
        1,
        1.2
    );

    assert.ok(Number.isFinite(distance));
    assert.ok(distance > 0);
});

test("increases camera distance for a narrow viewport", () => {
    const bounds = { width: 2, height: 2, depth: 2 };
    const squareDistance = calculateCameraDistance(bounds, 60, 1, 1.2);
    const portraitDistance = calculateCameraDistance(bounds, 60, 0.5, 1.2);

    assert.ok(portraitDistance > squareDistance);
});

test("keeps degenerate model bounds at a usable minimum camera distance", () => {
    assert.equal(calculateCameraDistance(
        { width: 0, height: 0, depth: 0 },
        60,
        1
    ), 0.1);
});

test("rejects invalid model bounds and camera parameters", () => {
    assert.throws(
        () => calculateCameraDistance({ width: -1, height: 2, depth: 3 }, 60, 1),
        /negative dimensions/
    );
    assert.throws(
        () => calculateCameraDistance({ width: 1, height: 2, depth: 3 }, 180, 1),
        /field of view/
    );
    assert.throws(
        () => calculateCameraDistance({ width: 1, height: 2, depth: 3 }, 60, 0),
        /aspect ratio/
    );
});
