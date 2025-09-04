// utils/objectIdUtils.js
import { ObjectId } from "mongodb";

export function isValidObjectId(id) {
    if (typeof id !== "string") return false;
    return ObjectId.isValid(id) && (new ObjectId(id)).toString() === id;
}