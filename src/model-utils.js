(function attachModelUtils(root, factory) {
    const utilities = factory();
    if (typeof module === "object" && module.exports) {
        module.exports = utilities;
    } else {
        root.ModelUtils = utilities;
    }
})(typeof globalThis !== "undefined" ? globalThis : this, function createModelUtils() {
    const MAX_MODEL_BYTES = 100 * 1024 * 1024;

    function isSupportedModelFile(file) {
        if (!file || typeof file.name !== "string") return false;
        if (!Number.isSafeInteger(file.size) || file.size <= 0 || file.size > MAX_MODEL_BYTES) {
            return false;
        }
        return /\.(glb|gltf)$/i.test(file.name);
    }

    function calculateCameraDistance(size, verticalFovDegrees, aspectRatio, padding = 1.2) {
        if (!size || ![size.width, size.height, size.depth].every(Number.isFinite)) {
            throw new TypeError("Model bounds must contain finite width, height, and depth values.");
        }
        if (size.width < 0 || size.height < 0 || size.depth < 0) {
            throw new RangeError("Model bounds cannot contain negative dimensions.");
        }
        if (!Number.isFinite(verticalFovDegrees) || verticalFovDegrees <= 0 || verticalFovDegrees >= 179) {
            throw new RangeError("Vertical field of view must be between 0 and 179 degrees.");
        }
        if (!Number.isFinite(aspectRatio) || aspectRatio <= 0) {
            throw new RangeError("Aspect ratio must be a positive finite number.");
        }
        if (!Number.isFinite(padding) || padding <= 0) {
            throw new RangeError("Camera padding must be a positive finite number.");
        }

        const verticalHalfFov = verticalFovDegrees * Math.PI / 360;
        const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * aspectRatio);
        const limitingHalfFov = Math.min(verticalHalfFov, horizontalHalfFov);
        const boundingRadius = Math.hypot(size.width, size.height, size.depth) / 2;
        return Math.max((boundingRadius / Math.sin(limitingHalfFov)) * padding, 0.1);
    }

    function disposeModel(model) {
        if (!model || typeof model.traverse !== "function") return;

        const geometries = new Set();
        const materials = new Set();
        const textures = new Set();

        model.traverse((object) => {
            if (object.geometry && typeof object.geometry.dispose === "function") {
                geometries.add(object.geometry);
            }

            if (object.skeleton && object.skeleton.boneTexture) {
                textures.add(object.skeleton.boneTexture);
            }

            const objectMaterials = Array.isArray(object.material)
                ? object.material
                : [object.material];

            for (const material of objectMaterials) {
                if (!material) continue;
                materials.add(material);

                for (const value of Object.values(material)) {
                    if (value && value.isTexture && typeof value.dispose === "function") {
                        textures.add(value);
                    }
                }
            }
        });

        textures.forEach((texture) => texture.dispose());
        materials.forEach((material) => {
            if (typeof material.dispose === "function") material.dispose();
        });
        geometries.forEach((geometry) => geometry.dispose());

        if (model.parent && typeof model.parent.remove === "function") {
            model.parent.remove(model);
        }
    }

    return {
        MAX_MODEL_BYTES,
        isSupportedModelFile,
        calculateCameraDistance,
        disposeModel,
    };
});
