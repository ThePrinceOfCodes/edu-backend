"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.preprocessAttendantImage = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const sharp_1 = __importDefault(require("sharp"));
const preprocessAttendantImage = async (sourcePath) => {
    const dir = path_1.default.dirname(sourcePath);
    const base = path_1.default.basename(sourcePath, path_1.default.extname(sourcePath));
    const outputPath = path_1.default.join(dir, `${base}-preprocessed.png`);
    try {
        const image = (0, sharp_1.default)(sourcePath);
        const metadata = await image.metadata();
        const scaleFactor = metadata.width && metadata.width < 2000 ? 3 : 2;
        const targetWidth = metadata.width ? metadata.width * scaleFactor : 2400;
        await image
            .rotate()
            .grayscale()
            .resize({
            width: targetWidth,
            kernel: sharp_1.default.kernel.lanczos3,
            withoutEnlargement: false,
        })
            .normalize()
            .median(3)
            .linear(1.35, -25)
            .gamma(1.3)
            .sharpen({ sigma: 1.5, m1: 2.0, m2: 3.5 })
            .png({ compressionLevel: 6 })
            .toFile(outputPath);
    }
    catch (_a) {
        await promises_1.default.copyFile(sourcePath, outputPath);
    }
    await promises_1.default.access(outputPath);
    return outputPath;
};
exports.preprocessAttendantImage = preprocessAttendantImage;
//# sourceMappingURL=attendant-preprocess.service.js.map