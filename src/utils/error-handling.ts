export class McpError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly details?: unknown
    ) {
        super(message);
        this.name = "McpError";
        Object.setPrototypeOf(this, McpError.prototype);
    }

    /**
     * Serialize error to JSON for logging/debugging
     */
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            details: this.details
        };
    }
}

export function handleError(error: unknown): string {
    if (error instanceof McpError) {
        return `[${error.code}] ${error.message}`;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return "An unknown error occurred";
}

export function withErrorHandling<T>(
    fn: () => T,
    errorMessage: string
): T {
    try {
        return fn();
    } catch (error) {
        throw new McpError(errorMessage, "OPERATION_FAILED", error);
    }
}
