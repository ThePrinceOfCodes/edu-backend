"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceOperation = exports.submitOperation = void 0;
const _1 = require(".");
const delay_1 = require("../utils/delay");
const DELETE_DELAY_MS = 10000;
const submitOperation = async function (collection, key, notif, shouldDeleteAfterDelay = false) {
    try {
        const connection = _1.sharedb.connect();
        const doc = connection.get(collection, key);
        // 1️⃣ Load doc
        await new Promise((resolve, reject) => {
            doc.fetch(err => {
                if (err)
                    return reject(err);
                // 2️⃣ Create doc if missing
                if (!doc.type) {
                    doc.create({ messages: [notif] }, err2 => {
                        if (err2)
                            reject(err2);
                        else
                            resolve();
                    });
                }
                else {
                    // Ensure messages array exists
                    if (!Array.isArray(doc.data.messages)) {
                        doc.submitOp([{ p: ['messages'], oi: [] }], undefined);
                    }
                    else {
                        resolve();
                    }
                }
            });
        });
        // 3️⃣ Build the "insert into list" operation
        const insertOp = {
            p: ['messages', doc.data.messages.length],
            li: notif,
        };
        // 4️⃣ Submit operation
        await new Promise((resolve, reject) => {
            doc.submitOp(insertOp, { source: false }, err => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
        // --- 5️⃣ Conditional Deletion ---
        if (shouldDeleteAfterDelay) {
            console.log(`Job ${key} complete. Scheduling deletion in ${DELETE_DELAY_MS / 1000} seconds.`);
            // Set a timeout to delete the document
            await (0, delay_1.delay)(DELETE_DELAY_MS);
            doc.del(undefined, err => {
                if (err) {
                    console.error(`❌ SharedDB Auto-Delete Error for ${key}:`, err);
                }
                else {
                    console.log(`✅ SharedDB Document ${key} successfully auto-deleted after delay.`);
                }
                // Clean up the document object from memory after deletion attempt
                doc.destroy();
            });
        }
        return true;
    }
    catch (err) {
        console.error("SharedDB backend submitOperation error:", err);
        return false;
    }
};
exports.submitOperation = submitOperation;
const replaceOperation = async function (collection, key, itemId, newItem) {
    try {
        const connection = _1.sharedb.connect();
        const doc = connection.get(collection, key);
        // 1️⃣ Load doc
        await new Promise((resolve, reject) => {
            doc.fetch(err => {
                if (err)
                    return reject(err);
                if (!doc.type)
                    return reject(new Error("Document does not exist"));
                resolve();
            });
        });
        const messages = doc.data.messages;
        if (!Array.isArray(messages)) {
            throw new Error("Messages is not an array");
        }
        const index = messages.findIndex((m) => m.id === itemId);
        if (index === -1) {
            console.warn(`Item with id ${itemId} not found in collection ${collection}, key ${key}`);
            return false;
        }
        const oldItem = messages[index];
        // 2️⃣ Build the replace operation (delete old, insert new at same index)
        const replaceOp = {
            p: ['messages', index],
            ld: oldItem,
            li: newItem,
        };
        // 3️⃣ Submit operation
        await new Promise((resolve, reject) => {
            doc.submitOp(replaceOp, { source: false }, err => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
        return true;
    }
    catch (err) {
        console.error("SharedDB backend replaceOperation error:", err);
        return false;
    }
};
exports.replaceOperation = replaceOperation;
//# sourceMappingURL=operations.js.map