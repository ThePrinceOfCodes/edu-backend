declare module 'joi' {
  const Joi: any;
  namespace Joi {
    type CustomHelpers = any;
  }
  export = Joi;
}

declare module 'http-status' {
  const httpStatus: any;
  export = httpStatus;
}

declare module 'helmet' {
  const helmet: any;
  export = helmet;
}

declare module 'moment' {
  const moment: any;
  namespace moment {
    type Moment = any;
  }
  export = moment;
}

declare module 'node-mailjet' {
  const Mailjet: any;
  export = Mailjet;
}

declare module 'node-mocks-http' {
  const httpMocks: any;
  export = httpMocks;
}
