// kairo/knowledge/Registry.js

import { TaskRecipe } from "../microagents/Task/Recipe.js";
import { UserRecipe } from "../microagents/User/Recipe.js";
import { ProjectRecipe } from "../microagents/Project/Recipe.js";

/**
 * Registry holds schemas and agent metadata for all supported entities.
 */
export class Registry {
    constructor() {
        this._entities = {
            Task: TaskRecipe,
            User: UserRecipe,
            Project: ProjectRecipe
        };
    }

    /**
     * Returns the full recipe (schema, prompt, validation rules) for an entity.
     * @param {string} entity
     * @returns {object|null}
     */
    getRecipe(entity) {
        return this._entities?.[entity] || null;
    }

    /**
     * Returns all supported entities and their metadata.
     * @returns {object}
     */
    getAllRecipes() {
        return this._entities;
    }

    /**
     * Check if an entity type is known to the system.
     * @param {string} entity
     * @returns {boolean}
     */
    isKnownEntity(entity) {
        return !!this._entities?.[entity];
    }

    /**
     * Resolves any externally referenced fields (like user names to ObjectIds)
     * This doesn't hit a DB directly — it's just used to describe resolution paths.
     *
     * @param {string} entity
     * @param {string} field
     * @returns {object|null}
     */
    getFieldReference(entity, field) {
        const recipe = this.getRecipe(entity);
        if (!recipe) return null;

        const fieldDef = recipe.requiredFields?.[field] || recipe.optionalFields?.[field];
        if (!fieldDef?.refEntity) return null;

        return {
            refEntity: fieldDef.refEntity,
            resolveFrom: fieldDef.resolveFrom || "name"
        };
    }

    /**
     * Returns the fields that require referencing other entities.
     * @param {string} entity
     * @returns {Array<string>}
     */
    getAllResolvableFields(entity) {
        const recipe = this.getRecipe(entity);
        const resolvableFields = [];

        const fields = {
            ...recipe.requiredFields,
            ...recipe.optionalFields
        };

        for (const [key, def] of Object.entries(fields)) {
            if (def.refEntity) resolvableFields.push(key);
        }

        return resolvableFields;
    }
}