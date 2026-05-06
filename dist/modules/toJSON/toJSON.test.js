"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const index_1 = require("./index");
describe('toJSON plugin', () => {
    let connection;
    beforeEach(() => {
        connection = mongoose_1.default.createConnection();
    });
    it('should replace _id with id', () => {
        const schema = new mongoose_1.default.Schema();
        schema.plugin(index_1.toJSON);
        const SampleModel = connection.model('Model', schema);
        const doc = new SampleModel();
        expect(doc.toJSON()).not.toHaveProperty('_id');
        expect(doc.toJSON()).toHaveProperty('id', doc._id.toString());
    });
    it('should remove __v', () => {
        const schema = new mongoose_1.default.Schema();
        schema.plugin(index_1.toJSON);
        const SampleModel = connection.model('Model', schema);
        const doc = new SampleModel();
        expect(doc.toJSON()).not.toHaveProperty('__v');
    });
    it('should remove createdAt and updatedAt', () => {
        const schema = new mongoose_1.default.Schema({}, { timestamps: true });
        schema.plugin(index_1.toJSON);
        const SampleModel = connection.model('Model', schema);
        const doc = new SampleModel();
        expect(doc.toJSON()).not.toHaveProperty('createdAt');
        expect(doc.toJSON()).not.toHaveProperty('updatedAt');
    });
    it('should remove any path set as private', () => {
        const schema = new mongoose_1.default.Schema({
            public: { type: String },
            private: { type: String, private: true },
        });
        schema.plugin(index_1.toJSON);
        const SampleModel = connection.model('Model', schema);
        const doc = new SampleModel({ public: 'some public value', private: 'some private value' });
        expect(doc.toJSON()).not.toHaveProperty('private');
        expect(doc.toJSON()).toHaveProperty('public');
    });
    it('should remove any nested paths set as private', () => {
        const schema = new mongoose_1.default.Schema({
            public: { type: String },
            nested: {
                private: { type: String, private: true },
            },
        });
        schema.plugin(index_1.toJSON);
        const SampleModel = connection.model('Model', schema);
        const doc = new SampleModel({
            public: 'some public value',
            nested: {
                private: 'some nested private value',
            },
        });
        expect(doc.toJSON()).not.toHaveProperty('nested.private');
        expect(doc.toJSON()).toHaveProperty('public');
    });
    it('should also call the schema toJSON transform function', () => {
        const schema = new mongoose_1.default.Schema({
            public: { type: String },
            private: { type: String },
        }, {
            toJSON: {
                transform: (_doc, ret) => {
                    // eslint-disable-next-line no-param-reassign, @typescript-eslint/dot-notation
                    delete ret['private'];
                },
            },
        });
        schema.plugin(index_1.toJSON);
        const SampleModel = connection.model('Model', schema);
        const doc = new SampleModel({ public: 'some public value', private: 'some private value' });
        expect(doc.toJSON()).not.toHaveProperty('private');
        expect(doc.toJSON()).toHaveProperty('public');
    });
});
//# sourceMappingURL=toJSON.test.js.map