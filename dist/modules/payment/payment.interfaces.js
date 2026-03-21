"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchPaymentStatus = exports.PaymentStatus = void 0;
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["PROCESSING"] = "processing";
    PaymentStatus["COMPLETED"] = "completed";
    PaymentStatus["FAILED"] = "failed";
})(PaymentStatus = exports.PaymentStatus || (exports.PaymentStatus = {}));
// ---------------------------------------------------------------------------
// Batch Payment
// ---------------------------------------------------------------------------
var BatchPaymentStatus;
(function (BatchPaymentStatus) {
    BatchPaymentStatus["PENDING"] = "pending";
    BatchPaymentStatus["PROCESSING"] = "processing";
    BatchPaymentStatus["COMPLETED"] = "completed";
    BatchPaymentStatus["PARTIAL"] = "partial";
    BatchPaymentStatus["FAILED"] = "failed";
})(BatchPaymentStatus = exports.BatchPaymentStatus || (exports.BatchPaymentStatus = {}));
//# sourceMappingURL=payment.interfaces.js.map