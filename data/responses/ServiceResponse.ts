class ServiceResponse {
    message: string;
    constructor(message) {
        this.message = message;
    }
    toString() {
        return this.message;
    }
}

export = ServiceResponse;