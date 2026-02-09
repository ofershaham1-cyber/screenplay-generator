declare module 'swagger-ui-express' {
  import { RequestHandler } from 'express';
  
  function serve(...args: any[]): RequestHandler;
  function setup(spec: any, options?: any): RequestHandler;
  
  export { serve, setup };
}
